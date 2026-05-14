import { useEffect, useState } from 'react'
import { Mail, AlertCircle, CheckCircle, Clock, Trash2, RotateCcw } from 'lucide-react'
import notificationAPI, { Notification } from '../services/notificationAPI'

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const status = filter === 'all' ? undefined : filter
    setLoading(true)

    notificationAPI
      .getAll(status, undefined, 50)
      .then((data) => {
        if (isMounted) setNotifications(data.notifications)
      })
      .catch((error) => {
        console.error('Failed to load notifications:', error)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    notificationAPI
      .getStats()
      .then((data) => {
        if (isMounted) setStats(data)
      })
      .catch((error) => {
        console.error('Failed to load stats:', error)
      })

    return () => {
      isMounted = false
    }
  }, [filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const status = filter === 'all' ? undefined : filter
      const data = await notificationAPI.getAll(status, undefined, 50)
      setNotifications(data.notifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await notificationAPI.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleResend = async (id: string) => {
    try {
      await notificationAPI.resend(id)
      loadNotifications()
      loadStats()
    } catch (error) {
      console.error('Failed to resend:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification record?')) {
      try {
        await notificationAPI.delete(id)
        loadNotifications()
        loadStats()
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />
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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <RotateCcw className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-3 text-sm font-medium text-slate-500">Loading notifications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Sent</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.summary.totalSent}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Failed</p>
            <p className="text-3xl font-bold text-rose-600">{stats.summary.totalFailed}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pending</p>
            <p className="text-3xl font-bold text-amber-600">{stats.summary.totalPending}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Grand Total</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.summary.total}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-1">
        {(['all', 'sent', 'failed', 'pending'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Notifications</h3>
            <p className="text-sm text-slate-500">Your notification history is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <tr key={notif._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                      {notif.recipientEmail}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                        {getTypeLabel(notif.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {notif.subject}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        {getStatusIcon(notif.status)}
                        <span className={
                          notif.status === 'sent' ? 'text-emerald-600' :
                          notif.status === 'failed' ? 'text-rose-600' : 'text-amber-600'
                        }>{notif.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {notif.status === 'failed' && (
                          <button
                            onClick={() => handleResend(notif._id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Retry"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif._id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
