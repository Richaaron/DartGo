import { motion } from 'framer-motion'
import ChatSystem from '../components/ChatSystem'
import { MessageSquare } from 'lucide-react'

export default function Messages() {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-500/10 border border-white/5 text-folusho-sage-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Communication Protocols
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Operational <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Sync.</span>
          </h1>
          <p className="text-folusho-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Establish direct synchronization with faculty units for real-time academic operational directives.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="folusho-card !p-0 h-[calc(100vh-300px)] min-h-[600px] overflow-hidden border-white/5 bg-folusho-slate-900/40 backdrop-blur-md shadow-2xl"
      >
        <ChatSystem />
      </motion.div>
    </div>
  )
}
