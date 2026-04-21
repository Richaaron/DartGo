import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabase } from './config/supabase.js'
import { getEnvConfig, EnvConfig } from './utils/envConfig.js'
import { loadEnvFile, verifyEnvLoading, printDiagnostics } from './utils/env-loader.js'
import {
  securityHeaders,
  generalLimiter,
  requestLogger,
  sanitizeInput,
} from './middleware/security.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import studentRoutes from './routes/students.js'
import teacherRoutes from './routes/teachers.js'
import subjectRoutes from './routes/subjects.js'
import resultRoutes from './routes/results.js'
import authRoutes from './routes/auth.js'
import attendanceRoutes from './routes/attendance.js'
import configRoutes from './routes/config.js'
import observationRoutes from './routes/observations.js'
import notificationRoutes from './routes/notifications.js'
import curriculumRoutes from './routes/curriculum.js'
import schemeOfWorkRoutes from './routes/schemeOfWork.js'
import messageRoutes from './routes/messages.js'
import activityRoutes from './routes/activities.js'
import analyticsRoutes from './routes/analytics.js'
import { activityLogger } from './middleware/activityLogger.js'
import { authenticate } from './middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * STARTUP SEQUENCE
 * This ensures all environment and system checks are performed before server starts
 */

console.log('\n╔════════════════════════════════════════════════════════════╗')
console.log('║        Folusho Reporting Sheet - Server Startup          ║')
console.log('╚════════════════════════════════════════════════════════════╝\n')

// Step 1: Load environment variables
console.log('[STARTUP] Step 1: Loading environment variables...')
const loadedFile = loadEnvFile()
if (loadedFile) {
  console.log(`[STARTUP] ✓ Loaded from: ${loadedFile}`)
} else {
  console.log('[STARTUP] ℹ️  Using process.env and defaults')
}
verifyEnvLoading()

// Step 2: Validate configuration
console.log('\n[STARTUP] Step 2: Validating configuration...')
let envConfig: EnvConfig
try {
  envConfig = getEnvConfig()
  console.log('[STARTUP] ✓ Configuration valid')
} catch (error) {
  console.error('[STARTUP] ❌ Configuration validation failed!')
  console.error(error instanceof Error ? error.message : String(error))
  printDiagnostics()
  process.exit(1)
}

// Step 3: Initialize Express app
console.log('\n[STARTUP] Step 3: Initializing Express application...')
const app = express()
const PORT = envConfig.PORT

// HTTPS enforcement in production
if (envConfig.NODE_ENV === 'production') {
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

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

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
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
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
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      process.exit(1)
    }
    throw err
  }
}

// Initial server start for local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer()
}

export default app

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
