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
  email: string
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
  subjectCategory?: 'CORE' | 'ELECTIVE' | 'VOCATIONAL'
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
}

export interface StudentResult extends Result {
  studentName: string
  subjectName: string
  grade: string
  gradePoint: number
  percentage: number
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

export interface Topic {
  weekNumber: number
  topic: string
  duration: number
  objectives: string[]
  resources: string[]
  assessmentMethod: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface SchemeOfWork {
  id: string
  teacherId: string
  subjectId: string
  classId: string
  academicYear: string
  term: number
  curriculumId: string
  topics: Topic[]
  uploadedBy: string
  uploadedDate: string
  lastUpdated: string
  version: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE'
  approvedBy?: string
  approvalDate?: string
  notes: string
  createdAt: string
  updatedAt: string
}

export const DEFAULT_GRADE_SCALE: GradeScale[] = [
  { minScore: 90, maxScore: 100, grade: 'A', gradePoint: 4.0, description: 'Excellent' },
  { minScore: 80, maxScore: 89, grade: 'B', gradePoint: 3.0, description: 'Good' },
  { minScore: 70, maxScore: 79, grade: 'C', gradePoint: 2.0, description: 'Average' },
  { minScore: 60, maxScore: 69, grade: 'D', gradePoint: 1.0, description: 'Below Average' },
  { minScore: 0, maxScore: 59, grade: 'F', gradePoint: 0.0, description: 'Fail' },
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
  subject: string
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
  
  // Primary Subjects
  { id: 'pri-1', name: 'Mathematics', code: 'MTH', level: 'Primary', creditUnits: 3 },
  { id: 'pri-2', name: 'English Language', code: 'ENG', level: 'Primary', creditUnits: 3 },
  { id: 'pri-3', name: 'Basic Science', code: 'BSC', level: 'Primary', creditUnits: 2 },
  { id: 'pri-4', name: 'Basic Technology', code: 'BTE', level: 'Primary', creditUnits: 1 },
  { id: 'pri-5', name: 'Religious Knowledge', code: 'RK', level: 'Primary', creditUnits: 1 },
  { id: 'pri-6', name: 'Social Studies', code: 'SOS', level: 'Primary', creditUnits: 2 },
  { id: 'pri-7', name: 'Creative Arts', code: 'CAR', level: 'Primary', creditUnits: 1 },
  { id: 'pri-8', name: 'Agricultural Science', code: 'AGS', level: 'Primary', creditUnits: 1 },
  { id: 'pri-9', name: 'Home Economics', code: 'HEC', level: 'Primary', creditUnits: 1 },
  { id: 'pri-10', name: 'Physical Education', code: 'PHE', level: 'Primary', creditUnits: 1 },
  { id: 'pri-11', name: 'Computer Studies', code: 'CST', level: 'Primary', creditUnits: 1 },
  { id: 'pri-12', name: 'French Language', code: 'FRE', level: 'Primary', creditUnits: 1 },
  { id: 'pri-13', name: 'Yoruba Language', code: 'YOR', level: 'Primary', creditUnits: 1 },
  { id: 'pri-14', name: 'Islamic Religious Knowledge', code: 'IRK', level: 'Primary', creditUnits: 1 },
  { id: 'pri-15', name: 'Civic Education', code: 'CVE', level: 'Primary', creditUnits: 1 },
  { id: 'pri-16', name: 'Security Education', code: 'SEC', level: 'Primary', creditUnits: 1 },
  
  // Secondary Subjects (JSS and SSS)
  { id: 'sec-1', name: 'Mathematics', code: 'MTH', level: 'Secondary', creditUnits: 3 },
  { id: 'sec-2', name: 'English Language', code: 'ENG', level: 'Secondary', creditUnits: 3 },
  { id: 'sec-3', name: 'Physics', code: 'PHY', level: 'Secondary', creditUnits: 3 },
  { id: 'sec-4', name: 'Chemistry', code: 'CHM', level: 'Secondary', creditUnits: 3 },
  { id: 'sec-5', name: 'Biology', code: 'BIO', level: 'Secondary', creditUnits: 3 },
  { id: 'sec-6', name: 'Geography', code: 'GEO', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-7', name: 'Economics', code: 'ECO', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-8', name: 'Commerce', code: 'COM', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-9', name: 'Accounting', code: 'ACC', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-10', name: 'Government', code: 'GOV', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-11', name: 'Literature-in-English', code: 'LIT', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-12', name: 'Christian Religious Knowledge', code: 'CRK', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-13', name: 'Islamic Religious Knowledge', code: 'IRK', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-14', name: 'Yoruba Language', code: 'YOR', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-15', name: 'French Language', code: 'FRE', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-16', name: 'Computer Studies', code: 'CST', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-17', name: 'Technical Drawing', code: 'TD', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-18', name: 'Food and Nutrition', code: 'FAN', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-19', name: 'Home Management', code: 'HMG', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-20', name: 'Fine Arts', code: 'FAA', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-21', name: 'Music', code: 'MUS', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-22', name: 'Physical Education', code: 'PHE', level: 'Secondary', creditUnits: 1 },
  { id: 'sec-23', name: 'Civic Education', code: 'CVE', level: 'Secondary', creditUnits: 1 },
  { id: 'sec-24', name: 'Security Education', code: 'SEC', level: 'Secondary', creditUnits: 1 },
  { id: 'sec-25', name: 'Agricultural Science', code: 'AGS', level: 'Secondary', creditUnits: 2 },
  { id: 'sec-26', name: 'Further Mathematics', code: 'FMA', level: 'Secondary', creditUnits: 3 },
]
