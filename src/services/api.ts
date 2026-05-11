import { Student, Teacher, Subject, SubjectResult, Curriculum, StudentSubject } from '../types'
import apiService from './apiService'

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
    if (Array.isArray(data) && data.length > 0) {
      return data as Subject[]
    }
  } catch (error) {
  }
  return []
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

export async function fetchStudentSubjects(studentId?: string): Promise<StudentSubject[]> {
  const endpoint = studentId ? `/student-subjects/${studentId}` : '/student-subjects'
  const { data } = await apiService.get(endpoint)
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
    return []
  }
}

export async function deleteCurriculum(id: string): Promise<void> {
  await apiService.delete(`/curriculum/${id}`)
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

export async function releaseResults(studentIds: string[], term: string, academicYear: string): Promise<{ message: string; updated: number }> {
  const { data: result } = await apiService.patch('/results/release', { studentIds, term, academicYear })
  return result as { message: string; updated: number }
}

export async function unreleaseResults(studentIds: string[], term: string, academicYear: string): Promise<{ message: string; updated: number }> {
  const { data: result } = await apiService.patch('/results/unrelease', { studentIds, term, academicYear })
  return result as { message: string; updated: number }
}

export default apiService
