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
import { motion } from "framer-motion";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

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
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-16"
    >
      {/* Hero Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div variants={itemVariants} className="space-y-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-folusho-slate-900 leading-[0.85] tracking-tighter">
              Inspiring <br />
              Excellence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Folusho.</span>
            </h1>
            <p className="text-xl text-folusho-slate-400 font-bold max-w-xl leading-relaxed tracking-tight">
              A premium academic sanctuary designed for precision, institutional governance, and nurturing the champions of tomorrow.
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            {userRole === 'Admin' && (
              <Link to="/settings" className="btn-vibrant from-folusho-sage-600 to-folusho-sage-800 group shadow-folusho">
                <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Control Center
              </Link>
            )}
            {userRole === 'Teacher' && (
              <Link to="/subject-results" className="btn-vibrant from-folusho-coral-500 to-folusho-coral-700 !text-white group shadow-folusho">
                <ClipboardList className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Academic Matrix
              </Link>
            )}
            <button className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.35em] text-folusho-sage-500 hover:text-folusho-slate-900 transition-all group">
              Legacy Vault
              <Check className="w-4 h-4 group-hover:translate-x-3 transition-transform" />
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="folusho-card !p-12 border-folusho-cream-300 shadow-folusho-lg">
           <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-folusho-sage-50 rounded-3xl flex items-center justify-center border border-folusho-sage-100 shadow-inner">
                <BookOpen className="w-8 h-8 text-folusho-sage-400" />
              </div>
              <h2 className="text-xl font-black text-folusho-slate-900 tracking-tighter uppercase leading-none">Global <br /> <span className="text-folusho-sage-500">Infrastructure</span></h2>
           </div>

           <div className="space-y-10">
              <div className="flex gap-6 group/item">
                <div className="w-3.5 h-3.5 rounded-full bg-folusho-sage-400 mt-2.5 flex-shrink-0 shadow-sm group-hover/item:scale-125 transition-transform" />
                <div>
                  <h3 className="text-xs font-black text-folusho-slate-900 uppercase tracking-[0.25em] mb-2">Elite Governance</h3>
                  <p className="text-sm text-folusho-slate-400 font-bold leading-relaxed">Centralized intelligence for academic and institutional precision.</p>
                </div>
              </div>
              <div className="flex gap-6 group/item">
                <div className="w-3.5 h-3.5 rounded-full bg-folusho-coral-400 mt-2.5 flex-shrink-0 shadow-sm group-hover/item:scale-125 transition-transform" />
                <div>
                  <h3 className="text-xs font-black text-folusho-slate-900 uppercase tracking-[0.25em] mb-2">Precision Metrics</h3>
                  <p className="text-sm text-folusho-slate-400 font-bold leading-relaxed">Advanced frameworks for student character and growth analysis.</p>
                </div>
              </div>
              <div className="flex gap-6 group/item">
                <div className="w-3.5 h-3.5 rounded-full bg-folusho-yellow-500 mt-2.5 flex-shrink-0 shadow-sm group-hover/item:scale-125 transition-transform" />
                <div>
                  <h3 className="text-xs font-black text-folusho-slate-900 uppercase tracking-[0.25em] mb-2">Strategic Alliance</h3>
                  <p className="text-sm text-folusho-slate-400 font-bold leading-relaxed">Transparent and real-time engagement for all school stakeholders.</p>
                </div>
              </div>
           </div>
        </motion.div>
      </div>

      {/* Analytics Matrix */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Champions"
          value={stats.totalStudents}
          color="indigo"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Active Deployments"
          value={stats.activeStudents}
          color="teal"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          label="Core Records"
          value={stats.totalResults}
          color="pink"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Performance Index"
          value={`${stats.averageScore}%`}
          color="indigo"
        />
      </motion.div>

      {/* Visual Intelligence Section */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12"
      >
        <div className="folusho-card">
          <h2 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] mb-12">
            Performance Matrix
          </h2>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformanceData}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="rgba(45,42,38,0.05)"
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
                  cursor={{ fill: "rgba(168,198,159,0.1)", radius: 16 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-folusho-cream-200 p-6 rounded-4xl shadow-folusho-lg">
                          <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-widest mb-2">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-3xl font-black text-folusho-slate-900 tracking-tighter">
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
                  fill="url(#sageGradient)"
                  radius={[12, 12, 12, 12]}
                  barSize={48}
                />
                <defs>
                  <linearGradient id="sageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A8C69F" />
                    <stop offset="100%" stopColor="#8fb185" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="folusho-card">
          <h2 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.45em] mb-12">
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
                        <div className="bg-white border border-folusho-cream-200 p-6 rounded-4xl shadow-folusho-lg">
                          <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest mb-2">
                            {payload[0].name}
                          </p>
                          <p className="text-3xl font-black text-folusho-slate-900 tracking-tighter">
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
                  <span className="text-[10px] text-folusho-slate-400 font-black uppercase tracking-widest leading-none mb-1">
                    {entry.name}
                  </span>
                  <span className="text-base text-folusho-slate-900 font-black leading-none">
                    {String(entry.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Performance Insights Matrix */}
      <motion.div variants={itemVariants} className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-folusho-cream-200 pb-10">
          <h2 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em]">
            Precision Analytics Engine
          </h2>
          <div className="flex items-center gap-4 bg-folusho-yellow-200/50 p-2.5 rounded-2xl border border-folusho-yellow-300/30">
            <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest ml-3">Matrix Filter:</span>
            <select
              value={selectedAnalyticsClass}
              onChange={(e) => setSelectedAnalyticsClass(e.target.value)}
              className="bg-white text-folusho-slate-900 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest outline-none border border-folusho-cream-200 focus:ring-4 focus:ring-folusho-sage-400/20 transition-all"
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
      </motion.div>

      {/* Activity Monitor Section */}
      <motion.div variants={itemVariants} className="folusho-card">
        <h2 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] mb-12 flex items-center gap-5">
          <TrendingUp className="w-5 h-5" /> Recent Sync Operations
        </h2>
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-folusho-cream-400">
            <AlertCircle className="w-20 h-20 mb-6 opacity-20" />
            <p className="font-black uppercase tracking-[0.35em] text-[10px]">
              No data streams available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {recentResults.map((result) => (
              <motion.div
                key={result.id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="p-10 bg-folusho-cream-100/50 rounded-4xl border border-folusho-cream-200 flex justify-between items-center group transition-all duration-500 shadow-sm hover:shadow-folusho"
              >
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.25em]">
                    {result.term}
                  </p>
                  <p className="text-xl font-black text-folusho-slate-900 tracking-tighter">
                    {result.academicYear}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-4xl font-black ${result.percentage >= 60 ? "text-folusho-sage-500" : "text-folusho-coral-500"} tracking-tighter`}
                  >
                    {result.grade}
                  </span>
                  <span className="text-[11px] font-black text-folusho-slate-400 tracking-widest">
                    {Math.round(result.percentage)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* AI Performance Insights - Only for Admin/Teacher */}
      {(userRole === "Admin" || userRole === "Teacher") && (
        <motion.div variants={itemVariants} className="pt-16">
          <h2 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] mb-12">
            Folusho AI Analytics Engine
          </h2>
          <PerformanceInsights />
        </motion.div>
      )}

      {/* Teacher Activity and Messages - Activity for Admin, Messages for Admin/Teacher */}
      {(userRole === "Admin" || userRole === "Teacher") && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 xl:grid-cols-2 gap-16"
        >
          {userRole === "Admin" && (
            <div className="space-y-10">
              <h2 className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em]">
                Sentinel Monitor
              </h2>
              <TeacherActivityLog />
            </div>
          )}
          <div className="space-y-10">
            <h2 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.45em]">
              Inter-Citadel Communication
            </h2>
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
          className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md flex items-center justify-center p-8 z-50"
          onClick={() => !isChangingPassword && setShowPasswordModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-folusho-cream-200 rounded-[3rem] shadow-folusho max-w-lg w-full p-12 overflow-hidden"
          >
            <div className="flex items-center gap-6 mb-12">
              <div className="p-5 bg-folusho-sage-50 rounded-[2rem] border border-folusho-sage-100 shadow-sm">
                <Lock className="w-8 h-8 text-folusho-sage-500" />
              </div>
              <h2 className="text-2xl font-black text-folusho-slate-900 tracking-tighter uppercase leading-none">
                Update <br /> <span className="text-folusho-sage-500">Credentials</span>
              </h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-8">
              {/* Current Password */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em] px-2">
                  Identity Verification
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
                    className="input-folusho !py-5"
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
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-folusho-slate-400 hover:text-folusho-sage-500 transition-colors"
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
                <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
                  New Encryption Sequence
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
                    className="input-folusho !py-5"
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
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-folusho-slate-400 hover:text-folusho-sage-500 transition-colors"
                  >
                    {showPassword.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-folusho-slate-400 font-bold uppercase tracking-widest mt-3 px-2">
                  Min 12 chars, mixed casing, symbol
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
                  Verify Sequence
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
                    className="input-folusho !py-5"
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
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-folusho-slate-400 hover:text-folusho-sage-500 transition-colors"
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-folusho-coral-50 border border-folusho-coral-100 rounded-3xl flex items-start gap-4"
                >
                  <X className="w-5 h-5 text-folusho-coral-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-folusho-coral-500">
                    {passwordError}
                  </p>
                </motion.div>
              )}

              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-folusho-sage-50 border border-folusho-sage-100 rounded-3xl flex items-start gap-4"
                >
                  <CheckCircle className="w-5 h-5 text-folusho-sage-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-folusho-sage-600">
                    Credentials updated successfully.
                  </p>
                </motion.div>
              )}

              <div className="flex gap-6 pt-6">
                <button
                  type="button"
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordError("");
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
  );
}
