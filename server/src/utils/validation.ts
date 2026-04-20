/**
 * Input Validation Utilities
 * Validates and sanitizes common input types
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  value?: any
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required and must be a string')
    return { isValid: false, errors }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format')
  }
  
  if (email.length > 255) {
    errors.push('Email is too long (max 255 characters)')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: email.toLowerCase().trim(),
  }
}

/**
 * Password strength validation
 * Requires: minimum 12 characters, uppercase, lowercase, number, special character
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required and must be a string')
    return { isValid: false, errors }
  }
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }
  
  if (password.length > 128) {
    errors.push('Password is too long (max 128 characters)')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Name validation
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  const errors: string[] = []
  
  if (!name || typeof name !== 'string') {
    errors.push(`${fieldName} is required and must be a string`)
    return { isValid: false, errors }
  }
  
  if (name.trim().length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`)
  }
  
  if (name.length > 100) {
    errors.push(`${fieldName} is too long (max 100 characters)`)
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: name.trim(),
  }
}

/**
 * Phone number validation
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = []
  
  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required and must be a string')
    return { isValid: false, errors }
  }
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().+]/g, '')
  
  if (!/^\d{10,15}$/.test(cleaned)) {
    errors.push('Phone number must be 10-15 digits')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: cleaned,
  }
}

/**
 * Role validation
 */
export function validateRole(role: string): ValidationResult {
  const validRoles = ['Admin', 'Teacher', 'Student', 'Parent']
  const errors: string[] = []
  
  if (!role || typeof role !== 'string') {
    errors.push('Role is required and must be a string')
    return { isValid: false, errors }
  }
  
  if (!validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: role,
  }
}

/**
 * Date validation
 */
export function validateDate(dateStr: string, fieldName: string = 'Date'): ValidationResult {
  const errors: string[] = []
  
  if (!dateStr || typeof dateStr !== 'string') {
    errors.push(`${fieldName} is required and must be a string`)
    return { isValid: false, errors }
  }
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} is not a valid date`)
  }
  
  // Check if date is in the future
  if (date > new Date()) {
    errors.push(`${fieldName} cannot be in the future`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: date.toISOString(),
  }
}

/**
 * Validate registration number format
 */
export function validateRegistrationNumber(regNum: string): ValidationResult {
  const errors: string[] = []
  
  if (!regNum || typeof regNum !== 'string') {
    errors.push('Registration number is required and must be a string')
    return { isValid: false, errors }
  }
  
  // Format: SCHOOL-YEAR-CLASS-SEQUENCE (e.g., FVS-2024-P1-001)
  if (!/^[A-Z0-9-]{5,20}$/.test(regNum)) {
    errors.push('Invalid registration number format')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: regNum.toUpperCase(),
  }
}

/**
 * Score validation
 */
export function validateScore(score: any, totalScore: number = 100): ValidationResult {
  const errors: string[] = []
  
  const numScore = Number(score)
  
  if (isNaN(numScore)) {
    errors.push('Score must be a number')
    return { isValid: false, errors }
  }
  
  if (numScore < 0) {
    errors.push('Score cannot be negative')
  }
  
  if (numScore > totalScore) {
    errors.push(`Score cannot exceed ${totalScore}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: numScore,
  }
}

/**
 * Validate all required fields are present
 */
export function validateRequiredFields(data: any, requiredFields: string[]): ValidationResult {
  const errors: string[] = []
  
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
