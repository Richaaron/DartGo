/**
 * Role-based permission utilities for teachers and admins
 */

import { User } from '../types'

export interface Permission {
  canEditStudent: boolean
  canDeleteStudent: boolean
  canAddStudents: boolean
  canManageSubjects: boolean
  canEditSubjects: boolean
  canAssignSubjectsToStudent: boolean
  canViewAllStudents: boolean
  viewableClasses: string[]
}

export function getUserPermissions(user: User | null): Permission {
  if (!user) {
    return {
      canEditStudent: false,
      canDeleteStudent: false,
      canAddStudents: false,
      canManageSubjects: false,
      canEditSubjects: false,
      canAssignSubjectsToStudent: false,
      canViewAllStudents: false,
      viewableClasses: [],
    }
  }

  if (user.role === 'Admin') {
    return {
      canEditStudent: true,
      canDeleteStudent: true,
      canAddStudents: true,
      canManageSubjects: true,
      canEditSubjects: true,
      canAssignSubjectsToStudent: true,
      canViewAllStudents: true,
      viewableClasses: [],
    }
  }

  if (user.role === 'Teacher') {
    const teacher = user as any
    const teacherType = teacher.teacherType || 'Form Teacher'
    const assignedClasses = teacher.assignedClasses || []

    const canEditStudent =
      teacherType === 'Form Teacher' || teacherType === 'Form + Subject Teacher'
    const canManageSubjects =
      teacherType === 'Subject Teacher' || teacherType === 'Form + Subject Teacher'

    return {
      canEditStudent,
      canDeleteStudent: canEditStudent,
      canAddStudents: canEditStudent,
      canManageSubjects,
      canEditSubjects: canManageSubjects,
      canAssignSubjectsToStudent: canManageSubjects || canEditStudent,
      canViewAllStudents: false,
      viewableClasses: assignedClasses,
    }
  }

  return {
    canEditStudent: false,
    canDeleteStudent: false,
    canAddStudents: false,
    canManageSubjects: false,
    canEditSubjects: false,
    canAssignSubjectsToStudent: false,
    canViewAllStudents: false,
    viewableClasses: [],
  }
}

export function canUserEditStudent(user: User | null, studentClass?: string): boolean {
  const permissions = getUserPermissions(user)
  if (!permissions.canEditStudent) return false

  if (permissions.canViewAllStudents) return true
  if (studentClass && permissions.viewableClasses.includes(studentClass)) return true

  return false
}

export function canUserManageSubjects(user: User | null): boolean {
  const permissions = getUserPermissions(user)
  return permissions.canManageSubjects || permissions.canAssignSubjectsToStudent
}

export function getEditableClasses(user: User | null): string[] {
  const permissions = getUserPermissions(user)
  if (permissions.canViewAllStudents) return [] // Empty means all
  return permissions.viewableClasses
}
