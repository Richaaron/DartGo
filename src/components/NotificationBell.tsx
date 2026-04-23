import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X } from 'lucide-react'
import notificationAPI, { Notification } from '../services/notificationAPI'

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationAPI.getRecent(5)
      setNotifications(data.notifications)
      const failedCount = data.notifications.filter(n => n.status === 'failed').length
      setUnreadCount(failedCount)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [])

  useEffect(() => {
    const kickOff = setTimeout(() => {
      void loadNotifications()
    }, 0)
    const interval = setInterval(loadNotifications, 30000) // Refresh every 30 seconds
    return () => {
      clearTimeout(kickOff)
      clearInterval(interval)
    }
  }, [loadNotifications])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student_registration':
        return 'bg-blue-100 dark:bg-blue-600/25 text-blue-800 dark:text-blue-300'
      case 'result_published':
        return 'bg-green-100 dark:bg-emerald-600/25 text-green-800 dark:text-emerald-300'
      case 'attendance_warning':
        return 'bg-yellow-100 dark:bg-gold-600/25 text-yellow-800 dark:text-gold-300'
      case 'low_grades':
        return 'bg-red-100 dark:bg-rose-600/25 text-red-800 dark:text-rose-300'
      case 'fee_reminder':
        return 'bg-purple-100 dark:bg-purple-600/25 text-purple-800 dark:text-purple-300'
      default:
        return 'bg-gray-100 dark:bg-slate-700/60 text-gray-800 dark:text-gray-300'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      student_registration: 'Registration',
      result_published: 'Results',
      attendance_warning: 'Attendance',
      low_grades: 'Grades',
      teacher_assigned: 'Teacher',
      fee_reminder: 'Fees'
    }
    return labels[type] || type
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800/95 rounded-lg shadow-lg border border-gray-200 dark:border-purple-600/40 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-purple-600/30 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No recent notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  className={`p-3 border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    notif.status === 'failed' ? 'bg-red-50 dark:bg-red-600/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getTypeColor(notif.type)}`}>
                      {getTypeLabel(notif.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notif.subject}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {notif.recipientEmail}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(notif.sentAt || notif.createdAt).toLocaleTimeString()}
                      </p>
                      {notif.status === 'failed' && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Failed to send</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200 text-center">
            <a
              href="/notifications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Notifications
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
