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
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string; role: string; email: string }
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    next()
  }
}
