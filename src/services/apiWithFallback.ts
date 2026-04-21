/* global localStorage, fetch, URLSearchParams */

/**
 * API Service with MongoDB Primary + Supabase Fallback
 * 
 * This service routes requests to MongoDB (primary) and automatically
 * falls back to Supabase if MongoDB is unavailable.
 */

const REQUEST_TIMEOUT = 30000 // 30 seconds

const getPrimaryUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return 'http://localhost:3002/api'
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
}

const getBackupUrl = () => {
  const envUrl = import.meta.env.VITE_BACKUP_API_URL
  if (!envUrl) return 'http://localhost:3001/api'
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
}

const PRIMARY_API_URL = getPrimaryUrl()
const BACKUP_API_URL = getBackupUrl()

// Track which API is currently active
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

async function apiFetch(endpoint: string, options: any = {}) {
  const now = Date.now()
  
  // Check if we should retry primary API
  if (primaryFailed && now - lastFailureTime > RETRY_INTERVAL) {
    primaryFailed = false
    activeAPI = PRIMARY_API_URL
    console.log('[API] Retrying primary MongoDB API')
  }

  let lastError: Error | null = null
  
  // Decide which URLs to try based on primary failure status
  const urlsToTry: string[] = []
  
  if (primaryFailed) {
    // If primary failed, try backup first, and only try primary if we've passed retry interval
    urlsToTry.push(BACKUP_API_URL)
    if (now - lastFailureTime > RETRY_INTERVAL) {
      urlsToTry.push(PRIMARY_API_URL)
    }
  } else {
    // Standard order: Primary then Backup
    urlsToTry.push(PRIMARY_API_URL)
    urlsToTry.push(BACKUP_API_URL)
  }

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

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

      // Success - update active API if we switched
      if (url !== activeAPI) {
        activeAPI = url
        primaryFailed = false
        const apiName = url === PRIMARY_API_URL ? 'MongoDB' : 'Supabase'
        console.log(`[API] Switched to ${apiName}`)
      }

      return res.json()
    } catch (error: unknown) {
      lastError = error as Error
      const apiName = url === PRIMARY_API_URL ? 'MongoDB' : 'Supabase'
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      // Check if it's a timeout error
      if (errorMsg === 'The operation was aborted') {
        console.warn(`[API] ${apiName} timeout (${REQUEST_TIMEOUT}ms)`)
      } else {
        console.warn(`[API] ${apiName} failed:`, errorMsg)
      }
      
      // Mark primary as failed if it was the first attempt
      if (url === PRIMARY_API_URL) {
        primaryFailed = true
        lastFailureTime = now
        activeAPI = BACKUP_API_URL
      }
    }
  }

  // Both APIs failed
  throw lastError || new Error('All API endpoints failed')
}

// Generic API methods
async function get<T>(url: string, config: any = {}): Promise<{ data: T }> {
  const data = await apiFetch(url, { method: 'GET', ...config })
  return { data }
}

async function post<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { 
    method: 'POST', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function put<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function patch<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { 
    method: 'PATCH', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function del<T>(url: string, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { method: 'DELETE', ...config })
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

// Export all API methods
export const apiWithFallback = {
  get,
  post,
  put,
  patch,
  delete: del,
  getStatus: getAPIStatus,
}

export default apiWithFallback
