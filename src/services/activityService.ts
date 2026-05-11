import api from './api'

export interface Activity {
  _id: string
  userId: string
  userName: string
  role: string
  action: string
  details: string
  createdAt: string
  entityType?: string
  entityId?: string
}

export const activityService = {
  getActivities: async () => {
    const response = await api.get<any[]>('/activities')
    return response.data.map(a => ({
      _id: a.id,
      userId: a.user_id,
      userName: a.user_name || a.user_id || 'Unknown',
      role: a.role || 'User',
      action: a.action || '',
      details: a.details || '',
      createdAt: a.created_at,
      entityType: a.entity_type,
      entityId: a.entity_id
    }))
  },

  getTeacherActivities: async (teacherId: string) => {
    const response = await api.get<any[]>(`/activities/teacher/${teacherId}`)
    return response.data.map(a => ({
      _id: a.id,
      userId: a.user_id,
      userName: a.user_name || a.user_id || 'Unknown',
      role: a.role || 'User',
      action: a.action || '',
      details: a.details || '',
      createdAt: a.created_at,
      entityType: a.entity_type,
      entityId: a.entity_id
    }))
  },

  clearActivities: async () => {
    const response = await api.delete('/activities')
    return response.data
  }
}


