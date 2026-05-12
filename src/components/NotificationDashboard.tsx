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
        return 'bg-folusho-sage-50/50 border-folusho-sage-100'
      case 'failed':
        return 'bg-folusho-coral-50/50 border-folusho-coral-100'
      case 'pending':
        return 'bg-folusho-yellow-50/50 border-folusho-yellow-100'
      default:
        return 'bg-folusho-cream-50/50 border-folusho-cream-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-folusho-sage-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-folusho-coral-500" />
      case 'pending':
        return <Bell className="w-5 h-5 text-folusho-yellow-500" />
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="folusho-card bg-folusho-sage-50 border-folusho-sage-100 !p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-folusho-sage-600 text-[10px] font-black uppercase tracking-widest">Total Sent</p>
              <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.totalSent}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-folusho-sage-400 border border-folusho-sage-100 shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="folusho-card bg-folusho-coral-50 border-folusho-coral-100 !p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest">Failed</p>
              <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.totalFailed}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-folusho-coral-400 border border-folusho-coral-100 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="folusho-card bg-folusho-yellow-50 border-folusho-yellow-100 !p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-folusho-yellow-600 text-[10px] font-black uppercase tracking-widest">Pending</p>
              <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.totalPending}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-folusho-yellow-500 border border-folusho-yellow-100 shadow-sm">
              <Bell className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="folusho-card bg-folusho-cream-50 border-folusho-cream-200 !p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-folusho-slate-400 text-[10px] font-black uppercase tracking-widest">Total</p>
              <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.totalSent + stats.totalFailed + stats.totalPending}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-folusho-slate-400 border border-folusho-cream-200 shadow-sm">
              <Bell className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-folusho-cream-100 pb-0">
        {(['all', 'sent', 'failed', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] border-b-2 transition-all ${
              filter === f
                ? 'border-folusho-sage-500 text-folusho-sage-600 bg-folusho-sage-50/50'
                : 'border-transparent text-folusho-slate-400 hover:text-folusho-slate-600 hover:bg-folusho-cream-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-folusho-slate-400 font-bold uppercase tracking-widest text-xs">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-folusho-slate-400 font-bold uppercase tracking-widest text-xs">No notifications found</div>
        ) : (
          notifications.map(notif => (
            <div key={notif._id} className={`border rounded-[2rem] p-6 transition-all hover:shadow-folusho ${getStatusColor(notif.status)}`}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className="mt-1">
                    {getStatusIcon(notif.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h3 className="font-black text-folusho-slate-900 text-lg tracking-tight truncate">{notif.subject}</h3>
                      <span className="text-[9px] font-black bg-white/60 text-folusho-slate-500 px-3 py-1 rounded-full uppercase tracking-widest border border-folusho-cream-100 shadow-sm">
                        {getTypeLabel(notif.type)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-folusho-slate-600 mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-folusho-slate-400 uppercase tracking-widest">Recipient:</span>
                      {notif.recipientEmail}
                    </p>
                    {notif.errorMessage && (
                      <div className="mt-3 p-3 rounded-xl bg-folusho-coral-50 border border-folusho-coral-100 flex items-center gap-3 text-folusho-coral-600">
                        <AlertCircle size={14} />
                        <p className="text-xs font-black uppercase tracking-widest leading-none">Error: {notif.errorMessage}</p>
                      </div>
                    )}
                    <p className="text-[10px] font-black text-folusho-slate-400 mt-4 uppercase tracking-widest">
                      {new Date(notif.sentAt || notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {notif.status === 'failed' && (
                    <button
                      onClick={() => handleResend(notif._id)}
                      className="p-3 bg-white hover:bg-folusho-yellow-50 text-folusho-yellow-600 rounded-2xl transition-all border border-folusho-yellow-100 shadow-sm"
                      title="Resend"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="p-3 bg-white hover:bg-folusho-coral-50 text-folusho-coral-500 rounded-2xl transition-all border border-folusho-coral-100 shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {notifications.length > 0 && (
        <div className="flex justify-center items-center gap-6 pt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-4 rounded-2xl bg-white border border-folusho-cream-200 text-folusho-sage-500 disabled:opacity-20 hover:bg-folusho-cream-50 transition-all shadow-sm"
          >
            Previous
          </button>
          <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em]">Matrix Phase {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="p-4 rounded-2xl bg-white border border-folusho-cream-200 text-folusho-sage-500 hover:bg-folusho-cream-50 transition-all shadow-sm"
          >
            Next Phase
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationDashboard
