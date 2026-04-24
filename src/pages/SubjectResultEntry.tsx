import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { ChangeEvent } from 'react'
import { Plus, Trash2, Search, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { SubjectResult, Student, Subject } from '../types'
import SubjectResultForm from '../components/SubjectResultForm'
import Table from '../components/Table'
import { useAuthContext } from '../context/AuthContext'
import { calculatePositions } from '../utils/calculations'

const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Subject Results</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Result
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search students..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Terms</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Classes</option>
            {Array.from(new Set(students.map(s => s.class))).map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Students</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} ({student.registrationNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <Table
        data={calculatedResults}
        columns={[
          { key: 'studentName', label: 'Student' },
          { key: 'subject', label: 'Subject' },
          { key: 'term', label: 'Term' },
          { key: 'firstCA', label: 'First CA' },
          { key: 'secondCA', label: 'Second CA' },
          { key: 'exam', label: 'Exam' },
          { key: 'totalScore', label: 'Total' },
          { key: 'grade', label: 'Grade' },
          { key: 'position', label: 'Position' }
        ]}
        actions={[
          {
            label: 'Edit',
            onClick: (result) => {
              setEditingResult(result)
              setShowForm(true)
            }
          },
          {
            label: 'Delete',
            onClick: (result) => handleDeleteResult(result.id)
          }
        ]}
      />

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
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Bulk Upload Results</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
