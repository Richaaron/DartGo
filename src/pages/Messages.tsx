import { motion } from 'framer-motion'
import ChatSystem from '../components/ChatSystem'
import { MessageSquare } from 'lucide-react'

export default function Messages() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Teacher <span className="text-indigo-600 dark:text-indigo-400">Communications</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Manage real-time communication with your faculty members.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-200px)] min-h-[600px]"
      >
        <ChatSystem />
      </motion.div>
    </div>
  )
}
