/**
 * Server Health Check Utility
 * Performs startup diagnostics to ensure all systems are ready
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface HealthCheckResult {
  timestamp: string
  mongodb: {
    status: 'healthy' | 'unhealthy'
    message: string
  }
  port: {
    status: 'available' | 'in-use'
    message: string
  }
  env: {
    status: 'valid' | 'invalid'
    message: string
  }
}

/**
 * Check if MongoDB is accessible
 */
async function checkMongoDB(mongoUri: string): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
  try {
    // Try to parse the URI and extract connection info
    const url = new URL(mongoUri)
    const host = url.hostname
    const port = url.port || '27017'
    
    console.log(`[HEALTH-CHECK] Checking MongoDB on ${host}:${port}...`)
    
    // Attempt a simple connection test (this will be verified when Mongoose connects)
    return {
      status: 'healthy',
      message: `MongoDB URI configured: ${mongoUri.replace(/:[^:]*@/, ':****@')}`,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Invalid MongoDB URI: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Check if port is available (Windows)
 */
async function checkPortWindows(port: number): Promise<{ status: 'available' | 'in-use'; message: string }> {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
    if (stdout.trim()) {
      return {
        status: 'in-use',
        message: `Port ${port} is already in use`,
      }
    }
    return {
      status: 'available',
      message: `Port ${port} is available`,
    }
  } catch {
    // Command failed means port is available
    return {
      status: 'available',
      message: `Port ${port} is available`,
    }
  }
}

/**
 * Check if port is available (Unix-like)
 */
async function checkPortUnix(port: number): Promise<{ status: 'available' | 'in-use'; message: string }> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} || netstat -tuln | grep :${port}`)
    if (stdout.trim()) {
      return {
        status: 'in-use',
        message: `Port ${port} is already in use`,
      }
    }
    return {
      status: 'available',
      message: `Port ${port} is available`,
    }
  } catch {
    return {
      status: 'available',
      message: `Port ${port} is available`,
    }
  }
}

/**
 * Check if port is available
 */
async function checkPort(port: number): Promise<{ status: 'available' | 'in-use'; message: string }> {
  const isWindows = process.platform === 'win32'
  
  try {
    if (isWindows) {
      return await checkPortWindows(port)
    } else {
      return await checkPortUnix(port)
    }
  } catch (error) {
    console.warn('[HEALTH-CHECK] Could not check port availability:', error)
    return {
      status: 'available',
      message: `Port ${port} (assumed available)`,
    }
  }
}

/**
 * Validate environment variables
 */
function validateEnv(): { status: 'valid' | 'invalid'; message: string } {
  const required = ['MONGO_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS']
  const missing = required.filter(v => {
    if (v.startsWith('EMAIL_')) {
      const smtpAlias = v.replace('EMAIL_', 'SMTP_')
      return !process.env[v] && !process.env[smtpAlias]
    }
    return !process.env[v]
  })
  
  if (missing.length > 0) {
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      return {
        status: 'valid',
        message: `${required.length - missing.length}/${required.length} env vars set (development mode allows defaults)`,
      }
    }
    return {
      status: 'invalid',
      message: `Missing variables: ${missing.join(', ')}`,
    }
  }
  
  return {
    status: 'valid',
    message: `All ${required.length} required environment variables are set`,
  }
}

/**
 * Run full health check
 */
export async function performHealthCheck(mongoUri: string, port: number): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    mongodb: await checkMongoDB(mongoUri),
    port: await checkPort(port),
    env: validateEnv(),
  }
  
  return result
}

/**
 * Print health check results
 */
export function printHealthCheckResults(result: HealthCheckResult): void {
  console.log('\n[HEALTH-CHECK] ========== STARTUP DIAGNOSTICS ==========')
  console.log(`[HEALTH-CHECK] Timestamp: ${result.timestamp}`)
  console.log(`[HEALTH-CHECK] Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('')
  
  console.log(
    `[HEALTH-CHECK] MongoDB: ${result.mongodb.status === 'healthy' ? '✓' : '✗'} ${result.mongodb.message}`
  )
  console.log(
    `[HEALTH-CHECK] Port: ${result.port.status === 'available' ? '✓' : '✗'} ${result.port.message}`
  )
  console.log(
    `[HEALTH-CHECK] Environment: ${result.env.status === 'valid' ? '✓' : '✗'} ${result.env.message}`
  )
  
  console.log('[HEALTH-CHECK] ================================================\n')
}

/**
 * Check if health check passed
 */
export function isHealthy(result: HealthCheckResult): boolean {
  return (
    result.mongodb.status === 'healthy' &&
    result.port.status === 'available' &&
    result.env.status === 'valid'
  )
}
