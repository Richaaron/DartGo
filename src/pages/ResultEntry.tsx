import { useState, useEffect, useMemo } from 'react'

// Define all standard classes
const PRIMARY_CLASSES = ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']
const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES]
import { Plus, Trash2, Search, Download, Send, Mail, AlertCircle, CheckCircle2, Clock, BarChart3, X, User, ChevronRight, List } from 'lucide-react'
import { SubjectResult, Student, Subject, ResultsSentTracker, StudentSubject } from '../types'
import { useAuthContext } from '../context/AuthContext'
import SubjectResultForm from '../components/SubjectResultForm'
import StudentResultEntryView from '../components/StudentResultEntryView'
import Table from '../components/Table'
import { formatDate, exportToCSV, calculatePositions, getStudentClassPosition, getPositionSuffix } from '../utils/calculations'
import { fetchStudents, fetchResults, fetchSubjects, deleteResult, createResult, updateResult, fetchStudentSubjects } from '../services/api'
import apiService from '../services/apiService'

export default function ResultEntry() {
  const { user } = useAuthContext()
  const teacher = user && 'teacherType' in user ? user : null
  
  const [results, setResults] = useState<SubjectResult[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [allStudentSubjects, setAllStudentSubjects] = useState<StudentSubject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingResult, setEditingResult] = useState<SubjectResult | null>(null)
  const [selectedStudentForEntry, setSelectedStudentForEntry] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<'results' | 'students'>('students')
  const [filterTerm, setFilterTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [sending, setSending] = useState<string | null>(null)
  const [sendMessage, setSendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // New state for bulk sending and tracking
  const [resultsSentTracker, setResultsSentTracker] = useState<ResultsSentTracker[]>([])
  const [isBulkSending, setIsBulkSending] = useState(false)
  
  // State for class-based control (teachers always use class view)
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [selectedSubject, setSelectedSubject] = useState<string>('All') // Only used by admins
  
  // New state for student selection
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState<'all' | 'none' | 'custom'>('none')
  
  // Subject breakdown state
  const [showSubjectBreakdown, setShowSubjectBreakdown] = useState(false)
  const [selectedBreakdownSubject, setSelectedBreakdownSubject] = useState<Subject | null>(null)

  // Student selection handlers (declared before use)
  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
    
    // Update select all mode
    const currentViewStudentIds = new Set(
      filteredResults.map(r => r.studentId)
    )
    const allSelected = Array.from(currentViewStudentIds).every(id => newSelected.has(id))
    const noneSelected = Array.from(currentViewStudentIds).every(id => !newSelected.has(id))
    
    if (allSelected) {
      setSelectAllMode('all')
    } else if (noneSelected) {
      setSelectAllMode('none')
    } else {
      setSelectAllMode('custom')
    }
  }

  const handleSelectAll = () => {
    const currentViewStudentIds = new Set(
      filteredResults.map(r => r.studentId)
    )
    
    if (selectAllMode === 'all') {
      // Deselect all
      setSelectedStudents(new Set())
      setSelectAllMode('none')
    } else {
      // Select all in current view
      setSelectedStudents(currentViewStudentIds)
      setSelectAllMode('all')
    }
  }

  // Determine if current user is form teacher or subject teacher
  const isFormTeacher = teacher?.teacherType === 'Form Teacher' || teacher?.teacherType === 'Form + Subject Teacher'
  const isSubjectTeacher = teacher?.teacherType === 'Subject Teacher' || teacher?.teacherType === 'Form + Subject Teacher'

  async function loadData() {
    try {
      const [studentsData, resultsData, subjectsData, studentSubjectsData] = await Promise.all([
        fetchStudents().catch(() => []),
        fetchResults().catch(() => []),
        fetchSubjects().catch(() => []),
        fetchStudentSubjects().catch(() => [])
      ])
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setResults(Array.isArray(resultsData) ? resultsData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setAllStudentSubjects(Array.isArray(studentSubjectsData) ? studentSubjectsData : [])
    } catch (error) {
      console.error('Failed to load results data', error)
      setStudents([])
      setResults([])
      setSubjects([])
      setAllStudentSubjects([])
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetchStudents().catch(() => []),
      fetchResults().catch(() => []),
      fetchSubjects().catch(() => []),
      fetchStudentSubjects().catch(() => [])
    ])
      .then(([studentsData, resultsData, subjectsData, studentSubjectsData]) => {
        if (!isMounted) return
        setStudents(Array.isArray(studentsData) ? studentsData : [])
        setResults(Array.isArray(resultsData) ? resultsData : [])
        setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
        setAllStudentSubjects(Array.isArray(studentSubjectsData) ? studentSubjectsData : [])
      })
      .catch((error) => {
        console.error('Failed to load results data', error)
        if (isMounted) {
          setStudents([])
          setResults([])
          setSubjects([])
        }
      })

    // Load tracking data from localStorage
    try {
      const savedTracker = localStorage.getItem('resultsSentTracker')
      if (savedTracker) {
        setResultsSentTracker(JSON.parse(savedTracker))
      }
    } catch (error) {
      console.error('Failed to load tracking data:', error)
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Auto-select teacher's assigned class if they only have one
  useEffect(() => {
    if (teacher && teacher.assignedClasses && teacher.assignedClasses.length === 1) {
      const assignedClass = teacher.assignedClasses[0]
      if (assignedClass) {
        setSelectedClass(assignedClass)
      }
    }
  }, [teacher])

  // Helper function to map all Mathematics subjects to unified Mathematics subject
  const mapMathematicsSubject = (subjectName: string): string => {
    // Map all Mathematics variations to the unified Mathematics subject
    if (subjectName && subjectName.toLowerCase().includes('mathematics')) {
      return 'Mathematics'
    }
    return subjectName
  }

  const filteredResults = useMemo(() => {
    const getResultDetailsForFilter = (result: SubjectResult) => {
      const student = students.find((s) => s.id === result.studentId)
      const subject = subjects.find((sub) => sub.id === result.subjectId)

      return {
        ...result,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        subjectName: mapMathematicsSubject(subject?.name || 'Unknown Subject'),
        studentClass: student?.class || 'Unknown Class',
      }
    }

    let filtered = results
      .filter((result) => {
        const details = getResultDetailsForFilter(result)
        const matchesSearchTerm =
          details.studentName.toLowerCase().includes(filterTerm.toLowerCase()) ||
          details.subjectName.toLowerCase().includes(filterTerm.toLowerCase())

        const matchesTerm = selectedTerm === 'All' || result.term === selectedTerm

        // Role-based filtering
        let matchesRoleRestriction = true
        
        if (teacher) {
          // Form Teacher: Filter by assigned classes
          if (isFormTeacher && !isSubjectTeacher && teacher.assignedClasses) {
            matchesRoleRestriction = teacher.assignedClasses.includes(details.studentClass)
          }
          // Subject Teacher: Filter by assigned subjects
          else if (isSubjectTeacher && !isFormTeacher && teacher.assignedSubjects) {
            matchesRoleRestriction = teacher.assignedSubjects.includes(mapMathematicsSubject(details.subjectName))
          }
          // Form + Subject Teacher: Show results for EITHER role (class-based OR subject-based)
          else if (isFormTeacher && isSubjectTeacher) {
            const matchesClass = teacher.assignedClasses?.includes(details.studentClass) || false
            const matchesSubject = teacher.assignedSubjects?.includes(mapMathematicsSubject(details.subjectName)) || false
            matchesRoleRestriction = matchesClass || matchesSubject
          }
        }

        return matchesSearchTerm && matchesTerm && matchesRoleRestriction
      })
      .map(getResultDetailsForFilter)

    // Add positions for results
    const grouped = new Map<string, SubjectResult[]>()
    filtered.forEach(result => {
      const key = `${result.term}-${result.academicYear}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(result)
    })

    const withPositions: SubjectResult[] = []
    grouped.forEach((groupResults) => {
      const positioned = calculatePositions(groupResults)
      withPositions.push(...positioned)
    })

    return withPositions
  }, [results, students, subjects, filterTerm, selectedTerm, selectedClass, selectedSubject, teacher, isFormTeacher, isSubjectTeacher])

  // Get available classes and subjects based on teacher's role
  const availableClasses = useMemo(() => {
    if (!teacher) {
      // For admin users, show all classes
      return ALL_CLASSES
    }
    return teacher.assignedClasses || []
  }, [teacher])

  const availableSubjects = useMemo(() => {
    if (!teacher) return []
    if (isSubjectTeacher) {
      return teacher.assignedSubjects || []
    }
    // For form teachers, show all subjects for their class
    if (isFormTeacher && selectedClass !== 'All') {
      return subjects.filter(s => s.level === teacher.level)
    }
    return subjects.filter(s => s.level === teacher.level)
  }, [teacher, isSubjectTeacher, isFormTeacher, selectedClass, subjects])

  const pageTitle = useMemo(() => {
    if (isFormTeacher && !isSubjectTeacher) {
      return 'Form Teacher - Result Entry'
    }
    if (isSubjectTeacher && !isFormTeacher) {
      return 'Subject Teacher - Result Entry'
    }
    return 'Result Entry'
  }, [isFormTeacher, isSubjectTeacher])

  const pageDescription = useMemo(() => {
    if (isFormTeacher) {
      return 'Enter and manage results for all subjects in your form class'
    } else if (isSubjectTeacher) {
      return 'Enter and manage results for your assigned classes'
    } else {
      return 'Enter and manage results for all classes and subjects'
    }
  }, [isFormTeacher, isSubjectTeacher])

  const handleAddResult = async (newResult: Omit<SubjectResult, 'id'>) => {
    try {
      await createResult(newResult)
      await loadData()
      setShowForm(false)
    } catch {
      window.alert('Failed to add result')
    }
  }

  const handleUpdateResult = async (updatedResult: SubjectResult) => {
    try {
      await updateResult(updatedResult.id, updatedResult)
      await loadData()
      setEditingResult(null)
      setShowForm(false)
    } catch {
      window.alert('Failed to update result')
    }
  }

  const handleSubmitResult = (result: SubjectResult | Omit<SubjectResult, 'id'>) => {
    if ('id' in result) {
      handleUpdateResult(result as SubjectResult)
    } else {
      handleAddResult(result as Omit<SubjectResult, 'id'>)
    }
  }

  const handleDeleteResult = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteResult(id)
        await loadData()
      } catch {
        window.alert('Failed to delete result')
      }
    }
  }

  const handleExport = () => {
    const dataToExport = filteredResults.map((result) => ({
      'Student Name': result.studentName,
      Subject: result.subjectName,
      'First CA': result.firstCA,
      'Second CA': result.secondCA,
      Exam: result.exam,
      'Total Score': result.totalScore,
      Percentage: result.percentage,
      Grade: result.grade,
      Term: result.term,
      'Academic Year': result.academicYear,
      'Date Recorded': formatDate(result.dateRecorded),
    }))
    exportToCSV(dataToExport, 'results_report')
  }

  const columns = [
    { 
      key: 'checkbox', 
      label: 'Select',
      render: (value: any, row: any) => (
        <input
          type="checkbox"
          checked={selectedStudents.has(row.studentId)}
          onChange={() => toggleStudentSelection(row.studentId)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      )
    },
    { key: 'studentName', label: 'Student Name' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'firstCA', label: '1st CA' },
    { key: 'secondCA', label: '2nd CA' },
    { key: 'exam', label: 'Exam' },
    { key: 'totalScore', label: 'Total' },
    { key: 'percentage', label: '%' },
    { key: 'grade', label: 'Grade' },
    { key: 'positionText', label: 'Position' },
    { key: 'term', label: 'Term' },
  ]

  const handleSendToParent = async (resultId: string) => {
    try {
      setSending(resultId)
      const result = results.find(r => r.id === resultId)
      if (!result) {
        setSendMessage({ type: 'error', text: 'Result not found' })
        return
      }

      const student = students.find(s => s.id === result.studentId)
      if (!student || !student.parentEmail) {
        setSendMessage({ type: 'error', text: 'Parent email not found' })
        return
      }

      // Get all results for the student in the same term to send complete report
      const studentTermResults = results.filter(
        r => r.studentId === result.studentId && r.term === result.term && r.academicYear === result.academicYear
      )

      // Calculate positions for each result
      const resultsWithPositions = calculatePositions(studentTermResults, result.studentId)

      // Get class position
      const classPosition = getStudentClassPosition(
        results,
        result.studentId,
        result.term,
        result.academicYear
      )

      // Format results for email
      const formattedResults = resultsWithPositions.map(r => {
        const subject = subjects.find(s => s.id === r.subjectId)
        return {
          subject: subject?.name || 'Unknown Subject',
          grade: r.grade,
          percentage: r.percentage,
          position: r.positionText || getPositionSuffix(r.position || 0),
        }
      })

      // Send email via backend
      await apiService.post('/send-results-email', {
        parentEmail: student.parentEmail,
        studentName: `${student.firstName} ${student.lastName}`,
        term: result.term,
        academicYear: result.academicYear,
        results: formattedResults,
        classPosition,
        studentId: result.studentId,
      })

      // Track the result as sent
      trackResultAsSent(result.studentId, result.term, result.academicYear, student.parentEmail)

      setSendMessage({
        type: 'success',
        text: `Results sent to ${student.parentName} (${student.parentEmail})`,
      })
    } catch (error) {
      console.error('Failed to send results:', error)
      setSendMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send results',
      })
    } finally {
      setSending(null)
    }
  }

  const handleBulkSend = async (studentId: string) => {
    try {
      setSending(`bulk-${studentId}`)
      const student = students.find(s => s.id === studentId)
      if (!student || !student.parentEmail) {
        setSendMessage({ type: 'error', text: 'Parent email not found' })
        return
      }

      // Get results for this student in current filtered term
      const studentResults = results.filter(
        r => r.studentId === studentId && (selectedTerm === 'All' || r.term === selectedTerm)
      )

      if (studentResults.length === 0) {
        setSendMessage({ type: 'error', text: 'No results to send for this student' })
        return
      }

      const term = studentResults[0].term
      const academicYear = studentResults[0].academicYear

      // Calculate positions
      const resultsWithPositions = calculatePositions(studentResults, studentId)
      const classPosition = getStudentClassPosition(results, studentId, term, academicYear)

      const formattedResults = resultsWithPositions.map(r => {
        const subject = subjects.find(s => s.id === r.subjectId)
        return {
          subject: subject?.name || 'Unknown Subject',
          grade: r.grade,
          percentage: r.percentage,
          position: r.positionText || getPositionSuffix(r.position || 0),
        }
      })

      await apiService.post('/send-results-email', {
        parentEmail: student.parentEmail,
        studentName: `${student.firstName} ${student.lastName}`,
        term,
        academicYear,
        results: formattedResults,
        classPosition,
        studentId: student.id,
      })

      // Track the result as sent
      trackResultAsSent(student.id, term, academicYear, student.parentEmail)

      setSendMessage({
        type: 'success',
        text: `Results sent successfully to ${student.parentName}`,
      })
    } catch (error) {
      console.error('Failed to send results:', error)
      setSendMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send results',
      })
    } finally {
      setSending(null)
    }
  }

  // Get unique students in current view based on filters
  const studentsInCurrentView = useMemo(() => {
    let filteredResults = results

    // Apply term filter
    if (selectedTerm !== 'All') {
      filteredResults = filteredResults.filter(r => r.term === selectedTerm)
    }

    // Apply class filter
    if (selectedClass !== 'All') {
      filteredResults = filteredResults.filter(r => {
        const student = students.find(s => s.id === r.studentId)
        return student && student.class === selectedClass
      })
    }

    // Apply subject filter
    if (selectedSubject !== 'All') {
      filteredResults = filteredResults.filter(r => r.subjectId === selectedSubject)
    }

    // Get unique student IDs from filtered results
    const uniqueStudentIds = [...new Set(filteredResults.map(r => r.studentId))]
    
    return uniqueStudentIds
      .map(studentId => students.find(s => s.id === studentId))
      .filter((student): student is Student => student !== undefined && student.parentEmail !== undefined) // Only students with parent emails
  }, [results, selectedTerm, selectedClass, selectedSubject, students])

  // Function to send results to selected students only
  const handleSendToSelectedParents = async () => {
    if (!user || selectedStudents.size === 0) return

    setIsBulkSending(true)
    setSendMessage(null)

    try {
      // Get current term and year
      const currentTerm = selectedTerm === 'All' ? 'First' : selectedTerm
      const currentYear = results.length > 0 ? results[0].academicYear : new Date().getFullYear().toString()

      let successCount = 0
      let failureCount = 0

      // Get selected students from current view
      const selectedStudentsList = Array.from(selectedStudents)
        .map(studentId => students.find(s => s.id === studentId))
        .filter(student => student && student.parentEmail) // Only students with parent emails

      for (const student of selectedStudentsList) {
        try {
          if (!student || !student.parentEmail) continue

          const studentTermResults = results.filter(
            r => r.studentId === student.id && r.term === currentTerm && r.academicYear === currentYear
          )

          if (studentTermResults.length === 0) continue

          // Calculate positions for the student's results
          const resultsWithPositions = studentTermResults.map(result => {
            const subjectResults = results.filter(
              r => r.subjectId === result.subjectId && r.term === currentTerm && r.academicYear === currentYear
            )
            const positionData = getStudentClassPosition(subjectResults, result.studentId, currentTerm, currentYear)
            return {
              ...result,
              position: positionData.position,
              positionText: getPositionSuffix(positionData.position)
            }
          })

          // Format results for email
          const formattedResults = resultsWithPositions.map(r => {
            const subject = subjects.find(s => s.id === r.subjectId)
            return {
              subject: subject?.name || 'Unknown Subject',
              score: r.totalScore,
              totalMarks: r.totalScore,
              grade: r.grade,
              position: r.positionText,
              remarks: r.remarks
            }
          })

          // Send email via backend
          await apiService.post('/send-results-email', {
            parentEmail: student.parentEmail,
            studentName: `${student.firstName} ${student.lastName}`,
            term: currentTerm,
            academicYear: currentYear,
            results: formattedResults,
            studentId: student.id,
          })

          // Track the result as sent
          trackResultAsSent(student.id, currentTerm, currentYear, student.parentEmail)
          successCount++
        } catch (error) {
          console.error('Failed to send to individual parent:', error)
          failureCount++
        }
      }

      setSendMessage({
        type: 'success',
        text: `Results sent to ${successCount} selected parent${successCount !== 1 ? 's' : ''}${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
      })
    } catch (error) {
      console.error('Failed to send selected results:', error)
      setSendMessage({
        type: 'error',
        text: 'Failed to send some results. Please try again.',
      })
    } finally {
      setIsBulkSending(false)
    }
  }

  // Helper function to mark results as sent
  const trackResultAsSent = (studentId: string, term: string, academicYear: string, parentEmail: string) => {
    const newTracker: ResultsSentTracker = {
      id: `${studentId}-${term}-${academicYear}-${Date.now()}`,
      studentId,
      term,
      academicYear,
      sentDate: new Date().toISOString(),
      sentBy: user?.id || 'unknown',
      parentEmail,
      status: 'sent',
      attemptCount: 1,
    }
    const updatedTracker = [...resultsSentTracker, newTracker]
    setResultsSentTracker(updatedTracker)
    localStorage.setItem('resultsSentTracker', JSON.stringify(updatedTracker))
  }

  // Helper function to check if results were sent for a student
  const hasResultsBeenSent = (studentId: string, term: string, academicYear: string): boolean => {
    return resultsSentTracker.some(
      t => t.studentId === studentId && t.term === term && t.academicYear === academicYear && t.status === 'sent'
    )
  }

  
  
  // Filtered students for the student list view
  const displayStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !filterTerm || 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(filterTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(filterTerm.toLowerCase())
      
      const matchesClass = selectedClass === 'All' || student.class === selectedClass
      
      return matchesSearch && matchesClass
    }).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
  }, [students, filterTerm, selectedClass])

  return (
    <div className="p-8">
      {selectedStudentForEntry ? (
        <StudentResultEntryView
          student={selectedStudentForEntry}
          subjects={subjects}
          studentSubjects={allStudentSubjects}
          existingResults={results}
          onBack={() => setSelectedStudentForEntry(null)}
          onResultsSaved={loadData}
        />
      ) : (
        <>
          {sendMessage && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            sendMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <AlertCircle size={20} />
          <span>{sendMessage.text}</span>
          <button
            onClick={() => setSendMessage(null)}
            className="ml-auto text-lg font-semibold"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{pageDescription}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-4 items-center">
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
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Export
            </button>
            <button
              onClick={() => {
                setEditingResult(null)
                setShowForm(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
            <Plus size={20} />
            Add Result
          </button>
            <button
              onClick={handleSendToSelectedParents}
              disabled={isBulkSending || selectedStudents.size === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full font-black shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={selectedStudents.size === 0 ? 'Select students to send results' : `Send results to ${selectedStudents.size} selected student${selectedStudents.size > 1 ? 's' : ''}`}
            >
              {isBulkSending ? (
                <>
                  <Mail size={20} className="animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send to Selected ({selectedStudents.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <SubjectResultForm
              onSubmit={handleSubmitResult}
              initialData={editingResult || undefined}
              onCancel={() => setShowForm(false)}
              isEditing={!!editingResult}
              students={students}
              subjects={subjects}
            />
          </div>
        </div>
      )}

      {/* Subject Breakdown Modal */}
      {showSubjectBreakdown && selectedBreakdownSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-brand-900 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-indigo-500/30">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBreakdownSubject.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Subject Code: {selectedBreakdownSubject.code}</p>
                </div>
                <button
                  onClick={() => setShowSubjectBreakdown(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-brand-800 rounded transition-colors dark:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Class Average</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {filteredResults
                        .filter(r => r.subjectId === selectedBreakdownSubject.id)
                        .length > 0
                        ? (
                            filteredResults
                              .filter(r => r.subjectId === selectedBreakdownSubject.id)
                              .reduce((sum, r) => sum + r.percentage, 0) /
                            filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).length
                          ).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="card-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Highest Score</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-emerald-400">
                      {filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).length > 0
                        ? Math.max(...filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).map(r => r.totalScore))
                        : 0}
                    </p>
                  </div>
                  <div className="card-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Lowest Score</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-rose-400">
                      {filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).length > 0
                        ? Math.min(...filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).map(r => r.totalScore))
                        : 0}
                    </p>
                  </div>
                  <div className="card-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Pass Rate</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-indigo-400">
                      {filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).length > 0
                        ? Math.round(
                            (filteredResults
                              .filter(r => r.subjectId === selectedBreakdownSubject.id && r.percentage >= 50)
                              .length /
                              filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).length) *
                            100
                          )
                        : 0}%
                    </p>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="card-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((grade) => {
                      const count = filteredResults.filter(
                        r => r.subjectId === selectedBreakdownSubject.id && r.grade === grade
                      ).length
                      const total = filteredResults.filter(r => r.subjectId === selectedBreakdownSubject.id).length
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
                      return (
                        <div key={grade} className="bg-gray-50 dark:bg-brand-800 p-3 rounded-lg text-center border dark:border-indigo-500/20">
                          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Grade {grade}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{percentage}%</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="card-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
                  <div className="space-y-2">
                    {filteredResults
                      .filter(r => r.subjectId === selectedBreakdownSubject.id)
                      .sort((a, b) => b.totalScore - a.totalScore)
                      .slice(0, 5)
                      .map((result, index) => {
                        const student = students.find(s => s.id === result.studentId)
                        return (
                          <div key={result.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-brand-800 rounded border dark:border-indigo-500/20">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-gray-600 dark:text-gray-400">#{index + 1}</span>
                              <span className="font-medium text-gray-900 dark:text-white">{student?.firstName} {student?.lastName}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-lg text-green-600 dark:text-emerald-400">{result.totalScore}%</span>
                              <span className="ml-2 px-3 py-1 bg-green-100 dark:bg-emerald-900/30 text-green-800 dark:text-emerald-400 rounded-full text-sm font-semibold">{result.grade}</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student or subject..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          {(!teacher || !isFormTeacher || availableClasses.length > 1) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field"
              >
                <option value="All">All Classes</option>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          )}
          {teacher && isFormTeacher && availableClasses.length === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Form Class
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                {availableClasses[0]}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Term
            </label>
            <div className="flex gap-4 mb-6">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              >
                <option value="All">All Terms</option>
                <option value="First">First Term</option>
                <option value="Second">Second Term</option>
                <option value="Third">Third Term</option>
              </select>
                          </div>
          </div>
          {!teacher && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedSubject !== 'All') {
                      const subject = subjects.find(s => s.id === selectedSubject)
                      if (subject) {
                        setSelectedBreakdownSubject(subject)
                        setShowSubjectBreakdown(true)
                      }
                    }
                  }}
                  disabled={selectedSubject === 'All'}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
                  title="View detailed subject breakdown"
                >
                  <BarChart3 size={18} />
                  <span className="hidden sm:inline">Breakdown</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {viewMode === 'students' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayStudents.map((student) => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudentForEntry(student)}
                className="card-lg hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer group transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {student.registrationNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-brand-800 rounded text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">
                        {student.class}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            ))}
            {displayStudents.length === 0 && (
              <div className="col-span-full py-20 text-center card-lg border-dashed border-2">
                <User size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-bold">No students found matching your filters.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Student Selection Controls */}
            <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectAllMode === 'all'}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectAllMode === 'all' ? 'All Selected' : selectAllMode === 'none' ? 'None Selected' : `${selectedStudents.size} Selected`}
                </span>
                {selectedStudents.size > 0 && (
                  <button
                    onClick={() => {
                      setSelectedStudents(new Set())
                      setSelectAllMode('none')
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {selectedStudents.size > 0 ? `Ready to send to ${selectedStudents.size} student${selectedStudents.size > 1 ? 's' : ''}` : 'Select students to send results'}
              </div>
            </div>

            <div className="card-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage and track student results</p>
              </div>
              <Table
                columns={columns}
                data={filteredResults.map((result) => ({
                  ...result,
                  actions: (
                    <div className="flex gap-1 items-center">
                      <button
                        onClick={() => handleSendToParent(result.id)}
                        disabled={sending === result.id}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send to Parent"
                      >
                        {sending === result.id ? (
                          <Mail size={18} className="animate-pulse" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingResult(result)
                          setShowForm(true)
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Result"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteResult(result.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Result"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ),
                }))}
              />
              {filteredResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No results found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Results</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{filteredResults.length}</p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average Percentage</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {filteredResults.length > 0
              ? (filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average Score</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
            {filteredResults.length > 0
              ? Math.round(filteredResults.reduce((sum, r) => sum + r.totalScore, 0) / filteredResults.length)
              : 0}
          </p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pass Rate</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {filteredResults.length > 0
              ? Math.round((filteredResults.filter((r) => r.percentage >= 50).length / filteredResults.length) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <SubjectResultForm
              onSubmit={handleSubmitResult}
              initialData={editingResult || undefined}
              onCancel={() => setShowForm(false)}
              isEditing={!!editingResult}
              students={students}
              subjects={subjects}
            />
          </div>
        </div>
      )}
    </>
  )}
</div>
  )
}
