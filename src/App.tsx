import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { BarChart3, GraduationCap, BookOpen, Menu, X, LogOut, Users, CheckCircle, Settings as SettingsIcon, Moon, Sun, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthContext } from './context/AuthContext'
import { useDarkMode } from './hooks/useLocalStorage'
import PageTransition from './components/PageTransition'
import NotificationBell from './components/NotificationBell'
import { ErrorBoundary } from './components/ErrorBoundary'
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
import NotificationsPage from './pages/Notifications'
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

  const handleLogout = () => {
    logout()
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen ${isDarkMode ? 'dark bg-gradient-dark-purple' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-black via-purple-900/40 to-black border-b border-gold-500/20' : 'bg-gradient-to-r from-purple-900 to-black border-b border-gold-500/30'} text-white px-4 py-3 flex items-center justify-between z-40`}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gold-500/10 rounded-lg transition-all active:scale-90"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            {config?.schoolLogo ? (
              <img src={config.schoolLogo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-500 rounded-lg flex items-center justify-center text-black">
                <GraduationCap size={18} />
              </div>
            )}
            <span className="text-xs font-black uppercase bg-gradient-to-r from-gold-300 to-gold-200 bg-clip-text text-transparent">
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
        } ${isDarkMode ? 'bg-gradient-to-b from-black via-purple-900/40 to-black border-r border-gold-500/20' : 'bg-gradient-to-b from-purple-900 to-black border-r border-gold-500/30'} text-white transition-all duration-500 flex flex-col shadow-2xl overflow-y-auto md:overflow-visible`}
      >
        {/* Desktop Logo - Hidden on Mobile */}
        {!isMobile && (
          <div className={`p-6 border-b ${isDarkMode ? 'border-gold-500/20' : 'border-gold-500/30'} flex items-center justify-between flex-shrink-0`}>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                {config?.schoolLogo ? (
                  <img src={config.schoolLogo} alt="Logo" className="w-10 h-10 object-contain shadow-gold-400/40 shadow-lg rounded-xl bg-gradient-to-br from-gold-400 to-gold-300 p-1" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-gold-400/30">
                    <GraduationCap size={24} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <h1 className="text-sm font-black truncate tracking-tighter uppercase bg-gradient-to-r from-gold-300 to-gold-200 bg-clip-text text-transparent">{config?.schoolName?.split(' ')[0] || 'FOLUSHO'}</h1>
                  <p className={`text-[9px] ${isDarkMode ? 'text-gold-300/60' : 'text-gold-200/60'} truncate uppercase font-black tracking-widest`}>{config?.schoolName?.split(' ').slice(1).join(' ') || 'Victory Schools'}</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 hover:bg-gold-500/10 rounded-xl transition-all active:scale-90 text-gold-300`}
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
            className={`px-6 py-4 border-b ${isDarkMode ? 'border-gold-500/20 bg-black/40' : 'border-gold-500/30 bg-purple-900/30'}`}
          >
            <p className={`text-[9px] uppercase font-black tracking-[0.2em] ${isDarkMode ? 'text-gold-400/60' : 'text-gold-300'}`}>Authenticated Session</p>
            <p className="font-black text-white truncate text-sm mt-1">{userName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-gold-400' : 'bg-gold-300'}`}></div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gold-300/80' : 'text-gold-200'}`}>{userRole}</p>
            </div>
          </motion.div>
        )}

        {/* Desktop User Info */}
        {!isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`px-6 py-5 border-b ${isDarkMode ? 'border-gold-500/20 bg-black/40' : 'border-gold-500/30 bg-purple-900/30'} flex-shrink-0`}
          >
            <p className={`text-[9px] uppercase font-black tracking-[0.2em] ${isDarkMode ? 'text-gold-400/60' : 'text-gold-300'}`}>Authenticated Session</p>
            <p className="font-black text-white truncate text-sm mt-1">{userName}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-gold-400' : 'bg-gold-300'}`}></div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gold-300/80' : 'text-gold-200'}`}>{userRole}</p>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {userRole === 'Teacher' ? (
            <>
              <NavLink
                to="/teacher-dashboard"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Academic Dashboard"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/subject-results"
                icon={<BookOpen size={isMobile ? 20 : 18} />}
                label="Result Entry"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
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
                  className="absolute bottom-full mb-3 left-0 right-0 bg-rose-600 rounded-2xl p-2 shadow-2xl z-50 border border-rose-500"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full text-white text-[10px] font-black hover:bg-rose-700 px-3 py-3 rounded-xl transition-all uppercase tracking-[0.2em]"
                  >
                    Confirm Termination
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {(isMobile || isSidebarOpen) && <p className={`text-[8px] font-black ${isDarkMode ? 'text-gold-800/40' : 'text-purple-900/30'} mt-6 text-center uppercase tracking-[0.3em] opacity-50`}>Folusho © 2024</p>}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isDarkMode ? 'bg-gradient-dark-purple text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-6 md:px-8 md:py-8'}`}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {userRole === 'Teacher' ? (
                <>
                  <Route path="/teacher-dashboard" element={<PageTransition><TeacherDashboard /></PageTransition>} />
                  <Route path="/subject-results" element={<PageTransition><SubjectResultEntry /></PageTransition>} />
                  <Route path="/attendance" element={<PageTransition><Attendance /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/teacher-dashboard" replace />} />
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
                  <Route path="/results" element={<PageTransition><ResultEntry /></PageTransition>} />
                  <Route path="/subject-results" element={<PageTransition><SubjectResultEntry /></PageTransition>} />
                  <Route path="/attendance" element={<PageTransition><Attendance /></PageTransition>} />
                  <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
                  <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm md:text-sm ${
        isDarkMode 
          ? 'text-gold-300/70 hover:bg-gold-500/10 hover:text-gold-200 active:bg-gold-500/20' 
          : 'text-gold-200 hover:bg-purple-700/30 hover:text-gold-100 active:bg-purple-700/50'
      }`}
    >
      <span className={`flex-shrink-0 ${isDarkMode ? 'text-gold-400' : 'text-gold-300'} group-hover:text-gold-200`}>{icon}</span>
      {isOpen && <span className="font-medium">{label}</span>}
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
