import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Plus, Save, AlertCircle, BookOpen, Users, TrendingUp, Download, X } from 'lucide-react'
import { SubjectResult, Student, Subject, StudentSubject, Teacher } from '../types'
import { calculateGrade, calculateGradePoint, calculatePercentage } from '../utils/calculations'
import { useAuthContext } from '../context/AuthContext'
import { createResult, updateResult } from '../services/api'

interface BulkEntryRow extends Partial<SubjectResult> {
  studentId: string
  studentName: string
  registrationNumber: string
  class: string
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

interface BulkSubjectResultEntryProps {
  subjects: Subject[]
  students: Student[]
  studentSubjects: StudentSubject[]
  existingResults: SubjectResult[]
  onResultsSaved: () => void
  teacherSubjects?: Subject[]
}

const BulkSubjectResultEntry = memo(function BulkSubjectResultEntry({
  subjects,
  students,
  studentSubjects,
  existingResults,
  onResultsSaved,
  teacherSubjects,
}: BulkSubjectResultEntryProps) {
  const { user } = useAuthContext()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('First')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [bulkData, setBulkData] = useState<BulkEntryRow[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const userRole = user?.role || 'Teacher'
  const isTeacher = userRole === 'Teacher'
  const teacher = isTeacher ? (user as Teacher) : null

  // Get teacher's subjects if available
  const availableSubjects = useMemo(() => {
    if (!isTeacher || !teacher) return subjects
    
    const assignedNames = new Set<string>()
    if (teacher.subject) assignedNames.add(teacher.subject)
    if (teacher.assignedSubjects) {
      teacher.assignedSubjects.forEach(s => assignedNames.add(s))
    }

    return subjects.filter(s => assignedNames.has(s.name) || assignedNames.has(s.id))
  }, [subjects, isTeacher, teacher])

  // Get all unique classes from students
  const availableClasses = useMemo(() => {
    // If a subject is selected, only show classes that have students registered for it
    if (selectedSubjectId) {
      const classSet = new Set<string>()
      studentSubjects
        .filter(sa => sa.subjectId === selectedSubjectId)
        .forEach(sa => {
          const student = students.find(s => s.id === sa.studentId)
          if (student && student.class) classSet.add(student.class)
        })
      return Array.from(classSet).sort()
    }

    const classSet = new Set<string>()
    students.forEach(s => {
      if (s.class) classSet.add(s.class)
    })
    return Array.from(classSet).sort()
  }, [students, selectedSubjectId, studentSubjects])

  // Build bulk entry data when subject and class are selected
  const loadBulkData = useCallback(() => {
    if (!selectedSubjectId) {
      setBulkData([])
      return
    }

    const subject = subjects.find(s => s.id === selectedSubjectId)
    if (!subject) return

    // Get all students assigned to this subject
    const studentAssignments = studentSubjects.filter(
      sa => sa.subjectId === selectedSubjectId && 
      (sa.term === selectedTerm || selectedTerm === 'All') &&
      (sa.academicYear === selectedYear || selectedYear === 'All')
    )

    const rows: BulkEntryRow[] = studentAssignments
      .map(assignment => {
        const student = students.find(s => s.id === assignment.studentId)
        if (!student) return null
        
        // Filter by class if selected
        if (selectedClass && selectedClass !== 'All' && student.class !== selectedClass) {
          return null
        }

      // Find existing result for this student, subject, term, year
      const existingResult = existingResults.find(r =>
        r.studentId === assignment.studentId &&
        r.subjectId === selectedSubjectId &&
        r.term === assignment.term &&
        r.academicYear === assignment.academicYear
      )

      if (existingResult) {
        return {
          id: existingResult.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          registrationNumber: student.registrationNumber,
          class: student.class,
          firstCA: existingResult.firstCA,
          secondCA: existingResult.secondCA,
          exam: existingResult.exam,
          totalScore: existingResult.totalScore,
          percentage: existingResult.percentage,
          grade: existingResult.grade,
          gradePoint: existingResult.gradePoint,
          remarks: existingResult.remarks,
          subjectId: selectedSubjectId,
          term: selectedTerm,
          academicYear: selectedYear,
          dateRecorded: existingResult.dateRecorded,
          recordedBy: existingResult.recordedBy,
          isNew: false,
          isDirty: false,
        }
      } else {
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          registrationNumber: student.registrationNumber,
          class: student.class,
          firstCA: 0,
          secondCA: 0,
          exam: 0,
          totalScore: 0,
          percentage: 0,
          grade: 'N/A',
          gradePoint: 0,
          remarks: '',
          subjectId: selectedSubjectId,
          term: selectedTerm,
          academicYear: selectedYear,
          dateRecorded: new Date().toISOString().split('T')[0],
          recordedBy: user?.name || '',
          isNew: true,
          isDirty: false,
        }
      }
    }).filter((row): row is BulkEntryRow => row !== null)

    // Sort by student name
    rows.sort((a, b) => a.studentName.localeCompare(b.studentName))
    setBulkData(rows)
  }, [selectedSubjectId, selectedClass, selectedTerm, selectedYear, subjects, students, studentSubjects, existingResults, user?.name])

  useEffect(() => {
    loadBulkData()
  }, [loadBulkData])

  const calculateTotals = (firstCA: number, secondCA: number, exam: number) => {
    const total = firstCA + secondCA + exam
    const percentage = calculatePercentage(total, 100)
    const grade = calculateGrade(percentage)
    const gradePoint = calculateGradePoint(percentage)
    
    let remarks = ''
    if (grade === 'A') {
      remarks = 'Excellent'
    } else if (grade === 'B') {
      remarks = 'Very Good'
    } else if (grade === 'C') {
      remarks = 'Good'
    } else if (grade === 'D') {
      remarks = 'Fair'
    } else if (grade === 'E') {
      remarks = 'Weak Pass'
    } else {
      remarks = 'Failed'
    }

    return { totalScore: total, percentage, grade, gradePoint, remarks }
  }

  const handleScoreChange = (studentId: string, field: 'firstCA' | 'secondCA' | 'exam', value: number) => {
    setBulkData(prev => {
      return prev.map(row => {
        if (row.studentId === studentId) {
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
        newErrors[`${row.studentId}-ca1`] = 'Max 20'
        hasError = true
      }
      if (row.secondCA < 0 || row.secondCA > 20) {
        newErrors[`${row.studentId}-ca2`] = 'Max 20'
        hasError = true
      }
      if (row.exam < 0 || row.exam > 60) {
        newErrors[`${row.studentId}-exam`] = 'Max 60'
        hasError = true
      }
    })

    setErrors(newErrors)
    return !hasError
  }

  const handleSaveAll = async () => {
    if (!selectedSubjectId) {
      setMessage({ type: 'error', text: 'Please select a subject' })
      return
    }

    if (bulkData.length === 0) {
      setMessage({ type: 'error', text: 'No students found for this subject' })
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
        const resultData: Omit<SubjectResult, 'id'> = {
          studentId: row.studentId,
          subjectId: selectedSubjectId,
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
          await updateResult(row.id, resultData)
        } else {
          await createResult(resultData)
        }
      }

      setMessage({ 
        type: 'success', 
        text: `Successfully saved ${dirtyRows.length} result(s)` 
      })
      
      // Reset dirty flags
      setBulkData(prev => prev.map(row => ({ ...row, isDirty: false, isNew: false })))
      
      // Notify parent to reload data
      setTimeout(() => {
        onResultsSaved()
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (error) {
      console.error('Failed to save results:', error)
      setMessage({ type: 'error', text: 'Failed to save results. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const dirtyCount = useMemo(() => bulkData.filter(r => r.isDirty || r.isNew).length, [bulkData])
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 text-school-blue dark:text-indigo-400 font-black uppercase tracking-widest">
        <BookOpen size={20} />
        <h3 className="text-lg">Bulk Result Entry</h3>
      </div>

      {/* Selection Controls */}
      <div className="card-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="bulk-subject-select" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Subject *
            </label>
            <select
              id="bulk-subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="input-field"
              aria-label="Select a subject"
            >
              <option value="">Select a subject...</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bulk-class-select" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Class
            </label>
            <select
              id="bulk-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field"
              aria-label="Select class"
            >
              <option value="All">All Classes</option>
              {availableClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bulk-term-select" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Term
            </label>
            <select
              id="bulk-term-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input-field"
              aria-label="Select term"
            >
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
          <div>
            <label htmlFor="bulk-year-select" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Academic Year
            </label>
            <select
              id="bulk-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-field"
              aria-label="Select academic year"
            >
              <option value={new Date().getFullYear().toString()}>
                {new Date().getFullYear()}
              </option>
              <option value={(new Date().getFullYear() - 1).toString()}>
                {new Date().getFullYear() - 1}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
            : message.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
        }`}>
          <AlertCircle size={20} />
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Bulk Entry Table */}
      {selectedSubjectId && selectedSubject && (
        <div className="card-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Users size={18} />
              <span className="font-bold">
                {bulkData.length} {bulkData.length === 1 ? 'student' : 'students'} registered
              </span>
            </div>
            {dirtyCount > 0 && (
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-bold">
                {dirtyCount} unsaved changes
              </span>
            )}
          </div>

          {bulkData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-indigo-500/30 bg-gray-50 dark:bg-brand-800/50">
                    <th className="px-4 py-3 text-left text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      Reg. No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      Class
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      1st CA (20)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      2nd CA (20)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      Exam (60)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      %
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {bulkData.map((row) => (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors ${
                        row.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        <div>
                          <p>{row.studentName}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{row.registrationNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                        {row.registrationNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                        {row.class}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.firstCA}
                          onChange={(e) => handleScoreChange(row.studentId, 'firstCA', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="20"
                          step="0.01"
                          aria-label={`1st CA for ${row.studentName}`}
                          className={`w-20 px-2 py-1 text-center font-bold rounded border text-sm ${
                            errors[`${row.studentId}-ca1`]
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-700'
                          }`}
                        />
                        {errors[`${row.studentId}-ca1`] && (
                          <p className="text-red-500 text-xs mt-0.5">{errors[`${row.studentId}-ca1`]}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.secondCA}
                          onChange={(e) => handleScoreChange(row.studentId, 'secondCA', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="20"
                          step="0.01"
                          aria-label={`2nd CA for ${row.studentName}`}
                          className={`w-20 px-2 py-1 text-center font-bold rounded border text-sm ${
                            errors[`${row.studentId}-ca2`]
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-700'
                          }`}
                        />
                        {errors[`${row.studentId}-ca2`] && (
                          <p className="text-red-500 text-xs mt-0.5">{errors[`${row.studentId}-ca2`]}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.exam}
                          onChange={(e) => handleScoreChange(row.studentId, 'exam', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="60"
                          step="0.01"
                          aria-label={`Exam for ${row.studentName}`}
                          className={`w-20 px-2 py-1 text-center font-bold rounded border text-sm ${
                            errors[`${row.studentId}-exam`]
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-700'
                          }`}
                        />
                        {errors[`${row.studentId}-exam`] && (
                          <p className="text-red-500 text-xs mt-0.5">{errors[`${row.studentId}-exam`]}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {row.totalScore}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {row.percentage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center font-black">
                        <span
                          className={`px-2 py-1 rounded text-xs font-black ${
                            ['A', 'B', 'C'].includes(row.grade)
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : ['D', 'E'].includes(row.grade)
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {row.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No students registered for this subject yet</p>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {selectedSubjectId && bulkData.length > 0 && (
        <div className="flex gap-4">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || dirtyCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <Save size={20} />
            Save All Changes ({dirtyCount})
          </button>
        </div>
      )}
    </div>
  )
})

export default BulkSubjectResultEntry
