import { useState, useEffect, useRef, useCallback } from 'react'
import type { FormEvent } from 'react'
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
  const messagesEndRef = useRef<any>(null)

  const loadMessages = useCallback(async (otherUserId: string) => {
    try {
      const allMessages = await messageService.getMessages()
      if (!Array.isArray(allMessages)) return
      
      const filtered = allMessages.filter(
        m => m && m.senderId && m.recipientId && (m.senderId._id === otherUserId || m.recipientId._id === otherUserId)
      )
      setMessages(filtered)
      
      // Mark unread messages as read
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
      
      // If teacher, automatically select admin conversation if it exists
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
    const interval = window.setInterval(loadConversations, 10000) // Poll for new messages
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
    <div className="flex h-[600px] bg-white rounded-[2rem] shadow-folusho overflow-hidden border border-folusho-cream-200">
      {/* Sidebar - Conversations List */}
      <div className={`w-1/3 border-r border-folusho-cream-100 flex flex-col ${user?.role === 'Teacher' ? 'hidden md:flex' : ''}`}>
        <div className="p-6 border-b border-folusho-cream-100 bg-folusho-cream-50/50">
          <h2 className="text-xl font-black text-folusho-slate-900 mb-5 tracking-tight uppercase tracking-widest text-[10px]">Operations Console</h2>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-folusho-slate-400 group-focus-within:text-folusho-sage-500 transition-colors" />
            <input
              type="text"
              placeholder="Locate Personnel..."
              className="input-folusho !pl-11 !py-3 !text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-folusho">
          {filteredConversations.length === 0 ? (
            <div className="p-12 text-center text-folusho-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
              No tactical units detected.
            </div>
          ) : (
            filteredConversations.map((convo) => (
              <button
                key={convo.user._id}
                onClick={() => setSelectedConvo(convo)}
                className={`w-full p-6 flex items-start gap-4 hover:bg-folusho-sage-50/30 transition-all border-b border-folusho-cream-50 relative ${
                  selectedConvo?.user._id === convo.user._id ? 'bg-folusho-sage-50/50 border-l-[6px] border-l-folusho-sage-500' : ''
                }`}
              >
                <div className="bg-folusho-sage-100 p-3 rounded-2xl border border-folusho-sage-200 shadow-sm text-folusho-sage-600">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-black text-folusho-slate-900 text-sm tracking-tight truncate">{convo.user.name}</h3>
                    <span className="text-[9px] font-black text-folusho-slate-400 whitespace-nowrap uppercase tracking-widest">
                      {new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-folusho-slate-500 truncate leading-relaxed">{convo.lastMessage}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      convo.user.role === 'Admin' ? 'bg-folusho-coral-50 text-folusho-coral-600 border-folusho-coral-100' : 'bg-folusho-sage-50 text-folusho-sage-600 border-folusho-sage-100'
                    }`}>
                      {convo.user.role}
                    </span>
                    {convo.unreadCount > 0 && (
                      <span className="bg-folusho-coral-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-folusho">
                        {convo.unreadCount} NEW
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
            <div className="p-6 border-b border-folusho-cream-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-folusho-sage-100 p-3 rounded-2xl border border-folusho-sage-200 text-folusho-sage-600 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-folusho-slate-900 text-lg tracking-tight">{selectedConvo.user.name}</h3>
                  <p className="text-[10px] text-folusho-sage-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-folusho-sage-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                    Operational
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {user?.role === 'Admin' && (
                  <div className="flex bg-folusho-cream-100 p-1.5 rounded-2xl border border-folusho-cream-200 shadow-inner">
                    <button 
                      onClick={() => setMessageType('general')}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${messageType === 'general' ? 'bg-white shadow-folusho text-folusho-sage-600' : 'text-folusho-slate-400 hover:text-folusho-slate-600'}`}
                    >
                      General
                    </button>
                    <button 
                      onClick={() => setMessageType('deadline')}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${messageType === 'deadline' ? 'bg-white shadow-folusho text-folusho-yellow-600' : 'text-folusho-slate-400 hover:text-folusho-slate-600'}`}
                    >
                      Deadline
                    </button>
                    <button 
                      onClick={() => setMessageType('caution')}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${messageType === 'caution' ? 'bg-white shadow-folusho text-folusho-coral-500' : 'text-folusho-slate-400 hover:text-folusho-slate-600'}`}
                    >
                      Caution
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-folusho-cream-50/30 scrollbar-folusho">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-folusho-slate-400 space-y-4">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-folusho-cream-50 flex items-center justify-center border border-folusho-cream-100 shadow-inner">
                    <Send className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest">Start a conversation with {selectedConvo.user.name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId._id === user?._id
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-[2rem] p-4 shadow-folusho relative border ${
                        isOwn 
                          ? 'bg-folusho-sage-500 text-white rounded-tr-none border-folusho-sage-400' 
                          : 'bg-white text-folusho-slate-800 rounded-tl-none border-folusho-cream-100 shadow-sm'
                      }`}>
                        {msg.type !== 'general' && (
                          <div className={`flex items-center gap-2 text-[9px] font-black uppercase mb-2 tracking-widest ${
                            isOwn ? 'text-folusho-sage-100' : msg.type === 'deadline' ? 'text-folusho-yellow-600' : 'text-folusho-coral-500'
                          }`}>
                            {msg.type === 'deadline' ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {msg.type} PROTOCOL
                          </div>
                        )}
                        <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-2 mt-2 ${isOwn ? 'text-folusho-sage-100' : 'text-folusho-slate-400'}`}>
                          <span className="text-[9px] font-black uppercase tracking-tighter">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && (
                            msg.isRead ? <CheckCircle className="w-3 h-3 text-white/80" /> : <div className="w-3 h-3" />
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
            <form onSubmit={handleSendMessage} className="p-6 border-t border-folusho-cream-100 bg-white">
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative group">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={user?.role === 'Admin' ? `Transmit ${messageType} directive...` : "Compose tactical response..."}
                    className="w-full bg-folusho-cream-50 border border-folusho-cream-200 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-folusho-slate-700 focus:ring-4 focus:ring-folusho-sage-500/10 focus:border-folusho-sage-300 transition-all resize-none min-h-[60px] max-h-48 scrollbar-none shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="bg-folusho-sage-500 text-white p-4 rounded-[1.5rem] hover:bg-folusho-sage-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-folusho hover:scale-105 active:scale-95"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-folusho-slate-400 p-12 text-center bg-folusho-cream-50/20">
            <div className="bg-white p-10 rounded-[3rem] mb-8 border border-folusho-cream-100 shadow-folusho group">
              <Send className="w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity" />
            </div>
            <h3 className="text-2xl font-black text-folusho-slate-900 mb-3 tracking-tight">Tactical Messaging Hub</h3>
            <p className="max-w-sm text-sm font-bold text-folusho-slate-500 leading-relaxed">
              {user?.role === 'Admin' 
                ? "Select an academic unit from the tactical manifest to transmit deadlines, cautions, or general directives." 
                : "Operational directives from institutional command will appear here. Synchronize and respond to maintain academic integrity."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
