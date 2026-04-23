/**
 * Custom hooks for API operations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { UseApiResult } from '../types/api'

// Generic API hook
export function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction()
      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        setData(null)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, dependencies)

  useEffect(() => {
    execute()
    
    return () => {
      mountedRef.current = false
    }
  }, [execute])

  return { data, loading, error, refetch: execute }
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  initialLimit: number = 10
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)
  const mountedRef = useRef(true)

  const loadPage = useCallback(async (pageNum: number = page, pageLimit: number = limit) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction(pageNum, pageLimit)
      if (mountedRef.current) {
        setData(result.data)
        setTotal(result.total)
        setPage(pageNum)
        setLimit(pageLimit)
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        setData([])
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [apiFunction, page, limit])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
    nextPage: () => loadPage(page + 1),
    prevPage: () => loadPage(page - 1),
    goToPage: loadPage,
    setLimit: (newLimit: number) => loadPage(1, newLimit),
    refetch: () => loadPage()
  }
}

// Hook for optimistic updates
export function useOptimisticApi<T, P>(
  apiFunction: (params: P) => Promise<T>,
  updateFunction: (oldData: T[] | null, params: P) => T[]
) {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const execute = useCallback(async (params: P) => {
    setLoading(true)
    setError(null)
    
    // Optimistic update
    const previousData = data
    try {
      const optimisticData = updateFunction(previousData, params)
      setData(optimisticData)
      
      const result = await apiFunction(params)
      if (mountedRef.current) {
        // Update with actual result
        setData(updateFunction(optimisticData, params))
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        // Rollback on error
        setData(previousData)
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [apiFunction, updateFunction, data])

  return { data, loading, error, execute, setData }
}

// Hook for debounced API calls
export function useDebouncedApi<T>(
  apiFunction: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()
  const mountedRef = useRef(true)

  const debouncedExecute = useCallback((searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setLoading(true)
    setError(null)

    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await apiFunction(searchQuery)
        if (mountedRef.current) {
          setData(result)
        }
      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred'
          setError(errorMessage)
          setData(null)
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }, delay)
  }, [apiFunction, delay])

  useEffect(() => {
    debouncedExecute(query)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, debouncedExecute])

  return { data, loading, error, setQuery, query }
}

// Hook for cached API calls
export function useCachedApi<T>(
  key: string,
  apiFunction: () => Promise<T>,
  cacheTime: number = 5 * 60 * 1000 // 5 minutes
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const mountedRef = useRef(true)

  const execute = useCallback(async (forceRefresh: boolean = false) => {
    const cached = cacheRef.current.get(key)
    const now = Date.now()
    
    if (!forceRefresh && cached && (now - cached.timestamp) < cacheTime) {
      setData(cached.data)
      return cached.data
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction()
      if (mountedRef.current) {
        setData(result)
        cacheRef.current.set(key, { data: result, timestamp: now })
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        setData(null)
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [key, apiFunction, cacheTime])

  useEffect(() => {
    execute()
  }, [execute])

  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(key)
  }, [key])

  return { data, loading, error, refetch: () => execute(true), invalidateCache }
}

// Hook for file uploads
export function useFileUpload<T>(
  uploadFunction: (file: File) => Promise<T>
) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<T | null>(null)
  const mountedRef = useRef(true)

  const upload = useCallback(async (file: File) => {
    setUploading(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      // Simulate progress (in real app, this would come from the upload function)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const uploadResult = await uploadFunction(file)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      if (mountedRef.current) {
        setResult(uploadResult)
      }
      
      return uploadResult
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMessage)
        setProgress(0)
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setTimeout(() => setUploading(false), 500)
      }
    }
  }, [uploadFunction])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
    setResult(null)
  }, [])

  return { upload, uploading, progress, error, result, reset }
}
