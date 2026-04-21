/**
 * Input Validation Utilities
 * Centralized validation for all form inputs
 */

export const validators = {
  // Email validation
  email: (email: string): { valid: boolean; error?: string } => {
    const trimmed = email.trim()
    if (!trimmed) return { valid: false, error: 'Email is required' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) return { valid: false, error: 'Invalid email format' }
    return { valid: true }
  },

  // Phone validation
  phone: (phone: string): { valid: boolean; error?: string } => {
    const trimmed = phone.trim()
    if (!trimmed) return { valid: false, error: 'Phone number is required' }
    const phoneRegex = /^\d{10,}$/
    if (!phoneRegex.test(trimmed.replace(/\D/g, ''))) {
      return { valid: false, error: 'Phone must be at least 10 digits' }
    }
    return { valid: true }
  },

  // Name validation
  name: (name: string): { valid: boolean; error?: string } => {
    const trimmed = name.trim()
    if (!trimmed) return { valid: false, error: 'Name is required' }
    if (trimmed.length < 2) return { valid: false, error: 'Name must be at least 2 characters' }
    if (trimmed.length > 100) return { valid: false, error: 'Name must be less than 100 characters' }
    return { valid: true }
  },

  // Password validation
  password: (password: string): { valid: boolean; error?: string } => {
    if (!password) return { valid: false, error: 'Password is required' }
    if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' }
    if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain uppercase letter' }
    if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must contain lowercase letter' }
    if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain number' }
    return { valid: true }
  },

  // Registration number validation
  registrationNumber: (regNum: string): { valid: boolean; error?: string } => {
    const trimmed = regNum.trim()
    if (!trimmed) return { valid: false, error: 'Registration number is required' }
    if (trimmed.length < 3) return { valid: false, error: 'Registration number must be at least 3 characters' }
    return { valid: true }
  },

  // Score validation
  score: (score: string | number): { valid: boolean; error?: string } => {
    const num = typeof score === 'string' ? parseFloat(score) : score
    if (isNaN(num)) return { valid: false, error: 'Score must be a number' }
    if (num < 0) return { valid: false, error: 'Score cannot be negative' }
    if (num > 100) return { valid: false, error: 'Score cannot exceed 100' }
    return { valid: true }
  },

  // URL validation
  url: (url: string): { valid: boolean; error?: string } => {
    const trimmed = url.trim()
    if (!trimmed) return { valid: false, error: 'URL is required' }
    try {
      new URL(trimmed)
      return { valid: true }
    } catch {
      return { valid: false, error: 'Invalid URL format' }
    }
  },

  // Date validation
  date: (date: string): { valid: boolean; error?: string } => {
    if (!date) return { valid: false, error: 'Date is required' }
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return { valid: false, error: 'Invalid date format' }
    return { valid: true }
  },

  // Required field validation
  required: (value: string | number | boolean): { valid: boolean; error?: string } => {
    if (value === '' || value === null || value === undefined) {
      return { valid: false, error: 'This field is required' }
    }
    return { valid: true }
  },
}

/**
 * Validate multiple fields at once
 */
export function validateForm(data: Record<string, any>, rules: Record<string, (val: any) => { valid: boolean; error?: string }>): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field])
    if (!result.valid && result.error) {
      errors[field] = result.error
    }
  }

  return errors
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

/**
 * Validate file upload
 */
export function validateFile(file: File, options: { maxSize?: number; allowedTypes?: string[] } = {}): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['text/csv', 'application/json'] } = options

  if (!file) return { valid: false, error: 'File is required' }
  if (file.size > maxSize) return { valid: false, error: `File size must be less than ${maxSize / 1024 / 1024}MB` }
  if (!allowedTypes.includes(file.type)) return { valid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` }

  return { valid: true }
}
