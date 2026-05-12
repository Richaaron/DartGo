import { useState } from 'react'
import { motion } from "framer-motion";
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
    <motion.div 
      className="folusho-card !p-0 border-white/5 bg-folusho-slate-900 shadow-2xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="relative z-10 p-12">
        <div className="flex justify-between items-start mb-12">
          <div>
            <motion.h2 
              className="text-4xl font-black uppercase tracking-tighter leading-none text-white mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {isEditing ? 'Sync' : 'Initialize'} <br /> <span className="text-folusho-sage-500">Result</span>
            </motion.h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.35em]">
              Academic Evaluation Protocol
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-4 hover:bg-white/5 rounded-3xl transition-all border border-white/5 text-folusho-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Section I: Identity Mapping */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-folusho-sage-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              I. Identity Mapping
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Target Student
                </label>
                <select
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className={`input-folusho w-full !bg-folusho-slate-950/50 ${errors.studentId ? 'border-folusho-coral-500' : ''}`}
                >
                  <option value="" className="bg-folusho-slate-900">Choose Student Identity...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id} className="bg-folusho-slate-900">
                      {student.firstName} {student.lastName} ({student.registrationNumber})
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.studentId}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Subject Matrix
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  className={`input-folusho w-full !bg-folusho-slate-950/50 ${errors.subjectId ? 'border-folusho-coral-500' : ''}`}
                >
                  <option value="" className="bg-folusho-slate-900">Select Subject Protocol...</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id} className="bg-folusho-slate-900">
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

          {/* Section II: Performance Metrics */}
          <section className="space-y-6 pt-10 border-t border-white/5">
            <h3 className="text-[10px] font-black text-folusho-coral-400 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-folusho-coral-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              II. Performance Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Evaluation Category
                </label>
                <select
                  name="assessmentType"
                  value={formData.assessmentType}
                  onChange={handleChange}
                  className="input-folusho w-full !bg-folusho-slate-950/50"
                >
                  <option value="Test" className="bg-folusho-slate-900">Standard Test</option>
                  <option value="Exam" className="bg-folusho-slate-900">Global Examination</option>
                  <option value="Assignment" className="bg-folusho-slate-900">Cognitive Assignment</option>
                  <option value="Project" className="bg-folusho-slate-900">Specialized Project</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Raw Score
                </label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  step="0.01"
                  className={`input-folusho w-full !bg-folusho-slate-950/50 ${errors.score ? 'border-folusho-coral-500' : ''}`}
                />
                {errors.score && (
                  <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.score}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Max Potential
                </label>
                <input
                  type="number"
                  name="totalScore"
                  value={formData.totalScore}
                  onChange={handleChange}
                  step="0.01"
                  className={`input-folusho w-full !bg-folusho-slate-950/50 ${errors.totalScore ? 'border-folusho-coral-500' : ''}`}
                />
                {errors.totalScore && (
                  <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.totalScore}</p>
                )}
              </div>
            </div>

            {/* Score Intelligence Preview */}
            <div className="p-10 rounded-[3rem] bg-folusho-slate-950/50 border border-white/5 shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">Efficiency</p>
                  <p className="text-3xl font-black text-white leading-none">{preview.percentage}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">Classification</p>
                  <p className="text-3xl font-black text-folusho-sage-400 leading-none">{preview.grade}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest">Fractional Value</p>
                  <p className="text-3xl font-black text-folusho-coral-400 leading-none">{formData.score} <span className="text-sm opacity-30 text-white">/ {formData.totalScore}</span></p>
                </div>
              </div>
            </div>
          </section>

          {/* Section III: Contextual Data */}
          <section className="space-y-6 pt-10 border-t border-white/5">
            <h3 className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-folusho-sage-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              III. Contextual Intelligence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Session Vector (Term)
                </label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  className="input-folusho w-full !bg-folusho-slate-950/50"
                >
                  <option value="First" className="bg-folusho-slate-900">First Vector</option>
                  <option value="Second" className="bg-folusho-slate-900">Second Vector</option>
                  <option value="Third" className="bg-folusho-slate-900">Third Vector</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Academic Cycle
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="input-folusho w-full !bg-folusho-slate-950/50"
                  placeholder="e.g. 2026"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Execution Date
                </label>
                <input
                  type="date"
                  name="dateRecorded"
                  value={formData.dateRecorded}
                  onChange={handleChange}
                  className="input-folusho w-full !bg-folusho-slate-950/50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                Institutional Sign-off
              </label>
              <input
                type="text"
                name="recordedBy"
                value={formData.recordedBy}
                onChange={handleChange}
                className={`input-folusho w-full !bg-folusho-slate-950/50 ${errors.recordedBy ? 'border-folusho-coral-500' : ''}`}
                placeholder="Teacher Identity..."
              />
              {errors.recordedBy && (
                <p className="text-folusho-coral-500 text-[10px] font-black uppercase tracking-widest px-2">{errors.recordedBy}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                Evaluation Memo (Notes)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-folusho w-full resize-none !bg-folusho-slate-950/50"
                placeholder="Enter specialized observations..."
              />
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-end gap-6 pt-12 border-t border-white/5">
            <button
              type="button"
              onClick={onCancel}
              className="px-10 py-5 text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.35em] hover:text-white transition-all"
            >
              Abort
            </button>
            <button
              type="submit"
              className="px-12 py-5 bg-folusho-sage-400 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.35em] shadow-folusho hover:bg-folusho-sage-500 hover:scale-105 active:scale-95 transition-all"
            >
              {isEditing ? 'Sync Matrix' : 'Commit Result'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
