import { Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'

export const activityLogger = async (req: any, res: Response, next: NextFunction) => {
  if (req.user) {
    // Log non-GET requests as activities
    if (req.method !== 'GET') {
      try {
        const action = `${req.method} ${req.originalUrl}`
        const details = JSON.stringify(req.body)

        // Try to infer entity type and id from URL if possible
        const urlParts = req.originalUrl.split('/')
        const entityType = urlParts[2] || 'unknown'
        const entityId = urlParts[3] || 'none'

        await supabase.from('activities').insert({
          user_id: req.user.id || req.user.email,
          user_name: req.user.name || req.user.email,
          role: req.user.role,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details: details.length > 500 ? details.substring(0, 500) + '...' : details
        })
      } catch (error) {
        console.error('Error logging activity:', error)
      }
    }
  }
  next()
}
