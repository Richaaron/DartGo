/* global localStorage, fetch, URLSearchParams */
import { Student, Teacher, Subject, SubjectResult, Curriculum, SchemeOfWork, DEFAULT_SUBJECTS } from '../types'

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return 'http://localhost:3001/api'
  
  // If the URL doesn't end with /api, append it
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
}

const API_URL = getBaseUrl()

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

const DEV_SCHEMES_OF_WORK: SchemeOfWork[] = DEV_SUBJECTS.filter((subject) =>
  ['Pre-Nursery', 'Nursery', 'Primary', 'Secondary'].includes(subject.level)
).slice(0, 12).map((subject, index) => {
  const classMap: Record<string, string> = {
    'Pre-Nursery': 'Pre-Nursery A',
    Nursery: 'Nursery 1',
    Primary: `Primary ${Math.min(index + 1, 5)}`,
    Secondary: index % 2 === 0 ? 'Jss 1' : 'Ss1',
  }

  return {
    id: `dev-scheme-${subject.id}`,
    teacherId: 'teacher1@folusho.com',
    subjectId: subject.id,
    classId: classMap[subject.level] || 'Primary 1',
    academicYear: '2025/2026',
    term: 3,
    curriculumId: subject.level === 'Secondary' ? 'dev-curriculum-secondary' : 'dev-curriculum-primary',
    topics: [
      {
        weekNumber: 1,
        topic: `Introduction to ${subject.name}`,
        duration: 1,
        objectives: [`Understand the basics of ${subject.name}`],
        resources: ['Teacher guide', 'Class notes'],
        assessmentMethod: 'Class exercise',
        status: 'PLANNED',
      },
      {
        weekNumber: 2,
        topic: `${subject.name} fundamentals`,
        duration: 1,
        objectives: [`Explain key ideas in ${subject.name}`],
        resources: ['Textbook', 'Board work'],
        assessmentMethod: 'Oral assessment',
        status: 'PLANNED',
      },
    ],
    uploadedBy: 'teacher1@folusho.com',
    uploadedDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    version: 1,
    status: 'APPROVED',
    approvedBy: 'admin@folusho.com',
    approvalDate: new Date().toISOString(),
    notes: `Local development fallback scheme for ${subject.name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
})

function getHeaders() {
  const session = localStorage.getItem('authSession')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (session) {
    try {
      const { token } = JSON.parse(session)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch (e) {
      console.error('Error parsing auth session for headers', e)
    }
  }
  
  return headers
}

async function apiFetch(endpoint: string, options: any = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Request failed with status ${res.status}`)
  }
  
  return res.json()
}

// Generic API methods for compatibility with Axios-like usage
async function get<T>(url: string, config: any = {}): Promise<{ data: T }> {
  const data = await apiFetch(url, { method: 'GET', ...config })
  return { data }
}

async function post<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { 
    method: 'POST', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function put<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function patch<T>(url: string, data: any = {}, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { 
    method: 'PATCH', 
    body: JSON.stringify(data),
    ...config 
  })
  return { data: result }
}

async function del<T>(url: string, config: any = {}): Promise<{ data: T }> {
  const result = await apiFetch(url, { method: 'DELETE', ...config })
  return { data: result }
}

// Students
export async function fetchStudents(): Promise<Student[]> {
  return apiFetch('/students')
}

export async function fetchStudent(id: string): Promise<Student> {
  return apiFetch(`/students/${id}`)
}

export async function createStudent(data: Partial<Student>): Promise<Student> {
  return apiFetch('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  return apiFetch(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteStudent(id: string): Promise<void> {
  return apiFetch(`/students/${id}`, { 
    method: 'DELETE'
  })
}

// Teachers
export async function fetchTeachers(): Promise<Teacher[]> {
  return apiFetch('/teachers')
}

export async function fetchTeacher(id: string): Promise<Teacher> {
  return apiFetch(`/teachers/${id}`)
}

export async function createTeacher(data: Partial<Teacher>): Promise<Teacher> {
  return apiFetch('/teachers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  return apiFetch(`/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteTeacher(id: string): Promise<void> {
  return apiFetch(`/teachers/${id}`, { 
    method: 'DELETE'
  })
}

// Subjects
export async function fetchSubjects(): Promise<Subject[]> {
  try {
    return await apiFetch('/subjects')
  } catch {
    return DEV_SUBJECTS
  }
}

export async function fetchSubject(id: string): Promise<Subject> {
  return apiFetch(`/subjects/${id}`)
}

export async function createSubject(data: Partial<Subject>): Promise<Subject> {
  return apiFetch('/subjects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  return apiFetch(`/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteSubject(id: string): Promise<void> {
  return apiFetch(`/subjects/${id}`, {
    method: 'DELETE'
  })
}

// Results
export async function fetchResults(params: { studentId?: string, term?: string, academicYear?: string } = {}): Promise<SubjectResult[]> {
  const query = new URLSearchParams(params as any).toString()
  return apiFetch(`/results?${query}`)
}

export async function createResult(data: Partial<SubjectResult>): Promise<SubjectResult> {
  return apiFetch('/results', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateResult(id: string, data: Partial<SubjectResult>): Promise<SubjectResult> {
  return apiFetch(`/results/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteResult(id: string): Promise<void> {
  return apiFetch(`/results/${id}`, {
    method: 'DELETE'
  })
}

export async function saveBulkResults(data: { term: string, academicYear: string, results: any[] }): Promise<{ message: string }> {
  return apiFetch('/results/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Attendance
export async function fetchAttendance(params: { studentId?: string, date?: string, startDate?: string, endDate?: string } = {}): Promise<any[]> {
  const query = new URLSearchParams(params as any).toString()
  return apiFetch(`/attendance?${query}`)
}

export async function saveBulkAttendance(date: string, records: { studentId: string, status: string, remarks?: string }[]): Promise<void> {
  return apiFetch('/attendance/bulk', {
    method: 'POST',
    body: JSON.stringify({ date, records }),
  })
}

// Observations
export async function fetchObservations(params: { studentId?: string, term?: string, academicYear?: string } = {}): Promise<any[]> {
  const query = new URLSearchParams(params as any).toString()
  return apiFetch(`/observations?${query}`)
}

export async function saveObservation(data: any): Promise<any> {
  return apiFetch('/observations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Config
export async function fetchConfig(): Promise<any> {
  return apiFetch('/config')
}

export async function updateConfig(data: any): Promise<any> {
  return apiFetch('/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Curriculum
export async function fetchCurriculums(params: { level?: string, status?: string } = {}): Promise<Curriculum[]> {
  const query = new URLSearchParams(params as any).toString()

  try {
    return await apiFetch(`/curriculum?${query}`)
  } catch {
    return DEV_CURRICULUMS.filter((curriculum) => {
      const matchesLevel = !params.level || curriculum.level === params.level
      const matchesStatus = !params.status || curriculum.status === params.status
      return matchesLevel && matchesStatus
    })
  }
}

export async function fetchCurriculum(id: string): Promise<Curriculum> {
  return apiFetch(`/curriculum/${id}`)
}

export async function createCurriculum(data: Partial<Curriculum>): Promise<Curriculum> {
  return apiFetch('/curriculum', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCurriculum(id: string, data: Partial<Curriculum>): Promise<Curriculum> {
  return apiFetch(`/curriculum/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCurriculum(id: string): Promise<void> {
  return apiFetch(`/curriculum/${id}`, {
    method: 'DELETE'
  })
}

export async function fetchCurriculumsByLevel(level: string): Promise<Curriculum[]> {
  return apiFetch(`/curriculum/level/${level}`)
}

// Scheme of Work
export async function fetchSchemesOfWork(teacherId: string): Promise<SchemeOfWork[]> {
  try {
    return await apiFetch(`/scheme-of-work/teacher/${teacherId}`)
  } catch {
    return DEV_SCHEMES_OF_WORK.filter((scheme) => scheme.teacherId === teacherId)
  }
}

export async function fetchSchemeOfWork(id: string): Promise<SchemeOfWork> {
  return apiFetch(`/scheme-of-work/${id}`)
}

export async function createSchemeOfWork(data: Partial<SchemeOfWork>): Promise<SchemeOfWork> {
  return apiFetch('/scheme-of-work', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSchemeOfWork(id: string, data: Partial<SchemeOfWork>): Promise<SchemeOfWork> {
  return apiFetch(`/scheme-of-work/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function submitSchemeOfWork(id: string): Promise<{ message: string, scheme: SchemeOfWork }> {
  return apiFetch(`/scheme-of-work/${id}/submit`, {
    method: 'PUT',
  })
}

export async function approveSchemeOfWork(id: string): Promise<{ message: string, scheme: SchemeOfWork }> {
  return apiFetch(`/scheme-of-work/${id}/approve`, {
    method: 'PUT',
  })
}

export async function updateTopicStatus(schemeId: string, weekNumber: number, status: string): Promise<SchemeOfWork> {
  return apiFetch(`/scheme-of-work/${schemeId}/topic/${weekNumber}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function deleteSchemeOfWork(id: string): Promise<void> {
  return apiFetch(`/scheme-of-work/${id}`, {
    method: 'DELETE'
  })
}

// Additional missing functions and aliases for the api object
export async function fetchSubjectResult(id: string): Promise<SubjectResult> {
  return apiFetch(`/results/${id}`)
}

export async function updateObservation(id: string, data: any): Promise<any> {
  return apiFetch(`/observations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteObservation(id: string): Promise<void> {
  return apiFetch(`/observations/${id}`, {
    method: 'DELETE'
  })
}

export async function fetchNotifications(): Promise<any[]> {
  try {
    return await apiFetch('/notifications')
  } catch {
    return []
  }
}

export async function markNotificationAsRead(id: string): Promise<any> {
  return apiFetch(`/notifications/${id}/read`, {
    method: 'PATCH'
  })
}

export async function markAllNotificationsAsRead(): Promise<any> {
  return apiFetch('/notifications/read-all', {
    method: 'PATCH'
  })
}

const api = {
  // Axios-compatible methods
  get,
  post,
  put,
  patch,
  delete: del,

  // Domain methods
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

