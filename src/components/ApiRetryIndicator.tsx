import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCcw, AlertCircle, CheckCircle, X, RotateCcw } from 'lucide-react'

interface RetryState {
  endpoint: string
  attempt: number
  maxRetries: number
  status: 'retrying' | 'success' | 'failure'
}

/**
 * Global floating indicator that shows when API requests are being retried
 */
const ApiRetryIndicator: React.FC = () => {
  const [retry, setRetry] = useState<RetryState | null>(null)

  useEffect(() => {
    const handleRetry = (e: any) => {
      setRetry({ ...e.detail, status: 'retrying' })
    }
    const handleSuccess = () => {
      setRetry(prev => prev ? { ...prev, status: 'success' } : null)
      const timer = setTimeout(() => setRetry(null), 2500)
      return () => clearTimeout(timer)
    }
    const handleFailure = () => {
      setRetry(prev => prev ? { ...prev, status: 'failure' } : null)
      const timer = setTimeout(() => setRetry(null), 4000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('api-retry' as any, handleRetry)
    window.addEventListener('api-retry-success' as any, handleSuccess)
    window.addEventListener('api-retry-failure' as any, handleFailure)

    return () => {
      window.removeEventListener('api-retry' as any, handleRetry)
      window.removeEventListener('api-retry-success' as any, handleSuccess)
      window.removeEventListener('api-retry-failure' as any, handleFailure)
    }
  }, [])

  const handleRetryNow = () => {
    if (!retry || retry.status !== 'retrying') return
    window.dispatchEvent(new CustomEvent('api-request-retry-now', { detail: { endpoint: retry.endpoint } }))
  }

  const handleCancel = () => {
    if (!retry || retry.status !== 'retrying') return
    window.dispatchEvent(new CustomEvent('api-request-cancel', { detail: { endpoint: retry.endpoint } }))
  }

  return (
    <AnimatePresence>
      {retry && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-4 px-4 py-3 rounded-lg shadow-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-center">
            {retry.status === 'retrying' && (
              <RefreshCcw className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            {retry.status === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {retry.status === 'failure' && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          
          <div className="flex flex-col min-w-[140px]">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {retry.status === 'retrying' && `Retrying Request...`}
              {retry.status === 'success' && 'Reconnected Successfully'}
              {retry.status === 'failure' && 'Connection Failed'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {retry.status === 'retrying' 
                ? `Attempt ${retry.attempt} of ${retry.maxRetries}` 
                : `Endpoint: ${retry.endpoint}`}
            </span>
          </div>
          
          {retry.status === 'retrying' && (
            <div className="w-12 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ml-2">
              <motion.div 
                className="h-full bg-blue-500"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </div>
          )}

          {retry.status === 'retrying' && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handleRetryNow}
                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors group"
                title="Retry Now"
              >
                <RotateCcw className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors group"
                title="Cancel Request"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ApiRetryIndicator