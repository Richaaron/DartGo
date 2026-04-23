import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X } from 'lucide-react'
import { SubjectResult, Student, Subject } from '../types'
import { calculateGrade, calculateGradePoint, calculatePercentage } from '../utils/calculations'

interface SubjectResultFormProps {
  onSubmit: (result: SubjectResult | Omit<SubjectResult, 'id'>) => void
  initialData?: SubjectResult
  onCancel: () => void
  isEditing?: boolean
  students: Student[]
  subjects: Subject[]
}

export default function SubjectResultForm({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false,
  students,
  subjects,
}: SubjectResultFormProps) {
  const [formData, setFormData] = useState<Omit<SubjectResult, 'id'> & { id?: string }>({
    studentId: '',
    subjectId: '',
    term: 'First',
    academicYear: new Date().getFullYear().toString(),
    firstCA: 0,
    secondCA: 0,
    exam: 0,
    totalScore: 0,
    percentage: 0,
    grade: '',
    gradePoint: 0,
    remarks: '',
    dateRecorded: new Date().toISOString().split('T')[0],
    recordedBy: '',
    ...(initialData && initialData),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const calculateTotals = (firstCA: number, secondCA: number, exam: number) => {
    const total = firstCA + secondCA + exam
    const percentage = calculatePercentage(total, 100)
    const grade = calculateGrade(percentage)
    const gradePoint = calculateGradePoint(percentage)
    
    let remarks = ''
    if (grade === 'A') {
      remarks = 'Excellent performance. Outstanding achievement in all areas.'
    } else if (grade === 'B') {
      remarks = 'Very good performance. Shows strong understanding of the subject.'
    } else if (grade === 'C') {
      remarks = 'Credit performance. Meeting expectations with room for improvement.'
    } else if (grade === 'D') {
      remarks = 'Fair performance. Needs more dedication and practice.'
    } else if (grade === 'E') {
      remarks = 'Weak pass. Significant improvement required.'
    } else {
      remarks = 'Failed. Required to retake the subject and seek extra help.'
    }

    return { total, percentage, grade, gradePoint, remarks }
  }

  const handleChange = (
    e: ChangeEvent<any>
  ) => {
    const { name, value } = e.target
    let newValue: string | number = value

    if (name === 'firstCA' || name === 'secondCA' || name === 'exam') {
      newValue = parseFloat(value) || 0
      const firstCA = name === 'firstCA' ? newValue : formData.firstCA
      const secondCA = name === 'secondCA' ? newValue : formData.secondCA
      const exam = name === 'exam' ? newValue : formData.exam
      
      const totals = calculateTotals(firstCA, secondCA, exam)
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        totalScore: totals.total,
        percentage: totals.percentage,
        grade: totals.grade,
        gradePoint: totals.gradePoint,
        remarks: totals.remarks,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }))
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.studentId) newErrors.studentId = 'Student is required'
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required'
    if (formData.firstCA < 0 || formData.firstCA > 20) newErrors.firstCA = '1st CA must be 0-20'
    if (formData.secondCA < 0 || formData.secondCA > 20) newErrors.secondCA = '2nd CA must be 0-20'
    if (formData.exam < 0 || formData.exam > 60) newErrors.exam = 'Exam must be 0-60'
    if (!formData.recordedBy.trim()) newErrors.recordedBy = 'Recorded by is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData as any)
    }
  }

  const preview = {
    total: formData.totalScore,
    percentage: Math.round(formData.percentage * 100) / 100,
    grade: formData.grade,
    gradePoint: formData.gradePoint,
    remarks: formData.remarks,
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Subject Result' : 'Enter Subject Results'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Scores</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1st CA (Max 20) *
              </label>
              <input
                type="number"
                name="firstCA"
                value={formData.firstCA}
                onChange={handleChange}
                min="0"
                max="20"
                step="0.01"
                className={`input-field ${errors.firstCA ? 'border-red-500' : ''}`}
              />
              {errors.firstCA && (
                <p className="text-red-500 text-sm mt-1">{errors.firstCA}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2nd CA (Max 20) *
              </label>
              <input
                type="number"
                name="secondCA"
                value={formData.secondCA}
                onChange={handleChange}
                min="0"
                max="20"
                step="0.01"
                className={`input-field ${errors.secondCA ? 'border-red-500' : ''}`}
              />
              {errors.secondCA && (
                <p className="text-red-500 text-sm mt-1">{errors.secondCA}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam (Max 60) *
              </label>
              <input
                type="number"
                name="exam"
                value={formData.exam}
                onChange={handleChange}
                min="0"
                max="60"
                step="0.01"
                className={`input-field ${errors.exam ? 'border-red-500' : ''}`}
              />
              {errors.exam && (
                <p className="text-red-500 text-sm mt-1">{errors.exam}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automated Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Score</p>
              <p className="text-2xl font-bold text-blue-600">{preview.total}/100</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Percentage</p>
              <p className="text-2xl font-bold text-blue-600">{preview.percentage}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Grade</p>
              <p className="text-2xl font-bold text-blue-600">{preview.grade}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Grade Point</p>
              <p className="text-2xl font-bold text-blue-600">{preview.gradePoint}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className={`text-2xl font-bold ${preview.grade === 'F' ? 'text-red-600' : 'text-green-600'}`}>
                {preview.grade === 'F' ? 'Fail' : 'Pass'}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-gray-600 text-sm">Teacher's Remarks</p>
            <p className="text-gray-900 font-medium">{preview.remarks}</p>
          </div>
        </div>

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

        <div className="space-y-4 border-t pt-4">
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
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Result' : 'Save Result'}
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
