/**
 * Validation schemas and middleware for data validation
 */

import { Student, Teacher, SubjectResult } from '../types'
import { validateEmail, validatePhone, validateName, validateRegistrationNumber, validateScore, validateText, validateId } from './security'

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data?: any
}

// Student validation schema
export const validateStudent = (data: Partial<Student>): ValidationResult => {
  const errors: string[] = []

  // Required fields validation
  if (!data.firstName || !validateName(data.firstName)) {
    errors.push('First name is required and must be valid')
  }

  if (!data.lastName || !validateName(data.lastName)) {
    errors.push('Last name is required and must be valid')
  }

  if (!data.registrationNumber || !validateRegistrationNumber(data.registrationNumber)) {
    errors.push('Registration number is required and must be valid')
  }

  if (!data.dateOfBirth) {
    errors.push('Date of birth is required')
  }

  if (!data.gender || !['Male', 'Female'].includes(data.gender)) {
    errors.push('Gender must be Male or Female')
  }

  if (!data.level || !['Pre-Nursery', 'Nursery', 'Primary', 'Secondary'].includes(data.level)) {
    errors.push('Level must be one of: Pre-Nursery, Nursery, Primary, Secondary')
  }

  if (!data.class || !validateText(data.class, 1, 50)) {
    errors.push('Class is required and must be valid')
  }

  if (!data.parentName || !validateName(data.parentName)) {
    errors.push('Parent name is required and must be valid')
  }

  if (!data.parentPhone || !validatePhone(data.parentPhone)) {
    errors.push('Parent phone number is required and must be valid')
  }

  if (data.parentEmail && !validateEmail(data.parentEmail)) {
    errors.push('Parent email must be valid if provided')
  }

  if (!data.enrollmentDate) {
    errors.push('Enrollment date is required')
  }

  if (!data.status || !['Active', 'Inactive', 'Suspended'].includes(data.status)) {
    errors.push('Status must be one of: Active, Inactive, Suspended')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined
  }
}

// Teacher validation schema
export const validateTeacher = (data: Partial<Teacher>): ValidationResult => {
  const errors: string[] = []

  if (!data.name || !validateName(data.name)) {
    errors.push('Name is required and must be valid')
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Email is required and must be valid')
  }

  if (!data.teacherId || !validateText(data.teacherId, 3, 20)) {
    errors.push('Teacher ID is required and must be valid')
  }

  if (!data.username || !validateText(data.username, 3, 30)) {
    errors.push('Username is required and must be valid')
  }

  if (data.teacherType && !['Form Teacher', 'Subject Teacher', 'Form + Subject Teacher'].includes(data.teacherType)) {
    errors.push('Teacher type must be one of: Form Teacher, Subject Teacher, Form + Subject Teacher')
  }

  if (data.subject && !validateText(data.subject, 2, 50)) {
    errors.push('Subject must be valid if provided')
  }

  if (data.assignedClasses && Array.isArray(data.assignedClasses)) {
    data.assignedClasses.forEach((className, index) => {
      if (!validateText(className, 1, 50)) {
        errors.push(`Assigned class at index ${index} must be valid`)
      }
    })
  }

  if (!data.level || !['Pre-Nursery', 'Nursery', 'Primary', 'Secondary'].includes(data.level)) {
    errors.push('Level must be one of: Pre-Nursery, Nursery, Primary, Secondary')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined
  }
}

// Subject result validation schema
export const validateSubjectResult = (data: Partial<SubjectResult>): ValidationResult => {
  const errors: string[] = []

  if (!data.studentId || !validateId(data.studentId)) {
    errors.push('Valid student ID is required')
  }

  if (!data.subjectId || !validateId(data.subjectId)) {
    errors.push('Valid subject ID is required')
  }

  if (!data.term || !validateText(data.term, 1, 50)) {
    errors.push('Term is required and must be valid')
  }

  if (!data.academicYear || !validateText(data.academicYear, 4, 20)) {
    errors.push('Academic year is required and must be valid')
  }

  // Score validations
  const firstCAValidation = validateScore(String(data.firstCA || 0))
  if (!firstCAValidation.isValid) {
    errors.push('First CA score must be between 0 and 100')
  }

  const secondCAValidation = validateScore(String(data.secondCA || 0))
  if (!secondCAValidation.isValid) {
    errors.push('Second CA score must be between 0 and 100')
  }

  const examValidation = validateScore(String(data.exam || 0))
  if (!examValidation.isValid) {
    errors.push('Exam score must be between 0 and 100')
  }

  // Validate total score calculation
  const totalScore = (firstCAValidation.value || 0) + (secondCAValidation.value || 0) + (examValidation.value || 0)
  if (totalScore > 100) {
    errors.push('Total score cannot exceed 100')
  }

  // Remarks validation
  if (data.remarks && !validateText(data.remarks, 0, 500)) {
    errors.push('Remarks must be valid if provided')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      ...data,
      firstCA: firstCAValidation.value,
      secondCA: secondCAValidation.value,
      exam: examValidation.value,
      totalScore,
      percentage: totalScore,
      grade: calculateGrade(totalScore),
      gradePoint: calculateGradePoint(totalScore),
      dateRecorded: new Date().toISOString()
    } : undefined
  }
}

// Grade calculation helper
const calculateGrade = (score: number): string => {
  if (score >= 70) return 'A'
  if (score >= 65) return 'B'
  if (score >= 55) return 'C'
  if (score >= 50) return 'D'
  if (score >= 45) return 'E'
  return 'F'
}

const calculateGradePoint = (score: number): number => {
  if (score >= 70) return 4.0
  if (score >= 65) return 3.5
  if (score >= 55) return 3.0
  if (score >= 50) return 2.5
  if (score >= 45) return 2.0
  return 0.0
}

// Generic validation middleware
export const validateAndSanitize = <T>(
  data: any,
  validator: (data: any) => ValidationResult
): ValidationResult => {
  try {
    // Sanitize input first
    const sanitized = typeof data === 'object' ? { ...data } : data
    
    // Apply validation
    return validator(sanitized)
  } catch (error) {
    return {
      isValid: false,
      errors: ['Validation error occurred']
    }
  }
}

// API request validation middleware
export const validateAPIRequest = (req: any, schema: any) => {
  const errors: string[] = []

  // Check request body
  if (!req.body) {
    errors.push('Request body is required')
    return { isValid: false, errors }
  }

  // Validate against schema
  const validation = validateAndSanitize(req.body, schema)
  if (!validation.isValid) {
    return validation
  }

  return { isValid: true, errors: [], data: validation.data }
}

// Batch validation for bulk operations
export const validateBulkData = <T>(
  dataArray: any[],
  validator: (data: any) => ValidationResult
): { isValid: boolean; errors: string[]; validData: T[]; invalidIndices: number[] } => {
  const errors: string[] = []
  const validData: T[] = []
  const invalidIndices: number[] = []

  dataArray.forEach((data, index) => {
    const validation = validateAndSanitize(data, validator)
    if (validation.isValid) {
      validData.push(validation.data)
    } else {
      invalidIndices.push(index)
      errors.push(`Row ${index + 1}: ${validation.errors.join(', ')}`)
    }
  })

  return {
    isValid: invalidIndices.length === 0,
    errors,
    validData,
    invalidIndices
  }
}
