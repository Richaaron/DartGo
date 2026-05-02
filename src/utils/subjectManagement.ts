/**
 * Utilities for managing student subjects in batch
 */

import { StudentSubject } from '../types'
import {
  createStudentSubject,
  deleteStudentSubject,
  updateStudentSubject,
} from '../services/api'

export interface SubjectChangeSet {
  toAdd: StudentSubject[]
  toRemove: StudentSubject[]
  toUpdate: StudentSubject[]
}

/**
 * Compare current and new subject assignments to determine what needs to change
 */
export function calculateSubjectChanges(
  currentSubjects: StudentSubject[],
  newSubjects: StudentSubject[]
): SubjectChangeSet {
  const currentMap = new Map(currentSubjects.map((s) => [s.subjectId, s]))
  const newMap = new Map(newSubjects.map((s) => [s.subjectId, s]))

  const toAdd: StudentSubject[] = []
  const toRemove: StudentSubject[] = []
  const toUpdate: StudentSubject[] = []

  // Find subjects to add
  for (const [subjectId, newSubject] of newMap) {
    if (!currentMap.has(subjectId)) {
      toAdd.push(newSubject)
    } else {
      const currentSubject = currentMap.get(subjectId)!
      // Check if any properties changed
      if (JSON.stringify(currentSubject) !== JSON.stringify(newSubject)) {
        toUpdate.push(newSubject)
      }
    }
  }

  // Find subjects to remove
  for (const [subjectId, currentSubject] of currentMap) {
    if (!newMap.has(subjectId)) {
      toRemove.push(currentSubject)
    }
  }

  return { toAdd, toRemove, toUpdate }
}

/**
 * Apply subject changes (add, update, remove)
 */
export async function applySubjectChanges(
  changes: SubjectChangeSet,
  onProgress?: (message: string) => void
): Promise<void> {
  try {
    // Remove subjects
    if (changes.toRemove.length > 0) {
      onProgress?.(`Removing ${changes.toRemove.length} subject(s)...`)
      for (const subject of changes.toRemove) {
        try {
          await deleteStudentSubject(subject.id)
        } catch (error) {
          console.error(`Failed to remove subject ${subject.id}:`, error)
        }
      }
    }

    // Add subjects
    if (changes.toAdd.length > 0) {
      onProgress?.(`Adding ${changes.toAdd.length} subject(s)...`)
      for (const subject of changes.toAdd) {
        try {
          await createStudentSubject(subject)
        } catch (error) {
          console.error(`Failed to add subject ${subject.subjectId}:`, error)
        }
      }
    }

    // Update subjects
    if (changes.toUpdate.length > 0) {
      onProgress?.(`Updating ${changes.toUpdate.length} subject(s)...`)
      for (const subject of changes.toUpdate) {
        try {
          await updateStudentSubject(subject.id, subject)
        } catch (error) {
          console.error(`Failed to update subject ${subject.id}:`, error)
        }
      }
    }

    onProgress?.('Done!')
  } catch (error) {
    console.error('Error applying subject changes:', error)
    throw error
  }
}

/**
 * Bulk assign subjects to multiple students
 */
export async function bulkAssignSubjects(
  studentIds: string[],
  subjectIds: string[],
  academicYear: string,
  term: string,
  assignedBy: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const errors: string[] = []
  let successCount = 0
  let failureCount = 0

  for (const studentId of studentIds) {
    for (const subjectId of subjectIds) {
      try {
        await createStudentSubject({
          studentId,
          subjectId,
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          academicYear,
          term,
          assignedBy,
        })
        successCount++
      } catch (error) {
        failureCount++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(
          `Failed to assign subject ${subjectId} to student ${studentId}: ${errorMsg}`
        )
      }
    }
  }

  return { success: successCount, failed: failureCount, errors }
}

/**
 * Remove subjects from a student
 */
export async function removeStudentSubjects(
  subjectIds: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const errors: string[] = []
  let successCount = 0
  let failureCount = 0

  for (const subjectId of subjectIds) {
    try {
      await deleteStudentSubject(subjectId)
      successCount++
    } catch (error) {
      failureCount++
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to remove subject ${subjectId}: ${errorMsg}`)
    }
  }

  return { success: successCount, failed: failureCount, errors }
}

/**
 * Check if a student has required prerequisite subjects
 */
export function hasPrerequisiteSubjects(
  studentSubjects: StudentSubject[],
  subject: { prerequisiteSubjects?: string[] }
): boolean {
  if (!subject.prerequisiteSubjects || subject.prerequisiteSubjects.length === 0) {
    return true
  }

  const studentSubjectIds = new Set(
    studentSubjects.map((s) => s.subjectId)
  )
  return subject.prerequisiteSubjects.every((preReqId) =>
    studentSubjectIds.has(preReqId)
  )
}
