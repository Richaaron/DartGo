import { useState, useEffect } from 'react'
import { motion } from "framer-motion";
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
    <div className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
      <motion.div 
        className="folusho-card max-w-5xl w-full max-h-[90vh] flex flex-col !p-0 overflow-hidden border-folusho-cream-200 shadow-folusho-lg"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Decorative Orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-100/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-100/30 rounded-full blur-[100px] pointer-events-none" />

        {/* Dynamic Header */}
        <div className="p-10 border-b border-folusho-cream-100 relative z-10 bg-folusho-cream-50/30">
          <div className="flex justify-between items-start mb-10">
            <div>
              <motion.h2 
                className="text-4xl font-black uppercase tracking-tighter leading-none text-folusho-slate-900 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                Intelligence <br /> <span className="text-folusho-sage-500">Modifier</span>
              </motion.h2>
              <div className="flex items-center gap-6">
                <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                  Personnel Unit: {student.firstName} {student.lastName}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-folusho-cream-200" />
                <p className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.3em]">
                  Registry: {student.registrationNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-4 hover:bg-white rounded-[1.5rem] transition-all border border-folusho-cream-200 text-folusho-slate-400 hover:text-folusho-slate-900 shadow-sm"
            >
              <X size={24} />
            </button>
          </div>

          {/* Institutional Tab Navigation */}
          <div className="flex gap-4">
            {[
              { id: 'info', label: 'Primary Intelligence', icon: <UserIcon size={16} /> },
              { id: 'subjects', label: 'Subject Matrix', icon: <BookOpen size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEditMode(tab.id as EditMode)}
                className={`relative px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${
                  editMode === tab.id 
                    ? 'text-folusho-sage-600' 
                    : 'text-folusho-slate-400 hover:text-folusho-slate-600'
                }`}
              >
                {editMode === tab.id && (
                  <motion.div 
                    layoutId="active-tab-editor"
                    className="absolute inset-0 bg-white border border-folusho-sage-200 rounded-[1.5rem] shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Feedback */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-10 mt-8 p-6 bg-folusho-coral-50 border border-folusho-coral-100 rounded-[2rem] flex gap-5 items-center overflow-hidden"
            >
              <AlertCircle size={24} className="text-folusho-coral-500 flex-shrink-0" />
              <p className="text-folusho-coral-500 font-black text-[10px] uppercase tracking-widest leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Operational Context */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={editMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-10"
            >
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
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
