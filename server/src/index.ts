import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import { getEnvConfig, EnvConfig } from './utils/envConfig.js'
import { loadEnvFile, verifyEnvLoading, printDiagnostics } from './utils/env-loader.js'
import { performHealthCheck, printHealthCheckResults, isHealthy } from './utils/startup-health-check.js'
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
  res.json({ status: 'ok' })
})

console.log('[STARTUP] Finalizing middleware...')
app.use(notFoundHandler)
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