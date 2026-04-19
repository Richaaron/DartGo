import api from './api'

export interface Message {
  _id: string
  senderId: {
    _id: string
    name: string
    email: string
    role: string
  }
  recipientId: {
    _id: string
    name: string
    email: string
    role: string
  }
  content: string
  isRead: boolean
  type: 'general' | 'deadline' | 'caution'
  createdAt: string
}

export interface Conversation {
  user: {
    _id: string
    name: string
    email: string
    role: string
  }
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export const messageService = {
  getMessages: async () => {
    const response = await api.get<Message[]>('/messages')
    return response.data
  },

  getConversations: async () => {
    const response = await api.get<Conversation[]>('/messages/conversations')
    return response.data
  },

  sendMessage: async (recipientId: string, content: string, type: string = 'general') => {
    const response = await api.post<Message>('/messages', { recipientId, content, type })
    return response.data
  },

  markAsRead: async (messageId: string) => {
    const response = await api.patch<Message>(`/messages/${messageId}/read`)
    return response.data
  }
}
