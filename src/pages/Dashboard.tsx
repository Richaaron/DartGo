import { useMemo, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Users, BookOpen, TrendingUp, AlertCircle, Lock, Eye, EyeOff, Check, X, FileText, ClipboardList } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { Student, SubjectResult } from '../types'
import { fetchStudents, fetchResults } from '../services/api'
import apiService from '../services/apiService'
import { useAuthContext } from '../context/AuthContext'
import ChatSystem from '../components/ChatSystem'
import TeacherActivityLog from '../components/TeacherActivityLog'
import PerformanceInsights from '../components/PerformanceInsights'

// School-inspired colors for charts
const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#C7A2FF', '#FF9FF3', '#FFA502', '#87CEEB']

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
  const { user } = useAuthContext()
  const [students, setStudents] = useState<Student[]>([])
  const [results, setResults] = useState<SubjectResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const userRole = user?.role || 'Student'
  const teacher = userRole === 'Teacher' ? (user as any) : null
  const teacherType = teacher?.teacherType
  const hasAssignedClasses = Array.isArray(teacher?.assignedClasses) && teacher.assignedClasses.length > 0
  const hasAssignedSubjects =
    (Array.isArray(teacher?.assignedSubjects) && teacher.assignedSubjects.length > 0) ||
    (typeof teacher?.subject === 'string' && teacher.subject.trim().length > 0)

  const isFormTeacher =
    userRole === 'Teacher' &&
    (teacherType === 'Form Teacher' || teacherType === 'Form + Subject Teacher' || (!teacherType && hasAssignedClasses))
  const isSubjectTeacher =
    userRole === 'Teacher' &&
    (teacherType === 'Subject Teacher' || teacherType === 'Form + Subject Teacher' || (!teacherType && hasAssignedSubjects))

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

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
    const studentList = Array.isArray(students) ? students : []
    const resultList = Array.isArray(results) ? results : []
    
    const activeStudents = studentList.filter((s) => s && s.status === 'Active').length
    const totalResults = resultList.length
    const avgScore =
      totalResults > 0
        ? Math.round(
            (resultList.reduce((sum, r) => sum + (r?.percentage || 0), 0) /
              totalResults) *
              100
          ) / 100
        : 0

    return {
      totalStudents: studentList.length,
      activeStudents,
      totalResults,
      averageScore: avgScore,
    }
  }, [students, results])

  const classPerformanceData = useMemo(() => {
    const studentList = Array.isArray(students) ? students : []
    const resultList = Array.isArray(results) ? results : []
    
    const classes = [...new Set(studentList.map(s => s?.class).filter(Boolean))]
    
    // Optimization: Group students by class and results by studentId
    const studentsByClass = studentList.reduce((acc, s) => {
      if (s && s.class) {
        if (!acc[s.class]) acc[s.class] = []
        acc[s.class].push(s.id)
      }
      return acc
    }, {} as Record<string, string[]>)

    const resultsByStudent = resultList.reduce((acc, r) => {
      if (r && r.studentId) {
        if (!acc[r.studentId]) acc[r.studentId] = []
        acc[r.studentId].push(r)
      }
      return acc
    }, {} as Record<string, SubjectResult[]>)

    return classes.map(className => {
      const classStudentIds = studentsByClass[className] || []
      const classResults = classStudentIds.flatMap(id => resultsByStudent[id] || [])
      const avgScore = classResults.length > 0 
        ? Math.round(classResults.reduce((sum, r) => sum + (r?.percentage || 0), 0) / classResults.length)
        : 0
      return { name: className, average: avgScore }
    })
  }, [students, results])

  const studentStatusData = useMemo(() => {
    const studentList = Array.isArray(students) ? students : []
    const statusCounts = studentList.reduce((acc: any, s) => {
      if (s && s.status) {
        acc[s.status] = (acc[s.status] || 0) + 1
      }
      return acc
    }, {})
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }, [students])

  const recentResults = useMemo(() => {
    const resultList = Array.isArray(results) ? results : []
    return [...resultList].reverse().slice(0, 5)
  }, [results])

  const validatePassword = (password: string): string[] => {
    const errors = []
    if (password.length < 12) errors.push('At least 12 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character')
    return errors
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    const validationErrors = validatePassword(passwordForm.newPassword)
    if (validationErrors.length > 0) {
      setPasswordError(`New password must contain: ${validationErrors.join(', ')}`)
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await apiService.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })

      setPasswordSuccess('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      window.setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to change password'
      setPasswordError(errorMsg)
    } finally {
      setIsChangingPassword(false)
    }
  }

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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            System <span className="text-indigo-600 dark:text-indigo-400">Intelligence</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Welcome back. Here is your institutional performance overview.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-lg text-sm sm:text-base whitespace-nowrap"
        >
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Change Password</span>
          <span className="sm:hidden">Password</span>
        </motion.button>
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

      {/* Quick Recording Center */}
      {userRole === 'Teacher' && (
        <motion.div variants={itemVariants} className="card-lg bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-500/10 dark:to-purple-500/10 border-indigo-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-indigo-500" />
                Recording <span className="text-indigo-600 dark:text-indigo-400">Center</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Quickly access your assigned recording sheets for seamless result entry.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              {isFormTeacher && (
                <Link
                  to="/results"
                  className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-indigo-500/50 hover:border-indigo-500 transition-all hover:scale-105 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Class Records</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">Form Teacher Entry</p>
                    </div>
                  </div>
                </Link>
              )}
              {isSubjectTeacher && (
                <Link
                  to="/subject-results"
                  className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-purple-500/50 hover:border-purple-500 transition-all hover:scale-105 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Subject Records</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">Subject Teacher Entry</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="card-lg overflow-x-auto">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 md:mb-8">Class Performance Distribution</h2>
          <div className="h-64 sm:h-72 min-w-[300px] sm:min-w-full">
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
                          <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">{payload[0].value}% <span className="text-[10px] text-gray-400 font-medium ml-1">Avg Score</span></p>
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

        <div className="card-lg overflow-x-auto">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 md:mb-8">Enrollment Demographics</h2>
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

      {/* AI Performance Insights Section - Only for Admin/Teacher */}
      {(userRole === 'Admin' || userRole === 'Teacher') && (
        <motion.div variants={itemVariants} className="mt-8 mb-8">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">AI-Powered Performance Analytics</h2>
          <PerformanceInsights />
        </motion.div>
      )}

      {/* Teacher Activity and Messages Section - Activity for Admin, Messages for Admin/Teacher */}
      {(userRole === 'Admin' || userRole === 'Teacher') && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {userRole === 'Admin' && (
            <div className="space-y-4">
              <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Teacher Activity Monitor</h2>
              <TeacherActivityLog />
            </div>
          )}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Message Center</h2>
            <ChatSystem />
          </div>
        </motion.div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => !isChangingPassword && setShowPasswordModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    disabled={isChangingPassword}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    disabled={isChangingPassword}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                  Must contain: 12+ characters, uppercase, lowercase, number, and special character
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    disabled={isChangingPassword}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                    disabled={isChangingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
                >
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                </motion.div>
              )}

              {/* Success Message */}
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2"
                >
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                  }}
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

