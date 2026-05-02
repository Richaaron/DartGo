import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { Plus, Search, AlertCircle, Filter, User, BookOpen, ClipboardList, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react'
import { SubjectResult, Student, Subject, StudentSubject, Teacher } from '../types'
import SubjectResultForm from '../components/SubjectResultForm'
import BulkSubjectResultEntry from '../components/BulkSubjectResultEntry'
import { createResult, updateResult, fetchStudentSubjects } from '../services/api'
import { useAuthContext } from '../context/AuthContext'

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
  const [filterTerm, setFilterTerm] = useState('')
  const [debouncedFilterTerm, setDebouncedFilterTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [apiError, setApiError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'bulk'>('list')
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null)

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

  // Get subjects assigned to the teacher
  // Form teachers with no assigned subjects can see all subjects for their class level
  const teacherSubjects = useMemo(() => {
    if (!isTeacher || !teacher) return subjects
    
    // Check both 'subject' (string) and 'assignedSubjects' (array)
    const assignedNames = new Set<string>()
    if (teacher.subject) assignedNames.add(teacher.subject)
    if (teacher.assignedSubjects) {
      teacher.assignedSubjects.forEach(s => assignedNames.add(s))
    }

    // If the teacher has specific assigned subjects, filter to those
    if (assignedNames.size > 0) {
      return subjects.filter(s => assignedNames.has(s.name) || assignedNames.has(s.id))
    }

    // Form teacher with no assigned subjects: show all subjects for their level
    // This lets them enter results for any subject in their class
    if (teacher.level) {
      const filtered = subjects.filter(s => s.level === teacher.level)
      if (filtered.length > 0) return filtered
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

  // Simple filtering for the combined list - uses debounced filter for performance
  const filteredDisplayData = useMemo(() => {
    const dataToFilter = isTeacher ? offeringStudents : results.map(r => ({ ...r, status: 'Completed' }))

    return dataToFilter.filter(item => {
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
      const matchesSubject = selectedSubject === 'All' || item.subjectId === selectedSubject

      return matchesSearch && matchesTerm && matchesClass && matchesSubject
    })
  }, [offeringStudents, results, students, subjects, debouncedFilterTerm, selectedTerm, selectedClass, selectedSubject, isTeacher])

  // Transform for display in the table with pagination
  const displayResults = useMemo(() => {
    const transformed = filteredDisplayData.map(item => {
      const student = students.find(s => s.id === item.studentId)
      const subject = subjects.find(s => s.id === item.subjectId)
      
      return {
        ...item,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        class: student ? student.class : 'Unknown Class',
        subjectName: subject ? subject.name : 'Unknown Subject',
        positionText: item.position ? `${item.position}th` : 'N/A'
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
      if ('id' in result) {
        // Update existing result
        await updateResult(result.id, result)
      } else {
        // Create new result
        await createResult(result)
      }
      await loadData()
      setShowForm(false)
      setEditingResult(null)
      setMessage({ type: 'success', text: 'Result saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to save result:', error)
      setMessage({ type: 'error', text: 'Failed to save result. Please try again.' })
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

  // If bulk mode is selected, show the bulk entry component
  if (viewMode === 'bulk') {
    return (
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Subject <span className="text-indigo-600 dark:text-indigo-400">Results</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Bulk entry mode - Enter multiple students at once</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-brand-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-brand-700 transition-all"
            >
              <List size={18} />
              List View
            </button>
          </div>
        </div>

        {/* Bulk Entry Component */}
        <BulkSubjectResultEntry
          subjects={subjects}
          students={students}
          studentSubjects={allStudentSubjects}
          existingResults={results}
          onResultsSaved={loadData}
          teacherSubjects={teacherSubjects}
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
          <button
            onClick={() => setViewMode('bulk')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg"
          >
            <LayoutGrid size={18} />
            Bulk Entry
          </button>
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
            <label htmlFor="list-subject-filter" className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">Subject</label>
            <select
              id="list-subject-filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field"
              aria-label="Filter by subject"
            >
              <option value="All">All {isTeacher ? 'My' : ''} Subjects</option>
              {teacherSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
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

      {/* Results Table */}
      <div className="card-lg">
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
                <tr key={result.id || index} className="hover:bg-brand-50 dark:hover:bg-indigo-900/10 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {result.studentName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{result.studentName}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Reg: {students.find(s => s.id === result.studentId)?.registrationNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-bold">{result.class}</td>
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
              initialData={editingResult || undefined}
              onCancel={handleCancel}
              isEditing={!!editingResult}
              students={students}
              subjects={isTeacher ? teacherSubjects : subjects}
            />
          </div>
        </div>
      )}
    </div>
  )
})

export default SubjectResultEntry
