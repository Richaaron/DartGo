import { useState, useEffect } from 'react'
import { getAPIStatus } from '../services/apiWithFallback'
import { AlertCircle, CheckCircle, Database } from 'lucide-react'

export function APIStatusDebug() {
  const [status, setStatus] = useState(getAPIStatus())
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getAPIStatus())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const isPrimary = status.active === status.primary
  const apiName = isPrimary ? 'MongoDB' : 'Supabase'

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 z-50"
        title="Show API Status"
      >
        <Database size={20} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-800">API Status</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {isPrimary ? (
            <CheckCircle size={16} className="text-green-600" />
          ) : (
            <AlertCircle size={16} className="text-yellow-600" />
          )}
          <span className="font-semibold">Active: {apiName}</span>
        </div>

        <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
          <div>
            <span className="text-gray-600">Primary:</span>
            <div className="text-gray-800 break-all">{status.primary}</div>
          </div>
          <div>
            <span className="text-gray-600">Backup:</span>
            <div className="text-gray-800 break-all">{status.backup}</div>
          </div>
        </div>

        {status.primaryFailed && status.nextRetry && (
          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
            <div className="text-yellow-800">
              Primary failed. Retrying at:
            </div>
            <div className="text-yellow-900 font-mono">
              {status.nextRetry.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
