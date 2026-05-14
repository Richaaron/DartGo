import { useState, useEffect } from 'react'
import { X, Plus, Search, AlertCircle, RefreshCw } from 'lucide-react'
import { StudentSubject, Subject, Student } from '../types'

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
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl w-full flex flex-col shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Assign Subjects</h2>
            <p className="text-xs text-indigo-100 mt-1">
              Student: {student.firstName} {student.lastName} ({student.class})
            </p>
          </div>
          <button
            onClick={onCancel}
            type="button"
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex gap-4 items-center">
              <AlertCircle size={20} className="text-rose-500 flex-shrink-0" />
              <p className="text-rose-500 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2024"
                className="input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Term
              </label>
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="input resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Search Subjects
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type to filter subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Available Subjects ({selectedCount} selected)
              </h3>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 text-sm">No subjects found.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedCategories.map((category) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {category === 'General' ? 'Common Subjects' : `${category} Subjects`}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjectsByCategory[category].map((subject) => {
                        const isSelected = !!selectedSubjectsMap[subject.id]
                        return (
                          <label
                            key={subject.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSubject(subject.id)}
                              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                {subject.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
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
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCount === 0}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Update Subjects ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  )
}
