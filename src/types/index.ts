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
  arm?: 'Science' | 'Art' | 'Commercial' // For SSS students
}

export interface Subject {
  id: string
  name: string
  code: string
  level: SchoolLevel
  creditUnits: number
  subjectCategory?: 'Science' | 'Art' | 'Commercial' | 'General'
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
  status?: 'DRAFT' | 'RELEASED'
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
  // Pre-Nursery & Nursery (7 subjects)
  ...['Pre-Nursery', 'Nursery'].flatMap(level => [
    { id: `${level.toLowerCase().substring(0, 3)}-1`, name: 'Mathematics', code: 'MTH', level: level as SchoolLevel, creditUnits: 1 },
    { id: `${level.toLowerCase().substring(0, 3)}-2`, name: 'English', code: 'ENG', level: level as SchoolLevel, creditUnits: 1 },
    { id: `${level.toLowerCase().substring(0, 3)}-3`, name: 'Social Habits', code: 'SOH', level: level as SchoolLevel, creditUnits: 1 },
    { id: `${level.toLowerCase().substring(0, 3)}-4`, name: 'Health Habits', code: 'HHB', level: level as SchoolLevel, creditUnits: 1 },
    { id: `${level.toLowerCase().substring(0, 3)}-5`, name: 'Rhymes', code: 'RHM', level: level as SchoolLevel, creditUnits: 1 },
    { id: `${level.toLowerCase().substring(0, 3)}-6`, name: 'Primary Science', code: 'PSC', level: level as SchoolLevel, creditUnits: 1 },
    { id: `${level.toLowerCase().substring(0, 3)}-7`, name: 'Phonics', code: 'PHN', level: level as SchoolLevel, creditUnits: 1 },
  ]),
  
  // Primary 1-3 (17 subjects)
  ...[1, 2, 3].flatMap(p => [
    { id: `pri-${p}-1`, name: 'Mathematics', code: 'MTH', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-2`, name: 'English Language', code: 'ENG', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-3`, name: 'National Values', code: 'NVL', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-4`, name: 'Basic Technology', code: 'BTE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-5`, name: 'Basic Science', code: 'BSC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-6`, name: 'Physical & Health Education', code: 'PHE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-7`, name: 'Computer Studies', code: 'CST', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-8`, name: 'Religious Studies', code: 'RES', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-9`, name: 'Phonics', code: 'PHN', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-10`, name: 'Home Economics', code: 'HEC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-11`, name: 'Literature', code: 'LIT', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-12`, name: 'Vocational Aptitude', code: 'VAP', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-13`, name: 'Writing', code: 'WRT', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-14`, name: 'Creative Arts', code: 'CAR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-15`, name: 'Verbal Reasoning', code: 'VRR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-16`, name: 'Quantitative Reasoning', code: 'QTR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-17`, name: 'Agricultural Science', code: 'AGS', level: 'Primary', creditUnits: 2 },
  ]),

  // Primary 4-6 (16 subjects - no Writing)
  ...[4, 5, 6].flatMap(p => [
    { id: `pri-${p}-1`, name: 'Mathematics', code: 'MTH', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-2`, name: 'English Language', code: 'ENG', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-3`, name: 'National Values', code: 'NVL', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-4`, name: 'Basic Technology', code: 'BTE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-5`, name: 'Basic Science', code: 'BSC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-6`, name: 'Physical & Health Education', code: 'PHE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-7`, name: 'Computer Studies', code: 'CST', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-8`, name: 'Religious Studies', code: 'RES', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-9`, name: 'Phonics', code: 'PHN', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-10`, name: 'Home Economics', code: 'HEC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-11`, name: 'Literature', code: 'LIT', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-12`, name: 'Vocational Aptitude', code: 'VAP', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-13`, name: 'Creative Arts', code: 'CAR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-14`, name: 'Verbal Reasoning', code: 'VRR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-15`, name: 'Quantitative Reasoning', code: 'QTR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-16`, name: 'Agricultural Science', code: 'AGS', level: 'Primary', creditUnits: 2 },
  ]),
  
  // Junior Secondary (13 subjects)
  { id: 'jss-1', name: 'Mathematics', code: 'MTH', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-2', name: 'English Language', code: 'ENG', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-3', name: 'Basic Technology', code: 'BTE', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-4', name: 'Basic Science', code: 'BSC', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-5', name: 'Computer Studies', code: 'CST', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-6', name: 'Religious Studies', code: 'REL', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-7', name: 'Physical & Health Education', code: 'PHE', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-8', name: 'Fine Arts', code: 'FAA', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'jss-9', name: 'Business Studies', code: 'BUS', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
  { id: 'jss-10', name: 'National Values', code: 'NVL', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-11', name: 'Agricultural Science', code: 'AGS', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-12', name: 'Home Economics', code: 'HEC', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-13', name: 'Hausa', code: 'HAU', level: 'Secondary', creditUnits: 2 },
  
  // Senior Secondary - Core/General (9 subjects)
  { id: 'ss-g-1', name: 'Mathematics', code: 'MTH', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-2', name: 'English Language', code: 'ENG', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-3', name: 'Biology', code: 'BIO', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-4', name: 'Geography', code: 'GEO', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-5', name: 'Agricultural Science', code: 'AGS', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-6', name: 'Civic Education', code: 'CVE', level: 'Secondary', creditUnits: 2, subjectCategory: 'General' },
  { id: 'ss-g-7', name: 'Marketing', code: 'MKT', level: 'Secondary', creditUnits: 2, subjectCategory: 'General' },
  { id: 'ss-g-8', name: 'ICT', code: 'ICT', level: 'Secondary', creditUnits: 2, subjectCategory: 'General' },
  { id: 'ss-g-9', name: 'Economics', code: 'ECO', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  
  // SSS Science Arm Core
  { id: 'ss-sci-1', name: 'Chemistry', code: 'CHM', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-sci-2', name: 'Physics', code: 'PHY', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  
  // SSS Art Arm Core
  { id: 'ss-art-1', name: 'Government', code: 'GOV', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'ss-art-2', name: 'Literature In English', code: 'LIT', level: 'Secondary', creditUnits: 3, subjectCategory: 'Art' },
  
  // SSS Commerce Arm Core
  { id: 'ss-com-1', name: 'Accounting', code: 'ACC', level: 'Secondary', creditUnits: 3, subjectCategory: 'Commercial' },
  { id: 'ss-com-2', name: 'Commerce', code: 'COM', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
]
