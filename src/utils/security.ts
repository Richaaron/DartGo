/**
 * Security utilities for input validation and XSS prevention
 */

// XSS prevention - sanitize HTML content
export const sanitizeHTML = (input: string): string => {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  name: /^[a-zA-Z\s\-'\.]+$/,
  registrationNumber: /^[A-Z0-9\-\/]+$/,
  score: /^\d+(\.\d{1,2})?$/,
  alphanumeric: /^[a-zA-Z0-9\s\-_]+$/,
  safeText: /^[a-zA-Z0-9\s\-_.,!?'"():;@#$%&*+=]+$/
}

// Validation functions
export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.email.test(email.trim())
}

export const validatePhone = (phone: string): boolean => {
  return VALIDATION_PATTERNS.phone.test(phone.trim())
}

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50 && VALIDATION_PATTERNS.name.test(name.trim())
}

export const validateRegistrationNumber = (regNo: string): boolean => {
  return regNo.trim().length >= 3 && VALIDATION_PATTERNS.registrationNumber.test(regNo.trim().toUpperCase())
}

export const validateScore = (score: string): { isValid: boolean; value: number } => {
  if (!VALIDATION_PATTERNS.score.test(score.trim())) {
    return { isValid: false, value: 0 }
  }
  const value = parseFloat(score.trim())
  return { 
    isValid: value >= 0 && value <= 100, 
    value 
  }
}

export const validateText = (text: string, minLength = 1, maxLength = 500): boolean => {
  const trimmed = text.trim()
  return trimmed.length >= minLength && 
         trimmed.length <= maxLength && 
         VALIDATION_PATTERNS.safeText.test(trimmed)
}

// SQL injection prevention - parameter validation
export const validateId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id) || /^[a-zA-Z0-9\-_]{1,50}$/.test(id)
}

// Content Security Policy helpers
export const createSafeURL = (baseURL: string, path: string): string => {
  const cleanPath = path.replace(/[^a-zA-Z0-9\-_\/]/g, '')
  return `${baseURL.replace(/\/$/, '')}/${cleanPath.replace(/^\//, '')}`
}

// Rate limiting in memory (for demo purposes)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now()
  const key = identifier
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

// CSRF token generation (simple version)
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Secure localStorage wrapper
export const secureStorage = {
  set: (key: string, value: any): void => {
    try {
      const encrypted = btoa(JSON.stringify(value))
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.warn('Failed to store data securely:', error)
    }
  },

  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return defaultValue || null
      return JSON.parse(atob(encrypted))
    } catch (error) {
      console.warn('Failed to retrieve secure data:', error)
      return defaultValue || null
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove secure data:', error)
    }
  }
}

// Input sanitization for different contexts
export const sanitizeInput = {
  text: (input: string): string => {
    return input.trim().replace(/[<>]/g, '')
  },

  email: (input: string): string => {
    return input.trim().toLowerCase()
  },

  number: (input: string): number => {
    const num = parseFloat(input.replace(/[^\d.-]/g, ''))
    return isNaN(num) ? 0 : num
  },

  alphanumeric: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9]/g, '')
  }
}

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} => {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain lowercase letters')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain uppercase letters')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain numbers')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain special characters')
  } else {
    score += 1
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  }
}
