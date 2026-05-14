import { useState, useEffect, useRef, useCallback } from 'react'
import type { FormEvent } from 'react'
import { messageService, Message, Conversation } from '../services/messageService'
import { useAuthContext } from '../context/AuthContext'
import { Send, User, Clock, AlertTriangle, CheckCircle, Search, MessageSquare } from 'lucide-react'

export default function ChatSystem() {
  const { user } = useAuthContext()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<'general' | 'deadline' | 'caution'>('general')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<any>(null)

  const loadMessages = useCallback(async (otherUserId: string) => {
    try {
      const allMessages = await messageService.getMessages()
      if (!Array.isArray(allMessages)) return
      
      const filtered = allMessages.filter(
        m => m && m.senderId && m.recipientId && (m.senderId._id === otherUserId || m.recipientId._id === otherUserId)
      )
      setMessages(filtered)
      
      const unread = filtered.filter(m => !m.isRead && m.recipientId && m.recipientId._id === user?._id)
      for (const msg of unread) {
        if (msg && msg._id) {
          await messageService.markAsRead(msg._id)
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }, [user?._id])

  const loadConversations = useCallback(async () => {
    try {
      const data = await messageService.getConversations()
      setConversations(data)
      
      if (user?.role === 'Teacher' && !selectedConvo && data.length > 0) {
        const adminConvo = data.find(c => c.user.role === 'Admin')
        if (adminConvo) setSelectedConvo(adminConvo)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }, [user?.role, selectedConvo])

  useEffect(() => {
    loadConversations()
    const interval = window.setInterval(loadConversations, 10000)
    return () => window.clearInterval(interval)
  }, [loadConversations])

  useEffect(() => {
    if (selectedConvo) {
      loadMessages(selectedConvo.user._id)
      const interval = window.setInterval(() => loadMessages(selectedConvo.user._id), 5000)
      return () => window.clearInterval(interval)
    }
  }, [selectedConvo, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: FormEvent) => {
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
    c && c.user && (
      (c.user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="flex h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className={`w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col ${user?.role === 'Teacher' ? 'hidden md:flex' : ''}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="input pl-9 py-1.5 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No contacts found.
            </div>
          ) : (
            filteredConversations.map((convo) => (
              <button
                key={convo.user._id}
                onClick={() => setSelectedConvo(convo)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 ${
                  selectedConvo?.user._id === convo.user._id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600' : ''
                }`}
              >
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                  <User size={18} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{convo.user.name}</h3>
                    <span className="text-[10px] text-slate-400">
                      {new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{convo.lastMessage}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      convo.user.role === 'Admin' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}>
                      {convo.user.role}
                    </span>
                    {convo.unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedConvo ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{selectedConvo.user.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {(['general', 'deadline', 'caution'] as const).map((type) => (
                  <button 
                    key={type}
                    onClick={() => setMessageType(type)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                      messageType === type 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <MessageSquare size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-wider">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId._id === user?._id
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 shadow-sm border ${
                        isOwn 
                          ? 'bg-indigo-600 text-white border-indigo-500' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-100 dark:border-slate-700'
                      }`}>
                        {msg.type !== 'general' && (
                          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase mb-1.5 ${
                            isOwn ? 'text-indigo-100' : msg.type === 'deadline' ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {msg.type === 'deadline' ? <Clock size={12} /> : <AlertTriangle size={12} />}
                            {msg.type}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1.5 mt-2 ${isOwn ? 'text-indigo-100' : 'text-slate-400'}`}>
                          <span className="text-[9px] font-bold uppercase">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && msg.isRead && <CheckCircle size={10} />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 input py-2 px-4 text-sm min-h-[40px] max-h-32 resize-none"
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
                  className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-full mb-6 border border-slate-100 dark:border-slate-800">
              <MessageSquare size={64} className="opacity-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a Conversation</h3>
            <p className="max-w-xs text-sm leading-relaxed">
              Choose a contact from the list to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
