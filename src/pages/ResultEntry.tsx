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
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load results data', error)
      }
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
    <div className="space-y-12">
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
              className={`p-6 rounded-4xl flex items-center gap-5 border ${
                sendMessage.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}
            >
              <AlertCircle size={24} />
              <span className="font-bold tracking-tight">{sendMessage.text}</span>
              <button onClick={() => setSendMessage(null)} className="ml-auto p-3 hover:bg-black/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
          )}

          {/* ── Dynamic Header ────────────────────────────── */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
                Result Management
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
                Result <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Center.</span>
              </h1>
              <p className="text-slate-500 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
                {pageDescription}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="flex bg-slate-900 border border-white/5 p-2 rounded-3xl shadow-xl">
                <button
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${
                    viewMode === 'students' && activeTab === 'entry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-400'
                  }`}
                  onClick={() => { setViewMode('students'); setActiveTab('entry') }}
                >
                  <User size={15} /> Student List
                </button>
                <button
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${
                    viewMode === 'results' && activeTab === 'entry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-400'
                  }`}
                  onClick={() => { setViewMode('results'); setActiveTab('entry') }}
                >
                  <List size={15} /> Result List
                </button>
                {(isFormTeacher || user?.role === 'Admin') && (
                  <button
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${
                      activeTab === 'release' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-rose-400'
                    }`}
                    onClick={() => setActiveTab('release')}
                  >
                    <Unlock size={15} /> Release Results
                  </button>
                )}
              </div>
              
              <div className="flex gap-4">
              <div className="flex gap-4">
                <button onClick={handleExport} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border border-white/5 hover:bg-slate-800 transition-all">
                  <Download size={20} className="text-indigo-400" /> 
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
                  <Plus size={20} /> 
                  <span className="hidden sm:inline">Add Result</span>
                </button>
              </div>
              </div>
            </div>
          </div>

          {activeTab === 'release' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg">
              <ReleaseResultsPanel students={students} results={results} onRefresh={loadData} />
            </div>
          )}

          {activeTab === 'entry' && (
            <div className="space-y-10">
              {/* Filters */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
                      Search Student
                    </label>
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="input !pl-16 !bg-slate-50 dark:!bg-slate-950/50"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
                      Filter by Class
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="input !bg-slate-50 dark:!bg-slate-950/50"
                    >
                      <option value="All" className="bg-white dark:bg-slate-900">All Classes</option>
                      {availableClasses.map(cls => <option key={cls} value={cls} className="bg-white dark:bg-slate-900">{cls}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Matrix */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg overflow-hidden">
                {viewMode === 'students' ? (
                  <Table
                    columns={[
                      { 
                        key: 'studentName', 
                        label: 'Student Name',
                        render: (v, row) => <span className="font-bold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</span>
                      },
                      { key: 'class', label: 'Class' },
                      {
                        key: 'actions',
                        label: 'Action',
                        render: (v, row: Student) => (
                          <button
                            onClick={() => setSelectedStudentForEntry(row)}
                            className="px-8 py-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black tracking-widest uppercase border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
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
                        <div className="flex gap-3">
                          <button 
                            onClick={() => { setEditingResult(r); setShowForm(true) }} 
                            className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all border border-indigo-500/20"
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteResult(r.id)} 
                            className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all border border-rose-500/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )
                    }))}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg group hover:border-indigo-400 transition-all">
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Total Results</p>
                    <BarChart3 className="w-5 h-5 text-indigo-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{filteredResults.length}</p>
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
              <div className="bg-white dark:bg-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="p-12 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Enter Result</h2>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.35em] mt-3">Add or edit student score</p>
                </div>
                <div className="p-12">
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
            </div>
          )}
        </>
      )}
    </div>
  )
}
