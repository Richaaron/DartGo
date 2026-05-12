import { useState, useEffect } from 'react'
import { motion } from "framer-motion";
import { X, Plus, Search } from 'lucide-react'
import { StudentSubject, Subject, Student } from '../types'

interface StudentSubjectFormProps {
  student: Student
  subjects: Subject[]
  currentSubjects: StudentSubject[]
  onSubmit: (assignments: StudentSubject[]) => void
  onCancel: () => void
}

export default function StudentSubjectForm({
  student,
  subjects,
  currentSubjects,
  onSubmit,
  onCancel,
}: StudentSubjectFormProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString())
  const [term, setTerm] = useState<string>('First')
  const [notes, setNotes] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isSecondary = student.level === 'Secondary'
  const isSSSStudent = isSecondary && student.class.toUpperCase().startsWith('SSS')
  const isJSSStudent = isSecondary && student.class.toUpperCase().startsWith('JSS')

  const availableSubjects = subjects.filter(s => {
    if (s.level !== student.level) return false
    
    // For Secondary level, further distinguish between JSS and SSS
    if (isSecondary) {
      const code = (s.code || '').toUpperCase()
      if (isSSSStudent) return code.includes('SS') && !code.includes('JSS')
      if (isJSSStudent) return code.includes('JSS')
    }
    
    return true
  })
  const MIN_SUBJECTS = isSecondary ? 9 : 0
  const MAX_SUBJECTS = isSecondary ? 11 : Infinity

  useEffect(() => {
    const currentSubjectIds = currentSubjects.map(cs => cs.subjectId)
    setSelectedSubjects(currentSubjectIds)
  }, [currentSubjects])

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) return prev.filter(id => id !== subjectId)
      if (isSecondary && prev.length >= MAX_SUBJECTS) return prev
      return [...prev, subjectId]
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (selectedSubjects.length === 0) {
      newErrors.subjects = 'At least one subject must be selected'
    }
    if (isSecondary && selectedSubjects.length < MIN_SUBJECTS) {
      newErrors.subjects = `Secondary students must select at least ${MIN_SUBJECTS} subjects (currently ${selectedSubjects.length})`
    }
    if (isSecondary && selectedSubjects.length > MAX_SUBJECTS) {
      newErrors.subjects = `Secondary students can select at most ${MAX_SUBJECTS} subjects`
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const assignments: StudentSubject[] = selectedSubjects.map(subjectId => {
        const existingAssignment = currentSubjects.find(cs => cs.subjectId === subjectId)
        return {
          id: existingAssignment?.id || `${student.id}-${subjectId}-${Date.now()}`,
          studentId: student.id,
          subjectId,
          enrollmentDate: existingAssignment?.enrollmentDate || new Date().toISOString().split('T')[0],
          status: 'Active',
          academicYear,
          term,
          assignedBy: 'System',
          notes: notes || undefined,
        }
      })
      onSubmit(assignments)
    }
  }

  const categoryOrder = ['Science', 'Art', 'Commercial', 'General']

  return (
    <motion.div 
      className="folusho-card border-folusho-cream-200"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-100/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-12">
          <div>
            <motion.h2 
              className="text-4xl font-black uppercase tracking-tighter leading-none text-folusho-slate-900 mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Subject <br /> <span className="text-folusho-sage-500">Matrix</span>
            </motion.h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.35em]">
              Academic Allocation Protocol
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-4 hover:bg-folusho-cream-100 rounded-3xl transition-all border border-folusho-cream-200 text-folusho-slate-400 hover:text-folusho-slate-900"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Institutional Intelligence */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-folusho-sage-400" />
              I. Target Subject Detail
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Academic Cycle
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="input-folusho w-full"
                  placeholder="e.g. 2026"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Session Term
                </label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="input-folusho w-full"
                >
                  <option value="First">First Vector</option>
                  <option value="Second">Second Vector</option>
                  <option value="Third">Third Vector</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                Intelligence Memo (Notes)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input-folusho w-full resize-none"
                placeholder="Institutional notes for this assignment..."
              />
            </div>
          </section>

          {/* Subject Matrix Selection */}
          <section className="space-y-10 pt-10 border-t border-folusho-cream-200">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h3 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.45em] px-2 flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-folusho-coral-400" />
                  II. Specialization Matrix
                </h3>
                <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Status: <span className="text-folusho-slate-900">{selectedSubjects.length}</span> Active Protocols
                </p>
              </div>
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Filter Matrix..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-folusho !pl-12 text-xs"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-folusho-slate-400" />
              </div>
            </div>

            <div className="space-y-10">
              {(() => {
                const searched = availableSubjects.filter(s =>
                  s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.code.toLowerCase().includes(searchTerm.toLowerCase())
                )
                const byCategory = searched.reduce((acc, subject) => {
                  const cat = isSSSStudent ? (subject.subjectCategory || 'General') : 'General'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(subject)
                  return acc
                }, {} as Record<string, Subject[]>)

                const sortedCats = Object.keys(byCategory).sort(
                  (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
                )

                return sortedCats.map(category => (
                  <div key={category} className="space-y-6">
                    <h4 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-folusho-sage-400/40" />
                      {category} Logic
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {byCategory[category].map(subject => {
                        const isSelected = selectedSubjects.includes(subject.id)
                        const isDisabled = !isSelected && isSecondary && selectedSubjects.length >= MAX_SUBJECTS
                        return (
                          <label
                            key={subject.id}
                            className={`flex items-center gap-4 p-6 rounded-[2.5rem] border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-folusho-sage-50 border-folusho-sage-200 shadow-inner'
                                : isDisabled
                                ? 'bg-folusho-cream-50 border-folusho-cream-100 opacity-40 cursor-not-allowed'
                                : 'bg-white border-folusho-cream-200 hover:bg-folusho-cream-50 hover:border-folusho-sage-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => toggleSubject(subject.id)}
                              className="w-6 h-6 bg-folusho-cream-50 border-folusho-cream-200 text-folusho-sage-600 rounded-xl focus:ring-folusho-sage-400"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-folusho-slate-900 truncate">{subject.name}</p>
                              <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">{subject.code}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-end gap-6 pt-12 border-t border-folusho-cream-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-10 py-5 text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.35em] hover:text-folusho-slate-900 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-12 py-5 bg-folusho-sage-400 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.35em] shadow-folusho hover:bg-folusho-sage-500 hover:scale-105 active:scale-95 transition-all"
            >
              Initialize Assignment
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
