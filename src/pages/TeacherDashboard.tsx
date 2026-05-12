import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Timer,
  Clock,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "../components/StatCard";
import Table from "../components/Table";
import { useAuthContext } from "../context/AuthContext";
import { Student, SubjectResult, Subject } from "../types";
import { formatDate } from "../utils/calculations";
import {
  fetchStudents,
  fetchResults,
  fetchSubjects,
  fetchDeadlines,
} from "../services/api";
import ChatSystem from "../components/ChatSystem";
import PerformanceInsights from "../components/PerformanceInsights";
import SubjectMetrics from "../components/SubjectMetrics";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function TeacherDashboard() {
  const { user } = useAuthContext();
  const teacher = user as any;
  const assignedSubjects = useMemo(
    () =>
      teacher?.assignedSubjects && teacher.assignedSubjects.length > 0
        ? teacher.assignedSubjects
        : (teacher?.subject || "")
            .split(",")
            .map((subject: string) => subject.trim())
            .filter(Boolean),
    [teacher],
  );

  // Debug logging
  useEffect(() => {
    console.log('[TeacherDashboard] Teacher data:', {
      name: teacher?.name,
      assignedClasses: teacher?.assignedClasses,
      assignedSubjects: teacher?.assignedSubjects,
      subject: teacher?.subject,
      computedAssignedSubjects: assignedSubjects,
    });
  }, [teacher, assignedSubjects]);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "results" | "messages" | "insights" | "analytics"
  >("results");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (teacher?.assignedClasses?.length && selectedClass === "All") {
      setSelectedClass("All");
    }
  }, [teacher?.assignedClasses, selectedClass]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsData, resultsData, subjectsData, deadlinesData] =
        await Promise.all([
          fetchStudents(),
          fetchResults(),
          fetchSubjects(),
          fetchDeadlines(),
        ]);
      setStudents(studentsData);
      setResults(resultsData);
      setSubjects(subjectsData);
      setDeadlines(
        deadlinesData.filter(
          (d) =>
            d.status === "ACTIVE" && new Date(d.deadline_date) > new Date(),
        ),
      );
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to load dashboard data", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const teacherResults = useMemo(() => {
    return results.filter((r) => {
      const student = students.find((s) => s.id === r.studentId);
      const subject = subjects.find((sub) => sub.id === r.subjectId);
      
      // Form teacher: sees results for assigned classes
      const isFormTeacher = teacher?.assignedClasses?.length > 0;
      const matchesAsFormTeacher =
        isFormTeacher && student && teacher?.assignedClasses?.includes(student.class);
      
      // Subject teacher: sees results for assigned subjects
      const isSubjectTeacher = assignedSubjects.length > 0;
      const matchesAsSubjectTeacher =
        isSubjectTeacher && assignedSubjects.includes(subject?.name);
      
      // Teacher should see the result if they match either role
      const matchesTeacherRole = matchesAsFormTeacher || matchesAsSubjectTeacher;
      
      // Apply selected filters if user has filtered the view
      const matchesSelectedClass =
        selectedClass === "All" || student?.class === selectedClass;
      const matchesSelectedSubject =
        selectedSubject === "All" || subject?.name === selectedSubject;
      
      return (
        matchesTeacherRole &&
        matchesSelectedClass &&
        matchesSelectedSubject
      );
    });
  }, [
    results,
    students,
    subjects,
    teacher?.assignedClasses,
    assignedSubjects,
    selectedClass,
    selectedSubject,
  ]);

  const stats = useMemo(() => {
    const teacherStudents = students.filter(
      (s) =>
        teacher?.assignedClasses?.includes(s.class) &&
        (selectedClass === "All" || s.class === selectedClass),
    );

    const avgScore =
      teacherResults.length > 0
        ? Math.round(
            teacherResults.reduce((sum, r) => sum + r.percentage, 0) /
              teacherResults.length,
          )
        : 0;

    return {
      classesCount: teacher?.assignedClasses?.length || 0,
      studentsCount: teacherStudents.length,
      resultsRecorded: teacherResults.length,
      averageClassScore: avgScore,
    };
  }, [students, teacherResults, teacher?.assignedClasses, selectedClass]);

  const tableData = useMemo(() => {
    return teacherResults.map((result) => {
      const student = students.find((s) => s.id === result.studentId);
      const subject = subjects.find((sub) => sub.id === result.subjectId);

      return {
        id: result.id,
        studentName: student
          ? `${student.firstName} ${student.lastName}`
          : "N/A",
        class: student?.class || "N/A",
        subjectName: subject?.name || "N/A",
        firstCA: result.firstCA,
        secondCA: result.secondCA,
        exam: result.exam,
        totalScore: result.totalScore,
        percentage: `${(result.percentage || 0).toFixed(0)}%`,
        grade: result.grade,
        term: result.term,
        dateRecorded: formatDate(result.dateRecorded),
      };
    });
  }, [teacherResults, students, subjects]);

  const columns = [
    { key: "studentName", label: "Student Name" },
    { key: "class", label: "Class" },
    { key: "subjectName", label: "Subject" },
    { key: "firstCA", label: "1st CA" },
    { key: "secondCA", label: "2nd CA" },
    { key: "exam", label: "Exam" },
    { key: "totalScore", label: "Total" },
    { key: "percentage", label: "%" },
    { key: "grade", label: "Grade" },
    { key: "term", label: "Term" },
  ];

  if (isLoading)
    return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-12">
      {/* ── Dynamic Hero Section ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div variants={itemVariants} className="space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-nebula-indigo-500/10 border border-nebula-indigo-500/20 text-nebula-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
              Faculty Command: {teacher.name}
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter">
              Inspire <br />
              The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">Future.</span>
            </h1>
            <p className="text-xl text-nebula-slate-400 font-bold max-w-lg leading-relaxed tracking-tight">
              Managing {(assignedSubjects.length > 0 ? assignedSubjects.join(", ") : "Form Teacher") || "Form Teacher"} | Sector: {teacher.level}
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <Link to="/subject-results" className="btn-vibrant from-nebula-indigo-600 to-nebula-indigo-800 shadow-nebula">
              <BookOpen className="w-5 h-5" />
              Log Data Protocols
            </Link>
            <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all group">
              Global Schedule
              <Calendar className="w-5 h-5 group-hover:translate-x-2 transition-transform text-nebula-indigo-500" />
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="nebula-card !p-12 group hover:border-nebula-indigo-500/30 transition-all">
           <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 bg-nebula-slate-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                <Users className="w-7 h-7 text-nebula-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Faculty Pillar</h2>
                <p className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-widest mt-1 opacity-70">Operational status: Verified</p>
              </div>
           </div>

           <div className="space-y-10">
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-nebula-indigo-500 mt-1 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <div>
                  <h3 className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em] mb-2">Assigned Sectors</h3>
                  <p className="text-sm text-white font-bold leading-relaxed tracking-tight">{(teacher.assignedClasses || []).join(", ")}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-nebula-teal-500 mt-1 shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
                <div>
                  <h3 className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em] mb-2">Subject Matrix</h3>
                  <p className="text-sm text-white font-bold leading-relaxed tracking-tight">{assignedSubjects.join(", ") || "General Strategic Studies"}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-nebula-pink-500 mt-1 shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                <div>
                  <h3 className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em] mb-2">Pillar Certification</h3>
                  <p className="text-sm text-white font-bold leading-relaxed tracking-tight">Authorized Instruction Protocol Active</p>
                </div>
              </div>
           </div>
        </motion.div>
      </div>

      {/* Intelligence Filters */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="nebula-card !p-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
              Sector Isolation (Class)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-nebula !py-4"
            >
              <option value="All">All Operational Sectors</option>
              {(teacher?.assignedClasses || []).map((className: string) => (
                <option key={className} value={className}>Sector {className}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="nebula-card !p-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
              Matrix Focus (Subject)
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-nebula !py-4"
            >
              <option value="All">Complete Subject Matrix</option>
              {assignedSubjects.map((subject: string) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Temporal Constraints */}
      <AnimatePresence>
        {deadlines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 px-2">
              <Timer className="w-5 h-5 text-nebula-pink-400" />
              <h2 className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em]">
                Active Temporal Constraints
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="nebula-card group hover:border-nebula-pink-500/30 transition-all !p-8 bg-gradient-to-br from-nebula-pink-500/[0.03] to-transparent"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 bg-nebula-pink-500/10 text-nebula-pink-400 text-[10px] font-black rounded-full border border-nebula-pink-500/20 uppercase tracking-widest">
                      {deadline.type.replace("_", " ")}
                    </div>
                    <Clock className="w-5 h-5 text-nebula-pink-500/30 group-hover:text-nebula-pink-500 transition-colors" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 tracking-tight group-hover:text-nebula-pink-400 transition-colors">
                    {deadline.title}
                  </h3>
                  <p className="text-xs text-nebula-slate-400 mb-6 line-clamp-2 leading-relaxed font-bold">
                    {deadline.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-nebula-pink-400 font-black text-[10px] uppercase tracking-widest">
                      <Calendar size={14} />
                      {new Date(deadline.deadline_date).toLocaleDateString()}
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-nebula-slate-500">
                      {Math.ceil((new Date(deadline.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} DAYS REMAINING
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="nebula-card !p-8 group hover:border-nebula-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em]">Sectors</p>
            <Users className="w-5 h-5 text-nebula-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-white">{stats.classesCount}</p>
        </div>
        <div className="nebula-card !p-8 group hover:border-nebula-teal-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-nebula-teal-400 uppercase tracking-[0.3em]">Personnel</p>
            <BookOpen className="w-5 h-5 text-nebula-teal-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-white">{stats.studentsCount}</p>
        </div>
        <div className="nebula-card !p-8 group hover:border-nebula-pink-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-nebula-pink-400 uppercase tracking-[0.3em]">Archives</p>
            <AlertCircle className="w-5 h-5 text-nebula-pink-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-white">{stats.resultsRecorded}</p>
        </div>
        <div className="nebula-card !p-8 group hover:border-nebula-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em]">Efficiency</p>
            <TrendingUp className="w-5 h-5 text-nebula-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-white">{stats.averageClassScore}%</p>
        </div>
      </div>

      {/* Tab Interface */}
      <div className="space-y-10">
        <div className="flex gap-4 bg-white/5 p-2 rounded-3xl border border-white/5 backdrop-blur-md w-fit mx-auto overflow-x-auto">
          {(["results", "messages", "insights", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-nebula-indigo-600 text-white shadow-nebula"
                  : "text-nebula-slate-400 hover:text-white"
              }`}
            >
              {tab === "results" && "Data Archive"}
              {tab === "messages" && "Neural Links"}
              {tab === "insights" && "AI Cortex"}
              {tab === "analytics" && "Efficiency Metrics"}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[400px]"
        >
          {activeTab === "results" && (
            <div className="nebula-card !p-0 overflow-hidden">
              <div className="p-10 border-b border-white/5">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                  Squad <br /> <span className="text-white/40">Archive</span>
                </h2>
              </div>
              {tableData.length > 0 ? (
                <Table columns={columns} data={tableData} />
              ) : (
                <div className="text-center py-40">
                  <p className="text-nebula-slate-500 font-bold uppercase tracking-widest text-sm">Zero data protocols detected in squad.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="nebula-card !p-10">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                  Neural <br /> <span className="text-white/40">Interface</span>
                </h2>
                <p className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] mt-4">Direct uplink to High Command</p>
              </div>
              <ChatSystem />
            </div>
          )}

          {activeTab === "insights" && <PerformanceInsights />}

          {activeTab === "analytics" && (
            <SubjectMetrics 
              students={students} 
              results={results} 
              subjects={subjects} 
              selectedClass={selectedClass} 
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
