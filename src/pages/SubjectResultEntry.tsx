import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Search, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { SubjectResult, Student, Subject } from '../types'
import SubjectResultForm from '../components/SubjectResultForm'
import Table from '../components/Table'
import { fetchStudents, fetchResults, fetchSubjects, saveBulkResults, deleteResult, createResult, updateResult } from '../services/api'

export default function SubjectResultEntry() {
  const [results, setResults] = useState<SubjectResult[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editingResult, setEditingResult] = useState<SubjectResult | null>(null)
  const [filterTerm, setFilterTerm] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('All')
  const [selectedStudent, setSelectedStudent] = useState<string>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  const getResultDetails = (result: SubjectResult) => {
    const student = students.find((s) => s.id === result.studentId)
    const subject = subjects.find((sub) => sub.id === result.subjectId)

    return {
      ...result,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
      subjectName: subject?.name || 'Unknown Subject',
      class: student?.class || '',
    }
  }

  const filteredResults = useMemo(() => {
    return results
      .filter((result) => {
        const details = getResultDetails(result)
        const matchesFilter =
          details.studentName.toLowerCase().includes(filterTerm.toLowerCase()) ||
          details.subjectName.toLowerCase().includes(filterTerm.toLowerCase())

        const matchesTerm = selectedTerm === 'All' || result.term === selectedTerm
        const matchesStudent = selectedStudent === 'All' || result.studentId === selectedStudent

        return matchesFilter && matchesTerm && matchesStudent
      })
      .map(getResultDetails)
  }, [results, students, subjects, filterTerm, selectedTerm, selectedStudent])

  const handleSubmitResult = async (resultData: SubjectResult | Omit<SubjectResult, 'id'>) => {
    try {
      if ('id' in resultData) {
        const updated = await updateResult(resultData.id, resultData)
        setResults(prev => prev.map(r => r.id === updated.id ? updated : r))
      } else {
        const created = await createResult(resultData)
        setResults(prev => [...prev, created])
      }
      setShowForm(false)
      setMessage({ type: 'success', text: 'Result saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      alert('Failed to save result')
    }
  }

  const handleDeleteResult = async (id: string) => {
    if (confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteResult(id)
        setResults(prev => prev.filter(r => r.id !== id))
      } catch (error) {
        alert('Failed to delete result')
      }
    }
  }

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const csvData = results.data as any[]
        // Expecting columns: registrationNumber, subjectName, firstCA, secondCA, exam, remarks, term, academicYear
        
        const processedResults = csvData.map(row => {
          const subject = subjects.find(s => s.name.toLowerCase() === row.subjectName?.toLowerCase())
          return {
            registrationNumber: row.registrationNumber,
            subjectId: subject?.id,
            firstCA: parseFloat(row.firstCA) || 0,
            secondCA: parseFloat(row.secondCA) || 0,
            exam: parseFloat(row.exam) || 0,
            remarks: row.remarks || '',
            term: row.term || '2nd Term',
            academicYear: row.academicYear || '2023/2024'
          }
        }).filter(r => r.subjectId && r.registrationNumber)

        if (processedResults.length === 0) {
          alert('No valid results found in CSV. Please check columns: registrationNumber, subjectName, firstCA, secondCA, exam')
          return
        }

        try {
          const res = await saveBulkResults({
            term: processedResults[0].term,
            academicYear: processedResults[0].academicYear,
            results: processedResults
          })
          alert(res.message)
          loadData()
          setShowBulkModal(false)
        } catch (error) {
          alert('Failed to process bulk upload')
        }
      }
    })
  }

  const columns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'class', label: 'Class' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'firstCA', label: '1st CA' },
    { key: 'secondCA', label: '2nd CA' },
    { key: 'exam', label: 'Exam' },
    { key: 'totalScore', label: 'Total' },
    { key: 'percentage', label: '%' },
    { key: 'grade', label: 'Grade' },
  ]

  if (isLoading) return <div className="p-8 text-center">Loading results...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subject Results</h1>
          <p className="text-gray-600 mt-2">Enter CA and Exam scores for automated grading</p>
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

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="input-field"
            >
              <option value="All">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input-field"
            >
              <option value="All">All Terms</option>
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
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

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-8">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-green-600 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Bulk Result Upload</h2>
              <p className="text-gray-600 mt-2">Upload a CSV file with student results</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Required CSV Columns:</p>
                <code className="text-[10px] text-blue-600 break-all">
                  registrationNumber, subjectName, firstCA, secondCA, exam, remarks, term, academicYear
                </code>
              </div>
              
              <label className="block w-full cursor-pointer bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-200 rounded-xl p-8 text-center transition-all">
                <Upload className="mx-auto text-blue-500 mb-2" size={32} />
                <span className="text-sm font-bold text-blue-700">Choose CSV File</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
              </label>
              
              <button 
                onClick={() => setShowBulkModal(false)}
                className="w-full py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-lg">
        <Table
          columns={columns}
          data={filteredResults.map((result) => ({
            ...result,
            percentage: `${result.percentage.toFixed(1)}%`,
            actions: (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingResult(result)
                    setShowForm(true)
                  }}
                  className="px-3 py-1 text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteResult(result.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Records</p>
          <p className="text-3xl font-black text-gray-900">{filteredResults.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Average Score</p>
          <p className="text-3xl font-black text-blue-600">
            {filteredResults.length > 0
              ? Math.round(
                  filteredResults.reduce((sum, r) => sum + r.percentage, 0) /
                    filteredResults.length
                )
              : 0}
            %
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Pass Rate</p>
          <p className="text-3xl font-black text-green-600">
            {filteredResults.length > 0
              ? Math.round(
                  (filteredResults.filter((r) => r.grade !== 'F').length /
                    filteredResults.length) *
                    100
                )
              : 0}
            %
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Passing Grade</p>
          <p className="text-3xl font-black text-green-600">60%</p>
        </div>
      </div>
    </div>
  )
}
