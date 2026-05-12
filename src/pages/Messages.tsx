import { motion } from 'framer-motion'
import ChatSystem from '../components/ChatSystem'
import { MessageSquare } from 'lucide-react'

export default function Messages() {
  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-nebula-indigo-500/10 border border-nebula-indigo-500/20 text-nebula-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
            Neural Uplink Protocols
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Communication <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">Matrix.</span>
          </h1>
          <p className="text-nebula-slate-400 text-lg font-bold max-w-xl leading-relaxed tracking-tight">
            Establish direct neural synchronization with faculty units for real-time operational directives.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="nebula-card !p-0 h-[calc(100vh-300px)] min-h-[600px] overflow-hidden"
      >
        <ChatSystem />
      </motion.div>
    </div>
  )
}
