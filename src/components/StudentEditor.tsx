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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
      <div className="bg-white dark:bg-slate-900 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">


        {/* Dynamic Header */}
        <div className="p-10 border-b border-slate-100 dark:border-slate-800 relative z-10 bg-slate-50 dark:bg-slate-950/20">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white mb-4">
                Student <br /> <span className="text-indigo-600 dark:text-indigo-400">Profile Editor</span>
              </h2>
              <div className="flex items-center gap-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Student: {student.firstName} {student.lastName}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">
                  Reg Number: {student.registrationNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-2 bg-slate-100 dark:bg-slate-950/50 p-2 rounded-[2rem] border border-slate-200 dark:border-white/5">
            {[
              { id: 'info', label: 'Basic Profile', icon: <UserIcon size={16} /> },
              { id: 'subjects', label: 'Subject Assignments', icon: <BookOpen size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEditMode(tab.id as EditMode)}
                className={`relative px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${
                  editMode === tab.id 
                    ? 'text-indigo-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {editMode === tab.id && (
                  <div 
                    className="absolute inset-0 bg-white border border-indigo-200 rounded-[1.5rem] shadow-sm"
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div 
            className="mx-10 mt-8 p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex gap-5 items-center overflow-hidden"
          >
            <AlertCircle size={24} className="text-rose-500 flex-shrink-0" />
            <p className="text-rose-500 font-black text-[10px] uppercase tracking-widest leading-relaxed">{error}</p>
          </div>
        )}

        {/* Main Operational Context */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-10">
          {editMode === 'info' ? (
            <StudentForm
              onSubmit={handleUpdateStudent}
              initialData={student}
              onCancel={onCancel}
              isEditing={true}
              allowedClasses={allowedClasses}
              lockClass={false}
              availableSubjects={subjects}
            />
          ) : (
            <SubjectManagement
              student={student}
              availableSubjects={subjects}
              currentSubjects={studentSubjects}
              onUpdate={handleUpdateSubjects}
              onCancel={onCancel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
