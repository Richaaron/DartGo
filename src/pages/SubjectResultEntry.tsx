import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { Plus, Search, AlertCircle, Filter, User, BookOpen, ClipboardList, ChevronLeft, ChevronRight, LayoutGrid, List, Loader2 } from 'lucide-react'
import { SubjectResult, Student, Subject, StudentSubject, Teacher } from '../types'
import SubjectResultForm from '../components/SubjectResultForm'
import BulkSubjectResultEntry from '../components/BulkSubjectResultEntry'
import StudentResultEntryView from '../components/StudentResultEntryView'
import { createResult, updateResult, fetchStudentSubjects } from '../services/api'
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

const SubjectResultEntry = memo(function SubjectResultEntry() {
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
      const { fetchStudents, fetchResults, fetchSubjects, fetchStudentSubjects } = await import('../services/api')
      
      // For teachers, optimize by loading only relevant data
      // For admins, load all data
      const isTeacher = user?.role === 'Teacher'
      
      // Load core data
      let subjectsData = await fetchSubjects().catch(() => [])
      let resultsData = await fetchResults().catch(() => [])
      
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
            .filter(s => teacherSubjectNames.has(s.name) || teacherSubjectNames.has(s.id))
            .map(s => s.id)
        )
        
        // Filter results to only teacher's subjects
        resultsData = (resultsData || []).filter(r => teacherSubjectIds.has(r.subjectId))
      }
      
      // Load students and student subjects in parallel
      const [studentsData, studentSubjectsData] = await Promise.all([
        fetchStudents().catch(() => []),
        fetchStudentSubjects().catch(() => [])
      ])
      
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setResults(Array.isArray(resultsData) ? resultsData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setAllStudentSubjects(Array.isArray(studentSubjectsData) ? studentSubjectsData : [])
    } catch (error: any) {
      console.error('Failed to load results data', error)
      setApiError('Failed to load data. Please try again.')
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
      // Senior Secondary subjects have IDs starting with 'ss-'
      return subjects.filter(s => s.id.startsWith('ss-'))
    } else if (className.startsWith('JSS')) {
      // For Junior Secondary classes, ONLY show Junior Secondary subjects
      // Junior Secondary subjects have IDs starting with 'jss-'
      return subjects.filter(s => s.id.startsWith('jss-'))
    }
    // For other levels, filter by level as usual
    if (className.startsWith('Primary')) {
      return subjects.filter(s => s.level === 'Primary')
    } else if (className.startsWith('Nursery')) {
      return subjects.filter(s => s.level === 'Nursery')
    } else if (className.startsWith('Pre-Nursery')) {
      return subjects.filter(s => s.level === 'Pre-Nursery')
    }
    return subjects.filter(s => s.level === 'Primary') // Default fallback
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
      return subjects.filter(s => assignedNames.has(s.name) || assignedNames.has(s.id))
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
      
      return matchesSearch && matchesClass && matchesArm
    }).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
  }, [students, debouncedFilterTerm, selectedClass])

  // Simple filtering for the combined list - uses debounced filter for performance
  const filteredDisplayData = useMemo(() => {
    let dataToFilter = isTeacher ? offeringStudents : results.map(r => ({ ...r, status: 'Completed' }))

    // If a student is selected via card, filter strictly to them
    if (selectedStudentResults) {
      dataToFilter = dataToFilter.filter(r => r.studentId === selectedStudentResults)
    }

    const filtered = dataToFilter.filter(item => {
      const student = students.find(s => s.id === item.studentId)
      if (!student) return false

      const subject = subjects.find(s => s.id === item.subjectId)
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
      const studentA = students.find(s => s.id === a.studentId)
      const studentB = students.find(s => s.id === b.studentId)
      const nameA = studentA ? `${studentA.firstName} ${studentA.lastName}` : ''
      const nameB = studentB ? `${studentB.firstName} ${studentB.lastName}` : ''
      
      if (nameA !== nameB) return nameA.localeCompare(nameB)
      
      const subjectA = subjects.find(s => s.id === a.subjectId)?.name || ''
      const subjectB = subjects.find(s => s.id === b.subjectId)?.name || ''
      return subjectA.localeCompare(subjectB)
    })
  }, [offeringStudents, results, students, subjects, debouncedFilterTerm, selectedTerm, selectedClass, selectedSubject, isTeacher])



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
        const { deleteResult } = await import('../services/api')
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
        <StudentResultEntryView
          student={selectedStudentForEntry}
          subjects={isTeacher ? teacherSubjects : subjects}
          studentSubjects={allStudentSubjects}
          existingResults={results}
          onBack={() => setSelectedStudentForEntry(null)}
          onResultsSaved={loadData}
        />
      </div>
    )
  }


  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Subject <span className="text-indigo-600 dark:text-indigo-400">Results</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Enter CA and Exam scores for automated grading</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-brand-800 p-1 rounded-xl border border-slate-200 dark:border-brand-700">
            <button
              onClick={() => setViewMode('students')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
                viewMode === 'students' 
                  ? 'bg-white dark:bg-brand-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <User size={18} />
              STUDENT VIEW
            </button>
            <button
              onClick={() => setViewMode('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
                viewMode === 'results' 
                  ? 'bg-white dark:bg-brand-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List size={18} />
              RESULT LIST
            </button>
          </div>

          <button
            onClick={() => {
              setEditingResult(null)
              setShowForm(true)
            }}
            className="btn-primary"
          >
            <Plus size={20} />
            Enter Results
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle size={20} />
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Filters */}
      {viewMode === 'results' && (
        <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search student or registration..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="list-class-filter" className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">Class</label>
            <select
              id="list-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field"
              aria-label="Filter by class"
            >
              <option value="All">All Classes</option>
              {ALL_CLASSES.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="list-arm-filter" className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">Dept/Arm</label>
            <select
              id="list-arm-filter"
              value={selectedArm}
              onChange={(e) => setSelectedArm(e.target.value)}
              disabled={!(selectedClass.startsWith('SSS') || selectedClass.startsWith('SS')) && selectedClass !== 'All'}
              className="input-field disabled:opacity-50"
              aria-label="Filter by arm"
            >
              <option value="All">All Departments</option>
              <option value="Science">Science</option>
              <option value="Art">Art</option>
              <option value="Commercial">Commerce</option>
            </select>
          </div>
          <div>
            <label htmlFor="list-subject-filter" className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">Subject</label>
            <select
              id="list-subject-filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field"
              aria-label="Filter by subject"
            >
              <option value="All">All {isTeacher ? 'My' : ''} Subjects</option>
              {teacherSubjects.map((subject) => {
                const levelLabel = subject.id.startsWith('jss-') ? 'JSS' : subject.id.startsWith('ss-') ? 'SSS' : subject.level;
                return (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({levelLabel})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor="list-term-filter" className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">Term</label>
            <select
              id="list-term-filter"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input-field"
              aria-label="Filter by term"
            >
              <option value="All">All Terms</option>
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        {viewMode === 'students' ? (
          <BulkSubjectResultEntry
            subjects={subjects}
            students={students}
            studentSubjects={allStudentSubjects}
            existingResults={results}
            onResultsSaved={loadData}
            teacherSubjects={teacherSubjects}
          />
        ) : !selectedStudentResults ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {studentResultsSummary.length > 0 ? (
              studentResultsSummary.filter(s => {
                const matchesSearch = !debouncedFilterTerm || 
                  `${s.student.firstName} ${s.student.lastName} ${s.student.registrationNumber}`.toLowerCase().includes(debouncedFilterTerm.toLowerCase())
                const matchesClass = selectedClass === 'All' || s.student.class === selectedClass
                return matchesSearch && matchesClass
              }).map(summary => (
                <div 
                  key={summary.student.id}
                  onClick={() => setSelectedStudentResults(summary.student.id)}
                  className="professional-card p-6 cursor-pointer group hover:bg-brand-900/60 transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      {summary.student.firstName[0]}{summary.student.lastName[0]}
                    </div>
                    <h3 className="text-white font-black uppercase tracking-tight text-lg mb-1">{summary.student.firstName} {summary.student.lastName}</h3>
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">{summary.student.class}</p>
                    
                    <div className="w-full pt-4 border-t border-indigo-500/10 flex justify-between items-center">
                      <div className="text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-black">Records</p>
                        <p className="text-white font-black">{summary.count}</p>
                      </div>
                      <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                        View Results
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center card-lg">
                <div className="w-20 h-20 bg-brand-900/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-800">
                  <User className="text-brand-400" size={40} />
                </div>
                <h3 className="text-white text-xl font-bold">No results found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your filters or record some new results.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card-lg">
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setSelectedStudentResults(null)}
                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-all hover:-translate-x-1"
              >
                <ChevronLeft size={20} />
                Back to All Students
              </button>
              
              {singleStudentResults && (
                <div className="flex gap-3">
                  <button onClick={handlePrint} className="btn-purple flex items-center gap-2 py-2 text-xs">
                    <Printer size={14} /> Print Report
                  </button>
                  <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="btn-gold flex items-center gap-2 py-2 text-xs">
                    {isGeneratingPDF ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              )}
            </div>

            {/* Hidden Print Content */}
            {singleStudentResults && (
              <div className="hidden">
                <div ref={printRef}>
                  <PrintResult 
                    child={singleStudentResults.student!} 
                    results={singleStudentResults.results} 
                    subjects={subjects}
                    classPositionText={singleStudentResults.classPositionText}
                  />
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-indigo-500/30">
                    <th className="table-header text-left">Student Name</th>
                    <th className="table-header text-left">Class</th>
                    <th className="table-header text-left">Subject</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-center">1st CA</th>
                    <th className="table-header text-center">2nd CA</th>
                    <th className="table-header text-center">Exam</th>
                    <th className="table-header text-center">Total</th>
                    <th className="table-header text-center">Grade</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayResults.map((result, index) => (
                    <tr key={result.id || index} className={`hover:bg-brand-50 dark:hover:bg-indigo-900/10 transition-colors ${result.hideName ? 'border-t-0' : 'border-t'}`}>
                      <td className="table-cell">
                        {!result.hideName && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                              {result.studentName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white leading-none">{result.studentName}</p>
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Reg: {students.find(s => s.id === result.studentId)?.registrationNumber || 'N/A'}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="table-cell font-bold text-xs opacity-60">
                        {!result.hideName && result.class}
                      </td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
                          {result.subjectName}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          result.status === 'Completed' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' 
                            : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="table-cell text-center font-bold">{result.firstCA || 0}</td>
                      <td className="table-cell text-center font-bold">{result.secondCA || 0}</td>
                      <td className="table-cell text-center font-bold">{result.exam || 0}</td>
                      <td className="table-cell text-center font-bold text-indigo-600 dark:text-indigo-400">{result.totalScore || 0}</td>
                      <td className="table-cell text-center font-black">{result.grade || 'N/A'}</td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-2">
                          {result.status === 'Pending' ? (
                            <button
                              onClick={() => {
                                setEditingResult(result)
                                setShowForm(true)
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
                            >
                              <Plus size={14} />
                              Enter Result
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingResult(result)
                                  setShowForm(true)
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <ClipboardList size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteResult(result.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <AlertCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayResults.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No results found. Try adjusting your filters or add some results.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-bold">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredDisplayData.length)}</span> to{' '}
                  <span className="font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDisplayData.length)}</span> of{' '}
                  <span className="font-bold">{filteredDisplayData.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-brand-800 border border-gray-200 dark:border-brand-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors ${
                          page === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-brand-800 border border-gray-200 dark:border-brand-700 hover:bg-gray-50 dark:hover:bg-brand-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-brand-800 border border-gray-200 dark:border-brand-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Records</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.totalRecords}</p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average Score</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.averageScore}%</p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pass Rate</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.passRate}%</p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Passing Grade</p>
          <p className="text-3xl font-black text-orange-500 dark:text-orange-400 mt-1">{stats.passingGrade}</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <SubjectResultForm
              onSubmit={handleSubmitResult}
              initialData={editingResult || {
                term: selectedTerm === 'All' ? 'First' : selectedTerm,
                subjectId: selectedSubject === 'All' ? '' : selectedSubject,
                academicYear: new Date().getFullYear().toString()
              } as any}
              onCancel={handleCancel}
              isEditing={!!editingResult && !editingResult.id?.startsWith('pending-')}
              students={students}
              subjects={isTeacher ? teacherSubjects : subjects}
              studentSubjects={allStudentSubjects}
            />
          </div>
        </div>
      )}
    </div>
  )
})

export default SubjectResultEntry
