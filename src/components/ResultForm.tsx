import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X } from 'lucide-react'
import { Result, Student, Subject } from '../types'
import { calculateGrade, calculatePercentage } from '../utils/calculations'

interface ResultFormProps {
  onSubmit: (result: Result | Omit<Result, 'id'>) => void
  initialData?: Result
  onCancel: () => void
  isEditing?: boolean
  students: Student[]
  subjects: Subject[]
}

export default function ResultForm({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false,
  students,
  subjects,
}: ResultFormProps) {
  const [formData, setFormData] = useState<Omit<Result, 'id'> & { id?: string }>({
    studentId: '',
    subjectId: '',
    assessmentType: 'Test',
    score: 0,
    totalScore: 100,
    dateRecorded: new Date().toISOString().split('T')[0],
    term: 'First',
    academicYear: new Date().getFullYear().toString(),
    recordedBy: '',
    notes: '',
    ...(initialData && initialData),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const percentage = calculatePercentage(formData.score, formData.totalScore)
  const preview = {
    percentage: Math.round(percentage * 100) / 100,
    grade: calculateGrade(percentage),
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.studentId) newErrors.studentId = 'Student is required'
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required'
    if (formData.score < 0) newErrors.score = 'Score cannot be negative'
    if (formData.score > formData.totalScore)
      newErrors.score = 'Score cannot exceed total score'
    if (formData.totalScore <= 0) newErrors.totalScore = 'Total score must be positive'
    if (!formData.recordedBy.trim()) newErrors.recordedBy = 'Recorded by is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (
    e: ChangeEvent<any>
  ) => {
    const { name, value } = e.target
    const newValue = name === 'score' || name === 'totalScore' ? parseFloat(value) || 0 : value

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData as any)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Result' : 'Record New Result'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selection Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Selection</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className={`input-field ${errors.studentId ? 'border-red-500' : ''}`}
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.registrationNumber})
                  </option>
                ))}
              </select>
              {errors.studentId && (
                <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className={`input-field ${errors.subjectId ? 'border-red-500' : ''}`}
              >
                <option value="">Select a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="text-red-500 text-sm mt-1">{errors.subjectId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Details */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Assessment Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment Type
              </label>
              <select
                name="assessmentType"
                value={formData.assessmentType}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Test">Test</option>
                <option value="Exam">Exam</option>
                <option value="Assignment">Assignment</option>
                <option value="Project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score *
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                step="0.01"
                className={`input-field ${errors.score ? 'border-red-500' : ''}`}
              />
              {errors.score && (
                <p className="text-red-500 text-sm mt-1">{errors.score}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Score *
              </label>
              <input
                type="number"
                name="totalScore"
                value={formData.totalScore}
                onChange={handleChange}
                step="0.01"
                className={`input-field ${errors.totalScore ? 'border-red-500' : ''}`}
              />
              {errors.totalScore && (
                <p className="text-red-500 text-sm mt-1">{errors.totalScore}</p>
              )}
            </div>
          </div>

          {/* Score Preview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Percentage</p>
                <p className="text-2xl font-bold text-blue-600">{preview.percentage}%</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Grade</p>
                <p className="text-2xl font-bold text-blue-600">{preview.grade}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formData.score}/{formData.totalScore}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Period */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Academic Period</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term
              </label>
              <select
                name="term"
                value={formData.term}
                onChange={handleChange}
                className="input-field"
              >
                <option value="First">First Term</option>
                <option value="Second">Second Term</option>
                <option value="Third">Third Term</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                placeholder="e.g., 2024"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Recorded
              </label>
              <input
                type="date"
                name="dateRecorded"
                value={formData.dateRecorded}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recorded By *
            </label>
            <input
              type="text"
              name="recordedBy"
              value={formData.recordedBy}
              onChange={handleChange}
              placeholder="Teacher name"
              className={`input-field ${errors.recordedBy ? 'border-red-500' : ''}`}
            />
            {errors.recordedBy && (
              <p className="text-red-500 text-sm mt-1">{errors.recordedBy}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes (optional)"
              rows={3}
              className="input-field"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Result' : 'Record Result'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
