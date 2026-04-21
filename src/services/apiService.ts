/* global localStorage, fetch */

/**
 * Simplified API Service for MongoDB Primary
 */

const REQUEST_TIMEOUT = 30000 // 30 seconds

const getPrimaryUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return 'http://localhost:3002/api'
  // Support relative paths for Vercel proxying
  if (envUrl.startsWith('/')) return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
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

// API methods
async function get<T>(url: string, config: any = {}): Promise<{ data: T }> {
  const data = await fetchWithTimeout(PRIMARY_API_URL, url, { method: 'GET', ...config })
  return { data }
}

async function post<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await fetchWithTimeout(PRIMARY_API_URL, url, { 
    method: 'POST', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function put<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await fetchWithTimeout(PRIMARY_API_URL, url, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function patch<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await fetchWithTimeout(PRIMARY_API_URL, url, { 
    method: 'PATCH', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function del<T>(url: string, config: any = {}): Promise<{ data: T }> {
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

export default apiService
