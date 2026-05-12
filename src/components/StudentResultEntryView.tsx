import { useState, useMemo, useCallback, memo } from 'react'
import { User, BookOpen, Save, AlertCircle, ArrowLeft, TrendingUp } from 'lucide-react'
import { SubjectResult, Student, Subject, StudentSubject } from '../types'
import { calculateGrade, calculateGradePoint, calculatePercentage } from '../utils/calculations'
import { useAuthContext } from '../context/AuthContext'
import { createResult, updateResult } from '../services/api'

interface StudentResultRow extends Partial<SubjectResult> {
  subjectId: string
  subjectName: string
  subjectCode: string
  firstCA: number
  secondCA: number
  exam: number
  totalScore: number
  percentage: number
  grade: string
  gradePoint: number
  remarks: string
  isNew: boolean
  isDirty: boolean
}

interface StudentResultEntryViewProps {
  student: Student
  subjects: Subject[]
  studentSubjects: StudentSubject[]
  existingResults: SubjectResult[]
  onBack: () => void
  onResultsSaved: () => void
}

export default function StudentResultEntryView({
  student,
  subjects,
  studentSubjects,
  existingResults,
  onBack,
  onResultsSaved,
}: StudentResultEntryViewProps) {
  const { user } = useAuthContext()
  const [selectedTerm, setSelectedTerm] = useState<string>('First')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter subjects registered for this student OR subjects that already have results
  const registeredSubjects = useMemo(() => {
    const isPrimary = student.class.toLowerCase().includes('primary') || student.class.toLowerCase().includes('nursery')
    const studentLevel = isPrimary ? 'Primary' : 'Secondary'

    // 1. Get subjects from registration table (Ignore term here, as subjects usually span all terms)
    const registeredIds = new Set(
      studentSubjects
        .filter(sa => sa.studentId === student.id)
        .map(sa => sa.subjectId)
    )

    // 2. Get subjects that already have results recorded for this student in ANY term
    const resultSubjectIds = new Set(
      existingResults
        .filter(r => r.studentId === student.id)
        .map(r => r.subjectId)
    )

    // Combine both sets of subject IDs
    const allSubjectIds = new Set([...Array.from(registeredIds), ...Array.from(resultSubjectIds)])

    // Helper to get exact subjects for the class
    const filterSubjectsByClass = (allSubjects: Subject[], className: string, studentArm?: string): Subject[] => {
      const isSSSClass = className.toUpperCase().startsWith('SSS') || className.toUpperCase().startsWith('SS ');
      const isJSSClass = className.toUpperCase().startsWith('JSS');
      
      if (isSSSClass) {
        // SSS students: show General subjects + their arm-specific subjects
        return allSubjects.filter(s =>
          (s.code?.startsWith('SSS-') || s.level === 'Secondary' && s.subjectCategory) && (
            s.subjectCategory === 'General' ||
            (studentArm && s.subjectCategory === studentArm)
          )
        )
      }
      if (isJSSClass) {
        return allSubjects.filter(s => 
          (s.code?.startsWith('JSS-') || (s.level === 'Secondary' && !s.subjectCategory))
        )
      }

      const level = className.startsWith('Primary') ? 'Primary' : 
                    className.startsWith('Nursery') ? 'Nursery' : 
                    className.startsWith('Pre-Nursery') ? 'Pre-Nursery' : 'Primary'
      
      return allSubjects.filter(s => {
        if (s.level !== level) return false;
        // Specific rule: Writing is only for P1-3
        if (s.name === 'Writing' && (className.includes('4') || className.includes('5') || className.includes('6'))) {
          return false;
        }
        return true;
      })
    }

    // If no specific subjects found via registration or results, 
    // show ALL appropriate subjects for the student's specific class
    const finalSubjectIds = allSubjectIds.size > 0 
      ? Array.from(allSubjectIds) 
      : filterSubjectsByClass(subjects, student.class, (student as any).arm).map(s => s.id)

    return finalSubjectIds.map(subjectId => {
      const subject = subjects.find(s => s.id === subjectId)
      const existingResult = existingResults.find(r => 
        r.studentId === student.id && 
        r.subjectId === subjectId &&
        r.term === selectedTerm &&
        (r.academicYear === selectedYear || selectedYear === 'All')
      )

      if (existingResult) {
        return {
          ...existingResult,
          subjectName: subject?.name || 'Unknown Subject',
          subjectCode: subject?.code || 'N/A',
          isNew: false,
          isDirty: false
        } as StudentResultRow
      } else {
        return {
          studentId: student.id,
          subjectId: subjectId,
          subjectName: subject?.name || 'Unknown Subject',
          subjectCode: subject?.code || 'N/A',
          term: selectedTerm === 'All' ? 'First' : selectedTerm,
          academicYear: selectedYear === 'All' ? new Date().getFullYear().toString() : selectedYear,
          firstCA: 0,
          secondCA: 0,
          exam: 0,
          totalScore: 0,
          percentage: 0,
          grade: 'N/A',
          gradePoint: 0,
          remarks: '',
          dateRecorded: new Date().toISOString().split('T')[0],
          recordedBy: user?.name || '',
          isNew: true,
          isDirty: false
        } as StudentResultRow
      }
    }).sort((a, b) => a.subjectName.localeCompare(b.subjectName))
  }, [student.id, subjects, studentSubjects, existingResults, selectedTerm, selectedYear, user?.name])

  const [bulkData, setBulkData] = useState<StudentResultRow[]>([])

  // Update internal state when registeredSubjects change
  useMemo(() => {
    setBulkData(registeredSubjects)
  }, [registeredSubjects])

  const TRAIT_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor']

  const calculateTotals = (subjectId: string, firstCA: number, secondCA: number, exam: number, trait?: string) => {
    const subject = subjects.find(s => s.id === subjectId)
    const isTraitBased = subject?.topics?.assessment_type === 'TRAIT'

    if (isTraitBased && trait) {
      return { 
        totalScore: 0, 
        percentage: 0, 
        grade: trait === 'Excellent' ? 'A' : trait === 'Good' ? 'B' : trait === 'Fair' ? 'C' : 'D',
        gradePoint: trait === 'Excellent' ? 4 : trait === 'Good' ? 3 : trait === 'Fair' ? 2 : 1,
        remarks: trait 
      }
    }

    const total = firstCA + secondCA + exam
    const percentage = calculatePercentage(total, 100)
    const grade = calculateGrade(percentage)
    const gradePoint = calculateGradePoint(percentage)
    
    let remarks = ''
    if (grade === 'A') remarks = 'Excellent'
    else if (grade === 'B') remarks = 'Very Good'
    else if (grade === 'C') remarks = 'Good'
    else if (grade === 'D') remarks = 'Fair'
    else if (grade === 'E') remarks = 'Weak Pass'
    else remarks = 'Failed'

    return { totalScore: total, percentage, grade, gradePoint, remarks }
  }

  const handleScoreChange = (subjectId: string, field: 'firstCA' | 'secondCA' | 'exam' | 'remarks', value: any) => {
    setBulkData(prev => {
      return prev.map(row => {
        if (row.subjectId === subjectId) {
          const subject = subjects.find(s => s.id === subjectId)
          const isTraitBased = subject?.topics?.assessment_type === 'TRAIT'

          if (isTraitBased && field === 'remarks') {
            const totals = calculateTotals(subjectId, 0, 0, 0, value)
            return {
              ...row,
              remarks: value,
              ...totals,
              isDirty: true,
            }
          }

          const firstCA = field === 'firstCA' ? value : row.firstCA
          const secondCA = field === 'secondCA' ? value : row.secondCA
          const exam = field === 'exam' ? value : row.exam

          const totals = calculateTotals(subjectId, firstCA, secondCA, exam)

          return {
            ...row,
            [field]: value,
            ...totals,
            isDirty: true,
          }
        }
        return row
      })
    })
  }

  const validateScores = (): boolean => {
    const newErrors: Record<string, string> = {}
    let hasError = false

    bulkData.forEach(row => {
      if (row.firstCA < 0 || row.firstCA > 20) {
        newErrors[`${row.subjectId}-ca1`] = 'Max 20'
        hasError = true
      }
      if (row.secondCA < 0 || row.secondCA > 20) {
        newErrors[`${row.subjectId}-ca2`] = 'Max 20'
        hasError = true
      }
      if (row.exam < 0 || row.exam > 60) {
        newErrors[`${row.subjectId}-exam`] = 'Max 60'
        hasError = true
      }
    })

    setErrors(newErrors)
    return !hasError
  }

  const handleSaveAll = async () => {
    if (bulkData.length === 0) {
      setMessage({ type: 'error', text: 'No subjects found for this student' })
      return
    }

    if (!validateScores()) {
      setMessage({ type: 'error', text: 'Please fix validation errors before saving' })
      return
    }

    const dirtyRows = bulkData.filter(row => row.isDirty || row.isNew)
    if (dirtyRows.length === 0) {
      setMessage({ type: 'info', text: 'No changes to save' })
      return
    }

    setIsSaving(true)
    try {
      for (const row of dirtyRows) {
        const cleanResult = {
          studentId: student.id,
          subjectId: row.subjectId,
          classId: student.class,
          term: selectedTerm,
          academicYear: selectedYear,
          firstCA: row.firstCA,
          secondCA: row.secondCA,
          exam: row.exam,
          totalScore: row.totalScore,
          percentage: row.percentage,
          grade: row.grade,
          gradePoint: row.gradePoint,
          remarks: row.remarks,
          dateRecorded: row.dateRecorded || new Date().toISOString().split('T')[0],
          recordedBy: user?.name || '',
        }

        if (row.id && !row.isNew) {
          await updateResult(row.id, cleanResult)
        } else {
          await createResult(cleanResult)
        }
      }

      setMessage({ 
        type: 'success', 
        text: `Successfully saved ${dirtyRows.length} result(s)` 
      })
      
      setTimeout(() => {
        onResultsSaved()
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (error: any) {
      console.error('Failed to save results:', error)
      setMessage({ type: 'error', text: `Failed to save results: ${error.message || 'Please try again.'}` })
    } finally {
      setIsSaving(false)
    }
  }

  const dirtyCount = bulkData.filter(r => r.isDirty || r.isNew).length

  return (
    <div className="space-y-12 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <motion.button
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="flex items-center gap-3 text-folusho-sage-400 font-black uppercase tracking-widest text-[10px] hover:text-folusho-sage-300 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Personnel Registry
        </motion.button>
        <div className="flex gap-4">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="input-folusho !py-2 !px-4 text-[10px] min-w-[140px]"
          >
            <option value="First">First Phase</option>
            <option value="Second">Second Phase</option>
            <option value="Third">Third Phase</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="input-folusho !py-2 !px-4 text-[10px] min-w-[120px]"
          >
            <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()} Cycle</option>
            <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1} Cycle</option>
          </select>
        </div>
      </div>

      {/* Student Profile Info */}
      <div className="folusho-card !p-10 bg-gradient-to-br from-folusho-sage-500 to-folusho-sage-700 text-white border-none shadow-folusho-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center text-4xl font-black border-2 border-white/30 shadow-2xl group-hover:scale-105 transition-transform">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{student.firstName} {student.lastName}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-80"><User size={14} className="opacity-60" /> {student.registrationNumber}</span>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-80"><BookOpen size={14} className="opacity-60" /> {student.class}</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      </div>

      {/* Message */}
      <AnimatePresence>
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-[2.5rem] flex items-center gap-4 border shadow-sm relative z-10 ${
              message.type === 'success' 
                ? 'bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20' 
                : 'bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20'
            }`}
          >
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Table */}
      <div className="folusho-card !p-0 overflow-hidden relative z-10 border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-10 py-6 text-left text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.3em]">Operational Unit</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.3em]">Phase I (20)</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.3em]">Phase II (20)</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.3em]">Logic (60)</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.3em]">Fulfillment</th>
                <th className="px-10 py-6 text-center text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.3em]">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bulkData.map((row) => {
                const subject = subjects.find(s => s.id === row.subjectId)
                const isTraitBased = subject?.topics?.assessment_type === 'TRAIT'

                return (
                  <tr key={row.subjectId} className={`group hover:bg-white/5 transition-all duration-300 ${row.isDirty ? 'bg-folusho-coral-500/5' : ''}`}>
                    <td className="px-10 py-6">
                      <p className="text-sm font-black text-white uppercase tracking-tighter group-hover:text-folusho-sage-400 transition-colors">{row.subjectName}</p>
                      <p className="text-[9px] text-folusho-slate-500 font-black uppercase tracking-[0.3em] mt-1.5">{row.subjectCode}</p>
                    </td>
                    {!isTraitBased ? (
                      <>
                        <td className="px-6 py-6">
                          <input
                            type="number"
                            value={row.firstCA}
                            onChange={(e) => handleScoreChange(row.subjectId, 'firstCA', parseFloat(e.target.value) || 0)}
                            className={`w-20 mx-auto block text-center font-black input-folusho !py-2 !px-0 ${errors[`${row.subjectId}-ca1`] ? '!border-folusho-coral-500' : ''}`}
                          />
                        </td>
                        <td className="px-6 py-6">
                          <input
                            type="number"
                            value={row.secondCA}
                            onChange={(e) => handleScoreChange(row.subjectId, 'secondCA', parseFloat(e.target.value) || 0)}
                            className={`w-20 mx-auto block text-center font-black input-folusho !py-2 !px-0 ${errors[`${row.subjectId}-ca2`] ? '!border-folusho-coral-500' : ''}`}
                          />
                        </td>
                        <td className="px-6 py-6">
                          <input
                            type="number"
                            value={row.exam}
                            onChange={(e) => handleScoreChange(row.subjectId, 'exam', parseFloat(e.target.value) || 0)}
                            className={`w-20 mx-auto block text-center font-black input-folusho !py-2 !px-0 ${errors[`${row.subjectId}-exam`] ? '!border-folusho-coral-500' : ''}`}
                          />
                        </td>
                        <td className="px-6 py-6 text-center">
                          <p className="text-lg font-black text-folusho-sage-400 leading-none">{row.totalScore}</p>
                          <p className="text-[10px] text-folusho-slate-500 font-black uppercase tracking-widest mt-1.5">{row.percentage.toFixed(0)}%</p>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                            ['A', 'B', 'C'].includes(row.grade) 
                              ? 'bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20' 
                              : 'bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20'
                          }`}>
                            {row.grade}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={5} className="px-10 py-6">
                        <select
                          value={row.remarks || ''}
                          onChange={(e) => handleScoreChange(row.subjectId, 'remarks', e.target.value)}
                          className="w-full max-w-xs mx-auto block input-folusho !py-3"
                        >
                          <option value="">Assess Trait Fulfillment...</option>
                          {TRAIT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                )
              })}
              {bulkData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-24 text-center">
                    <TrendingUp className="w-16 h-16 text-folusho-slate-700 mx-auto mb-6 opacity-30" />
                    <p className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.4em]">No Registered Logic Found for Current Cycle</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-6 relative z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-10 py-4 bg-folusho-slate-900/40 text-folusho-slate-500 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] border-2 border-white/5 hover:bg-white/5 transition-all shadow-2xl"
        >
          Abort
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveAll}
          disabled={isSaving || dirtyCount === 0}
          className="btn-vibrant !px-12 !py-4 shadow-folusho-lg"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span>Commit {dirtyCount > 0 ? `(${dirtyCount})` : ''}</span>
        </motion.button>
      </div>
    </div>
  )
}
