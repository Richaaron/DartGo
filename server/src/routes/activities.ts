import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { Activity } from '../models/Activity'

const router = express.Router()

interface AuthenticatedRequest extends Request {
  user?: any
}

// Get all teacher activities for admin
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' })
    }

    const activities = await Activity.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json(activities)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error })
  }
})

// Get activities for a specific teacher
router.get('/teacher/:teacherId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' })
    }

    const { teacherId } = req.params
    const activities = await Activity.find({ userId: teacherId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json(activities)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error })
  }
})

export default router
