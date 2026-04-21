/**
 * Environment Loader Utility
 * Handles explicit dotenv loading with fallbacks and validation
 * This ensures environment variables are properly loaded in all scenarios
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVER_ROOT = path.resolve(__dirname, '..', '..')

/**
 * Possible .env file locations (in order of priority)
 */
function getEnvFilePaths(): string[] {
  return [
    path.resolve(SERVER_ROOT, '.env.local'), // Local override (not committed)
    path.resolve(SERVER_ROOT, '.env'), // Main env file
    path.resolve(SERVER_ROOT, `.env.${process.env.NODE_ENV || 'development'}`), // Environment-specific
  ]
}

/**
 * Load environment variables from .env files
 * Returns the path of the loaded file or null if none found
 */
export function loadEnvFile(): string | null {
  // In serverless environments like Vercel, env vars are provided directly via process.env
  if (process.env.VERCEL) {
    console.log('[ENV-LOADER] Running on Vercel - using system environment variables')
    return 'process.env'
  }

  const envFiles = getEnvFilePaths()
  
  console.log('[ENV-LOADER] Searching for .env files...')
  console.log('[ENV-LOADER] Search paths:', envFiles)
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`[ENV-LOADER] Found: ${envFile}`)
      const result = dotenv.config({ path: envFile })
      
      if (result.error) {
        console.error(`[ENV-LOADER] Error loading ${envFile}:`, result.error)
        continue
      }
      
      console.log(`[ENV-LOADER] Successfully loaded ${envFile}`)
      console.log(`[ENV-LOADER] Loaded ${Object.keys(result.parsed || {}).length} variables`)
      return envFile
    }
  }
  
  console.warn('[ENV-LOADER] ⚠️  No .env files found! Using process.env and defaults.')
  return null
}

/**
 * Verify that critical environment variables are accessible
 */
export function verifyEnvLoading(): void {
  const criticalVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
  ]
  
  console.log('[ENV-LOADER] Verifying environment variables...')
  
  const loaded = criticalVars.filter(v => {
    if (v.startsWith('EMAIL_')) {
      const smtpAlias = v.replace('EMAIL_', 'SMTP_')
      return process.env[v] || process.env[smtpAlias]
    }
    return process.env[v]
  })
  const missing = criticalVars.filter(v => {
    if (v.startsWith('EMAIL_')) {
      const smtpAlias = v.replace('EMAIL_', 'SMTP_')
      return !process.env[v] && !process.env[smtpAlias]
    }
    return !process.env[v]
  })
  
  if (loaded.length > 0) {
    console.log(`[ENV-LOADER] ✓ Loaded: ${loaded.join(', ')}`)
  }
  
  if (missing.length > 0) {
    console.warn(`[ENV-LOADER] ⚠️  Missing: ${missing.join(', ')}`)
  }
}

/**
 * Get full path to server root for reference
 */
export function getServerRoot(): string {
  return SERVER_ROOT
}

/**
 * Print environment loading diagnostics (helpful for debugging)
 */
export function printDiagnostics(): void {
  console.log('[ENV-LOADER] ========== DIAGNOSTICS ==========')
  console.log('[ENV-LOADER] Server Root:', SERVER_ROOT)
  console.log('[ENV-LOADER] NODE_ENV:', process.env.NODE_ENV || 'not set')
  console.log('[ENV-LOADER] Available .env files:')
  
  getEnvFilePaths().forEach(p => {
    const exists = fs.existsSync(p)
    console.log(`  ${exists ? '✓' : '✗'} ${path.basename(p)}`)
  })
  
  console.log('[ENV-LOADER] ===================================')
}
