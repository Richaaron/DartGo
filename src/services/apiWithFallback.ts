/* global localStorage, fetch, URLSearchParams */

/**
 * API Service with MongoDB Primary + Supabase Fallback & Mirroring
 * 
 * READS: Try MongoDB (primary) first, fallback to Supabase.
 * WRITES: Dual-write to both MongoDB and Supabase for data consistency.
 */

const REQUEST_TIMEOUT = 30000 // 30 seconds

const getPrimaryUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return 'http://localhost:3002/api'
  // Support relative paths for Vercel proxying
  if (envUrl.startsWith('/')) return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
}

const getBackupUrl = () => {
  const envUrl = import.meta.env.VITE_BACKUP_API_URL
  if (!envUrl) return 'http://localhost:3001/api'
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
}

const PRIMARY_API_URL = getPrimaryUrl()
const BACKUP_API_URL = getBackupUrl()

// Track which API is currently active for READS
let activeAPI = PRIMARY_API_URL
let primaryFailed = false
let lastFailureTime = 0
const RETRY_INTERVAL = 30000 // Retry primary every 30 seconds

function getHeaders() {
  const session = localStorage.getItem('authSession')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (session) {
    try {
      const { token } = JSON.parse(session)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch (e) {
      console.error('Error parsing auth session for headers', e)
    }
  }
  
  return headers
}

/**
 * Perform a fetch with a specific timeout
 */
async function fetchWithTimeout(url: string, endpoint: string, options: any = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  
  try {
    const res = await fetch(`${url}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `Request failed with status ${res.status}`)
    }
    
    return res.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Generic Read Fetch (GET)
 * Tries Primary first, falls back to Backup
 */
async function readFetch(endpoint: string, options: any = {}) {
  const now = Date.now()
  
  // Check if we should retry primary API
  if (primaryFailed && now - lastFailureTime > RETRY_INTERVAL) {
    primaryFailed = false
    activeAPI = PRIMARY_API_URL
    console.log('[API] Retrying primary MongoDB API for read')
  }

  const urlsToTry = activeAPI === PRIMARY_API_URL 
    ? [PRIMARY_API_URL, BACKUP_API_URL]
    : [BACKUP_API_URL, PRIMARY_API_URL]

  let lastError: Error | null = null

  for (const url of urlsToTry) {
    try {
      const data = await fetchWithTimeout(url, endpoint, { ...options, method: 'GET' })
      
      // If we used the backup, log it
      if (url !== PRIMARY_API_URL) {
        console.warn(`[API] READ using Backup (Supabase). Primary (MongoDB) is currently down.`)
      }
      
      return data
    } catch (error: any) {
      lastError = error
      if (url === PRIMARY_API_URL) {
        primaryFailed = true
        lastFailureTime = now
        activeAPI = BACKUP_API_URL
      }
    }
  }

  throw lastError || new Error('All API endpoints failed for READ')
}

/**
 * Generic Write Fetch (POST, PUT, PATCH, DELETE)
 * Attempts to write to BOTH for consistency, but returns success if at least one works
 */
async function writeFetch(endpoint: string, options: any = {}) {
  const primaryPromise = fetchWithTimeout(PRIMARY_API_URL, endpoint, options)
  const backupPromise = fetchWithTimeout(BACKUP_API_URL, endpoint, options)

  // Try both in parallel
  const results = await Promise.allSettled([primaryPromise, backupPromise])
  
  const primaryResult = results[0]
  const backupResult = results[1]

  // If both failed, we have a problem
  if (primaryResult.status === 'rejected' && backupResult.status === 'rejected') {
    throw primaryResult.reason || backupResult.reason || new Error('All write attempts failed')
  }

  // If primary failed but backup worked
  if (primaryResult.status === 'rejected' && backupResult.status === 'fulfilled') {
    console.error('[API] Write failed on Primary (MongoDB) but succeeded on Backup (Supabase). Data fragmentation risk!')
    primaryFailed = true
    lastFailureTime = Date.now()
    activeAPI = BACKUP_API_URL
    return backupResult.value
  }

  // If primary worked but backup failed
  if (primaryResult.status === 'fulfilled' && backupResult.status === 'rejected') {
    console.warn('[API] Write succeeded on Primary but failed on Backup (Supabase). Backup is out of sync.')
    return primaryResult.value
  }

  // Both worked (ideal case)
  return (primaryResult as PromiseFulfilledResult<any>).value
}

// API methods
async function get<T>(url: string, config: any = {}): Promise<{ data: T }> {
  const data = await readFetch(url, config)
  return { data }
}

async function post<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await writeFetch(url, { 
    method: 'POST', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function put<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await writeFetch(url, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function patch<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await writeFetch(url, { 
    method: 'PATCH', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function del<T>(url: string, config: any = {}): Promise<{ data: T }> {
  const result = await writeFetch(url, { method: 'DELETE', ...config })
  return { data: result }
}

// Export status function for debugging
export function getAPIStatus() {
  return {
    primary: PRIMARY_API_URL,
    backup: BACKUP_API_URL,
    active: activeAPI,
    primaryFailed,
    nextRetry: primaryFailed ? new Date(lastFailureTime + RETRY_INTERVAL) : null,
  }
}

export const apiWithFallback = {
  get,
  post,
  put,
  patch,
  delete: del,
  getStatus: getAPIStatus,
}

export default apiWithFallback
