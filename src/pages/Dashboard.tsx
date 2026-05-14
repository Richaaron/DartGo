import { useMemo, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  FileText,
  ClipboardList,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { Student, SubjectResult } from "../types";
import ChatSystem from "../components/ChatSystem";
import TeacherActivityLog from "../components/TeacherActivityLog";
import PerformanceInsights from "../components/PerformanceInsights";
import SubjectMetrics from "../components/SubjectMetrics";
import { fetchStudents, fetchResults, fetchSubjects } from "../services/api";
import apiService from "../services/apiService";
import { useAuthContext } from "../context/AuthContext";

// Folusho-inspired colors for charts
const COLORS = [
  "#A8C69F", // Sage
  "#FF8A7A", // Coral
  "#FFF4D1", // Yellow
  "#818cf8", // Indigo (secondary)
  "#14b8a6", // Teal (secondary)
  "#f472b6", // Pink (secondary)
  "#2d2a26", // Slate
  "#e6e2d6", // Cream
];



export default function Dashboard() {
  const { user } = useAuthContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAnalyticsClass, setSelectedAnalyticsClass] = useState<string>("All");

  const userRole = user?.role || "Student";
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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, resultsData, subjectsData] = await Promise.all([
          fetchStudents(),
          fetchResults(),
          fetchSubjects(),
        ]);
        setStudents(studentsData);
        setResults(resultsData);
        setSubjects(subjectsData);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Failed to load dashboard data", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const studentList = Array.isArray(students) ? students : [];
    const resultList = Array.isArray(results) ? results : [];

    const activeStudents = studentList.filter(
      (s) => s && s.status === "Active",
    ).length;
    const totalResults = resultList.length;
    const avgScore =
      totalResults > 0
        ? Math.round(
            (resultList.reduce((sum, r) => sum + (r?.percentage || 0), 0) /
              totalResults) *
              100,
          ) / 100
        : 0;

    return {
      totalStudents: studentList.length,
      activeStudents,
      totalResults,
      averageScore: avgScore,
    };
  }, [students, results]);

  const classPerformanceData = useMemo(() => {
    const studentList = Array.isArray(students) ? students : [];
    const resultList = Array.isArray(results) ? results : [];

    const classes = [
      ...new Set(studentList.map((s) => s?.class).filter(Boolean)),
    ];

    // Optimization: Group students by class and results by studentId
    const studentsByClass = studentList.reduce(
      (acc, s) => {
        if (s && s.class) {
          if (!acc[s.class]) acc[s.class] = [];
          acc[s.class].push(s.id);
        }
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const resultsByStudent = resultList.reduce(
      (acc, r) => {
        if (r && r.studentId) {
          if (!acc[r.studentId]) acc[r.studentId] = [];
          acc[r.studentId].push(r);
        }
        return acc;
      },
      {} as Record<string, SubjectResult[]>,
    );

    return classes.map((className) => {
      const classStudentIds = studentsByClass[className] || [];
      const classResults = classStudentIds.flatMap(
        (id) => resultsByStudent[id] || [],
      );
      const avgScore =
        classResults.length > 0
          ? Math.round(
              classResults.reduce((sum, r) => sum + (r?.percentage || 0), 0) /
                classResults.length,
            )
          : 0;
      return { name: className, average: avgScore };
    });
  }, [students, results]);

  const studentStatusData = useMemo(() => {
    const studentList = Array.isArray(students) ? students : [];
    const statusCounts = studentList.reduce((acc: any, s) => {
      if (s && s.status) {
        acc[s.status] = (acc[s.status] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [students]);

  const recentResults = useMemo(() => {
    const resultList = Array.isArray(results) ? results : [];
    return [...resultList].reverse().slice(0, 5);
  }, [results]);

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 12) errors.push("At least 12 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("One number");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("One special character");
    return errors;
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const validationErrors = validatePassword(passwordForm.newPassword);
    if (validationErrors.length > 0) {
      setPasswordError(
        `New password must contain: ${validationErrors.join(", ")}`,
      );
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiService.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      window.setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to change password";
      setPasswordError(errorMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Loading Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.85] tracking-tighter">
              Inspiring <br />
              Excellence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Folusho.</span>
            </h1>
            <p className="text-xl text-slate-400 font-bold max-w-xl leading-relaxed tracking-tight">
              A premium academic sanctuary designed for precision, institutional governance, and nurturing the champions of tomorrow.
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            {userRole === 'Admin' && (
              <Link to="/settings" className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all group">
                <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Control Center
              </Link>
            )}
            {userRole === 'Teacher' && (
              <Link to="/subject-results" className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all group">
                <ClipboardList className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Academic Matrix
              </Link>
            )}
            <button className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.35em] text-indigo-600 hover:text-indigo-700 transition-all group">
              Legacy Records
              <Check className="w-4 h-4 group-hover:translate-x-3 transition-transform" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg">
           <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shadow-inner">
                <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">System <br /> <span className="text-indigo-600 dark:text-indigo-400">Features</span></h2>
           </div>

           <div className="space-y-10">
               <div className="flex gap-6 group/item">
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 mt-2.5 flex-shrink-0 shadow-sm group-hover/item:scale-125 transition-transform" />
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] mb-2">Administration</h3>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">Centralized tools for academic and institutional management.</p>
                </div>
              </div>
              <div className="flex gap-6 group/item">
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 mt-2.5 flex-shrink-0 shadow-sm group-hover/item:scale-125 transition-transform" />
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] mb-2">Student Progress</h3>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">Tools for tracking student performance and growth analysis.</p>
                </div>
              </div>
              <div className="flex gap-6 group/item">
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 mt-2.5 flex-shrink-0 shadow-sm group-hover/item:scale-125 transition-transform" />
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] mb-2">Communication</h3>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">Engagement and updates for all school stakeholders.</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Students"
          value={stats.totalStudents}
          color="indigo"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Active Students"
          value={stats.activeStudents}
          color="indigo"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          label="Total Records"
          value={stats.totalResults}
          color="indigo"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Avg Score"
          value={`${stats.averageScore}%`}
          color="indigo"
        />
      </div>

      {/* Visual Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-lg">
          <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.45em] mb-12">
            Performance Matrix
          </h2>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformanceData}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 800 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 800 }}
                  domain={[0, 100]}
                />
                  <Tooltip
                  cursor={{ fill: "rgba(99,102,241,0.1)", radius: 16 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
                          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {payload[0].value}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="average"
                  fill="url(#indigoGradient)"
                  radius={[12, 12, 12, 12]}
                  barSize={48}
                />
                <defs>
                  <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-lg">
          <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.45em] mb-12">
            Deployment Status
          </h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={105}
                  paddingAngle={15}
                  dataKey="value"
                  stroke="none"
                >
                  {studentStatusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg">
                          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                            {payload[0].name}
                          </p>
                          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            {studentStatusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-4">
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
                    {entry.name}
                  </span>
                  <span className="text-base text-slate-900 dark:text-white font-black leading-none">
                    {String(entry.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
          <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.45em]">
            Precision Analytics Engine
          </h2>
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Matrix Filter:</span>
            <select
              value={selectedAnalyticsClass}
              onChange={(e) => setSelectedAnalyticsClass(e.target.value)}
              className="bg-white dark:bg-slate-950/50 text-slate-900 dark:text-white rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest outline-none border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/20 transition-all"
            >
              <option value="All">Global View</option>
              {[...new Set(students.map(s => s.class))].filter(Boolean).sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        
        <SubjectMetrics 
          students={students} 
          results={results} 
          subjects={subjects} 
          selectedClass={selectedAnalyticsClass} 
        />
      </div>

      {/* Activity Monitor Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-lg">
        <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] mb-12 flex items-center gap-5">
          <TrendingUp className="w-5 h-5" /> Recent Results
        </h2>
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <AlertCircle className="w-20 h-20 mb-6 opacity-20" />
            <p className="font-black uppercase tracking-[0.35em] text-[10px]">
              No data streams available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {recentResults.map((result) => (
              <div
                key={result.id}
                className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group transition-all duration-500 shadow-sm hover:shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              >
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em]">
                    {result.term}
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {result.academicYear}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-4xl font-black ${result.percentage >= 60 ? "text-emerald-500" : "text-rose-500"} tracking-tighter`}
                  >
                    {result.grade}
                  </span>
                  <span className="text-[11px] font-black text-slate-500 tracking-widest">
                    {Math.round(result.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Performance Insights - Only for Admin/Teacher */}
      {(userRole === "Admin" || userRole === "Teacher") && (
        <div className="pt-16">
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] mb-12">
            AI Analytics
          </h2>
          <PerformanceInsights />
        </div>
      )}

      {/* Teacher Activity and Messages - Activity for Admin, Messages for Admin/Teacher */}
      {(userRole === "Admin" || userRole === "Teacher") && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
          {userRole === "Admin" && (
            <div className="space-y-10">
              <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.45em]">
                Sentinel Monitor
              </h2>
              <TeacherActivityLog />
            </div>
          )}
          <div className="space-y-10">
            <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.45em]">
              Inter-Citadel Communication
            </h2>
            <ChatSystem />
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8 z-50"
          onClick={() => !isChangingPassword && setShowPasswordModal(false)}
        >
          <div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-12 overflow-hidden"
          >
            <div className="flex items-center gap-6 mb-12">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                Update <br /> <span className="text-indigo-600 dark:text-indigo-400">Password</span>
              </h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-8">
              {/* Current Password */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">
                  Current Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    disabled={isChangingPassword}
                    className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        current: !showPassword.current,
                      })
                    }
                    disabled={isChangingPassword}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword.current ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] px-2">
                  New Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    disabled={isChangingPassword}
                    className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        new: !showPassword.new,
                      })
                    }
                    disabled={isChangingPassword}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 px-2">
                  Min 12 chars, mixed casing, symbol
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] px-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    disabled={isChangingPassword}
                    className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        confirm: !showPassword.confirm,
                      })
                    }
                    disabled={isChangingPassword}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword.confirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div
                  className="p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 dark:bg-rose-500/10 dark:border-rose-500/20"
                >
                  <X className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {passwordError}
                  </p>
                </div>
              )}

              {passwordSuccess && (
                <div
                  className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Credentials updated successfully.
                  </p>
                </div>
              )}

              <div className="flex gap-6 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordError("");
                    setShowPasswordModal(false);
                  }}
                  disabled={isChangingPassword}
                  className="flex-1 px-8 py-4 bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-4"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
