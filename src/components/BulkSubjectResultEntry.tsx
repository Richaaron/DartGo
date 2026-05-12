import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
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

export default function BulkSubjectResultEntry({
  subjects,
  students,
  studentSubjects,
  existingResults,
  onResultsSaved,
  teacherSubjects,
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

      // Extra Guard: If teacher is 'Secondary', don't show 'Primary' or 'Nursery' subjects
      // even if names match (like 'Mathematics')
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

    // 1. If teacher is Secondary, show all JSS and SSS classes
    if (teacherLevel === 'Secondary') {
      ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'].forEach(c => classSet.add(c))
    } 
    // 2. If teacher is Primary, show all Primary classes
    else if (teacherLevel === 'Primary') {
      ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'].forEach(c => classSet.add(c))
    }
    // 3. If teacher is Nursery, show all Nursery classes
    else if (teacherLevel === 'Nursery') {
      ['Nursery 1', 'Nursery 2'].forEach(c => classSet.add(c))
    }
    // 4. Fallback: Add classes where the teacher is a Form Teacher (just in case they cross levels)
    teacherAssignedClasses.forEach(c => classSet.add(c))

    // If for some reason nothing is found but they are an Admin, show everything
    if (classSet.size === 0 && !isTeacher) {
      students.forEach(s => {
        if (s.class) classSet.add(s.class)
      })
    }

    return Array.from(classSet).sort((a, b) => {
      // Sort Secondary classes properly
      const getPriority = (c: string) => {
        if (c.startsWith('SSS')) return 40;
        if (c.startsWith('JSS')) return 30;
        if (c.startsWith('Primary')) return 20;
        if (c.startsWith('Nursery')) return 10;
        return 0;
      }
      const pA = getPriority(a);
      const pB = getPriority(b);
      
      // If one is an assigned form class, give it highest priority
      const isAssignedA = teacherAssignedClasses.includes(a);
      const isAssignedB = teacherAssignedClasses.includes(b);
      if (isAssignedA && !isAssignedB) return -1;
      if (!isAssignedA && isAssignedB) return 1;

      if (pA !== pB) return pB - pA;
      return a.localeCompare(b);
    })
  }, [students, isTeacher, teacher, studentSubjects, availableSubjects])

  // Build bulk entry data when subject and class are selected
  const loadBulkData = useCallback(() => {
    if (!selectedSubjectId || !selectedClass) {
      setBulkData([])
      return
    }

    const subject = subjects.find(s => s.id === selectedSubjectId)
    if (!subject) return

    // Get all students in the selected class who are assigned to this subject
    const studentAssignments = studentSubjects.filter(
      sa => sa.subjectId === selectedSubjectId && 
      (sa.term === selectedTerm || selectedTerm === 'All') &&
      (sa.academicYear === selectedYear || selectedYear === 'All')
    )

    const rows: BulkEntryRow[] = studentAssignments
      .map(assignment => {
        const student = students.find(s => s.id === assignment.studentId)
        if (!student || student.class !== selectedClass) return null

        // Filter by arm if class is SSS and arm is selected
        const isSSSClass = selectedClass.toUpperCase().startsWith('SSS') || selectedClass.toUpperCase().startsWith('SS')
        if (isSSSClass && selectedArm !== 'All' && student.arm !== selectedArm) return null

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
    setBulkData(rows)
  }, [selectedSubjectId, selectedClass, selectedArm, selectedTerm, selectedYear, subjects, students, studentSubjects, existingResults, user])

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

  const handleScoreChange = (studentId: string, field: 'firstCA' | 'secondCA' | 'exam' | 'remarks', value: any) => {
    setBulkData(prev => {
      return prev.map(row => {
        if (row.studentId === studentId) {
          if (isTraitBased && field === 'remarks') {
            const totals = calculateTotals(0, 0, 0, value)
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

  return (
    <div className="space-y-12 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-100/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-5">
        <div className="p-4 bg-folusho-sage-100/50 rounded-2xl text-folusho-sage-600 border border-folusho-sage-200 shadow-sm">
          <BookOpen size={24} />
        </div>
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter text-folusho-slate-900 leading-none">Bulk Entry <br /> <span className="text-folusho-sage-500">Matrix</span></h3>
          <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em] mt-1">Institutional Academic Ledger</p>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="folusho-card !p-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-3">
            <label htmlFor="bulk-subject-select" className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
              Subject Matrix *
            </label>
            <select
              id="bulk-subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="input-folusho"
              aria-label="Select a subject"
            >
              <option value="">Select Protocol...</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label htmlFor="bulk-class-select" className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
              Target Class *
            </label>
            <select
              id="bulk-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-folusho"
              aria-label="Select class"
            >
              <option value="">Select Cohort...</option>
              {availableClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label htmlFor="bulk-arm-select" className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
              Strategic Dept
            </label>
            <select
              id="bulk-arm-select"
              value={selectedArm}
              onChange={(e) => setSelectedArm(e.target.value)}
              disabled={!(selectedClass && (selectedClass.toUpperCase().startsWith('SSS') || selectedClass.toUpperCase().startsWith('SS')))}
              className="input-folusho disabled:opacity-40 disabled:bg-folusho-cream-50"
              aria-label="Select arm"
            >
              <option value="All">All Sectors</option>
              <option value="Science">Science Matrix</option>
              <option value="Art">Creative Arts</option>
              <option value="Commercial">Commercial Logistics</option>
            </select>
          </div>
          <div className="space-y-3">
            <label htmlFor="bulk-term-select" className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
              Academic Term
            </label>
            <select
              id="bulk-term-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input-folusho"
              aria-label="Select term"
            >
              <option value="First">First Vector</option>
              <option value="Second">Second Vector</option>
              <option value="Third">Third Vector</option>
            </select>
          </div>
          <div className="space-y-3">
            <label htmlFor="bulk-year-select" className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
              Session Cycle
            </label>
            <select
              id="bulk-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-folusho"
              aria-label="Select academic year"
            >
              <option value={new Date().getFullYear().toString()}>
                {new Date().getFullYear()} Cycle
              </option>
              <option value={(new Date().getFullYear() - 1).toString()}>
                {new Date().getFullYear() - 1} Cycle
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-[2rem] flex items-center gap-4 relative z-10 border ${
            message.type === 'success' 
              ? 'bg-folusho-sage-50 text-folusho-sage-700 border-folusho-sage-200' 
              : message.type === 'error'
              ? 'bg-folusho-coral-50 text-folusho-coral-700 border-folusho-coral-200'
              : 'bg-folusho-cream-50 text-folusho-slate-700 border-folusho-cream-200'
          }`}
        >
          <AlertCircle size={20} />
          <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
        </motion.div>
      )}

      {/* Bulk Entry Table */}
      {selectedSubjectId && selectedSubject && (
        <div className="folusho-card !p-0 overflow-hidden relative z-10">
          <div className="flex items-center justify-between p-10 bg-folusho-cream-50/50 border-b border-folusho-cream-100">
            <div className="flex items-center gap-4 text-folusho-slate-900">
              <Users size={20} className="text-folusho-sage-500" />
              <span className="text-sm font-black uppercase tracking-tighter">
                {bulkData.length} {bulkData.length === 1 ? 'Intel Unit' : 'Intel Units'} Identified
              </span>
            </div>
            {dirtyCount > 0 && (
              <span className="px-5 py-2 bg-folusho-coral-100/50 text-folusho-coral-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-folusho-coral-200 shadow-sm">
                {dirtyCount} Pending Synchronizations
              </span>
            )}
          </div>

          {bulkData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-folusho-cream-50/30">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                      Personnel ID
                    </th>
                    {!isTraitBased ? (
                      <>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                          1st CA (20)
                        </th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                          2nd CA (20)
                        </th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                          Exam (60)
                        </th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                          Total
                        </th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                          %
                        </th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                          Grade
                        </th>
                      </>
                    ) : (
                      <th className="px-8 py-5 text-left text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em]">
                        Trait Assessment Matrix
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-folusho-cream-100">
                  {bulkData.map((row) => (
                    <tr
                      key={row.studentId}
                      className={`group hover:bg-folusho-cream-50/50 transition-all duration-300 ${
                        row.isDirty ? 'bg-folusho-yellow-50/30' : ''
                      }`}
                    >
                      <td className="px-8 py-5">
                        <div>
                          <p className="text-sm font-black text-folusho-slate-900 leading-none group-hover:text-folusho-sage-600 transition-colors">{row.studentName}</p>
                          <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1.5">{row.registrationNumber}</p>
                        </div>
                      </td>
                      {!isTraitBased ? (
                        <>
                          <td className="px-6 py-5 text-center">
                            <input
                              type="number"
                              value={row.firstCA}
                              onChange={(e) => handleScoreChange(row.studentId, 'firstCA', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="20"
                              step="0.01"
                              className={`w-24 px-4 py-2 text-center font-black rounded-2xl border text-sm transition-all focus:ring-4 ${
                                errors[`${row.studentId}-ca1`]
                                  ? 'border-folusho-coral-300 bg-folusho-coral-50 text-folusho-coral-700'
                                  : 'border-folusho-cream-200 bg-white focus:border-folusho-sage-400 focus:ring-folusho-sage-100'
                              }`}
                            />
                          </td>
                          <td className="px-6 py-5 text-center">
                            <input
                              type="number"
                              value={row.secondCA}
                              onChange={(e) => handleScoreChange(row.studentId, 'secondCA', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="20"
                              step="0.01"
                              className={`w-24 px-4 py-2 text-center font-black rounded-2xl border text-sm transition-all focus:ring-4 ${
                                errors[`${row.studentId}-ca2`]
                                  ? 'border-folusho-coral-300 bg-folusho-coral-50 text-folusho-coral-700'
                                  : 'border-folusho-cream-200 bg-white focus:border-folusho-sage-400 focus:ring-folusho-sage-100'
                              }`}
                            />
                          </td>
                          <td className="px-6 py-5 text-center">
                            <input
                              type="number"
                              value={row.exam}
                              onChange={(e) => handleScoreChange(row.studentId, 'exam', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="60"
                              step="0.01"
                              className={`w-24 px-4 py-2 text-center font-black rounded-2xl border text-sm transition-all focus:ring-4 ${
                                errors[`${row.studentId}-exam`]
                                  ? 'border-folusho-coral-300 bg-folusho-coral-50 text-folusho-coral-700'
                                  : 'border-folusho-cream-200 bg-white focus:border-folusho-sage-400 focus:ring-folusho-sage-100'
                              }`}
                            />
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-sm font-black text-folusho-sage-600">{row.totalScore}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-xs font-black text-folusho-slate-400 uppercase tracking-widest">{row.percentage.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span
                              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                                ['A', 'B', 'C'].includes(row.grade)
                                  ? 'bg-folusho-sage-50 border-folusho-sage-100 text-folusho-sage-600'
                                  : ['D', 'E'].includes(row.grade)
                                  ? 'bg-folusho-yellow-50 border-folusho-yellow-100 text-folusho-yellow-700'
                                  : 'bg-folusho-coral-50 border-folusho-coral-100 text-folusho-coral-600'
                              }`}
                            >
                              {row.grade}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="px-8 py-5">
                          <select
                            value={row.remarks || ''}
                            onChange={(e) => handleScoreChange(row.studentId, 'remarks', e.target.value)}
                            className="w-full max-w-xs px-6 py-3 font-black rounded-2xl border border-folusho-cream-200 bg-white text-[10px] uppercase tracking-widest focus:ring-4 focus:ring-folusho-sage-100 focus:border-folusho-sage-400 outline-none transition-all"
                          >
                            <option value="">Choose Trait...</option>
                            {TRAIT_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt} Efficiency</option>
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
            <div className="text-center py-24 bg-folusho-cream-50/20">
              <div className="p-8 bg-folusho-cream-50 rounded-full w-fit mx-auto mb-8 border border-folusho-cream-100 shadow-inner">
                <Users className="w-12 h-12 text-folusho-slate-300" />
              </div>
              <p className="text-sm font-black text-folusho-slate-400 uppercase tracking-[0.4em]">No Personnel Identities Found</p>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {selectedSubjectId && bulkData.length > 0 && (
        <div className="flex gap-6 relative z-10">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || dirtyCount === 0}
            className="btn-vibrant disabled:opacity-40 disabled:scale-100 disabled:bg-folusho-slate-300 !px-12 !py-6"
          >
            <Save size={20} />
            Sync All Logic ({dirtyCount})
          </button>
        </div>
      )}
    </div>
  )
}
