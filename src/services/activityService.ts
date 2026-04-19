import api from './api'

export interface Activity {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    role: string
  }
  userName: string
  role: string
  action: string
  details: string
  createdAt: string
}

export const activityService = {
  getActivities: async () => {
    const response = await api.get<Activity[]>('/activities')
    return response.data
  },

  getTeacherActivities: async (teacherId: string) => {
    const response = await api.get<Activity[]>(`/activities/teacher/${teacherId}`)
    return response.data
  }
}
