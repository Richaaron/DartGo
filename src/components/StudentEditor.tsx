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
    <div className="fixed inset-0 bg-nebula-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
      <motion.div 
        className="relative overflow-hidden bg-nebula-slate-950/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-nebula-lg max-w-5xl w-full max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Decorative Orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-nebula-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-nebula-pink-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Dynamic Header */}
        <div className="p-10 border-b border-white/5 relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <motion.h2 
                className="text-4xl font-black uppercase tracking-tighter leading-none text-white mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                Intelligence <br /> <span className="text-nebula-indigo-400">Modifier</span>
              </motion.h2>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em]">
                  Unit: {student.firstName} {student.lastName}
                </p>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <p className="text-[10px] font-black text-nebula-indigo-500 uppercase tracking-[0.3em]">
                  Registry: {student.registrationNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 hover:border-white/10 text-nebula-slate-400 hover:text-white"
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
                className={`relative px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                  editMode === tab.id 
                    ? 'text-white' 
                    : 'text-nebula-slate-500 hover:text-nebula-slate-300'
                }`}
              >
                {editMode === tab.id && (
                  <motion.div 
                    layoutId="active-tab-editor"
                    className="absolute inset-0 bg-nebula-indigo-500/10 border border-nebula-indigo-500/30 rounded-2xl shadow-nebula-sm"
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
        {error && (
          <div className="mx-10 mt-6 p-6 bg-nebula-pink-500/10 border border-nebula-pink-500/20 rounded-3xl flex gap-4 items-center">
            <AlertCircle size={24} className="text-nebula-pink-400" />
            <p className="text-nebula-pink-400 font-black text-[10px] uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* Main Operational Context */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={editMode}
              initial={{ opacity: 0, x: editMode === 'info' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: editMode === 'info' ? 20 : -20 }}
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
