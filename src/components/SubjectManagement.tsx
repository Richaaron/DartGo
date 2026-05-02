import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Search, AlertCircle } from 'lucide-react'
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-start gap-4 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Manage Subjects</h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.firstName} {student.lastName} ({student.registrationNumber})
            </p>
            <p className="text-xs text-gray-500">
              {student.level} · {student.class}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
            title="Close dialog"
            aria-label="Close subject management"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Academic Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year *
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Term *
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="First">First Term</option>
                <option value="Second">Second Term</option>
                <option value="Third">Third Term</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about subject assignment..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Subjects
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Subjects List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Select Subjects ({selectedCount} selected)
              </label>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No subjects found matching your search</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCategories.map((category) => (
                  <div key={category}>
                    {isSSSStudent && (
                      <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        {category}
                      </h4>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subjectsByCategory[category].map((subject) => {
                        const isSelected = !!selectedSubjectsMap[subject.id]
                        return (
                          <label
                            key={subject.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 border-purple-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSubject(subject.id)}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {subject.name}
                              </p>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
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

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedCount === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Save Subjects ({selectedCount})
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
