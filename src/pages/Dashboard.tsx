import { useMemo, useEffect, useState } from 'react'
import { Users, BookOpen, TrendingUp, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'
import { Student, SubjectResult } from '../types'
import { fetchStudents, fetchResults } from '../services/api'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
    }
  }
}

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [results, setResults] = useState<SubjectResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, resultsData] = await Promise.all([
          fetchStudents(),
          fetchResults()
        ])
        setStudents(studentsData)
        setResults(resultsData)
      } catch (error) {
        console.error('Failed to load dashboard data', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === 'Active').length
    const totalResults = results.length
    const avgScore =
      totalResults > 0
        ? Math.round(
            (results.reduce((sum, r) => sum + r.percentage, 0) /
              totalResults) *
              100
          ) / 100
        : 0

    return {
      totalStudents: students.length,
      activeStudents,
      totalResults,
      averageScore: avgScore,
    }
  }, [students, results])

  const classPerformanceData = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class))]
    
    // Optimization: Group students by class and results by studentId
    const studentsByClass = students.reduce((acc, s) => {
      if (!acc[s.class]) acc[s.class] = []
      acc[s.class].push(s.id)
      return acc
    }, {} as Record<string, string[]>)

    const resultsByStudent = results.reduce((acc, r) => {
      if (!acc[r.studentId]) acc[r.studentId] = []
      acc[r.studentId].push(r)
      return acc
    }, {} as Record<string, SubjectResult[]>)

    return classes.map(className => {
      const classStudentIds = studentsByClass[className] || []
      const classResults = classStudentIds.flatMap(id => resultsByStudent[id] || [])
      const avgScore = classResults.length > 0 
        ? Math.round(classResults.reduce((sum, r) => sum + r.percentage, 0) / classResults.length)
        : 0
      return { name: className, average: avgScore }
    })
  }, [students, results])

  const studentStatusData = useMemo(() => {
    const statusCounts = students.reduce((acc: any, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {})
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }, [students])

  const recentResults = useMemo(() => {
    return [...results].reverse().slice(0, 5)
  }, [results])

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Loading Insights...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 space-y-10"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          System <span className="text-indigo-600 dark:text-indigo-400">Intelligence</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Welcome back. Here is your institutional performance overview.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Students"
          value={stats.totalStudents}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Active Students"
          value={stats.activeStudents}
          color="green"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          label="Total Results"
          value={stats.totalResults}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Average Score"
          value={`${stats.averageScore}%`}
          color="orange"
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-lg">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-8">Class Performance Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)', radius: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{payload[0].value}% <span className="text-[10px] text-gray-400 font-medium ml-1">Avg Score</span></p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="average" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-lg">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-8">Enrollment Demographics</h2>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {studentStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{payload[0].value} <span className="text-[10px] text-gray-400 font-medium ml-1">Students</span></p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 ml-8">
              {studentStatusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{entry.name}</span>
                    <span className="text-sm text-gray-900 dark:text-white font-bold leading-none">{String(entry.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="card-lg">
        <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Recent Performance Records
        </h2>
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-600">
            <AlertCircle className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-[10px]">Database Empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentResults.map((result) => (
              <motion.div 
                key={result.id} 
                whileHover={{ scale: 1.02 }}
                className="p-5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/50 flex justify-between items-center group transition-all duration-300"
              >
                <div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{result.term}</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{result.academicYear}</p>
                </div>
                <div className={`flex flex-col items-end`}>
                   <span className={`text-xl font-black ${result.percentage >= 60 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {result.grade}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{Math.round(result.percentage)}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

