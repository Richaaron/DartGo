/**
 * Simplified API Service for MongoDB Primary
 */

const REQUEST_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 2 // Total of 3 attempts
const INITIAL_RETRY_DELAY = 1000 // 1 second

// Registry to allow manual cancellation of retry loops from the UI
const cancelRegistry = new Map<string, () => void>()
const retryNowRegistry = new Map<string, () => void>()

window.addEventListener('api-request-cancel', (e: any) => {
  const { endpoint } = e.detail
  cancelRegistry.get(endpoint)?.()
})

window.addEventListener('api-request-retry-now', (e: any) => {
  const { endpoint } = e.detail
  retryNowRegistry.get(endpoint)?.()
})

const getPrimaryUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  
  if (envUrl) {
    // Ensure we don't have double slashes and ends with /api
    const cleanUrl = envUrl.replace(/\/$/, '')
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`
  }

  if (import.meta.env.PROD) return '/api'
  // Fall back to local dev server
  return 'http://localhost:3002/api'
}

const PRIMARY_API_URL = getPrimaryUrl()

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
async function fetchWithTimeout(url: string, endpoint: string, options: RequestInit = {}) {
  let attempt = 0
  let isCancelled = false
  let currentController: AbortController | null = null
  let resolveWait: (() => void) | null = null

  const cancel = () => {
    isCancelled = true
    resolveWait?.()
    currentController?.abort()
  }

  cancelRegistry.set(endpoint, cancel)
  retryNowRegistry.set(endpoint, () => resolveWait?.())

  try {
    while (true) {
      if (isCancelled) throw new DOMException('Request cancelled by user', 'AbortError')

      currentController = new AbortController()
      const timeoutId = setTimeout(() => currentController?.abort(), REQUEST_TIMEOUT)

      try {
        const headers = {
          ...getHeaders(),
          ...options.headers as Record<string, string>,
        }

        // If the body is FormData, we must let the browser set the Content-Type (with boundary)
        if (options.body instanceof FormData) {
          delete headers['Content-Type']
        }

        const res = await fetch(`${url}${endpoint}`, {
          ...options,
          signal: currentController.signal,
          headers,
        })

        clearTimeout(timeoutId)

        if (res.ok) {
          if (attempt > 0) {
            window.dispatchEvent(new CustomEvent('api-retry-success', { detail: { endpoint } }))
          }
          return res.json()
        }

      // Global error interceptor for 401 Unauthorized
      if (res.status === 401) {
        console.warn('Unauthorized request detected. Clearing session and redirecting...')
        localStorage.removeItem('authSession')

        // Force redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?reason=expired'
        }
      } else if (res.status >= 500 && attempt < MAX_RETRIES && !isCancelled) {
        // Retry logic for Server Errors
        attempt++
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        
        window.dispatchEvent(new CustomEvent('api-retry', { 
          detail: { endpoint, attempt, maxRetries: MAX_RETRIES, delay } 
        }))

        console.warn(`API attempt ${attempt} failed with status ${res.status}. Retrying in ${delay}ms...`)
        
        // Wait for delay or until cancelled or manually triggered
        await new Promise(resolve => {
          resolveWait = () => {
            clearTimeout(t)
            resolve(null)
          }
          const t = setTimeout(resolveWait, delay)
          currentController?.signal.addEventListener('abort', resolveWait, { once: true })
        })
        resolveWait = null

        if (isCancelled) break
        continue
      }

      const errorData = await res.json().catch(() => ({ error: 'Invalid response from server' }))
      if (isCancelled) throw new DOMException('Request cancelled by user', 'AbortError')

      if (attempt > 0) {
        window.dispatchEvent(new CustomEvent('api-retry-failure', { detail: { endpoint } }))
      }
      throw new Error(errorData.error || `Request failed with status ${res.status}`)
    } catch (error: any) {
      console.error(`API Error at ${endpoint}:`, error.message)
      clearTimeout(timeoutId)
      if (isCancelled) throw error

      if (error.name !== 'AbortError' && attempt < MAX_RETRIES && !isCancelled) {
        attempt++
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        
        window.dispatchEvent(new CustomEvent('api-retry', { 
          detail: { endpoint, attempt, maxRetries: MAX_RETRIES, delay } 
        }))

        console.warn(`API attempt ${attempt} failed with network error. Retrying in ${delay}ms...`, error.message)

        // Wait for delay or until cancelled or manually triggered
        await new Promise(resolve => {
          resolveWait = () => {
            clearTimeout(t)
            resolve(null)
          }
          const t = setTimeout(resolveWait, delay)
          currentController?.signal.addEventListener('abort', resolveWait, { once: true })
        })
        resolveWait = null

        if (isCancelled) break
        continue
      }
      if (attempt > 0 && error.name !== 'AbortError' && !isCancelled) {
        window.dispatchEvent(new CustomEvent('api-retry-failure', { detail: { endpoint } }))
      }
      throw error
    }
  }
  } finally {
    cancelRegistry.delete(endpoint)
    retryNowRegistry.delete(endpoint)
  }
}

// API methods
async function get<T>(url: string, config: RequestInit = {}): Promise<{ data: T }> {
  const data = await fetchWithTimeout(PRIMARY_API_URL, url, { method: 'GET', ...config })
  return { data }
}

async function post<T>(url: string, data: any = {}, config: RequestInit = {}): Promise<{ data: T }> {
  const isFormData = data instanceof FormData
  const result = await fetchWithTimeout(PRIMARY_API_URL, url, { 
    method: 'POST', 
    body: isFormData ? data : JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function put<T>(url: string, data: any = {}, config: RequestInit = {}): Promise<{ data: T }> {
  const isFormData = data instanceof FormData
  const result = await fetchWithTimeout(PRIMARY_API_URL, url, { 
    method: 'PUT', 
    body: isFormData ? data : JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function patch<T>(url: string, data: any = {}, config: RequestInit = {}): Promise<{ data: T }> {
  const isFormData = data instanceof FormData
  const result = await fetchWithTimeout(PRIMARY_API_URL, url, { 
    method: 'PATCH', 
    body: isFormData ? data : JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function del<T>(url: string, config: RequestInit = {}): Promise<{ data: T }> {
  const result = await fetchWithTimeout(PRIMARY_API_URL, url, { method: 'DELETE', ...config })
  return { data: result }
}

export const apiService = {
  get,
  post,
  put,
  patch,
  delete: del
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's a JSON response error from the server
    if (error.response?.data) {
      return Promise.reject(error)
    }
    
    // If server returned a non-JSON error (like a 502/504 HTML page)
    if (error.response?.status >= 500) {
      return Promise.reject({
        message: `Server Error (${error.response.status}). The backend might be restarting or experiencing an issue.`,
        response: error.response
      })
    }

    return Promise.reject(error)
  }
)

export default apiService
