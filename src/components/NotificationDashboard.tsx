import React, { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCircle, AlertCircle, Trash2, RotateCcw } from 'lucide-react'
import notificationAPI, { Notification } from '../services/notificationAPI'

export const NotificationDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({ totalSent: 0, totalFailed: 0, totalPending: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')
  const [page, setPage] = useState(1)

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await notificationAPI.getAll(filter === 'all' ? undefined : filter, undefined, 20, page)
      setNotifications(data.notifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  const loadStats = useCallback(async () => {
    try {
      const data = await notificationAPI.getStats()
      setStats(data.summary)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    loadStats()
  }, [loadNotifications, loadStats])

  const handleResend = async (id: string) => {
    try {
      await notificationAPI.resend(id)
      loadNotifications()
      loadStats()
    } catch (error) {
      console.error('Failed to resend notification:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id)
      loadNotifications()
      loadStats()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 border-green-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Bell className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      student_registration: 'Student Registration',
      result_published: 'Result Published',
      attendance_warning: 'Attendance Warning',
      low_grades: 'Low Grades Alert',
      teacher_assigned: 'Teacher Assigned',
      fee_reminder: 'Fee Reminder'
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-lg bg-gradient-to-br from-emerald-50 dark:from-emerald-900/20 to-emerald-100/50 dark:to-emerald-800/10 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest">Total Sent</p>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.totalSent}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-emerald-500 opacity-30" />
          </div>
        </div>

        <div className="card-lg bg-gradient-to-br from-rose-50 dark:from-rose-900/20 to-rose-100/50 dark:to-rose-800/10 border-l-4 border-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-widest">Failed</p>
              <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-1">{stats.totalFailed}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-rose-500 opacity-30" />
          </div>
        </div>

        <div className="card-lg bg-gradient-to-br from-amber-50 dark:from-amber-900/20 to-amber-100/50 dark:to-amber-800/10 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">Pending</p>
              <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.totalPending}</p>
            </div>
            <Bell className="w-10 h-10 text-amber-500 opacity-30" />
          </div>
        </div>

        <div className="card-lg bg-gradient-to-br from-purple-50 dark:from-purple-900/20 to-purple-100/50 dark:to-purple-800/10 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest">Total</p>
              <p className="text-3xl font-black text-purple-700 dark:text-purple-300 mt-1">{stats.totalSent + stats.totalFailed + stats.totalPending}</p>
            </div>
            <Bell className="w-10 h-10 text-purple-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b-2 border-purple-200 dark:border-purple-800/50 pb-0">
        {(['all', 'sent', 'failed', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              filter === f
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notifications found</div>
        ) : (
          notifications.map(notif => (
            <div key={notif._id} className={`border rounded-lg p-4 ${getStatusColor(notif.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(notif.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{notif.subject}</h3>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {getTypeLabel(notif.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">To: {notif.recipientEmail}</p>
                    {notif.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">Error: {notif.errorMessage}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notif.sentAt || notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {notif.status === 'failed' && (
                    <button
                      onClick={() => handleResend(notif._id)}
                      className="p-2 hover:bg-yellow-100 rounded transition-colors"
                      title="Resend"
                    >
                      <RotateCcw className="w-4 h-4 text-yellow-600" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="p-2 hover:bg-red-100 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {notifications.length > 0 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationDashboard
