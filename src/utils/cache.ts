/**
 * Caching utilities and strategies
 */

// Cache entry interface
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  accessCount: number
  lastAccessed: number
}

// Cache configuration
interface CacheConfig {
  maxSize: number
  defaultTTL: number // Time to live in milliseconds
  cleanupInterval: number
}

// Memory-based cache implementation
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private config: CacheConfig
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      ...config
    }

    // Start cleanup interval
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.config.defaultTTL)

    // If cache is full, remove least recently used items
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now
    
    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Remove expired entries
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Evict least recently used items
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // Get cache statistics
  getStats(): {
    size: number
    hitRate: number
    memoryUsage: number
  } {
    const entries = Array.from(this.cache.values())
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const hitRate = totalAccess > 0 ? totalAccess / (totalAccess + this.config.maxSize - this.cache.size) : 0

    return {
      size: this.cache.size,
      hitRate,
      memoryUsage: JSON.stringify(entries).length
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.cache.clear()
  }
}

// LocalStorage-based cache with encryption
export class PersistentCache<T = any> {
  private keyPrefix: string
  private encryptionEnabled: boolean

  constructor(keyPrefix = 'app_cache_', encryptionEnabled = true) {
    this.keyPrefix = keyPrefix
    this.encryptionEnabled = encryptionEnabled
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = ttl ? now + ttl : null
    const entry = {
      data,
      timestamp: now,
      expiresAt
    }

    const storageKey = this.keyPrefix + key
    const value = this.encryptionEnabled ? this.encrypt(JSON.stringify(entry)) : JSON.stringify(entry)
    
    try {
      localStorage.setItem(storageKey, value)
    } catch (error) {
      console.warn('Failed to store data in localStorage:', error)
    }
  }

  get(key: string): T | null {
    const storageKey = this.keyPrefix + key
    
    try {
      const value = localStorage.getItem(storageKey)
      if (!value) return null

      const decrypted = this.encryptionEnabled ? this.decrypt(value) : value
      const entry = JSON.parse(decrypted)

      // Check if expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.delete(key)
        return null
      }

      return entry.data
    } catch (error) {
      console.warn('Failed to retrieve data from localStorage:', error)
      return null
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    const storageKey = this.keyPrefix + key
    localStorage.removeItem(storageKey)
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.keyPrefix))
    keys.forEach(key => localStorage.removeItem(key))
  }

  // Simple encryption (base64 for demo - use proper encryption in production)
  private encrypt(data: string): string {
    return btoa(data)
  }

  private decrypt(data: string): string {
    return atob(data)
  }
}

// Cache manager with multiple strategies
export class CacheManager {
  private memoryCache: MemoryCache
  private persistentCache: PersistentCache
  private strategy: 'memory' | 'persistent' | 'hybrid'

  constructor(strategy: 'memory' | 'persistent' | 'hybrid' = 'hybrid') {
    this.strategy = strategy
    this.memoryCache = new MemoryCache({ maxSize: 50, defaultTTL: 10 * 60 * 1000 })
    this.persistentCache = new PersistentCache('app_cache_')
  }

  set<T>(key: string, data: T, ttl?: number): void {
    switch (this.strategy) {
      case 'memory':
        this.memoryCache.set(key, data, ttl)
        break
      case 'persistent':
        this.persistentCache.set(key, data, ttl)
        break
      case 'hybrid':
        // Store in both for faster access and persistence
        this.memoryCache.set(key, data, Math.min(ttl || 300000, 300000)) // Max 5 min in memory
        this.persistentCache.set(key, data, ttl)
        break
    }
  }

  get<T>(key: string): T | null {
    switch (this.strategy) {
      case 'memory':
        return this.memoryCache.get(key)
      case 'persistent':
        return this.persistentCache.get(key)
      case 'hybrid':
        // Try memory first, then persistent
        let data = this.memoryCache.get(key)
        if (data === null) {
          data = this.persistentCache.get(key)
          if (data !== null) {
            // Cache back to memory
            this.memoryCache.set(key, data, 300000)
          }
        }
        return data
    }
  }

  has(key: string): boolean {
    switch (this.strategy) {
      case 'memory':
        return this.memoryCache.has(key)
      case 'persistent':
        return this.persistentCache.has(key)
      case 'hybrid':
        return this.memoryCache.has(key) || this.persistentCache.has(key)
    }
  }

  delete(key: string): void {
    this.memoryCache.delete(key)
    this.persistentCache.delete(key)
  }

  clear(): void {
    this.memoryCache.clear()
    this.persistentCache.clear()
  }

  getStats(): any {
    return {
      memory: this.memoryCache.getStats(),
      strategy: this.strategy
    }
  }
}

// API response caching
export class ApiCache {
  private cache: CacheManager
  private defaultTTL: number

  constructor(defaultTTL = 5 * 60 * 1000) {
    this.cache = new CacheManager('hybrid')
    this.defaultTTL = defaultTTL
  }

  // Generate cache key from URL and parameters
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `api:${url}:${paramString}`
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T | null> {
    const key = this.generateKey(url, params)
    return this.cache.get<T>(key)
  }

  set<T>(url: string, data: T, params?: Record<string, any>, ttl?: number): void {
    const key = this.generateKey(url, params)
    this.cache.set(key, data, ttl || this.defaultTTL)
  }

  invalidate(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params)
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    // This is a simplified implementation
    // In production, you'd want more sophisticated pattern matching
    this.cache.clear()
  }
}

// Global cache instances
export const memoryCache = new MemoryCache()
export const persistentCache = new PersistentCache()
export const apiCache = new ApiCache()
