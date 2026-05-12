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
    <div className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="folusho-card max-w-4xl w-full !p-0 overflow-hidden border-folusho-cream-200 shadow-folusho-lg"
      >
        {/* Header */}
        <div className="p-10 bg-folusho-sage-500 text-white flex justify-between items-center shadow-folusho relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">
              Matrix <br /> <span className="text-white/70">Configuration</span>
            </h2>
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-90">
                Personnel Unit: {student.firstName} {student.lastName}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-60">
                Registry: {student.registrationNumber} · {student.level} · {student.class}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            type="button"
            className="p-4 hover:bg-white/10 rounded-[1.5rem] transition-all relative z-10"
          >
            <X size={28} />
          </button>
          
          {/* Decorative Circle */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        </div>

        {/* Content */}
        <div className="p-12 space-y-12 max-h-[70vh] overflow-y-auto scrollbar-folusho">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 bg-folusho-coral-50 border border-folusho-coral-100 rounded-[2rem] flex gap-5 items-center shadow-sm"
              >
                <AlertCircle size={24} className="text-folusho-coral-500 flex-shrink-0" />
                <p className="text-folusho-coral-500 font-bold tracking-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Academic Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
                Deployment Cycle (Academic Year)
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024"
                className="input-folusho"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
                Operational Phase (Term)
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="input-folusho !py-5"
              >
                <option value="First">First Phase</option>
                <option value="Second">Second Phase</option>
                <option value="Third">Third Phase</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
              Strategic Observations (Notes)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter logistical directives for this personnel unit..."
              rows={3}
              className="input-folusho !py-5 resize-none"
            />
          </div>

          {/* Search */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
              Matrix Search
            </label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-folusho-sage-400 group-focus-within:text-folusho-sage-600 transition-colors" />
              <input
                type="text"
                placeholder="Scan institutional protocols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-folusho !pl-16"
              />
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em]">
                Protocol Selection ({selectedCount} active)
              </label>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="text-center py-24 bg-folusho-cream-50 rounded-[3rem] border border-dashed border-folusho-cream-200">
                <p className="text-folusho-slate-300 font-black uppercase tracking-[0.4em] text-xs">No protocols detected in search.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {sortedCategories.map((category) => (
                  <div key={category} className="space-y-6">
                    <h4 className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em] px-6 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-folusho-sage-400" />
                      {category === 'General' ? 'Core Matrix' : `${category} Specialized Matrix`}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subjectsByCategory[category].map((subject) => {
                        const isSelected = !!selectedSubjectsMap[subject.id]
                        return (
                          <label
                            key={subject.id}
                            className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-folusho-sage-50 border-folusho-sage-200 shadow-sm'
                                : 'bg-white border-folusho-cream-100 hover:border-folusho-sage-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSubject(subject.id)}
                              className="w-6 h-6 border-folusho-cream-200 text-folusho-sage-500 rounded-lg focus:ring-folusho-sage-400"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-base font-black truncate transition-colors ${isSelected ? 'text-folusho-sage-600' : 'text-folusho-slate-900'}`}>
                                {subject.name}
                              </p>
                              <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">
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
        <div className="p-10 bg-folusho-cream-50/50 border-t border-folusho-cream-100 flex gap-6">
          <button
            type="button"
            onClick={onCancel}
            className="btn-vibrant bg-white !text-folusho-slate-600 border border-folusho-cream-200 shadow-sm hover:border-folusho-coral-200 flex-1"
          >
            Abort
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCount === 0}
            className="btn-vibrant bg-folusho-sage-500 flex-1 shadow-folusho"
          >
            {isSubmitting ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Synchronize ({selectedCount})
          </button>
        </div>
      </motion.div>
    </div>
  )
}
