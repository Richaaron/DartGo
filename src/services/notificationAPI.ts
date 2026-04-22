import api from './api'

export interface Notification {
  _id: string
  recipientEmail: string
  recipientName: string
  type: 'student_registration' | 'result_published' | 'attendance_warning' | 'low_grades' | 'teacher_assigned' | 'fee_reminder'
  subject: string
  body: string
  status: 'sent' | 'failed' | 'pending'
  studentId?: string
  sentAt?: string
  errorMessage?: string
  metadata?: Record<string, any>
  createdAt: string
}

interface NotificationListResponse {
  notifications: Notification[]
  pagination?: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

interface NotificationStatsResponse {
  summary: {
    totalSent: number
    totalFailed: number
    totalPending: number
    total: number
  }
}

export const notificationAPI = {
  // Get all notifications (admin only)
  getAll: async (status?: string, type?: string, limit = 50, page = 1): Promise<NotificationListResponse> => {
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
    })
    if (status) params.set('status', status)
    if (type) params.set('type', type)

    const response = await api.get<NotificationListResponse>(`/notifications?${params.toString()}`)
    return response.data
  },

  // Get notifications for a specific student
  getByStudent: async (studentId: string): Promise<Notification[]> => {
    const response = await api.get<Notification[]>(`/notifications/student/${studentId}`)
    return response.data
  },

  // Get notification statistics
  getStats: async (): Promise<NotificationStatsResponse> => {
    const response = await api.get<NotificationStatsResponse>('/notifications/stats/summary')
    return response.data
  },

  // Resend a failed notification
  resend: async (notificationId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/notifications/${notificationId}/resend`)
    return response.data
  },

  // Delete a notification record
  delete: async (notificationId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/notifications/${notificationId}`)
    return response.data
  },

  // Utility: Get recent notifications
  getRecent: async (limit = 10) => {
    return notificationAPI.getAll(undefined, undefined, limit, 1)
  },

  // Utility: Get failed notifications needing retry
  getFailed: async (limit = 20) => {
    return notificationAPI.getAll('failed', undefined, limit, 1)
  },

  // Utility: Get statistics summary
  getSummary: async () => {
    return notificationAPI.getStats()
  }
}

export default notificationAPI
