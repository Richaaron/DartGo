import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db'
import { getEnvConfig, EnvConfig } from './utils/envConfig'
import { loadEnvFile, verifyEnvLoading, printDiagnostics } from './utils/env-loader'
import { performHealthCheck, printHealthCheckResults, isHealthy } from './utils/startup-health-check'
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
import messageRoutes from './routes/messages'
import activityRoutes from './routes/activities'
import analyticsRoutes from './routes/analytics'
import { activityLogger } from './middleware/activityLogger'
import { authenticate } from './middleware/auth'

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

// Step 3: Perform health checks
console.log('\n[STARTUP] Step 3: Performing health checks...')
const healthResult = await performHealthCheck(envConfig.MONGO_URI, envConfig.PORT)
printHealthCheckResults(healthResult)

if (!isHealthy(healthResult)) {
  console.warn('[STARTUP] ⚠️  Health check warnings detected (non-fatal in development)')
  if (envConfig.NODE_ENV === 'production') {
    console.error('[STARTUP] ❌ Health check failed in production mode!')
    process.exit(1)
  }
}

// Step 4: Initialize Express app
console.log('[STARTUP] Step 4: Initializing Express application...')
const app = express()
const PORT = envConfig.PORT

// Security middleware - apply first
app.use(helmet())
app.use(securityHeaders)

// CORS with restrictions
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

// Body parsing and sanitization
app.use(express.json({ limit: '10mb' }))
app.use(sanitizeInput)

// Request logging and rate limiting
app.use(requestLogger)
app.use(generalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/config', configRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/curriculum', curriculumRoutes)
app.use('/api/scheme-of-work', schemeOfWorkRoutes)
app.use('/api/observations', observationRoutes)

// Chat and Activity routes
app.use('/api/messages', authenticate, messageRoutes)
app.use('/api/activities', authenticate, activityRoutes)
app.use('/api/analytics', authenticate, analyticsRoutes)

// Action routes with activity logging
app.use('/api/results', authenticate, activityLogger, resultRoutes)
app.use('/api/attendance', authenticate, activityLogger, attendanceRoutes)
app.use('/api/students', authenticate, activityLogger, studentRoutes)
app.use('/api/teachers', authenticate, activityLogger, teacherRoutes)
app.use('/api/subjects', authenticate, activityLogger, subjectRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 404 handler - must come after all routes
app.use(notFoundHandler)

// Error handler - must be last
app.use(errorHandler)

// Step 5: Connect to database and start server
async function startServer() {
  try {
    console.log('[STARTUP] Step 5: Connecting to database...')
    await connectDB()
    console.log('[STARTUP] ✓ Database connected')

    console.log('\n[STARTUP] Step 6: Starting HTTP server...')
    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════════════════════╗')
      console.log('║               ✓ Server Successfully Started                ║')
      console.log('╠════════════════════════════════════════════════════════════╣')
      console.log(`║ URL: http://localhost:${PORT}${' '.repeat(35 - String(PORT).length)}║`)
      console.log(`║ Environment: ${envConfig.NODE_ENV}${' '.repeat(39 - envConfig.NODE_ENV.length)}║`)
      console.log('║ Features:                                                  ║')
      console.log('║   ✓ Security headers enabled                               ║')
      console.log('║   ✓ CORS configured                                        ║')
      console.log('║   ✓ Rate limiting active                                   ║')
      console.log('║   ✓ MongoDB connected                                      ║')
      console.log('║   ✓ Authentication ready                                   ║')
      console.log('╚════════════════════════════════════════════════════════════╝\n')
    })
  } catch (error) {
    console.error('\n[STARTUP] ❌ FATAL ERROR - Server failed to start!')
    console.error(error instanceof Error ? error.message : String(error))
    console.error('\n[STARTUP] Diagnostics:')
    printDiagnostics()
    process.exit(1)
  }
}

startServer()