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
    <div className="flex h-[600px] bg-folusho-slate-900/40 rounded-[2rem] shadow-2xl overflow-hidden border border-white/5 backdrop-blur-xl">
      {/* Sidebar - Conversations List */}
      <div className={`w-1/3 border-r border-white/5 flex flex-col ${user?.role === 'Teacher' ? 'hidden md:flex' : ''}`}>
        <div className="p-8 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-black text-white mb-6 tracking-tight uppercase tracking-[0.3em] text-[10px]">Operations Console</h2>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-5 top-1/2 transform -translate-y-1/2 text-folusho-slate-500 group-focus-within:text-folusho-sage-400 transition-colors" />
            <input
              type="text"
              placeholder="Locate Personnel..."
              className="input-folusho !pl-14 !py-4 !text-xs !bg-folusho-slate-900/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-folusho">
          {filteredConversations.length === 0 ? (
            <div className="p-12 text-center text-folusho-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
              No tactical units detected.
            </div>
          ) : (
            filteredConversations.map((convo) => (
              <button
                key={convo.user._id}
                onClick={() => setSelectedConvo(convo)}
                className={`w-full p-8 flex items-start gap-5 hover:bg-white/5 transition-all border-b border-white/5 relative ${
                  selectedConvo?.user._id === convo.user._id ? 'bg-white/10 border-l-[6px] border-l-folusho-sage-400' : ''
                }`}
              >
                <div className="bg-folusho-sage-400/10 p-3.5 rounded-2xl border border-folusho-sage-400/20 text-folusho-sage-400 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-black text-white text-base tracking-tight truncate">{convo.user.name}</h3>
                    <span className="text-[10px] font-black text-folusho-slate-500 whitespace-nowrap uppercase tracking-widest">
                      {new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-folusho-slate-400 truncate leading-relaxed">{convo.lastMessage}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      convo.user.role === 'Admin' ? 'bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20' : 'bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20'
                    }`}>
                      {convo.user.role}
                    </span>
                    {convo.unreadCount > 0 && (
                      <span className="bg-folusho-coral-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-folusho">
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
      <div className="flex-1 flex flex-col bg-folusho-slate-950/20 backdrop-blur-md">
        {selectedConvo ? (
          <>
            {/* Chat Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <div className="bg-folusho-sage-400/10 p-4 rounded-2xl border border-folusho-sage-400/20 text-folusho-sage-400 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-xl tracking-tight">{selectedConvo.user.name}</h3>
                  <p className="text-[10px] text-folusho-sage-400 font-black uppercase tracking-widest flex items-center gap-3 mt-1.5">
                    <span className="w-2 h-2 bg-folusho-sage-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                    Operational
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {user?.role === 'Admin' && (
                  <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    <button 
                      onClick={() => setMessageType('general')}
                      className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${messageType === 'general' ? 'bg-white/10 shadow-folusho text-folusho-sage-400' : 'text-folusho-slate-500 hover:text-white'}`}
                    >
                      General
                    </button>
                    <button 
                      onClick={() => setMessageType('deadline')}
                      className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${messageType === 'deadline' ? 'bg-white/10 shadow-folusho text-folusho-yellow-500' : 'text-folusho-slate-500 hover:text-white'}`}
                    >
                      Deadline
                    </button>
                    <button 
                      onClick={() => setMessageType('caution')}
                      className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${messageType === 'caution' ? 'bg-white/10 shadow-folusho text-folusho-coral-400' : 'text-folusho-slate-500 hover:text-white'}`}
                    >
                      Caution
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-transparent scrollbar-folusho">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-folusho-slate-600 space-y-6">
                  <div className="w-24 h-24 rounded-[3rem] bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                    <Send className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Start a conversation with {selectedConvo.user.name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId._id === user?._id
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-4xl p-6 shadow-2xl relative border ${
                        isOwn 
                          ? 'bg-folusho-sage-500 text-white rounded-tr-none border-folusho-sage-400' 
                          : 'bg-white/5 text-white rounded-tl-none border-white/5 backdrop-blur-md'
                      }`}>
                        {msg.type !== 'general' && (
                          <div className={`flex items-center gap-2 text-[9px] font-black uppercase mb-3 tracking-[0.2em] ${
                            isOwn ? 'text-folusho-sage-100' : msg.type === 'deadline' ? 'text-folusho-yellow-500' : 'text-folusho-coral-400'
                          }`}>
                            {msg.type === 'deadline' ? <Clock className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {msg.type} PROTOCOL
                          </div>
                        )}
                        <p className="text-base font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-2 mt-4 ${isOwn ? 'text-folusho-sage-100' : 'text-folusho-slate-500'}`}>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && (
                            msg.isRead ? <CheckCircle className="w-3.5 h-3.5 text-white/80" /> : <div className="w-3.5 h-3.5" />
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
            <form onSubmit={handleSendMessage} className="p-8 border-t border-white/5 bg-white/5">
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative group">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={user?.role === 'Admin' ? `Transmit ${messageType} directive...` : "Compose tactical response..."}
                    className="w-full bg-folusho-slate-900/50 border border-white/5 rounded-3xl px-8 py-5 text-base font-bold text-white focus:ring-4 focus:ring-folusho-sage-500/10 focus:border-folusho-sage-400 transition-all resize-none min-h-[60px] max-h-48 scrollbar-none shadow-inner"
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
                  className="bg-folusho-sage-400 text-white p-5 rounded-3xl hover:bg-folusho-sage-500 transition-all disabled:opacity-10 disabled:cursor-not-allowed shadow-folusho hover:scale-105 active:scale-95"
                >
                  <Send className="w-7 h-7" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-folusho-slate-600 p-16 text-center bg-transparent">
            <div className="bg-white/5 p-12 rounded-[4rem] mb-10 border border-white/5 shadow-2xl group backdrop-blur-md">
              <Send className="w-24 h-24 opacity-10 group-hover:opacity-30 transition-all duration-500" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Tactical Messaging Hub</h3>
            <p className="max-w-md text-sm font-bold text-folusho-slate-500 leading-relaxed uppercase tracking-widest">
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
