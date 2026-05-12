import { useMemo, useEffect, useState, useRef } from 'react'
import { GraduationCap, BookOpen, TrendingUp, AlertCircle, User, Printer, Download } from 'lucide-react'
import StatCard from '../components/StatCard'
import Table from '../components/Table'
import PrintResult from '../components/PrintResult'
import { useAuthContext } from '../context/AuthContext'
import { getStudentClassPosition } from '../utils/calculations'
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
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load dashboard data', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const child = useMemo(() => {
    return students.find(s => s.id === parent.studentId)
  }, [students, parent.studentId])

  const childResults = useMemo(() => {
    return subjectResults.filter(r => r.studentId === parent.studentId && r.status === 'RELEASED')
  }, [subjectResults, parent.studentId])

  const stats = useMemo(() => {
    const totalResults = childResults.length
    const avgScore = totalResults > 0
      ? Math.round((childResults.reduce((sum, r) => sum + r.percentage, 0) / totalResults) * 100) / 100
      : 0

    const classPos = getStudentClassPosition(
      subjectResults,
      parent.studentId,
      childResults[0]?.term || 'First',
      childResults[0]?.academicYear || new Date().getFullYear().toString()
    )

    return {
      totalSubjects: [...new Set(childResults.map(r => r.subjectId))].length,
      totalAssessments: totalResults,
      averageScore: avgScore,
      classPositionText: classPos.positionText
    }
  }, [childResults, subjectResults, parent.studentId])

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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: center; }
            th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
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
    <div className="space-y-12">
      {/* ── Dynamic Hero Section ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div variants={itemVariants} className="space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-nebula-indigo-500/10 border border-nebula-indigo-500/20 text-nebula-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
              Guardian Command: {parent.name}
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter">
              Legacy <br />
              Through <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">Excellence.</span>
            </h1>
            <p className="text-xl text-nebula-slate-400 font-bold max-w-lg leading-relaxed tracking-tight">
              Monitoring the academic matrix of <span className="text-white font-black">{child.firstName} {child.lastName}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <button
              onClick={handlePrint}
              className="btn-vibrant from-nebula-indigo-600 to-nebula-indigo-800 shadow-nebula"
            >
              <Printer size={18} />
              Output Protocol
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all group"
            >
              Archive Matrix (PDF)
              <Download className="w-5 h-5 group-hover:translate-x-2 transition-transform text-nebula-indigo-500" />
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="nebula-card !p-12 group hover:border-nebula-indigo-500/30 transition-all">
           <div className="flex items-center gap-6 mb-12">
              <div className="w-24 h-24 bg-nebula-slate-900 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
                {child.image ? (
                  <img src={child.image} alt={child.firstName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-nebula-indigo-400" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{child.firstName} {child.lastName}</h2>
                <p className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-widest mt-1 opacity-70">Sector: {child.class} · {child.level}</p>
              </div>
           </div>

           <div className="space-y-10">
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-nebula-indigo-500 mt-1 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <div>
                  <h3 className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em] mb-2">Registry Assignment</h3>
                  <p className="text-sm text-white font-bold tracking-tight">{child.registrationNumber}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-nebula-teal-500 mt-1 shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
                <div>
                  <h3 className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em] mb-2">Academic Standing</h3>
                  <p className="text-sm text-white font-bold tracking-tight">{stats.classPositionText}</p>
                </div>
              </div>
           </div>
        </motion.div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="nebula-card !p-8 group hover:border-nebula-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em]">Protocol Units</p>
            <BookOpen className="w-5 h-5 text-nebula-indigo-400 opacity-50" />
          </div>
          <p className="text-4xl font-black text-white">{stats.totalSubjects}</p>
        </div>
        <div className="nebula-card !p-8 group hover:border-nebula-teal-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-nebula-teal-400 uppercase tracking-[0.3em]">Evaluations</p>
            <TrendingUp className="w-5 h-5 text-nebula-teal-400 opacity-50" />
          </div>
          <p className="text-4xl font-black text-white">{stats.totalAssessments}</p>
        </div>
        <div className="nebula-card !p-8 group hover:border-nebula-pink-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-nebula-pink-400 uppercase tracking-[0.3em]">Efficiency Quotient</p>
            <GraduationCap className="w-5 h-5 text-nebula-pink-400 opacity-50" />
          </div>
          <p className="text-4xl font-black text-white">{stats.averageScore}%</p>
        </div>
      </div>

      {/* Results Matrix */}
      <div className="nebula-card !p-0 overflow-hidden">
        <div className="p-10 border-b border-white/5">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
            Performance <br /> <span className="text-white/40">Matrix</span>
          </h2>
        </div>

        {tableData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table columns={columns} data={tableData} />
            {/* Hidden components for export remain unchanged */}
            <div className="hidden print:block">
              <PrintResult ref={printRef} child={child} results={childResults} subjects={subjects} classPositionText={stats.classPositionText} />
            </div>
            <div ref={printRef} className="hidden">
              <PrintResult child={child} results={childResults} subjects={subjects} classPositionText={stats.classPositionText} />
            </div>
          </div>
        ) : (
          <div className="text-center py-40">
            <AlertCircle className="w-16 h-16 text-nebula-slate-700 mx-auto mb-6" />
            <p className="text-nebula-slate-500 font-bold uppercase tracking-widest text-sm">Zero performance protocols detected in matrix.</p>
          </div>
        )}
      </div>
    </div>
  )
}
