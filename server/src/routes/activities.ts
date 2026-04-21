import express, { Request, Response } from 'express'
import { authenticate, authorize } from '../middleware/auth'
import { supabase } from '../config/supabase'

const router = express.Router()

// Get all activities for admin
router.get('/', authenticate, authorize(['Admin']), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error })
  }
})

// Get activities for a specific teacher
router.get('/teacher/:teacherId', authenticate, authorize(['Admin']), async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error })
  }
})

export default router
