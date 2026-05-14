import { useState, useEffect } from 'react'
import { X, Save, Search, AlertCircle } from 'lucide-react'
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assign Subjects</h2>
          <p className="text-sm text-indigo-100 mt-1">
            Student: {student.firstName} {student.lastName} ({student.class})
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
        {errors.subjects && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{errors.subjects}</p>
          </div>
        )}

        {/* Basic Info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="input"
              placeholder="e.g. 2026"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="input"
            >
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
        </section>

        <section className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="input resize-none"
            placeholder="Additional information..."
          />
        </section>

        {/* Selection */}
        <section className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Available Subjects</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                {selectedSubjects.length} selected
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-8">
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

              if (sortedCats.length === 0) {
                return (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 text-sm">No matching subjects found.</p>
                  </div>
                )
              }

              return sortedCats.map(category => (
                <div key={category} className="space-y-3">
                  <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-1">
                    {category === 'General' ? 'Common Subjects' : `${category} Subjects`}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {byCategory[category].map(subject => {
                      const isSelected = selectedSubjects.includes(subject.id)
                      const isDisabled = !isSelected && isSecondary && selectedSubjects.length >= MAX_SUBJECTS
                      return (
                        <label
                          key={subject.id}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                              : isDisabled
                              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleSubject(subject.id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{subject.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{subject.code}</p>
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

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Save size={18} />
            Save Assignments
          </button>
        </div>
      </form>
    </div>
  )
}
