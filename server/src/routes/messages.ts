import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { supabase } from '../config/supabase'

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

    // Map to frontend structure
    const mapped = data.map((m: any) => ({
      _id: m.id,
      senderId: { _id: m.sender_id },
      recipientId: { _id: m.recipient_id },
      content: m.content,
      type: m.type,
      isRead: m.is_read,
      createdAt: m.created_at
    }))

    res.json(mapped)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error })
  }
})

// Get conversations list
router.get('/conversations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id
    
    // Get all messages where user is involved
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    const conversationsMap = new Map()

    for (const msg of messages) {
      const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: msg.recipient_id === userId && !msg.is_read ? 1 : 0,
          otherUserId
        })
      } else if (msg.recipient_id === userId && !msg.is_read) {
        const convo = conversationsMap.get(otherUserId)
        convo.unreadCount += 1
      }
    }

    const conversationUsers = Array.from(conversationsMap.keys())
    
    // Fetch user details for each conversation
    // Check both 'users' and 'teachers' tables
    const [adminsRes, teachersRes] = await Promise.all([
      supabase.from('users').select('id, name, email, role').in('id', conversationUsers),
      supabase.from('teachers').select('id, name, email, role').in('id', conversationUsers)
    ])

    const allUsers = [...(adminsRes.data || []), ...(teachersRes.data || [])]
    
    const results = allUsers.map(u => {
      const convo = conversationsMap.get(u.id)
      return {
        user: {
          _id: u.id,
          name: u.name,
          email: u.email,
          role: u.role
        },
        lastMessage: convo.lastMessage,
        lastMessageAt: convo.lastMessageAt,
        unreadCount: convo.unreadCount
      }
    })

    // If no conversations yet, and user is a teacher, add the default admin
    if (results.length === 0 && req.user.role === 'Teacher') {
      const { data: admins } = await supabase.from('users').select('id, name, email, role').eq('role', 'Admin').limit(1)
      if (admins && admins[0]) {
        results.push({
          user: {
            _id: admins[0].id,
            name: admins[0].name,
            email: admins[0].email,
            role: admins[0].role
          },
          lastMessage: 'Start a conversation with Admin',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0
        })
      }
    }

    res.json(results)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ message: 'Error fetching conversations', error })
  }
})

// Mark message as read
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('recipient_id', req.user.id)
    
    if (error) throw error
    res.json({ message: 'Message marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Error updating message', error })
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
