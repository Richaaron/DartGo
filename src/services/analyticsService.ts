import api from './api'

export interface StudentInsight {
  studentId: string
  studentName: string
  registrationNumber: string
  class: string
  averageScore: number
  trend: 'improving' | 'declining' | 'stable'
  trendMessage: string
  weakSubjects: {
    subjectName: string
    score: number
    reason: string
  }[]
  recommendation: string
  isAtRisk: boolean
}

export const analyticsService = {
  getStudentInsights: async () => {
    const response = await api.get<StudentInsight[]>('/analytics/student-insights')
    return response.data
  }
}
