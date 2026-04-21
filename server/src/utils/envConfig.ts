/**
 * Environment Variables Validation and Configuration
 * Robust environment variable loading and validation with production safety
 * 
 * This module ensures:
 * 1. Environment variables are properly loaded from .env files
 * 2. Sensible defaults are used in development mode
 * 3. Production mode enforces strict validation
 * 4. All values are type-validated and in correct ranges
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string
  JWT_EXPIRY: string
  CORS_ORIGIN: string
  EMAIL_HOST: string
  EMAIL_PORT: number
  EMAIL_USER: string
  EMAIL_PASS: string
  EMAIL_FROM: string
  FRONTEND_URL: string
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'
  MAX_LOGIN_ATTEMPTS: number
  LOGIN_ATTEMPT_WINDOW_MS: number
  SESSION_TIMEOUT_MS: number
}

/**
 * Development environment defaults
 * Used when variables are not provided in development mode
 */
const DEVELOPMENT_DEFAULTS: Partial<Record<keyof EnvConfig, string>> = {
  SUPABASE_URL: 'https://mlhoeaojalsiptkkmupi.supabase.co',
  JWT_SECRET: 'FolushoVictorySchools_SecureJWTSecret_2024_Production_Key_#@!$%',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_USER: 'folushovictoryschool@gmail.com',
  EMAIL_PASS: 'fvvv lyzz hdsd aupi',
  NODE_ENV: 'development',
  PORT: '3001',
  FRONTEND_URL: 'http://localhost:5173',
  CORS_ORIGIN: 'http://localhost:5173',
  EMAIL_PORT: '587',
  EMAIL_FROM: 'noreply@folusho.com',
  JWT_EXPIRY: '7d',
  LOG_LEVEL: 'info',
  MAX_LOGIN_ATTEMPTS: '5',
  LOGIN_ATTEMPT_WINDOW_MS: '900000',
  SESSION_TIMEOUT_MS: '86400000',
}

/**
 * Required variables that must be present (even in development)
 * These have defaults, so they'll always be available
 */
const CRITICAL_VARS: (keyof EnvConfig)[] = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
]

/**
 * Validates and loads environment variables
 * Returns validated configuration object
 * Throws error if production mode has missing critical variables
 */
export function validateEnv(): EnvConfig {
  // Ensure NODE_ENV is set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development'
    console.log('[CONFIG] NODE_ENV not set, defaulting to development')
  }

  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  console.log('[CONFIG] ========== ENVIRONMENT CONFIGURATION ==========')
  console.log(`[CONFIG] Mode: ${process.env.NODE_ENV}`)
  console.log('[CONFIG] Validating required variables...')

  // Check for missing critical variables
  const missingVars: string[] = []

  for (const varName of CRITICAL_VARS) {
    // Special handling for EMAIL/SMTP aliases
    let envValue: string | undefined
    if (varName.startsWith('EMAIL_')) {
      const smtpAlias = varName.replace('EMAIL_', 'SMTP_')
      envValue = process.env[varName] || process.env[smtpAlias]
    } else {
      envValue = process.env[varName]
    }

    const hasValue = envValue && envValue.trim() !== ''

    if (!hasValue) {
      if (isDevelopment && DEVELOPMENT_DEFAULTS[varName]) {
        console.log(
          `[CONFIG] ℹ️  ${varName}: using development default (not set in environment)`
        )
        // Set the default so it's available
        process.env[varName] = DEVELOPMENT_DEFAULTS[varName]!
      } else if (isProduction) {
        missingVars.push(varName)
      }
    } else {
      console.log(`[CONFIG] ✓ ${varName}: present`)
    }
  }

  // In production, reject missing variables (unless on Vercel where we trust process.env)
  if (missingVars.length > 0 && isProduction && !process.env.VERCEL) {
    console.error('[CONFIG] ❌ PRODUCTION MODE: Missing required environment variables!')
    console.error('[CONFIG] Missing:', missingVars.join(', '))
    throw new Error(
      `[CONFIGURATION ERROR] Production mode requires all variables. Missing: ${missingVars.join(', ')}`
    )
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET || ''
  if (isProduction && jwtSecret.length < 32) {
    throw new Error('[CONFIGURATION ERROR] JWT_SECRET must be at least 32 characters long for production')
  }
  if (isDevelopment && jwtSecret.length < 32) {
    console.warn('[CONFIG] ⚠️  JWT_SECRET is less than 32 characters (development mode)')
  }
  
  
  const config: EnvConfig = {
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    PORT: validatePort(parseInt(process.env.PORT || DEVELOPMENT_DEFAULTS.PORT || '3001', 10)),
    SUPABASE_URL: process.env.SUPABASE_URL || DEVELOPMENT_DEFAULTS.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
    JWT_SECRET: process.env.JWT_SECRET || DEVELOPMENT_DEFAULTS.JWT_SECRET || '',
    JWT_EXPIRY: process.env.JWT_EXPIRY || DEVELOPMENT_DEFAULTS.JWT_EXPIRY || '7d',
    CORS_ORIGIN: process.env.CORS_ORIGIN || DEVELOPMENT_DEFAULTS.CORS_ORIGIN || 'http://localhost:5173',
    EMAIL_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST || DEVELOPMENT_DEFAULTS.EMAIL_HOST || '',
    EMAIL_PORT: validatePort(parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || DEVELOPMENT_DEFAULTS.EMAIL_PORT || '587', 10)),
    EMAIL_USER: process.env.EMAIL_USER || process.env.SMTP_USER || DEVELOPMENT_DEFAULTS.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || process.env.SMTP_PASS || DEVELOPMENT_DEFAULTS.EMAIL_PASS || '',
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_FROM || DEVELOPMENT_DEFAULTS.EMAIL_FROM || 'noreply@folusho.com',
    FRONTEND_URL: process.env.FRONTEND_URL || DEVELOPMENT_DEFAULTS.FRONTEND_URL || 'http://localhost:5173',
    LOG_LEVEL: (process.env.LOG_LEVEL || DEVELOPMENT_DEFAULTS.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || DEVELOPMENT_DEFAULTS.MAX_LOGIN_ATTEMPTS || '5', 10),
    LOGIN_ATTEMPT_WINDOW_MS: parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS || DEVELOPMENT_DEFAULTS.LOGIN_ATTEMPT_WINDOW_MS || '900000', 10),
    SESSION_TIMEOUT_MS: parseInt(process.env.SESSION_TIMEOUT_MS || DEVELOPMENT_DEFAULTS.SESSION_TIMEOUT_MS || '86400000', 10),
  }

  // Log validated configuration
  console.log('[CONFIG] ✓ Port:', config.PORT)
  console.log('[CONFIG] ✓ CORS Origin:', config.CORS_ORIGIN)
  console.log('[CONFIG] ✓ Frontend URL:', config.FRONTEND_URL)
  
  if (isDevelopment) {
    console.warn('[CONFIG] ⚠️  DEVELOPMENT mode - do not use in production!')
  }
  if (isProduction) {
    console.log('[CONFIG] 🔒 PRODUCTION mode - strict validation enabled')
  }
  console.log('[CONFIG] ====================================================\n')

  return config
}

/**
 * Validate port number is in valid range
 */
function validatePort(port: number): number {
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`[CONFIGURATION ERROR] Invalid port number: ${port}. Must be between 1 and 65535.`)
  }
  return port
}


/**
 * Get validated environment configuration
 * Cached to avoid re-validation and ensure consistency
 */
let cachedConfig: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv()
  }
  return cachedConfig
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetEnvConfig(): void {
  cachedConfig = null
}

// Initialize configuration immediately on import
export default getEnvConfig()

