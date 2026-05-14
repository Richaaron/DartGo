import { useState, useEffect, useMemo } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Save, MessageSquare } from 'lucide-react'
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
      remarks = 'Excellent performance.'
    } else if (grade === 'B') {
      remarks = 'Very good performance.'
    } else if (grade === 'C') {
      remarks = 'Good performance.'
    } else if (grade === 'D') {
      remarks = 'Fair performance.'
    } else if (grade === 'E') {
      remarks = 'Weak performance.'
    } else {
      remarks = 'Needs improvement.'
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
    if (formData.firstCA < 0 || formData.firstCA > 20) newErrors.firstCA = 'Max 20'
    if (formData.secondCA < 0 || formData.secondCA > 20) newErrors.secondCA = 'Max 20'
    if (formData.exam < 0 || formData.exam > 60) newErrors.exam = 'Max 60'
    if (!formData.recordedBy.trim()) newErrors.recordedBy = 'Required'

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
      <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Subject Result' : 'Add Subject Result'}
          </h2>
          <p className="text-sm text-indigo-100 mt-1">
            Fill in the details below to record student performance.
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
        {/* Selection */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
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
                className={`input ${errors.studentId ? 'border-rose-500' : ''}`}
                disabled={isEditing || (!!initialData && !!initialData.studentId)}
              >
                <option value="">Select Student...</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.class})
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="text-xs text-rose-500 mt-1">{errors.studentId}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Subject
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className={`input ${errors.subjectId ? 'border-rose-500' : ''}`}
                disabled={isEditing || (!!initialData && !!initialData.studentId)}
              >
                <option value="">Select Subject...</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.subjectId && <p className="text-xs text-rose-500 mt-1">{errors.subjectId}</p>}
            </div>
          </div>
        </section>

        {/* Scores */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Assessment Scores
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                1st CA (20)
              </label>
              <input
                type="number"
                name="firstCA"
                value={formData.firstCA}
                onChange={handleChange}
                className={`input ${errors.firstCA ? 'border-rose-500' : ''}`}
              />
              {errors.firstCA && <p className="text-xs text-rose-500 mt-1">{errors.firstCA}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                2nd CA (20)
              </label>
              <input
                type="number"
                name="secondCA"
                value={formData.secondCA}
                onChange={handleChange}
                className={`input ${errors.secondCA ? 'border-rose-500' : ''}`}
              />
              {errors.secondCA && <p className="text-xs text-rose-500 mt-1">{errors.secondCA}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Exam (60)
              </label>
              <input
                type="number"
                name="exam"
                value={formData.exam}
                onChange={handleChange}
                className={`input ${errors.exam ? 'border-rose-500' : ''}`}
              />
              {errors.exam && <p className="text-xs text-rose-500 mt-1">{errors.exam}</p>}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{preview.total}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Percentage</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{preview.percentage}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grade</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{preview.grade}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Points</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{preview.gradePoint}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-start gap-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Auto Remark</p>
                <p className="text-sm italic text-slate-700 dark:text-slate-300">"{preview.remarks}"</p>
              </div>
            </div>
          </div>
        </section>

        {/* Admin */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Administration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Recorded By
              </label>
              <input
                type="text"
                name="recordedBy"
                value={formData.recordedBy}
                onChange={handleChange}
                className={`input ${errors.recordedBy ? 'border-rose-500' : ''}`}
                placeholder="Teacher name"
              />
              {errors.recordedBy && <p className="text-xs text-rose-500 mt-1">{errors.recordedBy}</p>}
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
            className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Save size={18} />
            {isEditing ? 'Update Result' : 'Save Result'}
          </button>
        </div>
      </form>
    </div>
  )
}
