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
import { useAuthContext } from "./context/AuthContext";
import { useDarkMode } from "./hooks/useLocalStorage";
import PageTransition from "./components/PageTransition";
import NotificationBell from "./components/NotificationBell";
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
      <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading System...</p>
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
      className={`flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 ${isDarkMode ? "dark" : ""}`}
    >
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-40 shadow-sm">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center p-1.5 shadow-sm">
              <img
                src={config?.schoolLogo || "/school_logo.png?v=20260512"}
                alt="Logo"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            <span className="text-base font-bold tracking-tight">
              {config?.schoolName?.split(" ")[0] || "FOLUSHO"}
            </span>
          </div>
          <NotificationBell />
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobile && showMobileMenu && (
        <div
          onClick={() => setShowMobileMenu(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      <aside
        className={`${
          isMobile
            ? "fixed left-0 top-0 bottom-0 w-72 z-30 shadow-2xl"
            : `${isSidebarOpen ? "w-72" : "w-20"} relative`
        } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col overflow-y-auto`}
      >
        {!isMobile && (
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            {isSidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center p-2 shadow-sm">
                  <img
                    src={config?.schoolLogo || "/school_logo.png?v=20260512"}
                    alt="Logo"
                    className="w-full h-full object-contain brightness-0 invert"
                  />
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight">
                    {typeof config?.schoolName === 'string' 
                      ? config.schoolName.split(" ")[0] 
                      : (config?.schoolName || "FOLUSHO")}
                  </h1>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-indigo-600 ${!isSidebarOpen ? "mx-auto" : ""}`}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}

        {(isMobile || (isSidebarOpen && !isMobile)) && (
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {userName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{userRole}</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {userRole === "Teacher" ? (
            <>
              <NavLink
                to="/teacher-dashboard"
                icon={<BarChart3 size={20} />}
                label="Dashboard"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={20} />}
                label="Students"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {isFormTeacher && (
                <NavLink
                  to="/results"
                  icon={<BookOpen size={20} />}
                  label="Results"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
              <NavLink
                to="/subject-results"
                icon={<BookOpen size={20} />}
                label="Subject Scores"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {isFormTeacher && (
                <NavLink
                  to="/reports"
                  icon={<FileText size={20} />}
                  label="Reports"
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
                label="Dashboard"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              <NavLink
                to="/students"
                icon={<GraduationCap size={20} />}
                label="Students"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {userRole === "Admin" && (
                <NavLink
                  to="/teachers"
                  icon={<Users size={20} />}
                  label="Teachers"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}

              <NavLink
                to="/results"
                icon={<BookOpen size={20} />}
                label="Class Results"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              <NavLink
                to="/subject-results"
                icon={<BookOpen size={20} />}
                label="Subject Results"
                isOpen={isMobile || isSidebarOpen}
                onClick={() => setShowMobileMenu(false)}
              />
              {(userRole === "Admin" || isFormTeacher) && (
                <NavLink
                  to="/reports"
                  icon={<FileText size={20} />}
                  label="Reports"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/activity-log"
                  icon={<Eye size={20} />}
                  label="Activity Log"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
              {userRole === "Admin" && (
                <NavLink
                  to="/settings"
                  icon={<SettingsIcon size={20} />}
                  label="Settings"
                  isOpen={isMobile || isSidebarOpen}
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-1 flex-shrink-0">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {(isMobile || isSidebarOpen) && (
              <span className="text-sm font-medium">
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={20} />
            {(isMobile || isSidebarOpen) && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-transparent">
        <div
          className={`max-w-7xl mx-auto ${isMobile ? "p-6 pt-2" : "p-10 md:p-16"}`}
        >
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
        `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
          isActive
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
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
          <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-[9999]">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
            <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Initializing Digital Citadel...</p>
          </div>
        }>
          <AppContent />
        </React.Suspense>
      </Router>
    </ErrorBoundary>
  );
}
