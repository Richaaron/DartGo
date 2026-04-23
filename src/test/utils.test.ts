import { describe, it, expect, beforeEach } from 'vitest'
import { 
  sanitizeHTML, 
  validateEmail, 
  validatePhone, 
  validateName, 
  validateScore,
  generateCSRFToken,
  secureStorage 
} from '../utils/security'

describe('Security Utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('sanitizeHTML', () => {
    it('should remove HTML tags from input', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const result = sanitizeHTML(input)
      expect(result).toBe('Hello World')
    })

    it('should handle empty input', () => {
      const result = sanitizeHTML('')
      expect(result).toBe('')
    })

    it('should preserve plain text', () => {
      const input = 'Hello World'
      const result = sanitizeHTML(input)
      expect(result).toBe('Hello World')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@example')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true)
      expect(validatePhone('123-456-7890')).toBe(true)
      expect(validatePhone('(123) 456-7890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('abc')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('validateName', () => {
    it('should validate correct names', () => {
      expect(validateName('John Doe')).toBe(true)
      expect(validateName('Mary-Jane Smith')).toBe(true)
      expect(validateName("O'Connor")).toBe(true)
    })

    it('should reject invalid names', () => {
      expect(validateName('')).toBe(false)
      expect(validateName('J')).toBe(false)
      expect(validateName('John123')).toBe(false)
      expect(validateName('a'.repeat(51))).toBe(false)
    })
  })

  describe('validateScore', () => {
    it('should validate correct scores', () => {
      expect(validateScore('85')).toEqual({ isValid: true, value: 85 })
      expect(validateScore('95.5')).toEqual({ isValid: true, value: 95.5 })
      expect(validateScore('0')).toEqual({ isValid: true, value: 0 })
      expect(validateScore('100')).toEqual({ isValid: true, value: 100 })
    })

    it('should reject invalid scores', () => {
      expect(validateScore('-1')).toEqual({ isValid: false, value: -1 })
      expect(validateScore('101')).toEqual({ isValid: false, value: 101 })
      expect(validateScore('abc')).toEqual({ isValid: false, value: 0 })
    })
  })

  describe('generateCSRFToken', () => {
    it('should generate a token of correct length', () => {
      const token = generateCSRFToken()
      expect(token).toHaveLength(64) // 32 bytes * 2 hex chars
    })

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('secureStorage', () => {
    it('should store and retrieve data securely', () => {
      const testData = { key: 'value', number: 123 }
      secureStorage.set('test', testData)
      
      const retrieved = secureStorage.get('test')
      expect(retrieved).toEqual(testData)
    })

    it('should return default value for non-existent keys', () => {
      const result = secureStorage.get('nonexistent', 'default')
      expect(result).toBe('default')
    })

    it('should remove data', () => {
      secureStorage.set('test', 'value')
      secureStorage.remove('test')
      
      const result = secureStorage.get('test')
      expect(result).toBe(null)
    })
  })
})
