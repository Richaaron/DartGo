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
    if (!formData.recordedBy.trim()) newErrors.recordedBy = 'Teacher name is required'

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Result' : 'Enter New Result'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record student academic performance for the current term.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Selection */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Student & Subject
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Student
              </label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className={`input ${errors.studentId ? 'border-red-500' : ''}`}
              >
                <option value="">Select Student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.registrationNumber})
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Subject
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className={`input ${errors.subjectId ? 'border-red-500' : ''}`}
              >
                <option value="">Select Subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.subjectId && <p className="text-xs text-red-500 mt-1">{errors.subjectId}</p>}
            </div>
          </div>
        </section>

        {/* Scores */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Performance Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Assessment Type
              </label>
              <select
                name="assessmentType"
                value={formData.assessmentType}
                onChange={handleChange}
                className="input"
              >
                <option value="Test">Test</option>
                <option value="Exam">Exam</option>
                <option value="Assignment">Assignment</option>
                <option value="Project">Project</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Score
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                step="0.01"
                className={`input ${errors.score ? 'border-red-500' : ''}`}
              />
              {errors.score && <p className="text-xs text-red-500 mt-1">{errors.score}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Total Score
              </label>
              <input
                type="number"
                name="totalScore"
                value={formData.totalScore}
                onChange={handleChange}
                step="0.01"
                className={`input ${errors.totalScore ? 'border-red-500' : ''}`}
              />
              {errors.totalScore && <p className="text-xs text-red-500 mt-1">{errors.totalScore}</p>}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center md:text-left">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Percentage</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{preview.percentage}%</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Grade</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{preview.grade}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Ratio</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formData.score} / {formData.totalScore}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Administration */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Record Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Term
              </label>
              <select
                name="term"
                value={formData.term}
                onChange={handleChange}
                className="input"
              >
                <option value="First">First Term</option>
                <option value="Second">Second Term</option>
                <option value="Third">Third Term</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Academic Year
              </label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="input"
                placeholder="e.g. 2026"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Date
              </label>
              <input
                type="date"
                name="dateRecorded"
                value={formData.dateRecorded}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Recorded By
            </label>
            <input
              type="text"
              name="recordedBy"
              value={formData.recordedBy}
              onChange={handleChange}
              className={`input ${errors.recordedBy ? 'border-red-500' : ''}`}
              placeholder="Enter your name"
            />
            {errors.recordedBy && <p className="text-xs text-red-500 mt-1">{errors.recordedBy}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input resize-none"
              placeholder="Any additional comments..."
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            {isEditing ? 'Update Result' : 'Save Result'}
          </button>
        </div>
      </form>
    </div>
  )
}
