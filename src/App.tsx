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
import { ErrorBoundary } from "./components/ErrorBoundary";

// Regular imports (removed lazy loading)
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentManagement from "./pages/StudentManagement";
import TeacherManagement from "./pages/TeacherManagement";
import ResultEntry from "./pages/ResultEntry";
import SubjectResultEntry from "./pages/SubjectResultEntry";
import Reports from "./pages/Reports";
import Attendance from "./pages/Attendance";
import Settings from "./pages/Settings";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import AdminSchemeUpload from "./pages/AdminSchemeUpload";
import NotificationsPage from "./pages/Notifications";
import Messages from "./pages/Messages";
import Deadlines from "./pages/Deadlines";
import ActivityLog from "./pages/ActivityLog";
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

  const userRole = user?.role || "Student";
  const userName = user?.name || "User";
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
      className={`flex flex-col md:flex-row h-screen bg-brand-100 dark:bg-brand-900 transition-colors duration-200 ${isDarkMode ? "dark" : ""}`}
    >
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-brand-900 border-b border-brand-700/50 text-white px-4 py-3 flex items-center justify-between z-40 shadow-lg">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gold-500/10 rounded-lg transition-all active:scale-90"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            {config?.schoolLogo ? (
              <img
                src={config.schoolLogo}
                alt="Logo"
                className="w-8 h-8 object-contain rounded-full ring-2 ring-white/20"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <GraduationCap size={18} />
              </div>
            )}
            <span className="text-sm font-semibold text-white">
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
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
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
            ? "fixed left-0 top-[60px] bottom-0 w-72 z-30"
            : `${isSidebarOpen ? "w-64" : "w-[72px]"} relative`
        } bg-brand-900 border-r border-brand-700/30 text-white transition-all duration-300 flex flex-col shadow-xl overflow-y-auto md:overflow-visible`}
      >
        {/* Desktop Logo - Hidden on Mobile */}
        {!isMobile && (
          <div className="p-5 border-b border-brand-700/50 flex items-center justify-between flex-shrink-0">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                {config?.schoolLogo ? (
                  <img
                    src={config.schoolLogo}
                    alt="Logo"
                    className="w-9 h-9 object-contain rounded-lg ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <GraduationCap size={24} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <h1 className="text-sm font-bold text-white truncate">
                    {config?.schoolName?.split(" ")[0] || "FOLUSHO"}
                  </h1>
                  <p className="text-[10px] text-brand-400 truncate mt-0.5">
                    {config?.schoolName?.split(" ").slice(1).join(" ") ||
                      "Victory Schools"}
                  </p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-brand-400 hover:text-white"
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
            className="px-4 py-4 border-b border-brand-700/50 bg-brand-800/40"
          >
            <p className="text-[10px] uppercase font-medium tracking-wider text-brand-400">
              Signed In As
            </p>
            <p className="font-semibold text-white truncate text-sm mt-1">
              {userName}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <p className="text-xs text-brand-300">{userRole}</p>
            </div>
            {userRole === "Teacher" && (
              <p className="text-[10px] text-brand-400 mt-0.5">
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
            className="px-5 py-4 border-b border-brand-700/50 bg-brand-800/40 flex-shrink-0"
          >
            <p className="text-[10px] uppercase font-medium tracking-wider text-brand-400">
              Signed In As
            </p>
            <p className="font-semibold text-white truncate text-sm mt-1">
              {userName}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <p className="text-xs text-brand-300">{userRole}</p>
            </div>
            {userRole === "Teacher" && (
              <p className="text-[10px] text-brand-400 mt-0.5">
                {teacherRoleLabel}
              </p>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {userRole === "Teacher" ? (
            <>
              <NavLink
                to="/teacher-dashboard"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Squads"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={isMobile ? 20 : 18} />}
                label="Champions"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {isFormTeacher && (
                <NavLink
                  to="/results"
                  icon={<BookOpen size={isMobile ? 20 : 18} />}
                  label="Class Results"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {isSubjectTeacher && (
                <NavLink
                  to="/subject-results"
                  icon={<BookOpen size={isMobile ? 20 : 18} />}
                  label="Subject Results"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              <NavLink
                to="/attendance"
                icon={<CheckCircle size={isMobile ? 20 : 18} />}
                label="Attendance"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
            </>
          ) : userRole === "Parent" ? (
            <>
              <NavLink
                to="/parent-dashboard"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="My Child's Progress"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
            </>
          ) : (
            <>
              <NavLink
                to="/"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Overview"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={isMobile ? 20 : 18} />}
                label="Champions"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {userRole === "Admin" && (
                <NavLink
                  to="/teachers"
                  icon={<Users size={isMobile ? 20 : 18} />}
                  label="Squads"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/admin-schemes"
                  icon={<FileText size={isMobile ? 20 : 18} />}
                  label="Schemes"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              <NavLink
                to="/results"
                icon={<BookOpen size={isMobile ? 20 : 18} />}
                label="Results"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/subject-results"
                icon={<BookOpen size={isMobile ? 20 : 18} />}
                label="Subject Results"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/attendance"
                icon={<CheckCircle size={isMobile ? 20 : 18} />}
                label="Attendance"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/reports"
                icon={<BarChart3 size={isMobile ? 20 : 18} />}
                label="Reports"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              <NavLink
                to="/notifications"
                icon={<Bell size={isMobile ? 20 : 18} />}
                label="Notifications"
                isOpen={isMobile || isSidebarOpen}
                isDarkMode={isDarkMode}
              />
              {userRole === "Admin" && (
                <NavLink
                  to="/messages"
                  icon={<MessageSquare size={isMobile ? 20 : 18} />}
                  label="Messages"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/deadlines"
                  icon={<Timer size={isMobile ? 20 : 18} />}
                  label="Deadlines"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/activity-log"
                  icon={<Eye size={isMobile ? 20 : 18} />}
                  label="Activity Log"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/settings"
                  icon={<SettingsIcon size={isMobile ? 20 : 18} />}
                  label="Settings"
                  isOpen={isMobile || isSidebarOpen}
                  isDarkMode={isDarkMode}
                />
              )}
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 py-3 border-t border-brand-700/50 space-y-0.5 flex-shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-400 hover:text-white hover:bg-white/[0.07] transition-colors duration-150"
          >
            {isDarkMode ? (
              <Sun size={isMobile ? 20 : 18} />
            ) : (
              <Moon size={isMobile ? 20 : 18} />
            )}
            {(isMobile || isSidebarOpen) && (
              <span className="text-sm font-medium">
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <div className="relative">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors duration-150"
            >
              <LogOut size={isMobile ? 20 : 18} />
              {(isMobile || isSidebarOpen) && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </button>
            <AnimatePresence>
              {showLogout && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 right-0 bg-brand-800 border border-brand-700 rounded-xl shadow-xl z-50 p-2"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full text-sm font-semibold text-rose-300 hover:text-white hover:bg-red-600 px-4 py-2.5 rounded-lg transition-colors duration-150"
                  >
                    Confirm Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {(isMobile || isSidebarOpen) && (
            <p className="text-[10px] text-brand-600 mt-3 text-center">
              Folusho © 2025
            </p>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-brand-50 dark:bg-brand-900 text-brand-900 dark:text-white">
        <div
          className={`max-w-7xl mx-auto ${isMobile ? "px-4 py-4" : "px-6 py-6 md:px-8 md:py-8"}`}
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
                      isSubjectTeacher ? (
                        <PageTransition>
                          <SubjectResultEntry />
                        </PageTransition>
                      ) : (
                        <Navigate to={teacherDefaultRoute} replace />
                      )
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
                    path="/admin-schemes"
                    element={
                      <PageTransition>
                        <AdminSchemeUpload />
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

function NavLink({ to, icon, label, isOpen }: NavLinkProps) {
  return (
    <RRNavLink
      to={to}
      className={({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm font-medium ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-brand-300 hover:text-white hover:bg-white/[0.07]"
        }`
      }
    >
      <span className="flex-shrink-0 w-[18px] flex items-center justify-center">
        {icon}
      </span>
      {isOpen && <span className="truncate">{label}</span>}
    </RRNavLink>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}
