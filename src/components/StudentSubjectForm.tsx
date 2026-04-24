import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
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
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString())
  const [term, setTerm] = useState<string>('First')
  const [notes, setNotes] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter subjects by student level and only for SSS classes
  const isSSSStudent = ['SSS 1', 'SSS 2', 'SSS 3'].includes(student.class)
  const availableSubjects = subjects.filter(s => s.level === student.level && s.subjectCategory)

  // Initialize selected subjects from current assignments
  useEffect(() => {
    const currentSubjectIds = currentSubjects.map(cs => cs.subjectId)
    setSelectedSubjects(currentSubjectIds)
  }, [currentSubjects])

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (selectedSubjects.length === 0) {
      newErrors.subjects = 'At least one subject must be selected'
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

  // Sort categories in order: Science, Art, Commercial
  const categoryOrder = ['Science', 'Art', 'Commercial']
  const subjectsByCategory = availableSubjects.reduce((acc, subject) => {
    const category = subject.subjectCategory || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(subject)
    return acc
  }, {} as Record<string, Subject[]>)

  // Sort by category order
  const sortedCategories = Object.keys(subjectsByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  return (
    <div className="p-6 bg-white">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assign Subjects</h2>
          <p className="text-sm text-gray-600 mt-1">
            {student.firstName} {student.lastName} ({student.registrationNumber})
          </p>
          <p className="text-xs text-gray-500">{student.level} - {student.class}</p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academic Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year *
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g., 2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term *
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Subjects by Category */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Choose Stream - {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
            </h3>
            <p className="text-xs text-gray-600 mb-2">SSS students must select subjects from one of the three streams</p>
            {errors.subjects && (
              <p className="text-red-500 text-sm mt-1">{errors.subjects}</p>
            )}
          </div>

          {sortedCategories.map((category) => {
            const categorySubjects = subjectsByCategory[category]
            return (
              <div key={category} className="border-2 border-blue-300 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold">
                    {category} Stream
                  </span>
                  <span className="text-gray-600 font-medium">({categorySubjects.length} subjects)</span>
                </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categorySubjects.map(subject => (
                  <label
                    key={subject.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-blue-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{subject.name}</p>
                      <p className="text-xs text-gray-500">{subject.code}</p>
                      {subject.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{subject.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Summary */}
        {selectedSubjects.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Selected Subjects ({selectedSubjects.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map(subjectId => {
                const subject = availableSubjects.find(s => s.id === subjectId)
                return subject ? (
                  <span key={subjectId} className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                    {subject.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <Plus size={18} />
              Assign Subjects
            </span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
