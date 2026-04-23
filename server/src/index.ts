import { loadEnvFile, verifyEnvLoading } from './utils/env-loader'

// Detect serverless environments (Vercel, Netlify, etc.)
const isServerless = !!(process.env.VERCEL || process.env.NETLIFY)

// Initialize environment before other imports
if (!isServerless) {
  loadEnvFile()
}

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabase } from './config/supabase'
import { getEnvConfig, EnvConfig } from './utils/envConfig'
import {
  securityHeaders,
  generalLimiter,
  requestLogger,
  sanitizeInput,
} from './middleware/security'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import studentRoutes from './routes/students'
import teacherRoutes from './routes/teachers'
import subjectRoutes from './routes/subjects'
import resultRoutes from './routes/results'
import authRoutes from './routes/auth'
import attendanceRoutes from './routes/attendance'
import configRoutes from './routes/config'
import observationRoutes from './routes/observations'
import notificationRoutes from './routes/notifications'
import curriculumRoutes from './routes/curriculum'
import schemeOfWorkRoutes from './routes/schemeOfWork'
import deadlineRoutes from './routes/deadlines'
import messageRoutes from './routes/messages'
import activityRoutes from './routes/activities'
import analyticsRoutes from './routes/analytics'
import { activityLogger } from './middleware/activityLogger'
import { authenticate } from './middleware/auth'

// Define __dirname safely for both local and serverless environments
let __dirname = ''
if (!isServerless) {
  try {
    __dirname = path.dirname(fileURLToPath(import.meta.url))
  } catch (err) {
    console.warn('[STARTUP] ⚠️  Could not determine __dirname using import.meta.url')
  }
}

/**
 * STARTUP SEQUENCE
 * This ensures all environment and system checks are performed before server starts
 */

console.log('\n╔════════════════════════════════════════════════════════════╗')
console.log('║        Folusho Reporting Sheet - Server Startup          ║')
console.log('╚════════════════════════════════════════════════════════════╝\n')

// Step 1: Verify environment variables
console.log('[STARTUP] Step 1: Verifying environment configuration...')
if (isServerless) {
  console.log('[STARTUP] ✓ Running in serverless environment (using system env)')
} else {
  verifyEnvLoading()
}

// Step 2: Validate configuration
console.log('\n[STARTUP] Step 2: Validating configuration...')
let envConfig: EnvConfig
try {
  envConfig = getEnvConfig()
  console.log('[STARTUP] ✓ Configuration valid')
  } catch (error) {
    console.error('[STARTUP] ❌ Configuration validation failed!')
    console.error(error instanceof Error ? error.message : String(error))

    if (isServerless) {
      console.error('[STARTUP] ⚠️ Running in serverless: Continuing with potentially invalid configuration')
      // Fallback to defaults to prevent crash
      envConfig = (process as any).env as EnvConfig
    } else {
      process.exit(1)
    }
  }

// Step 3: Initialize Express app
console.log('\n[STARTUP] Step 3: Initializing Express application...')
const app = express()
const PORT = envConfig?.PORT || 3001

// HTTPS enforcement in production (Skip in serverless environments as they handle it)
if (envConfig.NODE_ENV === 'production' && !isServerless) {
  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.get('host')}${req.url}`)
    }
    next()
  })
}

console.log('[STARTUP] Applying security middleware...')
app.use(compression())
app.use(helmet())
app.use(securityHeaders)

console.log('[STARTUP] Configuring CORS...')
const corsOrigin = envConfig.NODE_ENV === 'development' 
  ? /^http:\/\/localhost:(5173|5174|5175|5176|5177)$/  // Allow multiple dev ports
  : envConfig.CORS_ORIGIN

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

console.log('[STARTUP] Applying body parsing and sanitization...')
app.use(express.json({ limit: '10mb' }))
app.use(sanitizeInput)

// Serve uploaded files - only in local environments
if (!isServerless && __dirname) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
}

console.log('[STARTUP] Applying rate limiting...')
app.use(requestLogger)
app.use(generalLimiter)

console.log('[STARTUP] Registering routes...')
app.use('/api/auth', authRoutes)
app.use('/api/config', configRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/curriculum', curriculumRoutes)
app.use('/api/scheme-of-work', schemeOfWorkRoutes)
app.use('/api/observations', observationRoutes)
app.use('/api/deadlines', deadlineRoutes)

console.log('[STARTUP] Registering chat and activity routes...')
app.use('/api/messages', authenticate, messageRoutes)
app.use('/api/activities', authenticate, activityRoutes)
app.use('/api/analytics', authenticate, analyticsRoutes)

console.log('[STARTUP] Registering action routes...')
app.use('/api/results', authenticate, activityLogger, resultRoutes)
app.use('/api/attendance', authenticate, activityLogger, attendanceRoutes)
app.use('/api/students', authenticate, activityLogger, studentRoutes)
app.use('/api/teachers', authenticate, activityLogger, teacherRoutes)
app.use('/api/subjects', authenticate, activityLogger, subjectRoutes)

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    database: 'supabase',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

console.log('[STARTUP] Finalizing middleware...')
app.use(notFoundHandler)
app.use(errorHandler)

// Step 5: Connect to database and start server
let server: any

export async function startServer() {
  try {
    // Skip intensive database checks in serverless environments to prevent cold start timeouts
    if (isServerless) {
      console.log('[STARTUP] Step 5: Serverless environment - skipping Supabase connectivity check')
      return
    }

    console.log('[STARTUP] Step 5: Connecting to Supabase...')
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('[STARTUP] ✓ Supabase connected')

    // Check if database is empty
    const userCount = data?.[0]?.count || 0
    if (userCount === 0) {
      console.warn('\n╔════════════════════════════════════════════════════════════╗')
      console.log('║ ⚠️  WARNING: DATABASE IS EMPTY                             ║')
      console.log('║ No users found in Supabase. Login will not work!           ║')
      console.log('║ Please run: npm run seed:supabase                          ║')
      console.log('╚════════════════════════════════════════════════════════════╝\n')
    }

    // Only listen if not running in a serverless environment
    if (process.env.NODE_ENV !== 'production' || !isServerless) {
      console.log('\n[STARTUP] Step 6: Starting HTTP server...')
      server = app.listen(PORT, () => {
        console.log('\n╔════════════════════════════════════════════════════════════╗')
        console.log('║               ✓ Server Successfully Started                ║')
        console.log('╠════════════════════════════════════════════════════════════╣')
        console.log(`║ URL: http://localhost:${PORT}${' '.repeat(35 - String(PORT).length)}║`)
        console.log(`║ Environment: ${envConfig.NODE_ENV}${' '.repeat(39 - envConfig.NODE_ENV.length)}║`)
        console.log('╚════════════════════════════════════════════════════════════╝\n')
      })
    } else {
      console.log('[STARTUP] Step 6: Serverless environment detected - app exported')
    }
  } catch (err) {
    console.error('[STARTUP] ❌ Failed to start server:')
    console.error(err)
    if (process.env.NODE_ENV !== 'production' || !isServerless) {
      process.exit(1)
    }
    throw err
  }
}

// Initial server start for local development
if (process.env.NODE_ENV !== 'production' || !isServerless) {
  startServer()
}

export default app

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error)
  // In a production serverless environment, we might want to let the process exit
  if (!isServerless) {
    process.exit(1)
  }
})

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n[SHUTDOWN] Signal received, starting graceful shutdown...')
  if (server) {
    server.close(() => {
      console.log('[SHUTDOWN] HTTP server closed')
      try {
        console.log('[SHUTDOWN] Supabase connections closing...')
        process.exit(0)
      } catch (err) {
        console.error('[SHUTDOWN] Error during cleanup:', err)
        process.exit(1)
      }
    })
  } else {
    process.exit(0)
  }
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
