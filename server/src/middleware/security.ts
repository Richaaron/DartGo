import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { getEnvConfig } from '../utils/envConfig.js'

const envConfig = getEnvConfig()

/**
 * Security Headers Middleware
 * Adds essential security headers to all responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Disable content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:"
  )
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // HSTS for HTTPS
  if (envConfig.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  next()
}

/**
 * General rate limiter: 300 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
})

/**
 * Authentication rate limiter: 5 attempts per 15 minutes
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
})

/**
 * Strict rate limiter: 20 requests per 15 minutes
 * For sensitive endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Request logging middleware
 * Logs important security events
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }
    
    // Log authentication failures and errors
    if (res.statusCode >= 400) {
      console.warn('[Security Event]', JSON.stringify(logEntry))
    }
  })
  
  next()
}

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from request body and query
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    
    const sanitized: any = {}
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS and injection attempts
        sanitized[key] = obj[key]
          .replace(/[<>]/g, '') // Remove angle brackets
          .trim()
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitize(obj[key])
      } else {
        sanitized[key] = obj[key]
      }
    }
    return sanitized
  }
  
  if (req.body) req.body = sanitize(req.body)
  if (req.query) req.query = sanitize(req.query)
  
  next()
}
