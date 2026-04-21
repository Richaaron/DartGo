import { Student, Teacher, Subject, SubjectResult, Curriculum, SchemeOfWork, DEFAULT_SUBJECTS } from '../types'
import apiWithFallback from './apiWithFallback'

const DEV_SUBJECTS: Subject[] = DEFAULT_SUBJECTS.map((subject) => ({
  ...subject,
  description: subject.description || `${subject.name} for ${subject.level} level with guided classroom content and learning objectives.`,
  subjectCategory: subject.subjectCategory || 'CORE',
  curriculumType: subject.curriculumType || 'NIGERIAN',
  prerequisiteSubjects: subject.prerequisiteSubjects || [],
}))

const DEV_CURRICULUMS: Curriculum[] = [
  {
    id: 'dev-curriculum-primary',
    name: 'Nigerian Primary School Curriculum',
    version: '2023.1',
    level: 'Primary',
    yearsOfStudy: 6,
    subjects: DEV_SUBJECTS.filter((subject) => subject.level === 'Primary') as any,
    implementationDate: '2023-09-01',
    description: 'Current Nigerian primary school curriculum (Classes 1-6)',
    curriculum: 'NIGERIAN',
    status: 'ACTIVE',
    createdBy: 'admin@folusho.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dev-curriculum-secondary',
    name: 'Nigerian Secondary School Curriculum',
    version: '2023.1',
    level: 'Secondary',
    yearsOfStudy: 6,
    subjects: DEV_SUBJECTS.filter((subject) => subject.level === 'Secondary') as any,
    implementationDate: '2023-09-01',
    description: 'Current Nigerian secondary school curriculum (JSS 1-3, SSS 1-3)',
    curriculum: 'NIGERIAN',
    status: 'ACTIVE',
    createdBy: 'admin@folusho.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function fetchStudents(): Promise<Student[]> {
  const { data } = await apiWithFallback.get('/students')
  return data as Student[]
}

export async function fetchStudent(id: string): Promise<Student> {
  const { data } = await apiWithFallback.get(`/students/${id}`)
  return data as Student
}

export async function createStudent(data: Partial<Student>): Promise<Student> {
  const { data: result } = await apiWithFallback.post('/students', data)
  return result as Student
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const { data: result } = await apiWithFallback.put(`/students/${id}`, data)
  return result as Student
}

export async function deleteStudent(id: string): Promise<void> {
  await apiWithFallback.delete(`/students/${id}`)
}

export async function fetchTeachers(): Promise<Teacher[]> {
  const { data } = await apiWithFallback.get('/teachers')
  return data as Teacher[]
}

export async function fetchTeacher(id: string): Promise<Teacher> {
  const { data } = await apiWithFallback.get(`/teachers/${id}`)
  return data as Teacher
}

export async function createTeacher(data: Partial<Teacher>): Promise<Teacher> {
  const { data: result } = await apiWithFallback.post('/teachers', data)
  return result as Teacher
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  const { data: result } = await apiWithFallback.put(`/teachers/${id}`, data)
  return result as Teacher
}

export async function deleteTeacher(id: string): Promise<void> {
  await apiWithFallback.delete(`/teachers/${id}`)
}

export async function fetchSubjects(): Promise<Subject[]> {
  try {
    const { data } = await apiWithFallback.get('/subjects')
    return data as Subject[]
  } catch {
    return DEV_SUBJECTS
  }
}

export async function fetchSubject(id: string): Promise<Subject> {
  const { data } = await apiWithFallback.get(`/subjects/${id}`)
  return data as Subject
}

export async function createSubject(data: Partial<Subject>): Promise<Subject> {
  const { data: result } = await apiWithFallback.post('/subjects', data)
  return result as Subject
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  const { data: result } = await apiWithFallback.put(`/subjects/${id}`, data)
  return result as Subject
}

export async function deleteSubject(id: string): Promise<void> {
  await apiWithFallback.delete(`/subjects/${id}`)
}

export async function fetchResults(params: { studentId?: string; term?: string; academicYear?: string } = {}): Promise<SubjectResult[]> {
  const query = new URLSearchParams(params as any).toString()
  const { data } = await apiWithFallback.get(`/results?${query}`)
  return data as SubjectResult[]
}

export async function createResult(data: Partial<SubjectResult>): Promise<SubjectResult> {
  const { data: result } = await apiWithFallback.post('/results', data)
  return result as SubjectResult
}

export async function updateResult(id: string, data: Partial<SubjectResult>): Promise<SubjectResult> {
  const { data: result } = await apiWithFallback.put(`/results/${id}`, data)
  return result as SubjectResult
}

export async function deleteResult(id: string): Promise<void> {
  await apiWithFallback.delete(`/results/${id}`)
}

export async function saveBulkResults(data: { term: string; academicYear: string; results: any[] }): Promise<{ message: string }> {
  const { data: result } = await apiWithFallback.post('/results/bulk', data)
  return result as { message: string }
}

export async function fetchAttendance(params: { studentId?: string; date?: string; startDate?: string; endDate?: string } = {}): Promise<any[]> {
  const query = new URLSearchParams(params as any).toString()
  const { data } = await apiWithFallback.get(`/attendance?${query}`)
  return data as any[]
}

export async function saveBulkAttendance(date: string, records: { studentId: string; status: string; remarks?: string }[]): Promise<void> {
  await apiWithFallback.post('/attendance/bulk', { date, records })
}

export async function fetchObservations(params: { studentId?: string; term?: string; academicYear?: string } = {}): Promise<any[]> {
  const query = new URLSearchParams(params as any).toString()
  const { data } = await apiWithFallback.get(`/observations?${query}`)
  return data as any[]
}

export async function saveObservation(data: any): Promise<any> {
  const { data: result } = await apiWithFallback.post('/observations', data)
  return result
}

export async function fetchConfig(): Promise<any> {
  const { data } = await apiWithFallback.get('/config')
  return data
}

export async function updateConfig(data: any): Promise<any> {
  const { data: result } = await apiWithFallback.put('/config', data)
  return result
}

export async function fetchCurriculums(params: { level?: string; status?: string } = {}): Promise<Curriculum[]> {
  const query = new URLSearchParams(params as any).toString()
  try {
    const { data } = await apiWithFallback.get(`/curriculum?${query}`)
    return data as Curriculum[]
  } catch {
    return DEV_CURRICULUMS.filter((curriculum) => {
      const matchesLevel = !params.level || curriculum.level === params.level
      const matchesStatus = !params.status || curriculum.status === params.status
      return matchesLevel && matchesStatus
    })
  }
}

export async function fetchCurriculum(id: string): Promise<Curriculum> {
  const { data } = await apiWithFallback.get(`/curriculum/${id}`)
  return data as Curriculum
}

export async function createCurriculum(data: Partial<Curriculum>): Promise<Curriculum> {
  const { data: result } = await apiWithFallback.post('/curriculum', data)
  return result as Curriculum
}

export async function updateCurriculum(id: string, data: Partial<Curriculum>): Promise<Curriculum> {
  const { data: result } = await apiWithFallback.put(`/curriculum/${id}`, data)
  return result as Curriculum
}

export async function deleteCurriculum(id: string): Promise<void> {
  await apiWithFallback.delete(`/curriculum/${id}`)
}

export async function fetchCurriculumsByLevel(level: string): Promise<Curriculum[]> {
  const { data } = await apiWithFallback.get(`/curriculum/level/${level}`)
  return data as Curriculum[]
}

export async function fetchSchemesOfWork(teacherId: string): Promise<SchemeOfWork[]> {
  try {
    const { data } = await apiWithFallback.get(`/scheme-of-work/teacher/${teacherId}`)
    return data as SchemeOfWork[]
  } catch {
    return []
  }
}

export async function fetchSchemeOfWork(id: string): Promise<SchemeOfWork> {
  const { data } = await apiWithFallback.get(`/scheme-of-work/${id}`)
  return data as SchemeOfWork
}

export async function createSchemeOfWork(data: Partial<SchemeOfWork>): Promise<SchemeOfWork> {
  const { data: result } = await apiWithFallback.post('/scheme-of-work', data)
  return result as SchemeOfWork
}

export async function updateSchemeOfWork(id: string, data: Partial<SchemeOfWork>): Promise<SchemeOfWork> {
  const { data: result } = await apiWithFallback.put(`/scheme-of-work/${id}`, data)
  return result as SchemeOfWork
}

export async function submitSchemeOfWork(id: string): Promise<{ message: string; scheme: SchemeOfWork }> {
  const { data } = await apiWithFallback.put(`/scheme-of-work/${id}/submit`, {})
  return data as { message: string; scheme: SchemeOfWork }
}

export async function approveSchemeOfWork(id: string): Promise<{ message: string; scheme: SchemeOfWork }> {
  const { data } = await apiWithFallback.put(`/scheme-of-work/${id}/approve`, {})
  return data as { message: string; scheme: SchemeOfWork }
}

export async function updateTopicStatus(schemeId: string, weekNumber: number, status: string): Promise<SchemeOfWork> {
  const { data } = await apiWithFallback.put(`/scheme-of-work/${schemeId}/topic/${weekNumber}`, { status })
  return data as SchemeOfWork
}

export async function deleteSchemeOfWork(id: string): Promise<void> {
  await apiWithFallback.delete(`/scheme-of-work/${id}`)
}

export async function fetchSubjectResult(id: string): Promise<SubjectResult> {
  const { data } = await apiWithFallback.get(`/results/${id}`)
  return data as SubjectResult
}

export async function updateObservation(id: string, data: any): Promise<any> {
  const { data: result } = await apiWithFallback.put(`/observations/${id}`, data)
  return result
}

export async function deleteObservation(id: string): Promise<void> {
  await apiWithFallback.delete(`/observations/${id}`)
}

export async function fetchNotifications(): Promise<any[]> {
  try {
    const { data } = await apiWithFallback.get('/notifications')
    return data as any[]
  } catch {
    return []
  }
}

export async function markNotificationAsRead(id: string): Promise<any> {
  const { data } = await apiWithFallback.patch(`/notifications/${id}/read`, {})
  return data
}

export async function markAllNotificationsAsRead(): Promise<any> {
  const { data } = await apiWithFallback.patch('/notifications/read-all', {})
  return data
}

const api = {
  get: apiWithFallback.get,
  post: apiWithFallback.post,
  put: apiWithFallback.put,
  patch: apiWithFallback.patch,
  delete: apiWithFallback.delete,
  fetchStudents,
  fetchStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  fetchTeachers,
  fetchTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  fetchSubjects,
  fetchSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchSubjectResults: fetchResults,
  fetchSubjectResult,
  createSubjectResult: createResult,
  updateSubjectResult: updateResult,
  deleteSubjectResult: deleteResult,
  fetchResultsByStudent: (studentId: string) => fetchResults({ studentId }),
  fetchResultsByClass: (classId: string) => fetchResults({ classId } as any),
  fetchObservationsByStudent: (studentId: string) => fetchObservations({ studentId }),
  createObservation: saveObservation,
  updateObservation,
  deleteObservation,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchConfig,
  updateConfig,
  fetchCurriculums,
  fetchCurriculum,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  fetchCurriculumsByLevel,
  fetchSchemesOfWork,
  fetchSchemeOfWork,
  createSchemeOfWork,
  updateSchemeOfWork,
  submitSchemeOfWork,
  approveSchemeOfWork,
  updateTopicStatus,
  deleteSchemeOfWork,
}

export default api
