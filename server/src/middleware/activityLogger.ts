import { Request, Response, NextFunction } from 'express'
import { Activity } from '../models/Activity'
import { IUser } from '../models/User'

interface AuthenticatedRequest extends Request {
  user?: IUser
}

export const activityLogger = async (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'Teacher') {
    // We only log non-GET requests for teachers as "moves"
    if (req.method !== 'GET') {
      try {
        const action = `${req.method} ${req.originalUrl}`
        const details = JSON.stringify(req.body)

        await Activity.create({
          userId: req.user.id || req.user._id,
          userName: req.user.name || req.user.email, // Use email if name is not in token
          role: req.user.role,
          action,
          details: details.length > 500 ? details.substring(0, 500) + '...' : details
        })
      } catch (error) {
        console.error('Error logging activity:', error)
      }
    }
  }
  next()
}
