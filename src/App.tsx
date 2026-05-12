import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink as RRNavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  BarChart3,
  GraduationCap,
  BookOpen,
  Menu,
  X,
  LogOut,
  Users,
  CheckCircle,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  FileText,
  MessageSquare,
  Timer,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "./context/AuthContext";
import { useDarkMode } from "./hooks/useLocalStorage";
import PageTransition from "./components/PageTransition";
import NotificationBell from "./components/NotificationBell";
import FloatingAcademicBackground from "./components/FloatingAcademicBackground";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Page imports with lazy loading
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const StudentManagement = React.lazy(() => import("./pages/StudentManagement"));
const TeacherManagement = React.lazy(() => import("./pages/TeacherManagement"));
const ResultEntry = React.lazy(() => import("./pages/ResultEntry"));
const SubjectResultEntry = React.lazy(() => import("./pages/SubjectResultEntry"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Attendance = React.lazy(() => import("./pages/Attendance"));
const Settings = React.lazy(() => import("./pages/Settings"));
const TeacherDashboard = React.lazy(() => import("./pages/TeacherDashboard"));
const ParentDashboard = React.lazy(() => import("./pages/ParentDashboard"));
const NotificationsPage = React.lazy(() => import("./pages/Notifications"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Deadlines = React.lazy(() => import("./pages/Deadlines"));
const ActivityLog = React.lazy(() => import("./pages/ActivityLog"));
import "./App.css";

import { fetchConfig } from "./services/api";

function AppContent() {
  const { isAuthenticated, logout, user, isHydrated } = useAuthContext();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig().then(setConfig).catch(console.error);
    }
  }, [isAuthenticated]);

  const userRole = user?.role || "Student";
  const userName = user?.name || "User";

  useEffect(() => {
    console.log('[App] Auth State:', {
      isAuthenticated,
      userRole,
      userName,
      pathname: location.pathname
    });
  }, [isAuthenticated, userRole, userName, location.pathname]);

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
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }
  const teacher = userRole === "Teacher" ? (user as any) : null;
  const teacherType = teacher?.teacherType;
  const hasAssignedClasses =
    Array.isArray(teacher?.assignedClasses) &&
    teacher.assignedClasses.length > 0;
  const hasAssignedSubjects =
    (Array.isArray(teacher?.assignedSubjects) &&
      teacher.assignedSubjects.length > 0) ||
    (typeof teacher?.subject === "string" && teacher.subject.trim().length > 0);
  const isFormTeacher =
    userRole === "Teacher" &&
    (teacherType === "Form Teacher" ||
      teacherType === "Form + Subject Teacher" ||
      (!teacherType && hasAssignedClasses));
  const isSubjectTeacher =
    userRole === "Teacher" &&
    (teacherType === "Subject Teacher" ||
      teacherType === "Form + Subject Teacher" ||
      (!teacherType && hasAssignedSubjects));
  const teacherRoleLabel =
    teacherType ||
    (isFormTeacher && isSubjectTeacher
      ? "Form + Subject Teacher"
      : isFormTeacher
        ? "Form Teacher"
        : isSubjectTeacher
          ? "Subject Teacher"
          : "Teacher");
  const teacherDefaultRoute = isFormTeacher
    ? "/results"
    : isSubjectTeacher
      ? "/subject-results"
      : "/teacher-dashboard";

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className={`flex flex-col md:flex-row h-screen bg-nebula-slate-950 text-white selection:bg-nebula-indigo-500/30 transition-colors duration-200 ${isDarkMode ? "dark" : ""}`}
    >
      <FloatingAcademicBackground />
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-nebula-slate-950/80 backdrop-blur-xl border-b border-white/5 text-white px-6 py-4 flex items-center justify-between z-40 shadow-2xl">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2.5 hover:bg-white/5 rounded-2xl transition-all active:scale-90"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg ring-1 ring-white/10">
              <img
                src={config?.schoolLogo || "/school_logo.png?v=20260512"}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-black tracking-tighter uppercase">
              {config?.schoolName?.split(" ")[0] || "FOLUSHO"}
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* Sidebar / Mobile Menu */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !showMobileMenu ? -1000 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`${
          isMobile
            ? "fixed left-4 top-[84px] bottom-4 w-[calc(100%-32px)] max-w-72 z-30"
            : `${isSidebarOpen ? "w-72" : "w-[88px]"} relative m-4 mr-0`
        } bg-nebula-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] text-white transition-all duration-300 flex flex-col shadow-nebula overflow-y-auto md:overflow-visible`}
      >
        {/* Desktop Logo - Hidden on Mobile */}
        {!isMobile && (
          <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl ring-1 ring-white/10">
                  <img
                    src={config?.schoolLogo || "/school_logo.png?v=20260512"}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-lg font-black text-white truncate tracking-tighter uppercase leading-none">
                    {typeof config?.schoolName === 'string' 
                      ? config.schoolName.split(" ")[0] 
                      : (config?.schoolName || "FOLUSHO")}
                  </h1>
                  <p className="text-[10px] text-nebula-indigo-400 font-black uppercase tracking-[0.2em] truncate mt-1">
                    Excellence Defined
                  </p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 hover:bg-white/5 rounded-xl transition-colors text-nebula-slate-400 hover:text-white ${!isSidebarOpen ? "mx-auto" : ""}`}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}

        {/* Mobile User Info */}
        {(isMobile || (isSidebarOpen && !isMobile)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-6 border-b border-white/5 bg-white/[0.02]"
          >
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-nebula-indigo-400/60">
              Identity Verified
            </p>
            <p className="font-black text-white truncate text-base mt-1 tracking-tight">
              {userName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-nebula-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
              <p className="text-xs font-bold text-nebula-slate-400">{userRole}</p>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {userRole === "Teacher" ? (
            <>
              <NavLink
                to="/teacher-dashboard"
                icon={<BarChart3 size={20} />}
                label="Intelligence"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={20} />}
                label="Champions"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {isFormTeacher && (
                <NavLink
                  to="/results"
                  icon={<BookOpen size={20} />}
                  label="Class Matrix"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
              <NavLink
                to="/subject-results"
                icon={<BookOpen size={20} />}
                label="Core Metrics"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {isFormTeacher && (
                <NavLink
                  to="/reports"
                  icon={<FileText size={20} />}
                  label="Legacy Vault"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
            </>
          ) : userRole === "Parent" ? (
            <>
              <NavLink
                to="/parent-dashboard"
                icon={<BarChart3 size={20} />}
                label="Growth Monitor"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
            </>
          ) : (
            <>
              <NavLink
                to="/"
                icon={<BarChart3 size={20} />}
                label="Command Center"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={20} />}
                label="Champions"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {userRole === "Admin" && (
                <NavLink
                  to="/teachers"
                  icon={<Users size={20} />}
                  label="Elite Squad"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}

              <NavLink
                to="/results"
                icon={<BookOpen size={20} />}
                label="Academic Matrix"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              <NavLink
                to="/subject-results"
                icon={<BookOpen size={20} />}
                label="Core Metrics"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {(userRole === "Admin" || isFormTeacher) && (
                <NavLink
                  to="/reports"
                  icon={<FileText size={20} />}
                  label="Legacy Vault"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/activity-log"
                  icon={<Eye size={20} />}
                  label="Sentinel Log"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/settings"
                  icon={<SettingsIcon size={20} />}
                  label="System Config"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="px-4 py-6 border-t border-white/5 space-y-1.5 flex-shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-nebula-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            {isDarkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
            {(isMobile || isSidebarOpen) && (
              <span className="text-xs font-black uppercase tracking-widest">
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <div className="relative">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-nebula-slate-400 hover:text-nebula-pink-400 hover:bg-nebula-pink-500/10 transition-all duration-200"
            >
              <LogOut size={20} />
              {(isMobile || isSidebarOpen) && (
                <span className="text-xs font-black uppercase tracking-widest">Secure Exit</span>
              )}
            </button>
            <AnimatePresence>
              {showLogout && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full mb-3 left-0 right-0 bg-nebula-slate-900 border border-white/10 rounded-3xl shadow-nebula-lg z-50 p-3"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full text-xs font-black uppercase tracking-widest text-white bg-nebula-pink-600 hover:bg-nebula-pink-700 px-4 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    Confirm Exit
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {(isMobile || isSidebarOpen) && (
            <p className="text-[10px] text-nebula-slate-600 mt-4 text-center font-black tracking-[0.3em] uppercase">
              NEBULA © 2026
            </p>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-nebula-slate-950 text-white">
        <div
          className={`max-w-7xl mx-auto ${isMobile ? "p-6 pt-2" : "p-8 md:p-12"}`}
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {userRole === "Teacher" ? (
                <>
                  <Route
                    path="/teacher-dashboard"
                    element={
                      <PageTransition>
                        <TeacherDashboard />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/students"
                    element={
                      <PageTransition>
                        <StudentManagement />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/results"
                    element={
                      isFormTeacher ? (
                        <PageTransition>
                          <ResultEntry />
                        </PageTransition>
                      ) : (
                        <Navigate to={teacherDefaultRoute} replace />
                      )
                    }
                  />
                  <Route
                    path="/subject-results"
                    element={
                      <PageTransition>
                        <SubjectResultEntry />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <PageTransition>
                        <Attendance />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      isFormTeacher ? (
                        <PageTransition>
                          <Reports />
                        </PageTransition>
                      ) : (
                        <Navigate to={teacherDefaultRoute} replace />
                      )
                    }
                  />
                  <Route
                    path="*"
                    element={<Navigate to={teacherDefaultRoute} replace />}
                  />
                </>
              ) : userRole === "Parent" ? (
                <>
                  <Route
                    path="/parent-dashboard"
                    element={
                      <PageTransition>
                        <ParentDashboard />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/parent-dashboard" replace />}
                  />
                </>
              ) : (
                <>
                  <Route
                    path="/"
                    element={
                      <PageTransition>
                        <Dashboard />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/students"
                    element={
                      <PageTransition>
                        <StudentManagement />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/teachers"
                    element={
                      <PageTransition>
                        <TeacherManagement />
                      </PageTransition>
                    }
                  />

                  <Route
                    path="/results"
                    element={
                      <PageTransition>
                        <ResultEntry />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/subject-results"
                    element={
                      <PageTransition>
                        <SubjectResultEntry />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <PageTransition>
                        <Attendance />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <PageTransition>
                        <Reports />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <PageTransition>
                        <NotificationsPage />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <PageTransition>
                        <Messages />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/deadlines"
                    element={
                      <PageTransition>
                        <Deadlines />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/activity-log"
                    element={
                      <PageTransition>
                        <ActivityLog />
                      </PageTransition>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PageTransition>
                        <Settings />
                      </PageTransition>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
              </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  isDarkMode?: boolean;
}

function NavLink({ to, icon, label, isOpen, onClick }: NavLinkProps & { onClick?: () => void }) {
  return (
    <RRNavLink
      to={to}
      onClick={onClick}
      className={({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 text-xs font-black uppercase tracking-widest ${
          isActive
            ? "bg-gradient-to-r from-nebula-indigo-600 to-nebula-indigo-800 text-white shadow-nebula glow-indigo"
            : "text-nebula-slate-400 hover:text-white hover:bg-white/5"
        }`
      }
    >
      <span className="flex-shrink-0 w-5 flex items-center justify-center">
        {icon}
      </span>
      {isOpen && <span className="truncate">{label}</span>}
    </RRNavLink>
  );
}

export default function App() {
  return (
    <ErrorBoundary showDetails={true}>
      <Router>
        <React.Suspense fallback={
          <div className="fixed inset-0 bg-royal-dark-950 flex flex-col items-center justify-center z-[9999]">
            <div className="w-16 h-16 border-4 border-royal-purple-500/20 border-t-royal-purple-500 rounded-full animate-spin mb-6" />
            <p className="text-royal-purple-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Initializing Digital Citadel...</p>
          </div>
        }>
          <AppContent />
        </React.Suspense>
      </Router>
    </ErrorBoundary>
  );
}
