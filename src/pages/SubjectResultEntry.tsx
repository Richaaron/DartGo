import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Plus, Search, Upload, AlertCircle } from 'lucide-react'
import { SubjectResult, Student, Subject } from '../types'

const PRIMARY_CLASSES = ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']
const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES]

const SubjectResultEntry = memo(function SubjectResultEntry() {
  const [results, setResults] = useState<SubjectResult[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingResult, setEditingResult] = useState<SubjectResult | null>(null)
  const [filterTerm, setFilterTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [selectedStudent, setSelectedStudent] = useState<string>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [apiError, setApiError] = useState<string | null>(null)

  // Simple data loading with timeout
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setApiError(null)
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setApiError('Loading timeout. Please check your connection and try again.')
      setIsLoading(false)
    }, 5000) // 5 second timeout

    try {
      // Try to import and use API functions
      const { fetchStudents, fetchResults, fetchSubjects } = await import('../services/api')
      
      const [studentsData, resultsData, subjectsData] = await Promise.all([
        fetchStudents().catch(err => {
          console.warn('Failed to fetch students, using fallback:', err)
          return [] // Return empty array as fallback
        }),
        fetchResults().catch(err => {
          console.warn('Failed to fetch results, using fallback:', err)
          return [] // Return empty array as fallback
        }),
        fetchSubjects().catch(err => {
          console.warn('Failed to fetch subjects, using fallback:', err)
          return [] // Return empty array as fallback
        })
      ])
      
      setStudents(studentsData)
      setResults(resultsData)
      setSubjects(subjectsData)
    } catch (error: any) {
      console.error('Failed to load results data', error)
      setApiError('Failed to load data. Please try again.')
      // Set empty data to prevent crashes
      setStudents([])
      setResults([])
      setSubjects([])
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Get all available classes
  const availableClasses = useMemo(() => {
    return ALL_CLASSES
  }, [])

  // Filter students based on selected class
  const classFilteredStudents = useMemo(() => {
    if (selectedClass === 'All') return students
    return students.filter(s => s.class === selectedClass)
  }, [students, selectedClass])

  // Simple filtering without complex calculations
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const student = students.find(s => s.id === result.studentId)
      if (!student) return false

      const matchesSearch = filterTerm === '' || 
        student.registrationNumber.toLowerCase().includes(filterTerm.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(filterTerm.toLowerCase())
      
      const matchesTerm = selectedTerm === 'All' || result.term === selectedTerm
      const matchesClass = selectedClass === 'All' || student.class === selectedClass
      const matchesStudent = selectedStudent === 'All' || student.id === selectedStudent

      return matchesSearch && matchesTerm && matchesClass && matchesStudent
    })
  }, [results, students, filterTerm, selectedTerm, selectedClass, selectedStudent])

  // Simple data transformation without calculatePositions
  const displayResults = useMemo(() => {
    return filteredResults.map(result => {
      const student = students.find(s => s.id === result.studentId)
      const subject = subjects.find(s => s.id === result.subjectId)
      
      return {
        ...result,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        class: student ? student.class : 'Unknown Class',
        subjectName: subject ? subject.name : 'Unknown Subject',
        positionText: result.position ? `${result.position}th` : 'N/A'
      }
    })
  }, [filteredResults, students, subjects])

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

  const handleRetry = () => {
    loadData()
  }

  if (apiError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Data Loading Error</h2>
        <p className="text-gray-600 mb-4">{apiError}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading subject results...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subject Results</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Enter CA and Exam scores for automated grading</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setEditingResult(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
          >
            <Plus size={20} />
            Add Result
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by student or subject..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="input-field pl-10 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setSelectedStudent('All')
              }}
              className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="All">All Students</option>
              {classFilteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="All">All Terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table - Simple Version */}
      <div className="card-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-purple-700/50 bg-gray-50 dark:bg-gradient-to-r dark:from-slate-700/80 dark:to-slate-800/80">
                <th className="table-header text-left">Student Name</th>
                <th className="table-header text-left">Class</th>
                <th className="table-header text-left">Subject</th>
                <th className="table-header text-left">Term</th>
                <th className="table-header text-left">1st CA</th>
                <th className="table-header text-left">2nd CA</th>
                <th className="table-header text-left">Exam</th>
                <th className="table-header text-left">Total</th>
                <th className="table-header text-left">%</th>
                <th className="table-header text-left">Position</th>
                <th className="table-header text-left">Grade</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map((result, index) => (
                <tr key={result.id || index} className="hover:bg-gray-50 dark:hover:bg-purple-900/20 transition-colors">
                  <td className="table-cell">{result.studentName}</td>
                  <td className="table-cell">{result.class}</td>
                  <td className="table-cell">{result.subjectName}</td>
                  <td className="table-cell">{result.term}</td>
                  <td className="table-cell">{result.firstCA || 0}</td>
                  <td className="table-cell">{result.secondCA || 0}</td>
                  <td className="table-cell">{result.exam || 0}</td>
                  <td className="table-cell">{result.totalScore || 0}</td>
                  <td className="table-cell">{result.percentage || 0}%</td>
                  <td className="table-cell">{result.positionText}</td>
                  <td className="table-cell">{result.grade || 'N/A'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingResult(result)
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteResult(result.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Delete
                      </button>
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
      </div>
    </div>
  )
})

export default SubjectResultEntry
