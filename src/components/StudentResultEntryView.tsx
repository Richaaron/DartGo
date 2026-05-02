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

const StudentResultEntryView = memo(function StudentResultEntryView({
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

    // If no specific subjects found via registration or results, 
    // show ALL subjects for the student's level (Primary/Secondary) as a fallback
    const finalSubjectIds = allSubjectIds.size > 0 
      ? Array.from(allSubjectIds) 
      : subjects
          .filter(s => s.level === studentLevel)
          .map(s => s.id)

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

  const calculateTotals = (firstCA: number, secondCA: number, exam: number) => {
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

  const handleScoreChange = (subjectId: string, field: 'firstCA' | 'secondCA' | 'exam', value: number) => {
    setBulkData(prev => {
      return prev.map(row => {
        if (row.subjectId === subjectId) {
          const firstCA = field === 'firstCA' ? value : row.firstCA
          const secondCA = field === 'secondCA' ? value : row.secondCA
          const exam = field === 'exam' ? value : row.exam

          const totals = calculateTotals(firstCA, secondCA, exam)

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
        >
          <ArrowLeft size={20} />
          Back to Student List
        </button>
        <div className="flex gap-4">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="input-field py-1 text-sm"
          >
            <option value="First">First Term</option>
            <option value="Second">Second Term</option>
            <option value="Third">Third Term</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="input-field py-1 text-sm"
          >
            <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
            <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</option>
          </select>
        </div>
      </div>

      {/* Student Profile Info */}
      <div className="card-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black border-2 border-white/30 shadow-xl">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">{student.firstName} {student.lastName}</h2>
            <div className="flex gap-4 mt-2 opacity-90 font-bold text-sm">
              <span className="flex items-center gap-1"><User size={16} /> {student.registrationNumber}</span>
              <span className="flex items-center gap-1"><BookOpen size={16} /> {student.class}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle size={20} />
          <p className="font-bold">{message.text}</p>
        </div>
      )}

      {/* Results Table */}
      <div className="card-lg overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-brand-800/50 border-b border-slate-200 dark:border-indigo-500/30">
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest">Subject</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest">1st CA (20)</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest">2nd CA (20)</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest">Exam (60)</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bulkData.map((row) => (
                <tr key={row.subjectId} className={`hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors ${row.isDirty ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{row.subjectName}</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{row.subjectCode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={row.firstCA}
                      onChange={(e) => handleScoreChange(row.subjectId, 'firstCA', parseFloat(e.target.value) || 0)}
                      className={`w-20 mx-auto block text-center font-bold input-field py-1 ${errors[`${row.subjectId}-ca1`] ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={row.secondCA}
                      onChange={(e) => handleScoreChange(row.subjectId, 'secondCA', parseFloat(e.target.value) || 0)}
                      className={`w-20 mx-auto block text-center font-bold input-field py-1 ${errors[`${row.subjectId}-ca2`] ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={row.exam}
                      onChange={(e) => handleScoreChange(row.subjectId, 'exam', parseFloat(e.target.value) || 0)}
                      className={`w-20 mx-auto block text-center font-bold input-field py-1 ${errors[`${row.subjectId}-exam`] ? 'border-red-500' : ''}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{row.totalScore}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{row.percentage.toFixed(1)}%</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border-2 ${
                      ['A', 'B', 'C'].includes(row.grade) 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' 
                        : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800'
                    }`}>
                      {row.grade}
                    </span>
                  </td>
                </tr>
              ))}
              {bulkData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">No registered subjects found for this student in the selected term.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 sticky bottom-8">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-white dark:bg-brand-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest text-sm border-2 border-slate-200 dark:border-brand-700 hover:bg-slate-50 transition-all shadow-xl"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveAll}
          disabled={isSaving || dirtyCount === 0}
          className="flex items-center gap-2 px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-600/20"
        >
          <Save size={20} />
          {isSaving ? 'Saving...' : `Save Changes (${dirtyCount})`}
        </button>
      </div>
    </div>
  )
})

export default StudentResultEntryView
