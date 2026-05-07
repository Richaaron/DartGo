import { useState, useEffect } from 'react'
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
      if (isSSSStudent) return s.id.startsWith('ss-') || s.code.toUpperCase().includes('SSS') || s.code.toUpperCase().startsWith('SS')
      if (isJSSStudent) return s.id.startsWith('jss-') || s.code.toUpperCase().includes('JSS')
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
    <div className="p-6 bg-slate-800 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-600">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Subjects</h2>
          <p className="text-sm text-slate-300 mt-1">
            {student.firstName} {student.lastName} ({student.registrationNumber})
          </p>
          <p className="text-xs text-slate-400">{student.level} · {student.class}</p>
          {isSecondary && (
            <p className="text-xs text-royal-gold-400 mt-1 font-semibold">
              Min {MIN_SUBJECTS} – Max {MAX_SUBJECTS} subjects required
            </p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <X size={22} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Academic Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Academic Year *</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g., 2026"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-royal-gold-400 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Term *</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-royal-gold-400 focus:border-transparent outline-none"
            >
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about subject assignment..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-royal-gold-400 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Subject Selection */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Select Subjects
                <span className={`ml-2 text-sm font-semibold ${
                  selectedSubjects.length > MAX_SUBJECTS ? 'text-red-400' :
                  isSecondary && selectedSubjects.length < MIN_SUBJECTS ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>
                  ({selectedSubjects.length} selected)
                </span>
              </h3>
              {isSecondary && (
                <div className="w-48 bg-slate-700 rounded-full h-1.5 mt-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      selectedSubjects.length > MAX_SUBJECTS ? 'bg-red-500' :
                      selectedSubjects.length >= MIN_SUBJECTS ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min((selectedSubjects.length / MAX_SUBJECTS) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-royal-gold-400 outline-none"
              />
            </div>
          </div>

          {errors.subjects && (
            <p className="text-red-400 text-sm mb-3 font-medium">{errors.subjects}</p>
          )}

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
              <div key={category} className="mb-4 border border-slate-600 rounded-xl p-4 bg-slate-700/50">
                <h4 className="text-xs font-black text-royal-gold-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-royal-gold-500/20 border border-royal-gold-400/30 rounded-full">
                    {category} {isSSSStudent ? 'Stream' : 'Subjects'}
                  </span>
                  <span className="text-slate-500 font-medium normal-case">({byCategory[category].length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {byCategory[category].map(subject => {
                    const isSelected = selectedSubjects.includes(subject.id)
                    const isDisabled = !isSelected && isSecondary && selectedSubjects.length >= MAX_SUBJECTS
                    return (
                      <label
                        key={subject.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-all border ${
                          isSelected
                            ? 'bg-royal-purple-600/30 border-royal-purple-400/60 cursor-pointer'
                            : isDisabled
                            ? 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
                            : 'bg-slate-800/50 border-slate-600 hover:border-royal-gold-400/50 hover:bg-slate-700 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleSubject(subject.id)}
                          className="mt-0.5 w-4 h-4 accent-purple-500 border-slate-500 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">{subject.name}</p>
                          <p className="text-xs text-slate-400">{subject.code}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>

        {/* Selected summary */}
        {selectedSubjects.length > 0 && (
          <div className="bg-royal-purple-900/30 border border-royal-purple-600/40 rounded-lg p-4">
            <p className="text-sm font-bold text-royal-gold-300 mb-2">
              Selected ({selectedSubjects.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map(subjectId => {
                const subject = availableSubjects.find(s => s.id === subjectId)
                return subject ? (
                  <span key={subjectId} className="px-3 py-1 bg-royal-purple-600/40 text-royal-purple-200 border border-royal-purple-500/30 rounded-full text-xs font-semibold">
                    {subject.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-600">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-royal-purple-500 to-royal-purple-600 hover:from-royal-purple-600 hover:to-royal-purple-700 text-white rounded-lg font-bold transition-all shadow-lg"
          >
            <Plus size={18} />
            Assign Subjects
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
