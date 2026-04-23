import { z } from 'zod'

export const studentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date)
    const now = new Date()
    return dob < now
  }, { message: 'Date of birth cannot be in the future' }),
  gender: z.enum(['Male', 'Female']),
  level: z.enum(['Pre-Nursery', 'Nursery', 'Primary', 'Secondary']),
  class: z.string().min(1, 'Class is required'),
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  parentPhone: z.string()
    .regex(/^(\+?234|0)?[789][01][0-9]{8}$/, 'Invalid Nigerian phone number format'),
  parentEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  enrollmentDate: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
  parentUsername: z.string().optional(),
  parentPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

export const teacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  username: z.string().min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),
  subject: z.string().optional(),
  level: z.enum(['Pre-Nursery', 'Nursery', 'Primary', 'Secondary']),
  assignedClasses: z.array(z.string()).optional(),
})

export const subjectResultSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().min(1, 'Class is required'),
  term: z.union([z.string(), z.number()]).refine(val => {
    const num = typeof val === 'string' ? parseInt(val) : val
    return num >= 1 && num <= 3
  }, { message: 'Term must be 1, 2, or 3' }),
  academicYear: z.string().min(1, 'Academic year is required'),
  firstCA: z.number().min(0, 'Score cannot be negative').max(40, 'First CA cannot exceed 40'),
  secondCA: z.number().min(0, 'Score cannot be negative').max(40, 'Second CA cannot exceed 40'),
  exam: z.number().min(0, 'Score cannot be negative').max(100, 'Exam cannot exceed 100'),
})

export const attendanceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  date: z.string().refine((date) => {
    const d = new Date(date)
    const now = new Date()
    return d <= now
  }, { message: 'Attendance date cannot be in the future' }),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

export type StudentInput = z.infer<typeof studentSchema>
export type TeacherInput = z.infer<typeof teacherSchema>
export type SubjectResultInput = z.infer<typeof subjectResultSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
export type LoginInput = z.infer<typeof loginSchema>

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) }
    }
    return { success: false, errors: ['Invalid data format'] }
  }
}