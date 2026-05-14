import React, { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCircle, AlertCircle, Trash2, RotateCcw, Clock, Mail } from 'lucide-react'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-rose-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Sent</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.totalSent}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Failed</p>
          <p className="text-3xl font-bold text-rose-600">{stats.totalFailed}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-600">{stats.totalPending}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Grand Total</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalSent + stats.totalFailed + stats.totalPending}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-1">
        {(['all', 'sent', 'failed', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RotateCcw className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center shadow-sm">
            <Mail className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No notifications found</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="mt-1">{getStatusIcon(notif.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{notif.subject}</h3>
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                        {getTypeLabel(notif.type)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Recipient:</span>
                      {notif.recipientEmail}
                    </p>
                    {notif.errorMessage && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 text-rose-600 text-xs flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>{notif.errorMessage}</span>
                      </div>
                    )}
                    <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-wider">
                      {new Date(notif.sentAt || notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {notif.status === 'failed' && (
                    <button
                      onClick={() => handleResend(notif._id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="Resend"
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {notifications.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-6 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Previous
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={notifications.length < 20}
            className="px-6 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationDashboard
