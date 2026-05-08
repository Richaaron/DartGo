import { useState, useEffect, useMemo } from 'react'

// Define all standard classes
const PRIMARY_CLASSES = ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']
const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES]
import { Plus, Trash2, Search, Download, Send, Mail, AlertCircle, CheckCircle2, Clock, BarChart3, X, User, ChevronRight, List, Unlock, Lock } from 'lucide-react'
import ReleaseResultsPanel from '../components/ReleaseResultsPanel'
import { SubjectResult, Student, Subject, ResultsSentTracker, StudentSubject } from '../types'
import { useAuthContext } from '../context/AuthContext'
import SubjectResultForm from '../components/SubjectResultForm'
import StudentResultEntryView from '../components/StudentResultEntryView'
import Table from '../components/Table'
import { formatDate, exportToCSV, calculatePositions, getStudentClassPosition, getPositionSuffix } from '../utils/calculations'
import { fetchStudents, fetchResults, fetchSubjects, deleteResult, createResult, updateResult, fetchStudentSubjects, fetchObservations, fetchConfig, fetchTeachers } from '../services/api'
import apiService from '../services/apiService'
import PrintResult from '../components/PrintResult'
import { Printer, Loader2, ChevronLeft } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  const [selectedStudentResults, setSelectedStudentResults] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  // New state for bulk sending and tracking
  const [resultsSentTracker, setResultsSentTracker] = useState<ResultsSentTracker[]>([])
  const [isBulkSending, setIsBulkSending] = useState(false)
  const [observations, setObservations] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  
  // State for class-based control (teachers always use class view)
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [selectedSubject, setSelectedSubject] = useState<string>('All') // Only used by admins
  
  // New state for student selection
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState<'all' | 'none' | 'custom'>('none')
  const [activeTab, setActiveTab] = useState<'entry' | 'release'>('entry')
  
  // Subject breakdown state
  const [showSubjectBreakdown, setShowSubjectBreakdown] = useState(false)
  const [selectedBreakdownSubject, setSelectedBreakdownSubject] = useState<Subject | null>(null)

  // Student selection handlers
  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = () => {
    const currentViewStudentIds = new Set(
      displayStudents.map(s => s.id)
    )
    
    if (selectedStudents.size === currentViewStudentIds.size) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(currentViewStudentIds)
    }
  }

  // Determine role access
  const hasAssignedClasses = Array.isArray(teacher?.assignedClasses) && teacher.assignedClasses.length > 0
  const hasAssignedSubjects = (Array.isArray(teacher?.assignedSubjects) && teacher.assignedSubjects.length > 0) ||
    (typeof teacher?.subject === 'string' && teacher.subject.trim().length > 0)
  const isFormTeacher = teacher?.teacherType === 'Form Teacher' || teacher?.teacherType === 'Form + Subject Teacher' ||
    (!teacher?.teacherType && hasAssignedClasses)
  const isSubjectTeacher = teacher?.teacherType === 'Subject Teacher' || teacher?.teacherType === 'Form + Subject Teacher' ||
    (!teacher?.teacherType && hasAssignedSubjects)

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

  const singleStudentResults = useMemo(() => {
    if (!selectedStudentResults) return null
    const student = students.find(s => s.id === selectedStudentResults)
    if (!student) return null
    
    const studentResults = results.filter(r => r.studentId === selectedStudentResults)
    const classPos = getStudentClassPosition(
      results,
      student.id,
      studentResults[0]?.term || 'First',
      studentResults[0]?.academicYear || new Date().getFullYear().toString()
    )

    const observation = observations.find(o => 
      o.studentId === selectedStudentResults && 
      (o.term === (studentResults[0]?.term || 'First') || o.term === (studentResults[0]?.term || 'First Term'))
    )
    
    const classTeacher = teachers.find(t => 
      Array.isArray(t.assignedClasses) && t.assignedClasses.includes(student.class)
    )

    return {
      student,
      results: studentResults,
      classPositionText: classPos.positionText,
      observation,
      config,
      classTeacher
    }
  }, [selectedStudentResults, students, results, observations, config, teachers])

  async function loadData() {
    try {
      const [studentsData, resultsData, subjectsData, studentSubjectsData, observationsData, configData, teachersData] = await Promise.all([
        fetchStudents().catch(() => []),
        fetchResults().catch(() => []),
        fetchSubjects().catch(() => []),
        fetchStudentSubjects().catch(() => []),
        fetchObservations().catch(() => []),
        fetchConfig().catch(() => null),
        fetchTeachers().catch(() => [])
      ])
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setResults(Array.isArray(resultsData) ? resultsData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setAllStudentSubjects(Array.isArray(studentSubjectsData) ? studentSubjectsData : [])
      setObservations(Array.isArray(observationsData) ? observationsData : [])
      setConfig(configData)
      setTeachers(Array.isArray(teachersData) ? teachersData : [])
    } catch (error) {
      console.error('Failed to load results data', error)
    }
  }

  useEffect(() => {
    loadData()
    const savedTracker = localStorage.getItem('resultsSentTracker')
    if (savedTracker) {
      setResultsSentTracker(JSON.parse(savedTracker))
    }
  }, [])

  const filteredResults = useMemo(() => {
    let filtered = results.filter((result) => {
      const student = students.find((s) => s.id === result.studentId)
      const subject = subjects.find((sub) => sub.id === result.subjectId)
      const studentName = student ? `${student.firstName} ${student.lastName}` : ''
      const subjectName = subject?.name || ''
      const studentClass = student?.class || ''

      const matchesSearch = studentName.toLowerCase().includes(filterTerm.toLowerCase()) ||
                          subjectName.toLowerCase().includes(filterTerm.toLowerCase())
      const matchesTerm = selectedTerm === 'All' || result.term === selectedTerm
      const matchesClass = selectedClass === 'All' || studentClass === selectedClass

      // Role restrictions
      let matchesRole = true
      if (teacher) {
        if (isFormTeacher && !isSubjectTeacher) {
          matchesRole = teacher.assignedClasses?.includes(studentClass) || false
        } else if (isSubjectTeacher && !isFormTeacher) {
          matchesRole = teacher.assignedSubjects?.includes(subjectName) || teacher.subject === subjectName || false
        }
      }

      return matchesSearch && matchesTerm && matchesClass && matchesRole
    })

    return filtered
  }, [results, students, subjects, filterTerm, selectedTerm, selectedClass, teacher, isFormTeacher, isSubjectTeacher])

  const pageTitle = isFormTeacher && !isSubjectTeacher ? 'Form Teacher - Result Entry' : 
                   isSubjectTeacher && !isFormTeacher ? 'Subject Teacher - Result Entry' : 'Result Entry'
  
  const pageDescription = isFormTeacher ? 'Enter results for your form class' : 
                         isSubjectTeacher ? 'Enter results for your assigned subjects' : 'Manage results for all classes'

  const handleSubmitResult = async (result: any) => {
    try {
      if (result.id) {
        await updateResult(result.id, result)
      } else {
        await createResult(result)
      }
      await loadData()
      setShowForm(false)
      setEditingResult(null)
    } catch (error) {
      window.alert('Failed to save result')
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
    const dataToExport = filteredResults.map((result) => {
      const student = students.find(s => s.id === result.studentId)
      const subject = subjects.find(s => s.id === result.subjectId)
      return {
        'Student Name': student ? `${student.firstName} ${student.lastName}` : 'N/A',
        Subject: subject?.name || 'N/A',
        'Total Score': result.totalScore,
        Grade: result.grade,
        Term: result.term,
        'Academic Year': result.academicYear,
        Status: result.status || 'DRAFT'
      }
    })
    exportToCSV(dataToExport, 'results_report')
  }

  const columns = [
    { 
      key: 'studentName', 
      label: 'Student Name',
      render: (value: any, row: any) => {
        const student = students.find(s => s.id === row.studentId)
        return student ? `${student.firstName} ${student.lastName}` : 'N/A'
      }
    },
    { 
      key: 'subjectName', 
      label: 'Subject',
      render: (value: any, row: any) => {
        const subject = subjects.find(s => s.id === row.subjectId)
        return subject?.name || 'N/A'
      }
    },
    { key: 'firstCA', label: '1st CA' },
    { key: 'secondCA', label: '2nd CA' },
    { key: 'exam', label: 'Exam' },
    { key: 'totalScore', label: 'Total' },
    { key: 'grade', label: 'Grade' },
    { key: 'term', label: 'Term' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          value === 'RELEASED' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
        }`}>
          {value === 'RELEASED' ? <Unlock size={10} /> : <Lock size={10} />}
          {value || 'DRAFT'}
        </span>
      )
    },
  ]

  const handleSendToParent = async (resultId: string) => {
    // Logic for single student send
  }

  const handleSendToSelectedParents = async () => {
    // Logic for bulk send
  }

  const trackResultAsSent = (studentId: string, term: string, academicYear: string, parentEmail: string) => {
    const newTracker: ResultsSentTracker = {
      id: `${studentId}-${term}-${academicYear}-${Date.now()}`,
      studentId, term, academicYear,
      sentDate: new Date().toISOString(),
      sentBy: user?.id || 'unknown',
      parentEmail, status: 'sent', attemptCount: 1,
    }
    const updatedTracker = [...resultsSentTracker, newTracker]
    setResultsSentTracker(updatedTracker)
    localStorage.setItem('resultsSentTracker', JSON.stringify(updatedTracker))
  }

  // List of classes available to this user
  const availableClasses = useMemo(() => {
    if (!teacher || user?.role === 'Admin') return ALL_CLASSES;
    return teacher.assignedClasses || [];
  }, [teacher, user?.role])

  const displayStudents = useMemo(() => {
    return students.filter(student => {
      // Role restrictions for students list
      if (teacher && user?.role === 'Teacher') {
        const isAssigned = teacher.assignedClasses?.includes(student.class);
        if (!isAssigned) return false;
      }

      const matchesSearch = !filterTerm || 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(filterTerm.toLowerCase())
      const matchesClass = selectedClass === 'All' || student.class === selectedClass
      return matchesSearch && matchesClass
    }).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
  }, [students, filterTerm, selectedClass, teacher, user?.role])

  const handlePrint = () => { /* Print logic */ }
  const handleDownloadPDF = async () => { /* PDF logic */ }

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
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              sendMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <AlertCircle size={20} />
              <span>{sendMessage.text}</span>
              <button onClick={() => setSendMessage(null)} className="ml-auto text-lg">×</button>
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{pageDescription}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4 items-center">
                <div className="flex bg-slate-100 dark:bg-brand-800 p-1 rounded-xl border border-slate-200">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
                      viewMode === 'students' && activeTab === 'entry' ? 'bg-white text-indigo-600' : 'text-gray-500'
                    }`}
                    onClick={() => { setViewMode('students'); setActiveTab('entry') }}
                  >
                    <User size={18} /> STUDENT VIEW
                  </button>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
                      viewMode === 'results' && activeTab === 'entry' ? 'bg-white text-indigo-600' : 'text-gray-500'
                    }`}
                    onClick={() => { setViewMode('results'); setActiveTab('entry') }}
                  >
                    <List size={18} /> RESULT LIST
                  </button>
                  {(isFormTeacher || user?.role === 'Admin') && (
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
                        activeTab === 'release' ? 'bg-white text-yellow-600' : 'text-gray-500'
                      }`}
                      onClick={() => setActiveTab('release')}
                    >
                      <Unlock size={18} /> RELEASE RESULTS
                    </button>
                  )}
                </div>
                <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                  <Download size={20} /> Export
                </button>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                  <Plus size={20} /> Add Result
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'release' && (
            <ReleaseResultsPanel students={students} results={results} onRefresh={loadData} />
          )}

          {activeTab === 'entry' && (
            <>
              <div className="professional-card p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={filterTerm}
                      onChange={(e) => setFilterTerm(e.target.value)}
                      className="input-field pl-10 py-3 w-full"
                    />
                  </div>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="input-field py-3 min-w-[200px]"
                  >
                    <option value="All">All {user?.role === 'Teacher' ? 'My' : ''} Classes</option>
                    {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
              </div>

              <div className="professional-card overflow-hidden">
                {viewMode === 'students' ? (
                  <Table
                    columns={[
                      { 
                        key: 'studentName', 
                        label: 'Student',
                        render: (v, row) => `${row.firstName} ${row.lastName}`
                      },
                      { key: 'class', label: 'Class' },
                      {
                        key: 'actions',
                        label: 'Actions',
                        render: (v, row: Student) => (
                          <button
                            onClick={() => setSelectedStudentForEntry(row)}
                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-bold"
                          >
                            Enter Results
                          </button>
                        )
                      }
                    ]}
                    data={displayStudents}
                  />
                ) : (
                  <Table
                    columns={columns}
                    data={filteredResults.map(r => ({
                      ...r,
                      actions: (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingResult(r); setShowForm(true) }} className="text-indigo-600"><Plus size={18} /></button>
                          <button onClick={() => handleDeleteResult(r.id)} className="text-red-600"><Trash2 size={18} /></button>
                        </div>
                      )
                    }))}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                <div className="card-lg text-center">
                  <p className="text-sm font-medium text-gray-500">Total Results</p>
                  <p className="text-3xl font-black">{filteredResults.length}</p>
                </div>
                {/* Other stats... */}
              </div>
            </>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6">
                <SubjectResultForm
                  onSubmit={handleSubmitResult}
                  initialData={editingResult || undefined}
                  onCancel={() => { setShowForm(false); setEditingResult(null) }}
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
