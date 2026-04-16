import { Router } from 'express'
import { Notification } from '../models/Notification'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Get all notifications (admin only)
router.get('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { status, type, limit = 50, page = 1 } = req.query
    const filter: any = {}
    
    if (status) filter.status = status
    if (type) filter.type = type
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
    
    const total = await Notification.countDocuments(filter)
    
    res.json({
      notifications,
      total,
      page: parseInt(page as string),
      pages: Math.ceil(total / parseInt(limit as string))
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Get notifications for a student
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 })
      .limit(20)
    
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student notifications' })
  }
})

// Get notification statistics
router.get('/stats/summary', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const totalSent = await Notification.countDocuments({ status: 'sent' })
    const totalFailed = await Notification.countDocuments({ status: 'failed' })
    const totalPending = await Notification.countDocuments({ status: 'pending' })
    
    const byType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
    
    res.json({
      summary: {
        totalSent,
        totalFailed,
        totalPending,
        total: totalSent + totalFailed + totalPending
      },
      byType
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification statistics' })
  }
})

// Resend a failed notification
router.post('/:id/resend', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) return res.status(404).json({ error: 'Notification not found' })
    
    // Mark as pending for retry
    notification.status = 'pending'
    notification.errorMessage = undefined
    await notification.save()
    
    res.json({ message: 'Notification marked for retry', notification })
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend notification' })
  }
})

// Delete a notification record
router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.json({ message: 'Notification deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

export default router
