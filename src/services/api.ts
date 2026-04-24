import { Student, Teacher, Subject, SubjectResult, Curriculum, SchemeOfWork, StudentSubject, DEFAULT_SUBJECTS } from '../types'
import apiService from './apiService'

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
  const { data } = await apiService.get('/students')
  return data as Student[]
}

export async function fetchStudent(id: string): Promise<Student> {
  const { data } = await apiService.get(`/students/${id}`)
  return data as Student
}

export async function createStudent(data: Partial<Student>): Promise<Student> {
  const { data: result } = await apiService.post('/students', data)
  return result as Student
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const { data: result } = await apiService.put(`/students/${id}`, data)
  return result as Student
}

export async function deleteStudent(id: string): Promise<void> {
  await apiService.delete(`/students/${id}`)
}

export async function fetchTeachers(): Promise<Teacher[]> {
  const { data } = await apiService.get('/teachers')
  return data as Teacher[]
}

export async function fetchTeacher(id: string): Promise<Teacher> {
  const { data } = await apiService.get(`/teachers/${id}`)
  return data as Teacher
}

export async function createTeacher(data: Partial<Teacher>): Promise<Teacher> {
  const { data: result } = await apiService.post('/teachers', data)
  return result as Teacher
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  const { data: result } = await apiService.put(`/teachers/${id}`, data)
  return result as Teacher
}

export async function deleteTeacher(id: string): Promise<void> {
  await apiService.delete(`/teachers/${id}`)
}

export async function fetchSubjects(): Promise<Subject[]> {
  try {
    const { data } = await apiService.get('/subjects')
    return data as Subject[]
  } catch {
    return DEV_SUBJECTS
  }
}

export async function fetchResults(): Promise<SubjectResult[]> {
  const { data } = await apiService.get('/results')
  return data as SubjectResult[]
}

export async function createResult(data: Partial<SubjectResult>): Promise<SubjectResult> {
  const { data: result } = await apiService.post('/results', data)
  return result as SubjectResult
}

export async function updateResult(id: string, data: Partial<SubjectResult>): Promise<SubjectResult> {
  const { data: result } = await apiService.put(`/results/${id}`, data)
  return result as SubjectResult
}

export async function deleteResult(id: string): Promise<void> {
  await apiService.delete(`/results/${id}`)
}

export async function fetchStudentSubjects(studentId: string): Promise<StudentSubject[]> {
  const { data } = await apiService.get(`/student-subjects/${studentId}`)
  return data as StudentSubject[]
}

export async function createStudentSubject(data: Partial<StudentSubject>): Promise<StudentSubject> {
  const { data: result } = await apiService.post('/student-subjects', data)
  return result as StudentSubject
}

export async function deleteStudentSubject(id: string): Promise<void> {
  await apiService.delete(`/student-subjects/${id}`)
}

export async function updateStudentSubject(id: string, data: Partial<StudentSubject>): Promise<StudentSubject> {
  const { data: result } = await apiService.put(`/student-subjects/${id}`, data)
  return result as StudentSubject
}

export async function fetchConfig(): Promise<any> {
  const { data } = await apiService.get('/config')
  return data
}

export async function updateConfig(data: any): Promise<any> {
  const { data: result } = await apiService.put('/config', data)
  return result
}

export async function fetchCurriculums(params: any = {}): Promise<Curriculum[]> {
  try {
    const query = new URLSearchParams(params).toString()
    const { data } = await apiService.get(`/curriculum?${query}`)
    return data as Curriculum[]
  } catch {
    return DEV_CURRICULUMS
  }
}

export async function deleteCurriculum(id: string): Promise<void> {
  await apiService.delete(`/curriculum/${id}`)
}

export async function fetchSchemesOfWork(subjectId: string): Promise<SchemeOfWork[]> {
  const { data } = await apiService.get(`/scheme-of-work/${subjectId}`)
  return data as SchemeOfWork[]
}

export async function deleteSchemeOfWork(id: string): Promise<void> {
  await apiService.delete(`/scheme-of-work/${id}`)
}

export async function submitSchemeOfWork(id: string): Promise<SchemeOfWork> {
  const { data: result } = await apiService.post(`/scheme-of-work/${id}/submit`, {})
  return result as SchemeOfWork
}

export async function updateSchemeOfWork(id: string, data: Partial<SchemeOfWork>): Promise<SchemeOfWork> {
  const { data: result } = await apiService.put(`/scheme-of-work/${id}`, data)
  return result as SchemeOfWork
}

export async function uploadSchemeOfWorkFile(formData: FormData): Promise<SchemeOfWork> {
  const { data: result } = await apiService.post('/scheme-of-work/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return result as SchemeOfWork
}

export async function fetchAttendance(params: any = {}): Promise<any[]> {
  const query = new URLSearchParams(params).toString()
  const { data } = await apiService.get(`/attendance?${query}`)
  return data as any[]
}

export async function saveBulkAttendance(date: string, records: any[]): Promise<void> {
  await apiService.post('/attendance/bulk', { date, records })
}

export async function fetchObservations(params: any = {}): Promise<any[]> {
  const query = new URLSearchParams(params).toString()
  const { data } = await apiService.get(`/observations?${query}`)
  return data as any[]
}

export async function saveObservation(data: any): Promise<void> {
  await apiService.post('/observations', data)
}

export async function saveBulkResults(data: any): Promise<{ message: string }> {
  const { data: result } = await apiService.post('/results/bulk', data)
  return result as { message: string }
}

export async function fetchDeadlines(): Promise<any[]> {
  const { data } = await apiService.get('/deadlines')
  return data as any[]
}

export async function createDeadline(data: any): Promise<any> {
  const { data: result } = await apiService.post('/deadlines', data)
  return result
}

export async function updateDeadline(id: string, data: any): Promise<any> {
  const { data: result } = await apiService.put(`/deadlines/${id}`, data)
  return result
}

export async function deleteDeadline(id: string): Promise<void> {
  await apiService.delete(`/deadlines/${id}`)
}

export default apiService
