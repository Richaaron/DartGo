import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, AlertCircle, Filter, User, BookOpen, ClipboardList, ChevronLeft, ChevronRight, LayoutGrid, List, Loader2 } from 'lucide-react'
import { SubjectResult, Student, Subject, StudentSubject, Teacher } from '../types'
import SubjectResultForm from '../components/SubjectResultForm'
// Lazy load sub-components to prevent TDZ issues
const BulkSubjectResultEntry = React.lazy(() => import('../components/BulkSubjectResultEntry'))
const StudentResultEntryView = React.lazy(() => import('../components/StudentResultEntryView'))
import { createResult, updateResult, fetchStudentSubjects, fetchStudents, fetchResults, fetchSubjects, deleteResult } from '../services/api'
import { useAuthContext } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import { getPositionSuffix, getStudentClassPosition } from '../utils/calculations'
import PrintResult from '../components/PrintResult'
import { Printer, Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const PRIMARY_CLASSES = ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']
const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES]
const ITEMS_PER_PAGE = 25 // Paginate results to improve rendering performance

export default function SubjectResultEntry() {
  const { user } = useAuthContext()
  const [results, setResults] = useState<SubjectResult[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [allStudentSubjects, setAllStudentSubjects] = useState<StudentSubject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingResult, setEditingResult] = useState<SubjectResult | null>(null)
  const [selectedStudentForEntry, setSelectedStudentForEntry] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<'results' | 'students'>('students')
  const [selectedStudentResults, setSelectedStudentResults] = useState<string | null>(null)
  const [filterTerm, setFilterTerm] = useState('')
  const [debouncedFilterTerm, setDebouncedFilterTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [selectedArm, setSelectedArm] = useState<string>('All')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [apiError, setApiError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const userRole = user?.role || 'Teacher'
  const isTeacher = userRole === 'Teacher'
  const teacher = isTeacher ? (user as Teacher) : null

  // Debounce search input for performance
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current)
    }
    
    searchDebounceTimer.current = setTimeout(() => {
      setDebouncedFilterTerm(filterTerm)
      setCurrentPage(1) // Reset to first page when filter changes
    }, 300) // Wait 300ms after user stops typing

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current)
      }
    }
  }, [filterTerm])

  // Reset page when other filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedTerm, selectedClass, selectedSubject])

  // Simple data loading with timeout - optimized for performance
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setApiError(null)
    
    try {
      // For teachers, optimize by loading only relevant data
      // For admins, load all data
      const isTeacher = user?.role === 'Teacher'
      
      // Load core data
      let [subjectsData, resultsData, studentsData, studentSubjectsData] = await Promise.all([
        fetchSubjects().catch(() => []),
        fetchResults().catch(() => []),
        fetchStudents().catch(() => []),
        fetchStudentSubjects().catch(() => [])
      ])
      
      // If teacher, optimize by filtering results
      if (isTeacher && teacher) {
        const teacherSubjectNames = new Set<string>()
        if (teacher.subject) teacherSubjectNames.add(teacher.subject)
        if (teacher.assignedSubjects) {
          teacher.assignedSubjects.forEach(s => teacherSubjectNames.add(s))
        }
        
        // Filter to only teacher's subjects
        const teacherSubjectIds = new Set(
          (subjectsData || [])
            .filter(s => {
              if (teacherSubjectNames.has(s.name) || teacherSubjectNames.has(s.id)) return true;
              
              // Handle Subject Roles (e.g., "Mathematics (JSS)")
              const isJSS = s.code?.startsWith('JSS-') || (s.level === 'Secondary' && !s.subjectCategory);
              const isSSS = s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory);
              
              if (isJSS && teacherSubjectNames.has(`${s.name} (JSS)`)) return true;
              if (isSSS && teacherSubjectNames.has(`${s.name} (SSS)`)) return true;
              
              return false;
            })
            .map(s => s.id)
        )
        
        // Filter results to only teacher's subjects
        resultsData = (resultsData || []).filter(r => teacherSubjectIds.has(r.subjectId))
      }
      
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setResults(Array.isArray(resultsData) ? resultsData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setAllStudentSubjects(Array.isArray(studentSubjectsData) ? studentSubjectsData : [])
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load results data', error)
        setApiError('Failed to load data. Please try again.')
      }
      setStudents([])
      setResults([])
      setSubjects([])
      setAllStudentSubjects([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.role, teacher])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Helper function to filter subjects by class level (distinguishes JSS vs SSS)
  const filterSubjectsByClass = (subjects: Subject[], className: string): Subject[] => {
    if (className.startsWith('SSS')) {
      // For Senior Secondary classes, ONLY show Senior Secondary subjects
      return subjects.filter(s => s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory))
    } else if (className.startsWith('JSS')) {
      // For Junior Secondary classes, ONLY show Junior Secondary subjects
      return subjects.filter(s => s.code?.startsWith('JSS-') || (s.level === 'Secondary' && !s.subjectCategory))
    }
    
    // For other levels, filter by level as usual
    const level = className.startsWith('Primary') ? 'Primary' : 
                  className.startsWith('Nursery') ? 'Nursery' : 
                  className.startsWith('Pre-Nursery') ? 'Pre-Nursery' : 'Primary'
    
    return subjects.filter(s => {
      if (s.level !== level) return false;
      // Specific rule: Writing is only for P1-3
      if (s.name === 'Writing' && (className.includes('4') || className.includes('5') || className.includes('6'))) {
        return false;
      }
      return true;
    })
  }

  // Get subjects assigned to the teacher
  // Form teachers with no assigned subjects can see all subjects for their specific class
  const teacherSubjects = useMemo(() => {
    if (!isTeacher || !teacher) return subjects
    
    // Check both 'subject' (string) and 'assignedSubjects' (array)
    const assignedNames = new Set<string>()
    if (teacher.subject) assignedNames.add(teacher.subject)
    if (teacher.assignedSubjects) {
      teacher.assignedSubjects.forEach(s => assignedNames.add(s))
    }

    // 1. If teacher has specific assigned subjects, show those above all else.
    // We filter from the full subjects list to ensure they aren't accidentally 
    // filtered out by class level logic if the teacher teaches across levels.
    if (assignedNames.size > 0) {
      return subjects.filter(s => {
        if (assignedNames.has(s.name) || assignedNames.has(s.id)) return true;
        
        // Handle Subject Roles (e.g., "Mathematics (JSS)")
        const isJSS = s.code?.startsWith('JSS-') || (s.level === 'Secondary' && !s.subjectCategory);
        const isSSS = s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory);
        
        if (isJSS && assignedNames.has(`${s.name} (JSS)`)) return true;
        if (isSSS && assignedNames.has(`${s.name} (SSS)`)) return true;
        
        return false;
      });
    }

    // 2. If no specific subjects, but has assigned classes (Form Teacher):
    // Show all subjects appropriate for those classes.
    if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
      const allSubjects = new Set<Subject>()
      teacher.assignedClasses.forEach(className => {
        const classSubjects = filterSubjectsByClass(subjects, className)
        classSubjects.forEach(subject => allSubjects.add(subject))
      })
      if (allSubjects.size > 0) return Array.from(allSubjects)
    }

    // Fallback: show all subjects
    return subjects
  }, [subjects, isTeacher, teacher])

  // Filter students offering subjects the teacher teaches
  const offeringStudents = useMemo(() => {
    // If Admin, show all results. If Teacher, show based on level and assignments.
    if (!isTeacher || !teacher) return results.map(r => ({ ...r, status: 'Completed' }))

    const teacherSubjectIds = new Set(teacherSubjects.map(s => s.id))
    const teacherAssignedClasses = new Set(teacher.assignedClasses || [])
    const isSecondary = teacher.level === 'Secondary'
    
    // Map assignments to display items (existing results or pending ones)
    const items: any[] = []

    allStudentSubjects.forEach(assignment => {
      const student = students.find(s => s.id === assignment.studentId)
      if (!student) return

      // Logic for filtering assignments:
      // 1. If Secondary: Filter by assigned subjects
      // 2. If others: Filter by assigned classes (they handle all subjects for their class)
      const isRelevant = isSecondary 
        ? teacherSubjectIds.has(assignment.subjectId)
        : teacherAssignedClasses.has(student.class)

      if (!isRelevant) return

      // Find if a result already exists for this student, subject, term, and academic year
      const existingResult = results.find(r => 
        r.studentId === assignment.studentId && 
        r.subjectId === assignment.subjectId &&
        r.term === assignment.term &&
        r.academicYear === assignment.academicYear
      )

      if (existingResult) {
        items.push({
          ...existingResult,
          status: 'Completed'
        })
      } else {
        // Create a "Pending" placeholder
        items.push({
          id: `pending-${assignment.id}`,
          studentId: assignment.studentId,
          subjectId: assignment.subjectId,
          term: assignment.term,
          academicYear: assignment.academicYear,
          firstCA: 0,
          secondCA: 0,
          exam: 0,
          totalScore: 0,
          percentage: 0,
          grade: 'N/A',
          gradePoint: 0,
          remarks: 'Pending',
          dateRecorded: '',
          recordedBy: '',
          status: 'Pending'
        })
      }
    })

    return items
  }, [allStudentSubjects, results, teacherSubjects, isTeacher, teacher, students])

  // NEW: Group results by student for the Card View
  const studentResultsSummary = useMemo(() => {
    const summary: Record<string, { student: Student; count: number; lastTerm: string }> = {}
    
    results.forEach(r => {
      if (!summary[r.studentId]) {
        const student = students.find(s => s.id === r.studentId)
        if (student) {
          summary[r.studentId] = { student, count: 0, lastTerm: r.term }
        }
      }
      if (summary[r.studentId]) {
        summary[r.studentId].count++
      }
    })

    return Object.values(summary).sort((a, b) => 
      `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`)
    )
  }, [results, students])

  // Filtered students for the student list view
  const displayStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !debouncedFilterTerm || 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(debouncedFilterTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(debouncedFilterTerm.toLowerCase())
      
      const matchesClass = selectedClass === 'All' || student.class === selectedClass
      const matchesArm = selectedArm === 'All' || student.arm === selectedArm
      
      // Teacher filter: Only show students in classes they are assigned to
      // or who take subjects they teach
      if (isTeacher && teacher) {
        const isFormClass = teacher.assignedClasses?.includes(student.class);
        const takesMySubject = allStudentSubjects.some(sa => 
          sa.studentId === student.id && 
          teacherSubjects.some(ts => ts.id === sa.subjectId)
        );
        if (!isFormClass && !takesMySubject) return false;
      }
      
      return matchesSearch && matchesClass && matchesArm
    }).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
  }, [students, debouncedFilterTerm, selectedClass, isTeacher, teacher, allStudentSubjects, teacherSubjects])

  const availableClasses = useMemo(() => {
    if (!isTeacher || !teacher) return ALL_CLASSES;
    
    const classSet = new Set<string>()
    const teacherAssignedClasses = teacher.assignedClasses || []
    const teacherLevel = teacher.level || 'Secondary'
    
    // 1. Level-based classes
    if (teacherLevel === 'Secondary') {
      ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'].forEach(c => classSet.add(c))
    } else if (teacherLevel === 'Primary') {
      ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'].forEach(c => classSet.add(c))
    } else if (teacherLevel === 'Nursery') {
      ['Nursery 1', 'Nursery 2'].forEach(c => classSet.add(c))
    }
    
    // 2. Add specifically assigned classes (just in case they are cross-level)
    teacherAssignedClasses.forEach(c => classSet.add(c))
    
    if (classSet.size === 0) return [teacher.class].filter(Boolean);
    
    return Array.from(classSet).sort((a, b) => {
      // Prioritize assigned form classes
      const isAssignedA = teacherAssignedClasses.includes(a);
      const isAssignedB = teacherAssignedClasses.includes(b);
      if (isAssignedA && !isAssignedB) return -1;
      if (!isAssignedA && isAssignedB) return 1;
      
      return a.localeCompare(b);
    });
  }, [isTeacher, teacher])

  // Pre-index students and subjects for O(1) lookup performance
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>()
    students.forEach(s => map.set(s.id, s))
    return map
  }, [students])

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    subjects.forEach(s => map.set(s.id, s))
    return map
  }, [subjects])

  // Simple filtering for the combined list - uses debounced filter for performance
  const filteredDisplayData = useMemo(() => {
    let dataToFilter = isTeacher ? offeringStudents : results.map(r => ({ ...r, status: 'Completed' }))

    // If a student is selected via card, filter strictly to them
    if (selectedStudentResults) {
      dataToFilter = dataToFilter.filter(r => r.studentId === selectedStudentResults)
    }

    const filtered = dataToFilter.filter(item => {
      const student = studentMap.get(item.studentId)
      if (!student) return false

      const subject = subjectMap.get(item.subjectId)
      if (!subject) return false

      const matchesSearch = debouncedFilterTerm === '' || 
        student.registrationNumber.toLowerCase().includes(debouncedFilterTerm.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(debouncedFilterTerm.toLowerCase()) ||
        subject.name.toLowerCase().includes(debouncedFilterTerm.toLowerCase())
      
      const matchesTerm = selectedTerm === 'All' || item.term === selectedTerm
      const matchesClass = selectedClass === 'All' || student.class === selectedClass
      const matchesArm = selectedArm === 'All' || student.arm === selectedArm
      const matchesSubject = selectedSubject === 'All' || item.subjectId === selectedSubject

      return matchesSearch && matchesTerm && matchesClass && matchesArm && matchesSubject
    })

    // Sort by student name then by subject name to ensure grouping works
    return filtered.sort((a, b) => {
      const studentA = studentMap.get(a.studentId)
      const studentB = studentMap.get(b.studentId)
      const nameA = studentA ? `${studentA.firstName} ${studentA.lastName}` : ''
      const nameB = studentB ? `${studentB.firstName} ${studentB.lastName}` : ''
      
      if (nameA !== nameB) return nameA.localeCompare(nameB)
      
      const subjectA = subjectMap.get(a.subjectId)?.name || ''
      const subjectB = subjectMap.get(b.subjectId)?.name || ''
      return subjectA.localeCompare(subjectB)
    })
  }, [offeringStudents, results, studentMap, subjectMap, debouncedFilterTerm, selectedTerm, selectedClass, selectedSubject, isTeacher, selectedArm, selectedStudentResults])



  // NEW: Identify if we are viewing a single student's results
  const singleStudentResults = useMemo(() => {
    const studentIds = [...new Set(filteredDisplayData.map(r => r.studentId))]
    if (studentIds.length === 1 && filteredDisplayData.length > 0) {
      const student = students.find(s => s.id === studentIds[0])
      if (!student) return null
      
      const classPos = getStudentClassPosition(
        results,
        student.id,
        filteredDisplayData[0].term,
        filteredDisplayData[0].academicYear
      )

      return {
        student,
        results: filteredDisplayData,
        classPositionText: classPos.positionText
      }
    }
    return null
  }, [filteredDisplayData, students, results])

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return
    
    const windowToPrint = window.open('', '', 'width=900,height=900')
    if (!windowToPrint) {
      window.alert('Please allow popups to print the result.')
      return
    }
    
    windowToPrint.document.write(`
      <html>
        <head>
          <title>Print Result - ${singleStudentResults?.student?.firstName} ${singleStudentResults?.student?.lastName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: center; }
            th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    windowToPrint.document.close()
    windowToPrint.focus()
    windowToPrint.print()
    windowToPrint.close()
  }

  const handleDownloadPDF = async () => {
    const printContent = printRef.current
    if (!printContent) return

    try {
      setIsGeneratingPDF(true)
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${singleStudentResults?.student?.firstName}_${singleStudentResults?.student?.lastName}_Result_Card.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      window.alert('Failed to generate PDF. Please try printing instead.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const displayResults = useMemo(() => {
    const transformed = filteredDisplayData.map((item, index) => {
      const student = students.find(s => s.id === item.studentId)
      const subject = subjects.find(s => s.id === item.subjectId)
      
      return {
        ...item,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        class: student ? student.class : 'Unknown Class',
        subjectName: subject ? subject.name : 'Unknown Subject',
        positionText: item.position ? getPositionSuffix(item.position) : 'N/A',
        // Grouping aid: Hide name if same as previous row student
        hideName: index > 0 && filteredDisplayData[index - 1].studentId === item.studentId
      }
    })
    
    // Apply pagination
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    return transformed.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  }, [filteredDisplayData, students, subjects, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredDisplayData.length / ITEMS_PER_PAGE)
  }, [filteredDisplayData.length])

  // Memoize stats calculation for the full filtered data
  const stats = useMemo(() => {
    return {
      totalRecords: filteredDisplayData.length,
      averageScore: filteredDisplayData.length > 0 
        ? (filteredDisplayData.reduce((sum, r) => sum + (r.percentage || 0), 0) / filteredDisplayData.length).toFixed(1) 
        : 0,
      passRate: filteredDisplayData.length > 0
        ? Math.round((filteredDisplayData.filter(r => (r.percentage || 0) >= 50).length / filteredDisplayData.length) * 100)
        : 0,
      passingGrade: '50%'
    }
  }, [filteredDisplayData])

  const handleDeleteResult = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteResult(id)
        setResults(prev => prev.filter(r => r.id !== id))
      } catch (error) {
        console.error('Failed to delete result:', error)
        window.alert('Failed to delete result')
      }
    }
  }, [])

  const handleSubmitResult = async (result: SubjectResult | Omit<SubjectResult, 'id'>) => {
    try {
      // Find the student to get their class
      const student = students.find(s => s.id === result.studentId)
      
      // Clean extra fields that might be present from the table display transformation
      // This ensures we only send valid fields to the API
      const cleanResult = {
        studentId: result.studentId,
        subjectId: result.subjectId,
        classId: student?.class || (result as any).class || '',
        term: result.term,
        academicYear: result.academicYear,
        firstCA: result.firstCA,
        secondCA: result.secondCA,
        exam: result.exam,
        totalScore: result.totalScore,
        percentage: result.percentage,
        grade: result.grade,
        gradePoint: result.gradePoint,
        remarks: result.remarks,
        dateRecorded: result.dateRecorded || new Date().toISOString().split('T')[0],
        recordedBy: result.recordedBy,
      }

      if ('id' in result && result.id && !result.id.startsWith('pending-')) {
        // Update existing result
        await updateResult(result.id, cleanResult)
      } else {
        // Create new result
        await createResult(cleanResult)
      }
      await loadData()
      setShowForm(false)
      setEditingResult(null)
      setMessage({ type: 'success', text: 'Result saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error: any) {
      console.error('Failed to save result:', error)
      setMessage({ 
        type: 'error', 
        text: `Failed to save result: ${error.message || 'Please try again.'}` 
      })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingResult(null)
  }

  const handleRetry = () => {
    loadData()
  }

  if (apiError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Data Loading Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{apiError}</p>
        <button
          onClick={handleRetry}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading subject results...</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">This may take a moment on first load</p>
        </div>
      </div>
    )
  }

  if (selectedStudentForEntry) {
    return (
      <div className="p-8">
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center p-20 card-lg">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Student Details...</p>
          </div>
        }>
          <StudentResultEntryView
            student={selectedStudentForEntry}
            subjects={isTeacher ? teacherSubjects : subjects}
            studentSubjects={allStudentSubjects}
            existingResults={results}
            onBack={() => setSelectedStudentForEntry(null)}
            onResultsSaved={loadData}
          />
        </React.Suspense>
      </div>
    )
  }


  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-500/10 border border-folusho-sage-500/20 text-folusho-sage-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Evaluation Matrix
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Result <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Synchronization.</span>
          </h1>
          <p className="text-folusho-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Input CA and Examination scores for high-fidelity grade synthesis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex bg-folusho-slate-900/40 p-2 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
            {(["students", "results"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === mode
                    ? "bg-folusho-sage-400 text-white shadow-folusho"
                    : "text-folusho-slate-500 hover:text-folusho-sage-400"
                }`}
              >
                {mode === "students" ? "Identity Matrix" : "Archival List"}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setEditingResult(null)
              setShowForm(true)
            }}
            className="btn-vibrant bg-folusho-sage-400 shadow-folusho"
          >
            <Plus size={20} />
            Initialize Entry
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-6 rounded-[2rem] flex items-center gap-5 backdrop-blur-md border ${
          message.type === 'success' 
            ? 'bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
            : 'bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
        }`}>
          <AlertCircle size={24} />
          <p className="font-bold tracking-tight uppercase text-xs">{message.text}</p>
        </div>
      )}

      {/* ── Intelligence Filters ───────────────────────── */}
      <div className="folusho-card !p-12 border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">Personnel Lookup</label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-folusho-sage-400 group-focus-within:text-folusho-sage-600 transition-colors" />
              <input
                type="text"
                placeholder="Scan identities..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="input-folusho !pl-16 !bg-folusho-slate-950/50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">Sector Focus</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-folusho !py-5 !bg-folusho-slate-950/50"
            >
              <option value="All" className="bg-folusho-slate-900">Global Sectors</option>
              {availableClasses.map(cls => <option key={cls} value={cls} className="bg-folusho-slate-900">{cls}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">Matrix Focus (Subject)</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-folusho !py-5 !bg-folusho-slate-950/50"
            >
              <option value="All" className="bg-folusho-slate-900">All {isTeacher ? 'My' : ''} Subjects</option>
              {teacherSubjects.map((subject) => (
                <option key={subject.id} value={subject.id} className="bg-folusho-slate-900">{subject.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">Temporal Phase</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input-folusho !py-5 !bg-folusho-slate-950/50"
            >
              <option value="All" className="bg-folusho-slate-900">All Phases</option>
              <option value="First" className="bg-folusho-slate-900">First Phase</option>
              <option value="Second" className="bg-folusho-slate-900">Second Phase</option>
              <option value="Third" className="bg-folusho-slate-900">Third Phase</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Data Matrix ────────────────────────────────── */}
      <div className="folusho-card !p-0 border-white/5">
        {viewMode === "students" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 p-10">
            {displayStudents.map((student) => (
              <motion.div
                key={student.id}
                layoutId={student.id}
                onClick={() => setSelectedStudentForEntry(student)}
                className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/10 hover:border-folusho-sage-500/30 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-folusho-sage-500/10 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-folusho-sage-500/30 transition-colors shadow-inner mb-8">
                  <span className="text-2xl font-black text-folusho-sage-400">{student.firstName[0]}{student.lastName[0]}</span>
                </div>
                <h3 className="text-xl font-black text-white mb-1 tracking-tight group-hover:text-folusho-sage-400 transition-colors">
                  {student.firstName} {student.lastName}
                </h3>
                <p className="text-[9px] font-black text-folusho-slate-400 uppercase tracking-widest mb-8">
                  {student.registrationNumber}
                </p>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-widest">{student.class}</span>
                  <ChevronRight size={18} className="text-folusho-sage-400 group-hover:text-folusho-sage-300 group-hover:translate-x-2 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="py-6 px-8 text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.35em] text-left">Personnel</th>
                  <th className="py-6 px-6 text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.35em] text-left">Subject</th>
                  <th className="py-6 px-6 text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.35em] text-center">Protocol Status</th>
                  <th className="py-6 px-6 text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.35em] text-center">Score</th>
                  <th className="py-6 px-8 text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.35em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayResults.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-6 px-8">
                      <div className="font-bold text-white text-sm">{item.studentName}</div>
                      <div className="text-[9px] font-black text-folusho-slate-500 uppercase tracking-widest mt-1">{item.class}</div>
                    </td>
                    <td className="py-6 px-6 text-sm font-bold text-folusho-slate-400">{item.subjectName}</td>
                    <td className="py-6 px-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        item.status === "Completed" ? "bg-folusho-sage-500/10 text-folusho-sage-400 border-folusho-sage-500/20" : "bg-folusho-coral-500/10 text-folusho-coral-400 border-folusho-coral-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-6 px-6 text-center font-black text-white text-lg">{item.totalScore}</td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => { setEditingResult(item); setShowForm(true) }}
                          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-folusho-sage-400 transition-all border border-white/5 shadow-sm"
                        >
                          <ClipboardList size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteResult(item.id)}
                          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-folusho-coral-400 transition-all border border-white/5 shadow-sm"
                        >
                          <AlertCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-8 pb-12">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 text-folusho-sage-400 disabled:opacity-20 hover:bg-white/10 transition-all shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-[10px] font-black text-folusho-slate-500 uppercase tracking-[0.45em]">
            Matrix Phase {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 text-folusho-sage-400 disabled:opacity-20 hover:bg-white/10 transition-all shadow-sm"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Modal Overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-8"
          >
            <motion.div
              initial={{ scale: 0.98, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 10 }}
              className="folusho-card max-w-2xl w-full max-h-[90vh] overflow-y-auto !p-0 border-white/5"
            >
              <div className="p-10 border-b border-white/5 bg-folusho-sage-500/10">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Protocol Injection</h2>
                <p className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.35em] mt-4">Manual override active</p>
              </div>
              <div className="p-10">
                <SubjectResultForm
                  onSubmit={handleSubmitResult}
                  initialData={editingResult || undefined}
                  onCancel={handleCancel}
                  isEditing={!!editingResult}
                  students={students}
                  subjects={isTeacher ? teacherSubjects : subjects}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
