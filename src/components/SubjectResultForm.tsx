import { useState, useEffect, useMemo } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Save, AlertCircle, TrendingUp, Award, MessageSquare } from 'lucide-react'
import { SubjectResult, Student, Subject, StudentSubject } from '../types'
import { calculateGrade, calculateGradePoint, calculatePercentage } from '../utils/calculations'
import { useAuthContext } from '../context/AuthContext'

interface SubjectResultFormProps {
  onSubmit: (result: SubjectResult | Omit<SubjectResult, 'id'>) => void
  initialData?: SubjectResult
  onCancel: () => void
  isEditing?: boolean
  students: Student[]
  subjects: Subject[]
  studentSubjects?: StudentSubject[]
}

export default function SubjectResultForm({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false,
  students,
  subjects,
  studentSubjects = [],
}: SubjectResultFormProps) {
  const { user } = useAuthContext()
  const [formData, setFormData] = useState<Omit<SubjectResult, 'id'> & { id?: string }>(() => {
    const data = {
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
      recordedBy: user?.name || '',
      ...(initialData && initialData),
    }

    // If it's a pending result, remove the dummy ID so it's treated as new
    if (data.id && data.id.startsWith('pending-')) {
      delete data.id
    }

    return data
  })

  // Filter students based on subject registration if a subject is selected
  const filteredStudents = useMemo(() => {
    if (isEditing || !formData.subjectId || studentSubjects.length === 0) return students

    const registeredStudentIds = new Set(
      studentSubjects
        .filter(ss => ss.subjectId === formData.subjectId)
        .map(ss => ss.studentId)
    )

    const filtered = students.filter(s => registeredStudentIds.has(s.id))
    return filtered.length > 0 ? filtered : students
  }, [students, studentSubjects, formData.subjectId, isEditing])

  // Filter subjects based on student registration if a student is selected
  const filteredSubjects = useMemo(() => {
    if (isEditing || !formData.studentId || studentSubjects.length === 0) return subjects

    const registeredSubjectIds = new Set(
      studentSubjects
        .filter(ss => ss.studentId === formData.studentId)
        .map(ss => ss.subjectId)
    )

    const filtered = subjects.filter(s => registeredSubjectIds.has(s.id))
    return filtered.length > 0 ? filtered : subjects
  }, [subjects, studentSubjects, formData.studentId, isEditing])

  // Update totals if initialData is provided with score data
  useEffect(() => {
    if (initialData && (initialData.firstCA !== undefined || initialData.secondCA !== undefined || initialData.exam !== undefined)) {
      const totals = calculateTotals(
        initialData.firstCA || 0, 
        initialData.secondCA || 0, 
        initialData.exam || 0
      )
      setFormData(prev => ({
        ...prev,
        ...totals
      }))
    }
  }, [initialData])

  const [errors, setErrors] = useState<Record<string, string>>({})

  function calculateTotals(firstCA: number, secondCA: number, exam: number) {
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

    return { totalScore: total, percentage, grade, gradePoint, remarks }
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
        totalScore: totals.totalScore,
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
    <div className="bg-white dark:bg-brand-900 rounded-3xl overflow-hidden border-4 border-dashed border-school-blue dark:border-indigo-500/40 shadow-2xl">
      <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {isEditing ? '✏️ Edit Result' : '📝 Enter Result'}
          </h2>
          <p className="text-xs font-medium opacity-90">Recording scores for automated grading</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/20 rounded-full transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
        {/* Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-school-blue dark:text-indigo-400 font-black uppercase tracking-widest text-sm">
            <Award size={18} />
            <span>Student & Subject Selection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Student *
              </label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className={`input-field ${errors.studentId ? 'border-red-500' : ''}`}
                disabled={isEditing || (!!initialData && !!initialData.studentId)}
              >
                <option value="">Select a student...</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.registrationNumber}) - {student.class}
                  </option>
                ))}
              </select>
              {errors.studentId && (
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.studentId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Subject *
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className={`input-field ${errors.subjectId ? 'border-red-500' : ''}`}
                disabled={isEditing || (!!initialData && !!initialData.studentId)}
              >
                <option value="">Select a subject...</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.subjectId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Scores Section */}
        <div className="space-y-4 pt-6 border-t-2 border-dashed border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-2 text-school-blue dark:text-indigo-400 font-black uppercase tracking-widest text-sm">
            <TrendingUp size={18} />
            <span>Academic Scores</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
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
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.firstCA}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
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
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.secondCA}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
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
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.exam}</p>
              )}
            </div>
          </div>
        </div>

        {/* Grading Preview */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 border-2 border-indigo-100 dark:border-indigo-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Score</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{preview.total}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Percentage</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{preview.percentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grade</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{preview.grade}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grade Point</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{preview.gradePoint}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800/50 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-indigo-500 mt-1 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Automated Remarks</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 italic">{preview.remarks}</p>
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t-2 border-dashed border-brand-100 dark:border-brand-800">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Recorded By *
            </label>
            <input
              type="text"
              name="recordedBy"
              value={formData.recordedBy}
              onChange={handleChange}
              placeholder="Your name..."
              className={`input-field ${errors.recordedBy ? 'border-red-500' : ''}`}
            />
            {errors.recordedBy && (
              <p className="text-red-500 text-xs mt-1 font-bold">{errors.recordedBy}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Academic Year
            </label>
            <input
              type="text"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              placeholder="e.g. 2024"
              className="input-field"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 btn-primary"
          >
            <Save size={20} />
            {isEditing ? 'Update Result' : 'Save Result'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-400 rounded-full font-black uppercase tracking-widest text-sm hover:bg-brand-200 dark:hover:bg-brand-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
