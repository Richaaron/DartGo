import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { Message } from '../models/Message'
import { User } from '../models/User'
import mongoose from 'mongoose'

const router = express.Router()

interface AuthenticatedRequest extends Request {
  user?: any
}

// Get all messages for the current user (either as sender or recipient)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id
    const messages = await Message.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    })
      .populate('senderId', 'name email role')
      .populate('recipientId', 'name email role')
      .sort({ createdAt: 1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error })
  }
})

// Send a message
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipientId, content, type } = req.body
    const senderId = req.user?.id || req.user?._id

    const newMessage = await Message.create({
      senderId,
      recipientId,
      content,
      type: type || 'general'
    })

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email role')
      .populate('recipientId', 'name email role')

    res.status(201).json(populatedMessage)
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error })
  }
})

// Mark message as read
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const message = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true })
    res.json(message)
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error })
  }
})

// Get conversations list (unique users the current user has chatted with)
router.get('/conversations', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id
    const messages = await Message.find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    })
    .populate('senderId', 'name email role')
    .populate('recipientId', 'name email role')
    .sort({ createdAt: -1 })

    const conversationsMap = new Map()

    messages.forEach(msg => {
      const msgSenderId = msg.senderId._id.toString()
      const msgRecipientId = msg.recipientId._id.toString()
      const currentUserId = userId.toString()
      
      const otherUser = msgSenderId === currentUserId ? msg.recipientId : msg.senderId
      const otherUserId = otherUser._id.toString()
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: (!msg.isRead && msgRecipientId === currentUserId) ? 1 : 0
        })
      } else {
        const convo = conversationsMap.get(otherUserId)
        if (!msg.isRead && msgRecipientId === currentUserId) {
          convo.unreadCount += 1
        }
      }
    })

    res.json(Array.from(conversationsMap.values()))
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error })
  }
})

export default router
