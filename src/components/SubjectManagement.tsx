import { useState, useEffect } from 'react'
import { X, Plus, Search, AlertCircle } from 'lucide-react'
import { StudentSubject, Subject, Student } from '../types'
import { motion, AnimatePresence } from 'framer-motion'

interface SubjectManagementProps {
  student: Student
  availableSubjects: Subject[]
  currentSubjects: StudentSubject[]
  onUpdate: (subjects: StudentSubject[]) => Promise<void>
  onCancel: () => void
}

export default function SubjectManagement({
  student,
  availableSubjects,
  currentSubjects,
  onUpdate,
  onCancel,
}: SubjectManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjectsMap, setSelectedSubjectsMap] = useState<Record<string, StudentSubject>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [academicYear, setAcademicYear] = useState<string>(
    new Date().getFullYear().toString()
  )
  const [term, setTerm] = useState<string>('First')
  const [notes, setNotes] = useState<string>('')

  // Initialize selected subjects
  useEffect(() => {
    const map: Record<string, StudentSubject> = {}
    currentSubjects.forEach((subject) => {
      map[subject.subjectId] = subject
    })
    setSelectedSubjectsMap(map)
  }, [currentSubjects])

  // Filter subjects by student level and search term
  const isSSSStudent =
    student.level === 'Secondary' &&
    (student.class.toUpperCase().startsWith('SSS') ||
      student.class.toUpperCase().startsWith('SS'))

  const filteredSubjects = availableSubjects.filter((subject) => {
    const matchesLevel = subject.level === student.level
    const matchesSearch = subject.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesLevel && matchesSearch
  })

  // Group subjects by category
  const categoryOrder = ['Science', 'Art', 'Commercial', 'General']
  const subjectsByCategory = filteredSubjects.reduce(
    (acc, subject) => {
      const category = isSSSStudent ? subject.subjectCategory || 'General' : 'General'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(subject)
      return acc
    },
    {} as Record<string, Subject[]>
  )

  const sortedCategories = Object.keys(subjectsByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectsMap((prev) => {
      const newMap = { ...prev }
      if (newMap[subjectId]) {
        delete newMap[subjectId]
      } else {
        // Add new subject
        newMap[subjectId] = {
          id: `${student.id}-${subjectId}-${Date.now()}`,
          studentId: student.id,
          subjectId,
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          academicYear,
          term,
          assignedBy: 'System',
          notes: notes || undefined,
        }
      }
      return newMap
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (Object.keys(selectedSubjectsMap).length === 0) {
      setError('At least one subject must be selected')
      return
    }

    setIsSubmitting(true)
    try {
      const subjectsToSubmit = Object.values(selectedSubjectsMap).map((subject) => ({
        ...subject,
        academicYear,
        term,
        notes: notes || undefined,
      }))
      await onUpdate(subjectsToSubmit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subjects')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCount = Object.keys(selectedSubjectsMap).length

  return (
    <div className="fixed inset-0 bg-nebula-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="nebula-card max-w-4xl w-full !p-0 overflow-hidden border-white/10 shadow-nebula-lg"
      >
        {/* Header */}
        <div className="p-10 bg-gradient-to-r from-nebula-indigo-600 to-nebula-indigo-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">
              Matrix <br /> <span className="text-white/60">Configuration</span>
            </h2>
            <div className="mt-4 flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
                Personnel Unit: {student.firstName} {student.lastName}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                Registry: {student.registrationNumber} · {student.level} · {student.class}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            type="button"
            className="p-3 hover:bg-white/10 rounded-2xl transition-all"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 bg-nebula-pink-500/10 border border-nebula-pink-500/20 rounded-3xl flex gap-4 items-center"
              >
                <AlertCircle size={24} className="text-nebula-pink-400 flex-shrink-0" />
                <p className="text-nebula-pink-400 font-bold tracking-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Academic Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Deployment Cycle (Academic Year)
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024"
                className="input-nebula"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
                Operational Phase (Term)
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="input-nebula !py-4"
              >
                <option value="First">First Phase</option>
                <option value="Second">Second Phase</option>
                <option value="Third">Third Phase</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
              Strategic Observations (Notes)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter logistical directives..."
              rows={2}
              className="input-nebula resize-none"
            />
          </div>

          {/* Search */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
              Matrix Search
            </label>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-nebula-indigo-500 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Scan protocols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-nebula pl-14"
              />
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em]">
                Protocol Selection ({selectedCount} active)
              </label>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p className="text-nebula-slate-500 font-bold uppercase tracking-widest text-sm">No protocols detected in search.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {sortedCategories.map((category) => (
                  <div key={category} className="space-y-4">
                    <h4 className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-nebula-indigo-500" />
                      {category === 'General' ? 'Core Matrix' : `${category} Specialized Matrix`}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjectsByCategory[category].map((subject) => {
                        const isSelected = !!selectedSubjectsMap[subject.id]
                        return (
                          <label
                            key={subject.id}
                            className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-nebula-indigo-500/10 border-nebula-indigo-500/40 shadow-inner'
                                : 'bg-white/[0.02] border-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSubject(subject.id)}
                              className="w-5 h-5 bg-nebula-slate-900 border-white/10 text-nebula-indigo-600 rounded-lg focus:ring-nebula-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-white truncate">
                                {subject.name}
                              </p>
                              <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest">
                                {subject.code}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-10 bg-nebula-slate-900/50 border-t border-white/5 flex gap-6">
          <button
            type="button"
            onClick={onCancel}
            className="btn-vibrant from-white/5 to-white/10 !text-white border border-white/10 flex-1 shadow-none"
          >
            Abort
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCount === 0}
            className="btn-vibrant from-nebula-indigo-600 to-nebula-indigo-800 flex-1"
          >
            <Plus size={18} />
            Synchronize ({selectedCount})
          </button>
        </div>
      </motion.div>
    </div>
  )
}
