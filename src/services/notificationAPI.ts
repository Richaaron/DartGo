import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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

export const notificationAPI = {
  // Get all notifications (admin only)
  getAll: async (status?: string, type?: string, limit = 50, page = 1) => {
    const params: any = { limit, page }
    if (status) params.status = status
    if (type) params.type = type
    
    const response = await axios.get(`${API_URL}/notifications`, { params })
    return response.data
  },

  // Get notifications for a specific student
  getByStudent: async (studentId: string) => {
    const response = await axios.get(`${API_URL}/notifications/student/${studentId}`)
    return response.data
  },

  // Get notification statistics
  getStats: async () => {
    const response = await axios.get(`${API_URL}/notifications/stats/summary`)
    return response.data
  },

  // Resend a failed notification
  resend: async (notificationId: string) => {
    const response = await axios.post(`${API_URL}/notifications/${notificationId}/resend`)
    return response.data
  },

  // Delete a notification record
  delete: async (notificationId: string) => {
    const response = await axios.delete(`${API_URL}/notifications/${notificationId}`)
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
