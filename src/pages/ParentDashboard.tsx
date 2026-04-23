import { useMemo, useEffect, useState, useRef } from 'react'
import { GraduationCap, BookOpen, TrendingUp, AlertCircle, User, Printer, Download } from 'lucide-react'
import StatCard from '../components/StatCard'
import Table from '../components/Table'
import PrintResult from '../components/PrintResult'
import { useAuthContext } from '../context/AuthContext'
import { Student, SubjectResult, Subject, Parent } from '../types'
import { fetchStudents, fetchResults, fetchSubjects } from '../services/api'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ParentDashboard() {
  const { user } = useAuthContext()
  const parent = user as Parent
  const [students, setStudents] = useState<Student[]>([])
  const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

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
      setSubjectResults(resultsData)
      setSubjects(subjectsData)
    } catch (error) {
      console.error('Failed to load dashboard data', error)
    } finally {
      setIsLoading(false)
    }
  }

  const child = useMemo(() => {
    return students.find(s => s.id === parent.studentId)
  }, [students, parent.studentId])

  const childResults = useMemo(() => {
    return subjectResults.filter(r => r.studentId === parent.studentId)
  }, [subjectResults, parent.studentId])

  const stats = useMemo(() => {
    const totalResults = childResults.length
    const avgScore = totalResults > 0
      ? Math.round((childResults.reduce((sum, r) => sum + r.percentage, 0) / totalResults) * 100) / 100
      : 0

    return {
      totalSubjects: [...new Set(childResults.map(r => r.subjectId))].length,
      totalAssessments: totalResults,
      averageScore: avgScore,
    }
  }, [childResults])

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return
    
    const windowToPrint = window.open('', '', 'width=800,height=600')
    if (!windowToPrint) {
      window.alert('Please allow popups to print the result.')
      return
    }
    
    windowToPrint.document.write(`
      <html>
        <head>
          <title>Print Result - ${child?.firstName} ${child?.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #f0f0f0; }
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
      setIsLoading(true)
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
      pdf.save(`${child?.firstName}_${child?.lastName}_Result_Card.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      window.alert('Failed to generate PDF. Please try printing instead.')
    } finally {
      setIsLoading(false)
    }
  }

  const tableData = useMemo(() => {
    return childResults.map((result) => {
      const subject = subjects.find((sub) => sub.id === result.subjectId)

      return {
        id: result.id,
        subjectName: subject?.name || 'N/A',
        firstCA: result.firstCA,
        secondCA: result.secondCA,
        exam: result.exam,
        totalScore: result.totalScore,
        percentage: `${result.percentage.toFixed(1)}%`,
        grade: result.grade,
        term: result.term,
        academicYear: result.academicYear,
      }
    })
  }, [childResults, subjects])

  const columns = [
    { key: 'subjectName', label: 'Subject' },
    { key: 'firstCA', label: '1st CA' },
    { key: 'secondCA', label: '2nd CA' },
    { key: 'exam', label: 'Exam' },
    { key: 'totalScore', label: 'Total' },
    { key: 'percentage', label: '%' },
    { key: 'grade', label: 'Grade' },
    { key: 'term', label: 'Term' },
    { key: 'academicYear', label: 'Academic Year' },
  ]

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>

  if (!child) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Child Record Not Found</h2>
        <p className="text-gray-600 mt-2">Please contact the school administrator.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-500">
          {child.image ? (
            <img src={child.image} alt={child.firstName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-blue-500" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {parent.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Viewing results for: <span className="font-semibold text-blue-600">{child.firstName} {child.lastName}</span>
          </p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <p>Registration No: {child.registrationNumber}</p>
            <p>Class: {child.class}</p>
            <p>Level: {child.level}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<BookOpen className="w-8 h-8" />}
          label="Subjects"
          value={stats.totalSubjects}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          label="Assessments"
          value={stats.totalAssessments}
          color="green"
        />
        <StatCard
          icon={<GraduationCap className="w-8 h-8" />}
          label="Average Score"
          value={`${stats.averageScore}%`}
          color="purple"
        />
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Academic Results</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>
        {tableData.length > 0 ? (
          <>
            <Table columns={columns} data={tableData} />
            {/* Hidden Print-Only Content */}
            <div className="hidden print:block">
              <PrintResult ref={printRef} child={child} results={childResults} subjects={subjects} />
            </div>
            {/* Always visible for PDF generation */}
            <div ref={printRef} className="hidden">
              <PrintResult child={child} results={childResults} subjects={subjects} />
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No results have been recorded for your child yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
