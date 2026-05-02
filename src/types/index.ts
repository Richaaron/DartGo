export type SchoolLevel = 'Pre-Nursery' | 'Nursery' | 'Primary' | 'Secondary'

export interface Student {
  id: string
  firstName: string
  lastName: string
  registrationNumber: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  level: SchoolLevel
  class: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  enrollmentDate: string
  status: 'Active' | 'Inactive' | 'Suspended'
  image?: string // Base64 or URL
  parentUsername?: string
  parentPassword?: string
}

export interface Subject {
  id: string
  name: string
  code: string
  level: SchoolLevel
  creditUnits: number
  subjectCategory?: 'Science' | 'Art' | 'Commercial'
  description?: string
  curriculumType?: 'NIGERIAN' | 'IGCSE' | 'OTHER'
  prerequisiteSubjects?: string[]
}

export interface Result {
  id: string
  studentId: string
  subjectId: string
  assessmentType: 'Test' | 'Exam' | 'Assignment' | 'Project'
  score: number
  totalScore: number
  dateRecorded: string
  term: string
  academicYear: string
  recordedBy: string
  notes?: string
}

export interface SubjectResult {
  id: string
  studentId: string
  subjectId: string
  term: string
  academicYear: string
  firstCA: number
  secondCA: number
  exam: number
  totalScore: number
  percentage: number
  grade: string
  gradePoint: number
  remarks: string
  dateRecorded: string
  recordedBy: string
  position?: number
  positionText?: string
}

export interface ResultsSentTracker {
  id: string
  studentId: string
  term: string
  academicYear: string
  sentDate: string
  sentBy: string
  parentEmail: string
  status: 'sent' | 'failed'
  attemptCount: number
}

export interface StudentResult extends Result {
  studentName: string
  subjectName: string
  grade: string
  gradePoint: number
  percentage: number
}

export interface StudentSubject {
  id: string
  studentId: string
  subjectId: string
  enrollmentDate: string
  status: 'Active' | 'Dropped' | 'Completed'
  academicYear: string
  term: string
  assignedBy: string
  notes?: string
}

export interface ClassResult {
  class: string
  level: SchoolLevel
  totalStudents: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passPercentage: number
  failPercentage: number
}

export interface StudentPerformance {
  studentId: string
  studentName: string
  averageScore: number
  totalSubjects: number
  passedSubjects: number
  failedSubjects: number
  gpa: number
  performanceRating: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor'
  trend: 'Improving' | 'Stable' | 'Declining'
}

export interface GradeScale {
  minScore: number
  maxScore: number
  grade: string
  gradePoint: number
  description: string
}

export interface Curriculum {
  id: string
  name: string
  version: string
  level: SchoolLevel
  yearsOfStudy: number
  subjects: string[]
  implementationDate: string
  revisionDate?: string
  description: string
  curriculum: 'NIGERIAN' | 'IGCSE' | 'OTHER'
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  createdBy: string
  createdAt: string
  updatedAt: string
}



export const DEFAULT_GRADE_SCALE: GradeScale[] = [
  { minScore: 70, maxScore: 100, grade: 'A', gradePoint: 4.0, description: 'Excellent' },
  { minScore: 65, maxScore: 69, grade: 'B', gradePoint: 3.5, description: 'Very Good' },
  { minScore: 55, maxScore: 64, grade: 'C', gradePoint: 3.0, description: 'Credit' },
  { minScore: 50, maxScore: 54, grade: 'D', gradePoint: 2.5, description: 'Fair' },
  { minScore: 45, maxScore: 49, grade: 'E', gradePoint: 2.0, description: 'Weak Pass' },
  { minScore: 0, maxScore: 44, grade: 'F', gradePoint: 0.0, description: 'Fail' },
]

// Authentication and User Types
export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent'

export interface User {
  id: string
  _id?: string // MongoDB ID
  email: string
  name: string
  role: UserRole
}

export interface Parent extends User {
  role: 'Parent'
  studentId: string
  childName: string
}

export interface Teacher extends User {
  role: 'Teacher'
  teacherId: string
  username: string
  password?: string
  teacherType?: 'Form Teacher' | 'Subject Teacher' | 'Form + Subject Teacher'
  subject?: string
  assignedSubjects?: string[]
  level: SchoolLevel
  assignedClasses: string[] // Class names like "JSS1A", "JSS2B"
  image?: string // Base64 or URL
}

export interface Admin extends User {
  role: 'Admin'
}

export interface AuthSession {
  user: User | Teacher | Admin | Parent | null
  token?: string
  isAuthenticated: boolean
  lastLogin?: string
}

export const DEFAULT_SUBJECTS: Subject[] = [
  // Pre-Nursery Subjects
  { id: 'pre-nur-1', name: 'Reading', code: 'RDG', level: 'Pre-Nursery', creditUnits: 0 },
  { id: 'pre-nur-2', name: 'Writing', code: 'WRT', level: 'Pre-Nursery', creditUnits: 0 },
  { id: 'pre-nur-3', name: 'Numbers', code: 'NUM', level: 'Pre-Nursery', creditUnits: 0 },
  { id: 'pre-nur-4', name: 'Drawing', code: 'DRW', level: 'Pre-Nursery', creditUnits: 0 },
  { id: 'pre-nur-5', name: 'Animal Stories', code: 'AST', level: 'Pre-Nursery', creditUnits: 0 },
  { id: 'pre-nur-6', name: 'Rhymes', code: 'RHM', level: 'Pre-Nursery', creditUnits: 0 },
  
  // Nursery Subjects
  { id: 'nur-1', name: 'Mathematics', code: 'MTH', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-2', name: 'English Language', code: 'ENG', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-3', name: 'Basic Science', code: 'BSC', level: 'Nursery', creditUnits: 1 },
  { id: 'nur-4', name: 'Health Education', code: 'HLT', level: 'Nursery', creditUnits: 1 },
  { id: 'nur-5', name: 'Religious Knowledge', code: 'RK', level: 'Nursery', creditUnits: 1 },
  { id: 'nur-6', name: 'Social Studies', code: 'SOS', level: 'Nursery', creditUnits: 1 },
  { id: 'nur-7', name: 'Creative Arts', code: 'CAR', level: 'Nursery', creditUnits: 1 },
  { id: 'nur-8', name: 'Agricultural Science', code: 'AGS', level: 'Nursery', creditUnits: 1 },
  { id: 'nur-9', name: 'Phonics', code: 'PHN', level: 'Nursery', creditUnits: 1 },
  { id: 'nur-10', name: 'Handwriting', code: 'HWT', level: 'Nursery', creditUnits: 1 },
  
  // Primary Subjects (17 subjects)
  { id: 'pri-1', name: 'Mathematics', code: 'MTH', level: 'Primary', creditUnits: 2 },
  { id: 'pri-2', name: 'English Language', code: 'ENG', level: 'Primary', creditUnits: 2 },
  { id: 'pri-3', name: 'Basic Science', code: 'BSC', level: 'Primary', creditUnits: 2 },
  { id: 'pri-4', name: 'Basic Technology', code: 'BTE', level: 'Primary', creditUnits: 2 },
  { id: 'pri-5', name: 'National Values', code: 'NVL', level: 'Primary', creditUnits: 2 },
  { id: 'pri-6', name: 'Quantitative Reasoning', code: 'QTR', level: 'Primary', creditUnits: 2 },
  { id: 'pri-7', name: 'Verbal Reasoning', code: 'VRR', level: 'Primary', creditUnits: 2 },
  { id: 'pri-8', name: 'Religious Studies', code: 'RES', level: 'Primary', creditUnits: 2 },
  { id: 'pri-9', name: 'Vocational Aptitude', code: 'VAP', level: 'Primary', creditUnits: 2 },
  { id: 'pri-10', name: 'Creative Arts', code: 'CAR', level: 'Primary', creditUnits: 2 },
  { id: 'pri-11', name: 'Writing', code: 'WRT', level: 'Primary', creditUnits: 2 },
  { id: 'pri-12', name: 'Literature', code: 'LIT', level: 'Primary', creditUnits: 2 },
  { id: 'pri-13', name: 'Agricultural Science', code: 'AGS', level: 'Primary', creditUnits: 2 },
  { id: 'pri-14', name: 'Home Economics', code: 'HEC', level: 'Primary', creditUnits: 2 },
  { id: 'pri-15', name: 'Physical & Health Education', code: 'PHE', level: 'Primary', creditUnits: 2 },
  { id: 'pri-16', name: 'Computer Studies', code: 'CST', level: 'Primary', creditUnits: 2 },
  { id: 'pri-17', name: 'Phonics', code: 'PHN', level: 'Primary', creditUnits: 2 },
  
  // Secondary Subjects - Junior Secondary (13 subjects)
  { id: 'jss-1', name: 'Mathematics', code: 'MTH', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-2', name: 'English Language', code: 'ENG', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-3', name: 'Basic Science', code: 'BSC', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-4', name: 'Basic Technology', code: 'BTE', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-5', name: 'Fine Arts', code: 'FAA', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'jss-6', name: 'National Values', code: 'NVL', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-7', name: 'Home Economics', code: 'HEC', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-8', name: 'Business Studies', code: 'BUS', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
  { id: 'jss-9', name: 'Agricultural Science', code: 'AGS', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-10', name: 'Physical & Health Education', code: 'PHE', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-11', name: 'Hausa', code: 'HAU', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-12', name: 'Religious Studies', code: 'REL', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-13', name: 'Computer Studies', code: 'CST', level: 'Secondary', creditUnits: 2, subjectCategory: 'Science' },
  
  // Secondary Subjects - Senior Secondary (15 subjects)
  { id: 'ss-1', name: 'Mathematics', code: 'MTH', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-2', name: 'English Language', code: 'ENG', level: 'Secondary', creditUnits: 3, subjectCategory: 'Art' },
  { id: 'ss-3', name: 'Biology', code: 'BIO', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-4', name: 'Geography', code: 'GEO', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-5', name: 'Physics', code: 'PHY', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-6', name: 'Chemistry', code: 'CHM', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-7', name: 'Civic Education', code: 'CVE', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'ss-8', name: 'Marketing', code: 'MKT', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
  { id: 'ss-9', name: 'Literature in English', code: 'LIT', level: 'Secondary', creditUnits: 3, subjectCategory: 'Art' },
  { id: 'ss-10', name: 'Commerce', code: 'COM', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
  { id: 'ss-11', name: 'Government', code: 'GOV', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'ss-12', name: 'Accounting', code: 'ACC', level: 'Secondary', creditUnits: 3, subjectCategory: 'Commercial' },
  { id: 'ss-13', name: 'Agricultural Science', code: 'AGS', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-14', name: 'Economics', code: 'ECO', level: 'Secondary', creditUnits: 3, subjectCategory: 'Commercial' },
  { id: 'ss-15', name: 'Religious Studies', code: 'REL', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
]
