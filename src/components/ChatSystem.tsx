import { useState, useEffect, useRef } from 'react'
import { messageService, Message, Conversation } from '../services/messageService'
import { useAuthContext } from '../context/AuthContext'
import { Send, User, Clock, AlertTriangle, CheckCircle, Search } from 'lucide-react'

export default function ChatSystem() {
  const { user } = useAuthContext()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<'general' | 'deadline' | 'caution'>('general')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 10000) // Poll for new messages
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConvo) {
      loadMessages(selectedConvo.user._id)
      const interval = setInterval(() => loadMessages(selectedConvo.user._id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedConvo])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations()
      setConversations(data)
      
      // If teacher, automatically select admin conversation if it exists
      if (user?.role === 'Teacher' && !selectedConvo && data.length > 0) {
        const adminConvo = data.find(c => c.user.role === 'Admin')
        if (adminConvo) setSelectedConvo(adminConvo)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadMessages = async (otherUserId: string) => {
    try {
      const allMessages = await messageService.getMessages()
      const filtered = allMessages.filter(
        m => (m.senderId._id === otherUserId || m.recipientId._id === otherUserId)
      )
      setMessages(filtered)
      
      // Mark unread messages as read
      const unread = filtered.filter(m => !m.isRead && m.recipientId._id === user?._id)
      for (const msg of unread) {
        await messageService.markAsRead(msg._id)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvo) return

    try {
      setLoading(true)
      await messageService.sendMessage(selectedConvo.user._id, newMessage, messageType)
      setNewMessage('')
      setMessageType('general')
      loadMessages(selectedConvo.user._id)
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(c => 
    c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Sidebar - Conversations List */}
      <div className={`w-1/3 border-r border-gray-200 flex flex-col ${user?.role === 'Teacher' ? 'hidden md:flex' : ''}`}>
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((convo) => (
              <button
                key={convo.user._id}
                onClick={() => setSelectedConvo(convo)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedConvo?.user._id === convo.user._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-gray-900 truncate">{convo.user.name}</h3>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">{convo.lastMessage}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      convo.user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {convo.user.role}
                    </span>
                    {convo.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConvo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedConvo.user.name}</h3>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {user?.role === 'Admin' && (
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setMessageType('general')}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${messageType === 'general' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-500'}`}
                    >
                      General
                    </button>
                    <button 
                      onClick={() => setMessageType('deadline')}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${messageType === 'deadline' ? 'bg-white shadow-sm font-bold text-orange-600' : 'text-gray-500'}`}
                    >
                      Deadline
                    </button>
                    <button 
                      onClick={() => setMessageType('caution')}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${messageType === 'caution' ? 'bg-white shadow-sm font-bold text-red-600' : 'text-gray-500'}`}
                    >
                      Caution
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <Send className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Start a conversation with {selectedConvo.user.name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId._id === user?._id
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm relative ${
                        isOwn 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                        {msg.type !== 'general' && (
                          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase mb-1 ${
                            isOwn ? 'text-blue-100' : msg.type === 'deadline' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {msg.type === 'deadline' ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {msg.type}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                          <span className="text-[10px]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && (
                            msg.isRead ? <CheckCircle className="w-3 h-3 text-blue-200" /> : <div className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={user?.role === 'Admin' ? `Send ${messageType} message...` : "Type your reply..."}
                  className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none h-10 max-h-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <Send className="w-16 h-16 opacity-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">Your Message Center</h3>
            <p className="max-w-xs text-sm">
              {user?.role === 'Admin' 
                ? "Select a teacher from the sidebar to send deadlines, cautions, or general messages." 
                : "Messages from school administration will appear here. You can reply directly to any message."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
