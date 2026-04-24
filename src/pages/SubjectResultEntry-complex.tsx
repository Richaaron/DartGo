import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { ChangeEvent } from 'react'
import { Plus, Trash2, Search, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { SubjectResult, Student, Subject } from '../types'
import SubjectResultForm from '../components/SubjectResultForm'
import Table from '../components/Table'
import { useAuthContext } from '../context/AuthContext'
import { calculatePositions } from '../utils/calculations'

const PRIMARY_CLASSES = ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']
const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES]

const SubjectResultEntry = memo(function SubjectResultEntry() {
  const { user } = useAuthContext()
  const isTeacher = user?.role === 'Teacher'
  const teacherType = isTeacher ? (user as any)?.teacherType : undefined
  const normalizedAssignedClasses = useMemo(() => {
    const rawClasses = (user as any)?.assignedClasses
    if (Array.isArray(rawClasses)) {
      return rawClasses.map((item) => String(item || '').trim()).filter(Boolean)
    }
    if (typeof rawClasses === 'string') {
      return rawClasses
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean)
    }
    return []
  }, [user])
  const teacherSubjects =
    ((user as any)?.assignedSubjects && (user as any).assignedSubjects.length > 0
      ? (user as any).assignedSubjects
      : ((user as any)?.subject || '')
          .split(',')
          .map((subject: string) => subject.trim())
          .filter(Boolean)) as string[]
  const isSubjectCapableTeacher =
    isTeacher &&
    (
      teacherType === 'Subject Teacher' ||
      teacherType === 'Form + Subject Teacher' ||
      (!teacherType && teacherSubjects.length > 0)
    )
  const assignedClasses = normalizedAssignedClasses

  const [results, setResults] = useState<SubjectResult[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editingResult, setEditingResult] = useState<SubjectResult | null>(null)
  const [filterTerm, setFilterTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [selectedStudent, setSelectedStudent] = useState<string>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [apiError, setApiError] = useState<string | null>(null)

  // Safe API calls with error handling
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setApiError(null)
    
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
      
      if (isTeacher) {
        // Any teacher with subject-teaching capability can work across secondary classes here.
        // Form-only teachers remain scoped to assigned classes.
        const myStudents = isSubjectCapableTeacher
          ? studentsData.filter((s: Student) => s.level === 'Secondary')
          : studentsData.filter((s: Student) => assignedClasses.includes(s.class))
        setStudents(myStudents)
        
        // Teacher: always scoped to assigned subjects.
        const myResults = resultsData.filter((r: SubjectResult) => {
          const student = studentsData.find((s: Student) => s.id === r.studentId)
          const subject = subjectsData.find((sub: Subject) => sub.id === r.subjectId)
          const matchesSubject = teacherSubjects.length === 0 || teacherSubjects.includes(subject?.name || '')
          if (!student || !matchesSubject) return false
          if (isSubjectCapableTeacher) return student.level === 'Secondary'
          return assignedClasses.includes(student.class)
        })
        setResults(myResults)
        
        // Teacher: only see their assigned subjects in the dropdowns
        setSubjects(
          teacherSubjects.length > 0
            ? subjectsData.filter((s: Subject) => teacherSubjects.includes(s.name))
            : subjectsData
        )
      } else {
        setStudents(studentsData)
        setResults(resultsData)
        setSubjects(subjectsData)
      }
    } catch (error: any) {
      console.error('Failed to load results data', error)
      setApiError('Failed to load data. Please try again.')
      // Set empty data to prevent crashes
      setStudents([])
      setResults([])
      setSubjects([])
    } finally {
      setIsLoading(false)
    }
  }, [isTeacher, isSubjectCapableTeacher, assignedClasses, teacherSubjects])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmitResult = useCallback(async (resultData: SubjectResult | Omit<SubjectResult, 'id'>) => {
    try {
      const { createResult, updateResult } = await import('../services/api')
      
      if ('id' in resultData) {
        const updated = await updateResult(resultData.id, resultData)
        setResults(prev => prev.map(r => r.id === updated.id ? updated : r))
      } else {
        const created = await createResult(resultData)
        setResults(prev => [...prev, created])
      }
      setShowForm(false)
      setMessage({ type: 'success', text: 'Result saved successfully!' })
      window.setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to save result:', error)
      setMessage({ type: 'error', text: 'Failed to save result' })
    }
  }, [])

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

  const handleBulkUpload = useCallback((event: ChangeEvent<any>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const csvData = results.data as any[]
        
        try {
          const { saveBulkResults } = await import('../services/api')
          const res = await saveBulkResults(csvData)
          window.alert(res.message || 'Bulk upload successful')
          loadData()
          setShowBulkModal(false)
        } catch (error) {
          console.error('Failed to process bulk upload:', error)
          window.alert('Failed to process bulk upload')
        }
      }
    })
  }, [loadData])

  // Get all available classes (show all standard classes, not just classes with students)
  const availableClasses = useMemo(() => {
    // For admin, show all classes
    // For teachers, show their assigned classes or all secondary classes if subject teacher
    if (!isTeacher) {
      return ALL_CLASSES
    }
    
    if (isSubjectCapableTeacher) {
      return SECONDARY_CLASSES
    }
    
    // For form teachers, show their assigned classes but also include all standard classes for completeness
    const assignedClassList = assignedClasses.length > 0 ? assignedClasses : ALL_CLASSES
    return ALL_CLASSES.filter(cls => assignedClassList.includes(cls))
  }, [isTeacher, isSubjectCapableTeacher, assignedClasses])

  // Filter students based on selected class
  const classFilteredStudents = useMemo(() => {
    if (selectedClass === 'All') return students
    return students.filter(s => s.class === selectedClass)
  }, [students, selectedClass])

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

  const calculatedResults = useMemo(() => {
    return calculatePositions(filteredResults)
  }, [filteredResults])

  if (apiError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Data Loading Error</h2>
        <p className="text-gray-600 mb-4">{apiError}</p>
        <button
          onClick={loadData}
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
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md"
          >
            <Upload size={20} />
            Bulk Upload
          </button>
          <button
            onClick={() => {
              setEditingResult(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
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
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
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

      {/* Results Table */}
      <div className="card-lg">
        <Table
          data={calculatedResults}
          columns={[
            { key: 'studentName', label: 'Student Name' },
            { key: 'class', label: 'Class' },
            { key: 'subjectName', label: 'Subject' },
            { key: 'firstCA', label: '1st CA' },
            { key: 'secondCA', label: '2nd CA' },
            { key: 'exam', label: 'Exam' },
            { key: 'totalScore', label: 'Total' },
            { key: 'percentage', label: '%' },
            { key: 'positionText', label: 'Position' },
            { key: 'grade', label: 'Grade' },
          ]}
          actions={[
            {
              label: 'Edit',
              onClick: (result: any) => {
                setEditingResult(result)
                setShowForm(true)
              }
            },
            {
              label: 'Delete',
              onClick: (result: any) => handleDeleteResult(result.id)
            }
          ]}
        />
      </div>

      {/* Forms */}
      {showForm && (
        <SubjectResultForm
          result={editingResult}
          students={students}
          subjects={subjects}
          onSubmit={handleSubmitResult}
          onCancel={() => {
            setShowForm(false)
            setEditingResult(null)
          }}
        />
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Bulk Upload Results</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default SubjectResultEntry
