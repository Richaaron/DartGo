import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getEnvConfig } from '../utils/envConfig'

const config = getEnvConfig()

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
    email: string
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    console.warn('[AUTH] Authentication required: No token provided.')
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string; role: string; email: string }
    req.user = decoded
    console.log(`[AUTH] User authenticated: ${decoded.email} (${decoded.role})`)
    next()
  } catch (error) {
    console.error('[AUTH] Invalid token:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.warn('[AUTH] Authorization failed: No user in request after authentication.')
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      console.warn(`[AUTH] Authorization failed for user ${req.user.email}: Role '${req.user.role}' not in allowed roles [${roles.join(', ')}].`)
      return res.status(403).json({ error: 'Access denied' })
    }
    console.log(`[AUTH] User ${req.user.email} authorized for roles [${roles.join(', ')}].`)
    next()
  }
}
