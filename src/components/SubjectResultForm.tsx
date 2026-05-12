import { useState, useEffect, useMemo } from 'react'
import { motion } from "framer-motion";
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
    <motion.div 
      className="relative overflow-hidden bg-folusho-slate-900/90 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-folusho-lg"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-10 bg-gradient-to-r from-folusho-sage-500 to-folusho-sage-700 text-white flex justify-between items-center relative z-10">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-white">
            {isEditing ? 'Sync' : 'Initialize'} <br /> <span className="text-white/70">Matrix Protocol</span>
          </h2>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.35em] mt-4">
            Institutional Result Management Context
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-4 hover:bg-white/10 rounded-2xl transition-all border border-white/20"
        >
          <X size={28} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12 relative z-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
        {/* Section I: Identity Selection */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-sage-500" />
            I. Target Identification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] px-2">
                Operational Student
              </label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className={`input-folusho w-full !py-5 ${errors.studentId ? 'border-folusho-coral-500/50' : ''}`}
                disabled={isEditing || (!!initialData && !!initialData.studentId)}
              >
                <option value="">Select identity...</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.registrationNumber}) - {student.class}
                  </option>
                ))}
              </select>
              {errors.studentId && (
                <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.studentId}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] px-2">
                Subject Logic Matrix
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className={`input-folusho w-full !py-5 ${errors.subjectId ? 'border-folusho-coral-500/50' : ''}`}
                disabled={isEditing || (!!initialData && !!initialData.studentId)}
              >
                <option value="">Select subject protocol...</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.subjectId}</p>
              )}
            </div>
          </div>
        </section>

        {/* Section II: Performance Vectors */}
        <section className="space-y-6 pt-6 border-t border-white/5">
          <h3 className="text-[10px] font-black text-folusho-yellow-600 uppercase tracking-[0.45em] px-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-yellow-500" />
            II. Performance Vectors
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] px-2">
                1st CA Vector (20)
              </label>
              <input
                type="number"
                name="firstCA"
                value={formData.firstCA}
                onChange={handleChange}
                className={`input-folusho w-full !py-5 ${errors.firstCA ? 'border-folusho-coral-500/50' : ''}`}
              />
              {errors.firstCA && (
                <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.firstCA}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] px-2">
                2nd CA Vector (20)
              </label>
              <input
                type="number"
                name="secondCA"
                value={formData.secondCA}
                onChange={handleChange}
                className={`input-folusho w-full !py-5 ${errors.secondCA ? 'border-folusho-coral-500/50' : ''}`}
              />
              {errors.secondCA && (
                <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.secondCA}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] px-2">
                Final Exam (60)
              </label>
              <input
                type="number"
                name="exam"
                value={formData.exam}
                onChange={handleChange}
                className={`input-folusho w-full !py-5 ${errors.exam ? 'border-folusho-coral-500/50' : ''}`}
              />
              {errors.exam && (
                <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.exam}</p>
              )}
            </div>
          </div>

          {/* Grading Intelligence Dashboard */}
          <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 shadow-inner">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">Total Aggregate</p>
                <p className="text-4xl font-black text-white leading-none tracking-tighter">{preview.total}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">Efficiency</p>
                <p className="text-4xl font-black text-folusho-sage-400 leading-none tracking-tighter">{preview.percentage}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">Classification</p>
                <p className="text-4xl font-black text-folusho-yellow-500 leading-none tracking-tighter">{preview.grade}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">Logic Points</p>
                <p className="text-4xl font-black text-folusho-coral-400 leading-none tracking-tighter">{preview.gradePoint}</p>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl bg-folusho-sage-500/10 flex items-center justify-center text-folusho-sage-400 border border-white/5">
                <MessageSquare size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] mb-2">Automated Intelligence Remark</p>
                <p className="text-sm font-bold text-folusho-cream-100 leading-relaxed italic">"{preview.remarks}"</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section III: Operational Sign-off */}
        <section className="space-y-6 pt-6 border-t border-white/5">
          <h3 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.45em] px-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-folusho-coral-500" />
            III. Operational Sign-off
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] px-2">
                Faculty Identity (Recorded By)
              </label>
              <input
                type="text"
                name="recordedBy"
                value={formData.recordedBy}
                onChange={handleChange}
                className={`input-folusho w-full !py-5 ${errors.recordedBy ? 'border-folusho-coral-500/50' : ''}`}
                placeholder="Teacher Identity..."
              />
              {errors.recordedBy && (
                <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.recordedBy}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.2em] px-2">
                Deployment Cycle (Academic Year)
              </label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="input-folusho w-full !py-5"
                placeholder="e.g. 2026"
              />
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex justify-end gap-8 pt-12 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-10 py-5 text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.35em] hover:text-folusho-sage-400 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-12 py-5 bg-folusho-sage-400 text-white rounded-full font-black text-[10px] uppercase tracking-[0.35em] shadow-folusho hover:bg-folusho-sage-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
          >
            <Save size={20} />
            {isEditing ? 'Synchronize Data' : 'Establish Record'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
