import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { BarChart3, GraduationCap, BookOpen, Menu, X, LogOut, Users, CheckCircle, Settings as SettingsIcon, Moon, Sun, Bell, FileText, MessageSquare, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthContext } from './context/AuthContext'
import { useDarkMode } from './hooks/useLocalStorage'
import PageTransition from './components/PageTransition'
import NotificationBell from './components/NotificationBell'
import { ErrorBoundary } from './components/ErrorBoundary'

// Regular imports (removed lazy loading)
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentManagement from './pages/StudentManagement'
import TeacherManagement from './pages/TeacherManagement'
import ResultEntry from './pages/ResultEntry'
import SubjectResultEntry from './pages/SubjectResultEntry'
import Reports from './pages/Reports'
import Attendance from './pages/Attendance'
import Settings from './pages/Settings'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'
import AdminSchemeUpload from './pages/AdminSchemeUpload'
import NotificationsPage from './pages/Notifications'
import Messages from './pages/Messages'
import Deadlines from './pages/Deadlines'
import './App.css'

import { fetchConfig } from './services/api'

function AppContent() {
  const { isAuthenticated, logout, user, isHydrated } = useAuthContext()
  const location = useLocation()
  const [isDarkMode, setIsDarkMode] = useDarkMode()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig().then(setConfig).catch(console.error)
    }
  }, [isAuthenticated])

  // Show a loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => window.location.reload()} />
  }

  const userRole = user?.role || 'Student'
  const userName = user?.name || 'User'
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
  const teacherRoleLabel = teacherType || (isFormTeacher && isSubjectTeacher ? 'Form + Subject Teacher' : isFormTeacher ? 'Form Teacher' : isSubjectTeacher ? 'Subject Teacher' : 'Teacher')
  const teacherDefaultRoute = isFormTeacher ? '/results' : isSubjectTeacher ? '/subject-results' : '/teacher-dashboard'

  const handleLogout = () => {
    logout()
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen ${isDarkMode ? 'dark bg-gradient-school-dark' : 'bg-gradient-school'} transition-colors duration-300`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-school-blue via-school-green to-school-blue border-b-4 border-school-yellow' : 'bg-gradient-to-r from-school-red to-school-orange border-b-4 border-school-yellow'} text-white px-4 py-3 flex items-center justify-between z-40 shadow-lg`}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gold-500/10 rounded-lg transition-all active:scale-90"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            {config?.schoolLogo ? (
              <img src={config.schoolLogo} alt="Logo" className="w-8 h-8 object-contain rounded-full border-2 border-school-yellow shadow-lg" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-school-yellow to-school-orange rounded-full flex items-center justify-center text-school-red border-2 border-white shadow-lg animate-bounce-slow">
                <GraduationCap size={18} />
              </div>
            )}
            <span className="text-xs font-black uppercase bg-gradient-to-r from-school-yellow to-white bg-clip-text text-transparent animate-pulse-bright">
              {config?.schoolName?.split(' ')[0] || 'FOLUSHO'}
            </span>
          </div>
          <NotificationBell />
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobile && showMobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowMobileMenu(false)}
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
        />
      )}

      {/* Sidebar / Mobile Menu */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !showMobileMenu ? -1000 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`${
          isMobile ? 'fixed left-0 top-[60px] bottom-0 w-72 z-30' : `${isSidebarOpen ? 'w-72' : 'w-24'} relative`
        } ${isDarkMode ? 'bg-gradient-to-b from-school-blue via-school-green/20 to-school-blue border-r-4 border-school-yellow' : 'bg-gradient-to-b from-school-red to-school-pink border-r-4 border-school-yellow'} text-white transition-all duration-500 flex flex-col shadow-2xl overflow-y-auto md:overflow-visible`}
      >
        {/* Desktop Logo - Hidden on Mobile */}
        {!isMobile && (
          <div className={`p-6 border-b-4 ${isDarkMode ? 'border-school-yellow' : 'border-school-yellow'} flex items-center justify-between flex-shrink-0`}>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                {config?.schoolLogo ? (
                  <img src={config.schoolLogo} alt="Logo" className="w-10 h-10 object-contain shadow-school-yellow shadow-lg rounded-full border-2 border-school-yellow bg-gradient-to-br from-school-yellow to-school-orange p-1" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-school-yellow to-school-orange rounded-full flex items-center justify-center text-school-red shadow-lg shadow-school-yellow/50 border-2 border-white animate-bounce-slow">
                    <GraduationCap size={24} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <h1 className="text-sm font-black truncate tracking-tighter uppercase bg-gradient-to-r from-school-yellow to-white bg-clip-text text-transparent">{config?.schoolName?.split(' ')[0] || 'FOLUSHO'}</h1>
                  <p className={`text-[9px] ${isDarkMode ? 'text-school-yellow/80' : 'text-school-yellow'} truncate uppercase font-black tracking-widest`}>{config?.schoolName?.split(' ').slice(1).join(' ') || 'Victory Schools'}</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 hover:bg-school-yellow/20 rounded-full transition-all active:scale-90 text-school-yellow animate-bounce-slow`}
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        )}

        {/* Mobile User Info */}
        {isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`px-6 py-4 border-b-4 ${isDarkMode ? 'border-school-yellow bg-school-blue/20' : 'border-school-yellow bg-school-red/20'}`}
          >
            <p className={`text-[9px] uppercase font-black tracking-[0.2em] ${isDarkMode ? 'text-school-yellow/80' : 'text-school-yellow'}`}>Authenticated Session</p>
            <p className="font-black text-white truncate text-sm mt-1">{userName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-school-yellow' : 'bg-school-yellow'}`}></div>
              <p className={`text-[10px] font-black uppercase tracking-widest text-white`}>{userRole}</p>
            </div>
            {userRole === 'Teacher' && (
              <p className={`text-[9px] mt-1 uppercase tracking-[0.2em] text-school-yellow/90`}>
                {teacherRoleLabel}
              </p>
            )}
          </motion.div>
        )}

        {/* Desktop User Info */}
        {!isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`px-6 py-5 border-b-4 ${isDarkMode ? 'border-school-yellow bg-school-blue/20' : 'border-school-yellow bg-school-red/20'} flex-shrink-0`}
          >
            <p className={`text-[9px] uppercase font-black tracking-[0.2em] ${isDarkMode ? 'text-school-yellow/80' : 'text-school-yellow'}`}>Authenticated Session</p>
            <p className="font-black text-white truncate text-sm mt-1">{userName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-school-yellow' : 'bg-school-yellow'}`}></div>
              <p className={`text-[10px] font-black uppercase tracking-widest text-white`}>{userRole}</p>
            </div>
            {userRole === 'Teacher' && (
              <p className={`text-[9px] mt-1 uppercase tracking-[0.2em] text-school-yellow/90`}>
                {teacherRoleLabel}
              </p>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {userRole === 'Teacher' ? (
            <>
              <NavLink
                to="/teacher-dashboard"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Teacher Dashboard"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={isMobile ? 20 : 18} />}
                label="Scholar Management"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {isFormTeacher && (
                <NavLink
                  to="/results"
                  icon={<BookOpen size={isMobile ? 20 : 18} />}
                  label="Class Result Entry"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {isSubjectTeacher && (
                <NavLink
                  to="/subject-results"
                  icon={<BookOpen size={isMobile ? 20 : 18} />}
                  label="Subject Result Entry"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              <NavLink
                to="/attendance"
                icon={<CheckCircle size={isMobile ? 20 : 18} />}
                label="Registry & Attendance"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
            </>
          ) : userRole === 'Parent' ? (
            <>
              <NavLink
                to="/parent-dashboard"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Scholar Progress"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
            </>
          ) : (
            <>
              <NavLink
                to="/"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Insights Console"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={isMobile ? 20 : 18} />}
                label="Scholar Management"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {userRole === 'Admin' && (
                <NavLink
                  to="/teachers"
                  icon={<Users size={isMobile ? 20 : 18} />}
                  label="Faculty Management"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {userRole === 'Admin' && (
                <NavLink
                  to="/admin-schemes"
                  icon={<FileText size={isMobile ? 20 : 18} />}
                  label="Scheme Repository"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              <NavLink
                  to="/results"
                  icon={<BookOpen size={isMobile ? 20 : 18} />}
                  label="Grade Repository"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
                <NavLink
                  to="/subject-results"
                  icon={<BookOpen size={isMobile ? 20 : 18} />}
                  label="Subject Analytics"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
                <NavLink
                  to="/attendance"
                  icon={<CheckCircle size={isMobile ? 20 : 18} />}
                  label="Attendance Registry"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              <NavLink
                to="/reports"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Performance Reports"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/notifications"
                icon={<Bell size={isMobile ? 20 : 18} />}
                label="Email Notifications"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {userRole === 'Admin' && (
                <NavLink
                  to="/messages"
                  icon={<MessageSquare size={isMobile ? 20 : 18} />}
                  label="Teacher Communications"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {userRole === 'Admin' && (
                <NavLink
                  to="/deadlines"
                  icon={<Timer size={isMobile ? 20 : 18} />}
                  label="Timeline Control"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {userRole === 'Admin' && (
                <NavLink
                  to="/settings"
                  icon={<SettingsIcon size={isMobile ? 20 : 18} />}
                  label="System Parameters"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gold-500/20' : 'border-gold-500/30'} space-y-2 flex-shrink-0`}>
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'text-gold-400 hover:bg-gold-500/10 bg-black/30 shadow-inner' 
                : 'text-gold-200 hover:bg-gold-500/20 bg-gold-500/10'
            }`}
          >
            {isDarkMode ? <Sun size={isMobile ? 20 : 18} /> : <Moon size={isMobile ? 20 : 18} />}
            {(isMobile || isSidebarOpen) && <span className="font-black text-[10px] uppercase tracking-widest">{isDarkMode ? 'Solar Mode' : 'Lunar Mode'}</span>}
          </button>

          {/* Logout Button */}
          <div className="relative">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isDarkMode ? 'text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-300' : 'text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400'
              }`}
            >
              <LogOut size={isMobile ? 20 : 18} />
              {(isMobile || isSidebarOpen) && <span className="font-black text-[10px] uppercase tracking-widest">Logout</span>}
            </button>
            <AnimatePresence>
              {showLogout && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full mb-3 left-0 right-0 bg-gradient-to-r from-school-red to-school-pink rounded-full p-2 shadow-2xl z-50 border-2 border-school-yellow"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full text-white text-[10px] font-black hover:bg-school-yellow/20 px-3 py-3 rounded-full transition-all uppercase tracking-[0.2em]"
                  >
                    Confirm Termination
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {(isMobile || isSidebarOpen) && <p className={`text-[8px] font-black ${isDarkMode ? 'text-school-yellow/40' : 'text-school-yellow/30'} mt-6 text-center uppercase tracking-[0.3em] opacity-50`}>Folusho © 2024</p>}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isDarkMode ? 'bg-gradient-school-dark text-white' : 'bg-gradient-school text-gray-900'}`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-6 md:px-8 md:py-8'}`}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {userRole === 'Teacher' ? (
                <>
                  <Route path="/teacher-dashboard" element={<PageTransition><TeacherDashboard /></PageTransition>} />
                  <Route path="/students" element={<PageTransition><StudentManagement /></PageTransition>} />
                  <Route
                    path="/results"
                    element={isFormTeacher ? <PageTransition><ResultEntry /></PageTransition> : <Navigate to={teacherDefaultRoute} replace />}
                  />
                  <Route
                    path="/subject-results"
                    element={isSubjectTeacher ? <PageTransition><SubjectResultEntry /></PageTransition> : <Navigate to={teacherDefaultRoute} replace />}
                  />
                  <Route path="/attendance" element={<PageTransition><Attendance /></PageTransition>} />
                  <Route path="*" element={<Navigate to={teacherDefaultRoute} replace />} />
                </>
              ) : userRole === 'Parent' ? (
                <>
                  <Route path="/parent-dashboard" element={<PageTransition><ParentDashboard /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/parent-dashboard" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
                  <Route path="/students" element={<PageTransition><StudentManagement /></PageTransition>} />
                  <Route path="/teachers" element={<PageTransition><TeacherManagement /></PageTransition>} />
                  <Route path="/admin-schemes" element={<PageTransition><AdminSchemeUpload /></PageTransition>} />
                  <Route path="/results" element={<PageTransition><ResultEntry /></PageTransition>} />
                  <Route path="/subject-results" element={<PageTransition><SubjectResultEntry /></PageTransition>} />
                  <Route path="/attendance" element={<PageTransition><Attendance /></PageTransition>} />
                  <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
                  <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
                  <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
                  <Route path="/deadlines" element={<PageTransition><Deadlines /></PageTransition>} />
                  <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

interface NavLinkProps {
  to: string
  icon: React.ReactNode
  label: string
  isOpen: boolean
  isDarkMode?: boolean
}

function NavLink({ to, icon, label, isOpen, isDarkMode }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 group text-sm md:text-sm font-black hover:scale-105 active:scale-95 ${
        isDarkMode 
          ? 'text-white hover:bg-school-yellow/20 hover:text-school-yellow active:bg-school-yellow/30 border-2 border-transparent hover:border-school-yellow' 
          : 'text-white hover:bg-school-yellow/30 hover:text-school-yellow active:bg-school-yellow/40 border-2 border-transparent hover:border-school-yellow'
      }`}
    >
      <span className={`flex-shrink-0 ${isDarkMode ? 'text-school-yellow' : 'text-school-yellow'} group-hover:scale-110 transition-transform`}>{icon}</span>
      {isOpen && <span className="font-black">{label}</span>}
    </Link>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  )
}
