import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

interface AuthenticatedRequest extends Request {
  user?: any
}

// Get all messages for the current user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error })
  }
})

// Send a message
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipientId, content, type } = req.body
    const senderId = req.user?.id

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content,
        type: type || 'general'
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error })
  }
})

export default router
