/**
 * API and application type definitions
 */

import { Student, Teacher, SubjectResult, User } from './index'

// API Response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Configuration types
export interface SchoolConfig {
  schoolName: string
  schoolLogo?: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  academicYear: string
  currentTerm: string
  gradingSystem: GradingSystem
  features: SchoolFeatures
}

export interface GradingSystem {
  scale: GradeScale[]
  passingScore: number
  maxScore: number
}

export interface GradeScale {
  minScore: number
  maxScore: number
  grade: string
  gradePoint: number
  description: string
}

export interface SchoolFeatures {
  enableParentPortal: boolean
  enableNotifications: boolean
  enableReports: boolean
  enableAttendance: boolean
  enableSchemeOfWork: boolean
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'tel'
  required?: boolean
  placeholder?: string
  options?: string[]
  validation?: ValidationRule[]
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern'
  value?: string | number
  message: string
}

// Filter and Search types
export interface SearchFilters {
  query?: string
  class?: string
  term?: string
  academicYear?: string
  subject?: string
  status?: string
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
}

// UI State types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

export interface MessageState {
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
  timestamp?: number
}

// Table types
export interface TableColumn<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

export interface TableAction<T = any> {
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  disabled?: (row: T) => boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

// Modal types
export interface ModalState<T = any> {
  isOpen: boolean
  data?: T
  mode: 'create' | 'edit' | 'view'
}

// Notification types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: number
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// User session types
export interface UserSession {
  user: User | Teacher | Admin | Parent
  token: string
  permissions: Permission[]
  lastActivity: number
}

export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}

// Extended user types
export interface Admin {
  id: string
  email: string
  name: string
  role: 'Admin'
  permissions: Permission[]
}

export interface Parent {
  id: string
  email: string
  name: string
  role: 'Parent'
  studentIds: string[]
  children: Student[]
}

// Attendance types
export interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: 'Present' | 'Absent' | 'Late' | 'Excused'
  remarks?: string
  recordedBy: string
  recordedAt: string
}

export interface AttendanceSession {
  id: string
  classId: string
  date: string
  term: string
  academicYear: string
  records: AttendanceRecord[]
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
}

// Report types
export interface StudentReport {
  student: Student
  results: SubjectResult[]
  summary: {
    totalSubjects: number
    averageScore: number
    gpa: number
    classPosition?: number
    gradeDistribution: Record<string, number>
  }
  term: string
  academicYear: string
}

export interface ClassReport {
  class: string
  level: string
  students: StudentReport[]
  summary: {
    totalStudents: number
    averageScore: number
    passRate: number
    gradeDistribution: Record<string, number>
    subjectAverages: Record<string, number>
  }
  term: string
  academicYear: string
}

// File upload types
export interface FileUpload {
  file: File
  name: string
  size: number
  type: string
  progress?: number
  error?: string
}

export interface UploadedFile {
  id: string
  name: string
  originalName: string
  size: number
  type: string
  url: string
  uploadedAt: string
  uploadedBy: string
}

// Deadline types
export interface Deadline {
  id: string
  title: string
  description: string
  type: 'result_submission' | 'report_generation' | 'attendance' | 'other'
  dueDate: string
  assignedTo: string[] // User IDs
  status: 'pending' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  createdBy: string
  createdAt: string
  completedAt?: string
}

// Message/Communication types
export interface Message {
  id: string
  senderId: string
  recipientId: string
  subject: string
  content: string
  type: 'message' | 'announcement' | 'reminder'
  status: 'sent' | 'delivered' | 'read'
  timestamp: string
  replyTo?: string
  attachments?: UploadedFile[]
}

// Chart/Analytics types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
  }[]
}

export interface AnalyticsData {
  studentPerformance: {
    trend: number[]
    average: number
    gradeDistribution: Record<string, number>
  }
  classPerformance: {
    classAverages: Record<string, number>
    passRates: Record<string, number>
  }
  subjectPerformance: {
    subjectAverages: Record<string, number>
    difficultyIndex: Record<string, number>
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Event types
export interface ApplicationEvent {
  type: string
  payload: any
  timestamp: number
}

// Hook return types
export interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export interface UseFormResult<T> {
  values: T
  errors: Record<keyof T, string>
  touched: Record<keyof T, boolean>
  isSubmitting: boolean
  isValid: boolean
  handleChange: (field: keyof T) => (value: any) => void
  handleSubmit: (onSubmit: (values: T) => void) => void
  resetForm: () => void
}

export interface UseLocalStorageResult<T> {
  value: T
  setValue: (value: T) => void
  removeValue: () => void
}
