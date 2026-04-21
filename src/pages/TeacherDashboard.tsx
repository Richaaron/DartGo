import { useMemo, useEffect, useState } from 'react'
import { Users, BookOpen, TrendingUp, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'
import Table from '../components/Table'
import { useAuthContext } from '../context/AuthContext'
import { Student, SubjectResult, Subject } from '../types'
import { formatDate } from '../utils/calculations'
import { fetchStudents, fetchResults, fetchSubjects } from '../services/api'
import ChatSystem from '../components/ChatSystem'
import PerformanceInsights from '../components/PerformanceInsights'

export default function TeacherDashboard() {
  const { user } = useAuthContext()
  const teacher = user as any
  const [students, setStudents] = useState<Student[]>([])
  const [results, setResults] = useState<SubjectResult[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'results' | 'messages' | 'insights'>('results')

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
      console.error('Failed to load dashboard data', error)
    } finally {
      setIsLoading(false)
    }
  }

  const teacherResults = useMemo(() => {
    return results.filter((r) => {
      const student = students.find((s) => s.id === r.studentId)
      return student && teacher?.assignedClasses?.includes(student.class)
    })
  }, [results, students, teacher?.assignedClasses])

  const stats = useMemo(() => {
    const teacherStudents = students.filter((s) =>
      teacher?.assignedClasses?.includes(s.class)
    )

    const avgScore =
      teacherResults.length > 0
        ? Math.round(
            teacherResults.reduce(
              (sum, r) => sum + r.percentage,
              0
            ) / teacherResults.length
          )
        : 0

    return {
      classesCount: teacher?.assignedClasses?.length || 0,
      studentsCount: teacherStudents.length,
      resultsRecorded: teacherResults.length,
      averageClassScore: avgScore,
    }
  }, [students, teacherResults, teacher?.assignedClasses])

  const tableData = useMemo(() => {
    return teacherResults.map((result) => {
      const student = students.find((s) => s.id === result.studentId)
      const subject = subjects.find((sub) => sub.id === result.subjectId)

      return {
        id: result.id,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'N/A',
        class: student?.class || 'N/A',
        subjectName: subject?.name || 'N/A',
        firstCA: result.firstCA,
        secondCA: result.secondCA,
        exam: result.exam,
        totalScore: result.totalScore,
        percentage: `${result.percentage.toFixed(2)}%`,
        grade: result.grade,
        term: result.term,
        dateRecorded: formatDate(result.dateRecorded),
      }
    })
  }, [teacherResults, students, subjects])

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
    { key: 'term', label: 'Term' },
  ]

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {teacher.name}
        </h1>
        <p className="text-gray-600 mt-2">
          {teacher.subject} Teacher | School Level: {teacher.level}
        </p>
        <div className="mt-3 text-sm text-gray-600">
          <p>Assigned Classes: {teacher.assignedClasses.join(', ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-8 h-8" />}
          label="Classes"
          value={stats.classesCount}
          color="blue"
        />
        <StatCard
          icon={<BookOpen className="w-8 h-8" />}
          label="Students"
          value={stats.studentsCount}
          color="green"
        />
        <StatCard
          icon={<AlertCircle className="w-8 h-8" />}
          label="Results Recorded"
          value={stats.resultsRecorded}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          label="Class Average"
          value={`${stats.averageClassScore}%`}
          color="purple"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['results', 'messages', 'insights'] as const).map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab === 'results' && 'Class Results'}
            {tab === 'messages' && 'Admin Chat'}
            {tab === 'insights' && 'AI Insights'}
          </motion.button>
        ))}
      </div>

      {/* Results Tab */}
      {activeTab === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Class Results
          </h2>
          {tableData.length > 0 ? (
            <Table columns={columns} data={tableData} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No results recorded yet for your classes.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Message Admin</h2>
            <p className="text-sm text-gray-500">Contact the school administration for support or reports</p>
          </div>
          <ChatSystem />
        </motion.div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PerformanceInsights />
        </motion.div>
      )}
    </div>
  )
}
