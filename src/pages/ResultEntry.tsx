import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Search, Download, Send, Mail, AlertCircle } from 'lucide-react'
import { SubjectResult, Student, Subject } from '../types'
import SubjectResultForm from '../components/SubjectResultForm'
import Table from '../components/Table'
import { formatDate, exportToCSV, calculatePositions, getStudentClassPosition, getPositionSuffix } from '../utils/calculations'
import { fetchStudents, fetchResults, fetchSubjects, deleteResult, createResult, updateResult } from '../services/api'
import apiService from '../services/apiService'

export default function ResultEntry() {
  const [results, setResults] = useState<SubjectResult[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingResult, setEditingResult] = useState<SubjectResult | null>(null)
  const [filterTerm, setFilterTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [sending, setSending] = useState<string | null>(null)
  const [sendMessage, setSendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadData() {
    try {
      const [studentsData, resultsData, subjectsData] = await Promise.all([
        fetchStudents(),
        fetchResults(),
        fetchSubjects()
      ])
      setStudents(studentsData)
      setResults(resultsData)
      setSubjects(subjectsData)
    } catch (error) {
      console.error('Failed to load results data', error)
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([fetchStudents(), fetchResults(), fetchSubjects()])
      .then(([studentsData, resultsData, subjectsData]) => {
        if (!isMounted) return
        setStudents(studentsData)
        setResults(resultsData)
        setSubjects(subjectsData)
      })
      .catch((error) => {
        console.error('Failed to load results data', error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredResults = useMemo(() => {
    const getResultDetailsForFilter = (result: SubjectResult) => {
      const student = students.find((s) => s.id === result.studentId)
      const subject = subjects.find((sub) => sub.id === result.subjectId)

      return {
        ...result,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        subjectName: subject?.name || 'Unknown Subject',
      }
    }

    let filtered = results
      .filter((result) => {
        const details = getResultDetailsForFilter(result)
        const matchesFilter =
          details.studentName.toLowerCase().includes(filterTerm.toLowerCase()) ||
          details.subjectName.toLowerCase().includes(filterTerm.toLowerCase())

        const matchesTerm = selectedTerm === 'All' || result.term === selectedTerm

        return matchesFilter && matchesTerm
      })
      .map(getResultDetailsForFilter)

    // Add positions for results
    // Group by term and academic year to calculate positions
    const grouped = new Map<string, SubjectResult[]>()
    filtered.forEach(result => {
      const key = `${result.term}-${result.academicYear}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(result)
    })

    // Calculate positions for each group
    const withPositions: SubjectResult[] = []
    grouped.forEach((groupResults) => {
      const positioned = calculatePositions(groupResults)
      withPositions.push(...positioned)
    })

    return withPositions
  }, [results, students, subjects, filterTerm, selectedTerm])

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

  return (
    <div className="p-8">
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
          <h1 className="text-3xl font-bold text-gray-900">Result Entry</h1>
          <p className="text-gray-600 mt-2">Record and manage student results with position-based ranking</p>
        </div>
        <div className="flex gap-4">
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
        </div>
      </div>

      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input-field"
            >
              <option value="All">All Terms</option>
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
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

      <div className="card-lg">
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
                  className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => handleDeleteResult(result.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="card-lg text-center">
          <p className="text-gray-600 text-sm">Total Results</p>
          <p className="text-3xl font-bold text-gray-900">{filteredResults.length}</p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 text-sm">Average Percentage</p>
          <p className="text-3xl font-bold text-blue-600">
            {filteredResults.length > 0
              ? (filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 text-sm">Average Score</p>
          <p className="text-3xl font-bold text-gray-900">
            {filteredResults.length > 0
              ? Math.round(filteredResults.reduce((sum, r) => sum + r.totalScore, 0) / filteredResults.length)
              : 0}
          </p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 text-sm">Pass Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {filteredResults.length > 0
              ? Math.round((filteredResults.filter((r) => r.percentage >= 50).length / filteredResults.length) * 100)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  )
}
