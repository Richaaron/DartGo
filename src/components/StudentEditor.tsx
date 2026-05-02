import { useState, useEffect } from 'react'
import { X, AlertCircle, BookOpen, User as UserIcon } from 'lucide-react'
import { Student, Subject, StudentSubject } from '../types'
import StudentForm from './StudentForm'
import SubjectManagement from './SubjectManagement'

interface StudentEditorProps {
  student: Student
  subjects: Subject[]
  studentSubjects: StudentSubject[]
  onUpdateStudent: (student: Student) => Promise<void>
  onUpdateSubjects: (subjects: StudentSubject[]) => Promise<void>
  onCancel: () => void
  allowedClasses?: string[]
}

type EditMode = 'info' | 'subjects'

export default function StudentEditor({
  student,
  subjects,
  studentSubjects,
  onUpdateStudent,
  onUpdateSubjects,
  onCancel,
  allowedClasses = [],
}: StudentEditorProps) {
  const [editMode, setEditMode] = useState<EditMode>('info')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateStudent = async (updatedStudent: Student | Omit<Student, 'id'>) => {
    if (!('id' in updatedStudent)) return

    setError(null)
    setIsSubmitting(true)
    try {
      await onUpdateStudent(updatedStudent as Student)
      setEditMode('info')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubjects = async (updatedSubjects: StudentSubject[]) => {
    setError(null)
    setIsSubmitting(true)
    try {
      await onUpdateSubjects(updatedSubjects)
      setEditMode('info')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subjects')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Tabs */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.firstName} {student.lastName} ({student.registrationNumber})
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
            title="Close dialog"
            aria-label="Close edit student dialog"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-0 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setEditMode('info')}
            className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors ${
              editMode === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserIcon size={18} />
            <span>Student Information</span>
          </button>
          <button
            onClick={() => setEditMode('subjects')}
            className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors ${
              editMode === 'subjects'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen size={18} />
            <span>Manage Subjects</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {editMode === 'info' ? (
            <div className="p-6">
              <StudentForm
                onSubmit={handleUpdateStudent}
                initialData={student}
                onCancel={onCancel}
                isEditing={true}
                allowedClasses={allowedClasses}
                lockClass={false}
                availableSubjects={subjects}
              />
            </div>
          ) : (
            <div className="p-6">
              <SubjectManagement
                student={student}
                availableSubjects={subjects}
                currentSubjects={studentSubjects}
                onUpdate={handleUpdateSubjects}
                onCancel={onCancel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
