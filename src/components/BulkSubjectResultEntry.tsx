import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Save, AlertCircle, BookOpen, Users, RefreshCw } from 'lucide-react'
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

export default function BulkSubjectResultEntry({
  subjects,
  students,
  studentSubjects,
  existingResults,
  onResultsSaved,
}: BulkSubjectResultEntryProps) {
  const { user } = useAuthContext()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedArm, setSelectedArm] = useState<string>('All')
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
    
    const teacherSubjectNames = new Set<string>()
    if (teacher.subject) teacherSubjectNames.add(teacher.subject)
    if (teacher.assignedSubjects) {
      teacher.assignedSubjects.forEach(s => teacherSubjectNames.add(s))
    }

    return subjects.filter(s => {
      const isAssigned = teacherSubjectNames.has(s.name) || teacherSubjectNames.has(s.id);
      if (!isAssigned) return false;

      if (teacher.level === 'Secondary') {
        return s.code?.startsWith('JSS-') || s.code?.startsWith('SSS-') || s.level === 'Secondary';
      }
      if (teacher.level === 'Primary') {
        return s.level === 'Primary';
      }
      return true;
    })
  }, [subjects, isTeacher, teacher])

  // Get only classes relevant to the teacher's scope
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>()
    const teacherAssignedClasses = teacher?.assignedClasses || []
    const teacherLevel = teacher?.level || 'Secondary'

    if (teacherLevel === 'Secondary') {
      ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'].forEach(c => classSet.add(c))
    } else if (teacherLevel === 'Primary') {
      ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'].forEach(c => classSet.add(c))
    } else if (teacherLevel === 'Nursery') {
      ['Nursery 1', 'Nursery 2'].forEach(c => classSet.add(c))
    }
    
    teacherAssignedClasses.forEach(c => classSet.add(c))

    if (classSet.size === 0 && !isTeacher) {
      students.forEach(s => {
        if (s.class) classSet.add(s.class)
      })
    }

    return Array.from(classSet).sort((a, b) => {
      const getPriority = (c: string) => {
        if (c.startsWith('SSS')) return 40;
        if (c.startsWith('JSS')) return 30;
        if (c.startsWith('Primary')) return 20;
        if (c.startsWith('Nursery')) return 10;
        return 0;
      }
      const pA = getPriority(a);
      const pB = getPriority(b);
      
      const isAssignedA = teacherAssignedClasses.includes(a);
      const isAssignedB = teacherAssignedClasses.includes(b);
      if (isAssignedA && !isAssignedB) return -1;
      if (!isAssignedA && isAssignedB) return 1;

      if (pA !== pB) return pB - pA;
      return a.localeCompare(b);
    })
  }, [students, isTeacher, teacher])

  const loadBulkData = useCallback(() => {
    if (!selectedSubjectId || !selectedClass) {
      setBulkData([])
      return
    }

    const studentAssignments = studentSubjects.filter(
      sa => sa.subjectId === selectedSubjectId && 
      (sa.term === selectedTerm || selectedTerm === 'All') &&
      (sa.academicYear === selectedYear || selectedYear === 'All')
    )

    const rows: BulkEntryRow[] = studentAssignments
      .map(assignment => {
        const student = students.find(s => s.id === assignment.studentId)
        if (!student || student.class !== selectedClass) return null

        const isSSSClass = selectedClass.toUpperCase().startsWith('SSS') || selectedClass.toUpperCase().startsWith('SS')
        if (isSSSClass && selectedArm !== 'All' && student.arm !== selectedArm) return null

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

    setBulkData(rows)
  }, [selectedSubjectId, selectedClass, selectedArm, selectedTerm, selectedYear, students, studentSubjects, existingResults, user])

  useEffect(() => {
    loadBulkData()
  }, [loadBulkData])

  const isTraitBased = useMemo(() => {
    return selectedSubject?.topics?.assessment_type === 'TRAIT'
  }, [selectedSubject])

  const TRAIT_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor']

  const calculateTotals = (firstCA: number, secondCA: number, exam: number, trait?: string) => {
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

  const handleScoreChange = (studentId: string, field: 'firstCA' | 'secondCA' | 'exam' | 'remarks', value: any) => {
    setBulkData(prev => {
      return prev.map(row => {
        if (row.studentId === studentId) {
          if (isTraitBased && field === 'remarks') {
            const totals = calculateTotals(0, 0, 0, value)
            return { ...row, remarks: value, ...totals, isDirty: true }
          }

          const firstCA = field === 'firstCA' ? value : row.firstCA
          const secondCA = field === 'secondCA' ? value : row.secondCA
          const exam = field === 'exam' ? value : row.exam

          const totals = calculateTotals(firstCA, secondCA, exam)

          return { ...row, [field]: value, ...totals, isDirty: true }
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
      setMessage({ type: 'error', text: 'Select a subject first' })
      return
    }

    if (bulkData.length === 0) {
      setMessage({ type: 'error', text: 'No students to save' })
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

      setMessage({ type: 'success', text: `Saved ${dirtyRows.length} results` })
      setBulkData(prev => prev.map(row => ({ ...row, isDirty: false, isNew: false })))
      
      setTimeout(() => {
        onResultsSaved()
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (error) {
      console.error('Save failed:', error)
      setMessage({ type: 'error', text: 'Failed to save. Try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const dirtyCount = useMemo(() => bulkData.filter(r => r.isDirty || r.isNew).length, [bulkData])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <BookOpen size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Result Entry</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter multiple student results at once for a specific subject.</p>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="input"
            >
              <option value="">Select Subject...</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">Select Class...</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Department/Arm</label>
            <select
              value={selectedArm}
              onChange={(e) => setSelectedArm(e.target.value)}
              disabled={!(selectedClass && (selectedClass.toUpperCase().startsWith('SSS') || selectedClass.toUpperCase().startsWith('SS')))}
              className="input"
            >
              <option value="All">All Arms</option>
              <option value="Science">Science</option>
              <option value="Art">Art</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input"
            >
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input"
            >
              <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
              <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
          message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
          'bg-slate-50 text-slate-700 border-slate-200'
        }`}>
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Table */}
      {selectedSubjectId && selectedSubject && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Users size={18} className="text-indigo-500" />
              <span className="text-sm font-semibold">{bulkData.length} Students Found</span>
            </div>
            {dirtyCount > 0 && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                {dirtyCount} Unsaved Changes
              </span>
            )}
          </div>

          {bulkData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-50/50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    {!isTraitBased ? (
                      <>
                        <th className="px-4 py-4 text-center">1st CA (20)</th>
                        <th className="px-4 py-4 text-center">2nd CA (20)</th>
                        <th className="px-4 py-4 text-center">Exam (60)</th>
                        <th className="px-4 py-4 text-center">Total</th>
                        <th className="px-4 py-4 text-center">Grade</th>
                      </>
                    ) : (
                      <th className="px-6 py-4">Trait Assessment</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bulkData.map((row) => (
                    <tr key={row.studentId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${row.isDirty ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{row.studentName}</p>
                        <p className="text-xs text-slate-500">{row.registrationNumber}</p>
                      </td>
                      {!isTraitBased ? (
                        <>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="number"
                              value={row.firstCA}
                              onChange={(e) => handleScoreChange(row.studentId, 'firstCA', parseFloat(e.target.value) || 0)}
                              className={`w-16 px-2 py-1 text-center border rounded-lg ${errors[`${row.studentId}-ca1`] ? 'border-rose-500 text-rose-600' : 'border-slate-200'}`}
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="number"
                              value={row.secondCA}
                              onChange={(e) => handleScoreChange(row.studentId, 'secondCA', parseFloat(e.target.value) || 0)}
                              className={`w-16 px-2 py-1 text-center border rounded-lg ${errors[`${row.studentId}-ca2`] ? 'border-rose-500 text-rose-600' : 'border-slate-200'}`}
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="number"
                              value={row.exam}
                              onChange={(e) => handleScoreChange(row.studentId, 'exam', parseFloat(e.target.value) || 0)}
                              className={`w-16 px-2 py-1 text-center border rounded-lg ${errors[`${row.studentId}-exam`] ? 'border-rose-500 text-rose-600' : 'border-slate-200'}`}
                            />
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-slate-900 dark:text-white">{row.totalScore}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              ['A', 'B', 'C'].includes(row.grade) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                              ['D', 'E'].includes(row.grade) ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                              'bg-rose-50 border-rose-100 text-rose-600'
                            }`}>
                              {row.grade}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-4">
                          <select
                            value={row.remarks || ''}
                            onChange={(e) => handleScoreChange(row.studentId, 'remarks', e.target.value)}
                            className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="">Select Trait...</option>
                            {TRAIT_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No students found for selection.</p>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {selectedSubjectId && bulkData.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || dirtyCount === 0}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm"
          >
            {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
            Save {dirtyCount} Changes
          </button>
        </div>
      )}
    </div>
  )
}
