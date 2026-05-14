import { useState, useMemo } from 'react'
import { User, BookOpen, Save, AlertCircle, ArrowLeft, TrendingUp, RefreshCw } from 'lucide-react'
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
    const registeredIds = new Set(
      studentSubjects
        .filter(sa => sa.studentId === student.id)
        .map(sa => sa.subjectId)
    )

    const resultSubjectIds = new Set(
      existingResults
        .filter(r => r.studentId === student.id)
        .map(r => r.subjectId)
    )

    const allSubjectIds = new Set([...Array.from(registeredIds), ...Array.from(resultSubjectIds)])

    const filterSubjectsByClass = (allSubjects: Subject[], className: string, studentArm?: string): Subject[] => {
      const isSSSClass = className.toUpperCase().startsWith('SSS') || className.toUpperCase().startsWith('SS ');
      const isJSSClass = className.toUpperCase().startsWith('JSS');
      
      if (isSSSClass) {
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
      
      return allSubjects.filter(s => s.level === level)
    }

    const finalSubjectIds = allSubjectIds.size > 0 
      ? Array.from(allSubjectIds) 
      : filterSubjectsByClass(subjects, student.class, (student as any).arm).map(s => s.id)

    return finalSubjectIds.map(subjectId => {
      const subject = subjects.find(s => s.id === subjectId)
      const existingResult = existingResults.find(r => 
        r.studentId === student.id && 
        r.subjectId === subjectId &&
        r.term === selectedTerm &&
        r.academicYear === selectedYear
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
          term: selectedTerm,
          academicYear: selectedYear,
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
  }, [student.id, student.class, subjects, studentSubjects, existingResults, selectedTerm, selectedYear, user?.name, (student as any).arm])

  const [bulkData, setBulkData] = useState<StudentResultRow[]>([])

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
          const firstCA = field === 'firstCA' ? value : row.firstCA
          const secondCA = field === 'secondCA' ? value : row.secondCA
          const exam = field === 'exam' ? value : row.exam

          const totals = calculateTotals(subjectId, firstCA, secondCA, exam, field === 'remarks' ? value : row.remarks)

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
      setMessage({ type: 'error', text: 'No subjects found' })
      return
    }

    if (!validateScores()) {
      setMessage({ type: 'error', text: 'Fix errors before saving' })
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

      setMessage({ type: 'success', text: `Saved ${dirtyRows.length} result(s)` })
      setTimeout(() => {
        onResultsSaved()
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to save results' })
    } finally {
      setIsSaving(false)
    }
  }

  const dirtyCount = bulkData.filter(r => r.isDirty || r.isNew).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Students
        </button>
        <div className="flex gap-3">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="input py-1.5 px-3 text-xs w-32"
          >
            <option value="First">First Term</option>
            <option value="Second">Second Term</option>
            <option value="Third">Third Term</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="input py-1.5 px-3 text-xs w-32"
          >
            <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
            <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</option>
          </select>
        </div>
      </div>

      {/* Student Profile */}
      <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-sm flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
          <div className="flex gap-4 mt-1 text-sm text-indigo-100">
            <span className="flex items-center gap-1.5"><User size={14} /> {student.registrationNumber}</span>
            <span className="flex items-center gap-1.5"><BookOpen size={14} /> {student.class}</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50/50 text-slate-500">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-4 py-4 text-center">1st CA (20)</th>
                <th className="px-4 py-4 text-center">2nd CA (20)</th>
                <th className="px-4 py-4 text-center">Exam (60)</th>
                <th className="px-4 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bulkData.map((row) => {
                const subject = subjects.find(s => s.id === row.subjectId)
                const isTraitBased = subject?.topics?.assessment_type === 'TRAIT'

                return (
                  <tr key={row.subjectId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${row.isDirty ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{row.subjectName}</p>
                      <p className="text-xs text-slate-500">{row.subjectCode}</p>
                    </td>
                    {!isTraitBased ? (
                      <>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            value={row.firstCA}
                            onChange={(e) => handleScoreChange(row.subjectId, 'firstCA', parseFloat(e.target.value) || 0)}
                            className={`w-16 mx-auto block text-center border rounded-lg py-1 ${errors[`${row.subjectId}-ca1`] ? 'border-rose-500 text-rose-600' : 'border-slate-200'}`}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            value={row.secondCA}
                            onChange={(e) => handleScoreChange(row.subjectId, 'secondCA', parseFloat(e.target.value) || 0)}
                            className={`w-16 mx-auto block text-center border rounded-lg py-1 ${errors[`${row.subjectId}-ca2`] ? 'border-rose-500 text-rose-600' : 'border-slate-200'}`}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            value={row.exam}
                            onChange={(e) => handleScoreChange(row.subjectId, 'exam', parseFloat(e.target.value) || 0)}
                            className={`w-16 mx-auto block text-center border rounded-lg py-1 ${errors[`${row.subjectId}-exam`] ? 'border-rose-500 text-rose-600' : 'border-slate-200'}`}
                          />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <p className="font-bold text-slate-900 dark:text-white">{row.totalScore}</p>
                          <p className="text-[10px] text-slate-500">{row.percentage.toFixed(0)}%</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            ['A', 'B', 'C'].includes(row.grade) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                          }`}>
                            {row.grade}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={5} className="px-6 py-4">
                        <select
                          value={row.remarks || ''}
                          onChange={(e) => handleScoreChange(row.subjectId, 'remarks', e.target.value)}
                          className="w-full max-w-xs mx-auto block input py-1.5"
                        >
                          <option value="">Select Assessment...</option>
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
                  <td colSpan={6} className="px-10 py-12 text-center">
                    <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">No subjects found for this student.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveAll}
          disabled={isSaving || dirtyCount === 0}
          className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          Save {dirtyCount > 0 ? `(${dirtyCount})` : ''} Changes
        </button>
      </div>
    </div>
  )
}
