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
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-50 border border-folusho-sage-100 text-folusho-sage-500 text-[10px] font-black tracking-[0.35em] uppercase">
              Faculty Command: {teacher.name}
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-folusho-slate-900 leading-[0.85] tracking-tighter">
              Inspire <br />
              The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Future.</span>
            </h1>
            <p className="text-xl text-folusho-slate-400 font-bold max-w-lg leading-relaxed tracking-tight">
              Managing {(assignedSubjects.length > 0 ? assignedSubjects.join(", ") : "Form Teacher") || "Form Teacher"} | Sector: {teacher.level}
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <Link to="/subject-results" className="btn-vibrant bg-folusho-sage-400 shadow-folusho">
              <BookOpen className="w-5 h-5" />
              Log Data Protocols
            </Link>
            <button className="flex items-center gap-5 text-[10px] font-black uppercase tracking-[0.35em] text-folusho-slate-400 hover:text-folusho-sage-600 transition-all group">
              Global Schedule
              <Calendar className="w-5 h-5 group-hover:translate-x-2 transition-transform text-folusho-sage-500" />
            </button>
          </div>
        </div>

        <div className="folusho-card !p-12 group hover:border-folusho-sage-300 transition-all border-folusho-cream-200">
           <div className="flex items-center gap-6 mb-12">
              <div className="w-14 h-14 bg-folusho-sage-50 rounded-2xl flex items-center justify-center border border-folusho-sage-100 shadow-inner">
                <Users className="w-7 h-7 text-folusho-sage-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-folusho-slate-900 tracking-tighter uppercase">Faculty Pillar</h2>
                <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-widest mt-1 opacity-80">Operational status: Verified</p>
              </div>
           </div>

           <div className="space-y-10">
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-folusho-sage-500 mt-1 shadow-folusho" />
                <div>
                  <h3 className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.35em] mb-2">Assigned Sectors</h3>
                  <p className="text-sm text-folusho-slate-900 font-bold leading-relaxed tracking-tight">{(teacher.assignedClasses || []).join(", ")}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-folusho-yellow-500 mt-1 shadow-folusho" />
                <div>
                  <h3 className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.35em] mb-2">Subject Matrix</h3>
                  <p className="text-sm text-folusho-slate-900 font-bold leading-relaxed tracking-tight">{assignedSubjects.join(", ") || "General Strategic Studies"}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-folusho-coral-500 mt-1 shadow-folusho" />
                <div>
                  <h3 className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.35em] mb-2">Pillar Certification</h3>
                  <p className="text-sm text-folusho-slate-900 font-bold leading-relaxed tracking-tight">Authorized Instruction Protocol Active</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Intelligence Filters */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="folusho-card !p-8 border-folusho-cream-200">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
              Sector Isolation (Class)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-folusho !py-5"
            >
              <option value="All">All Operational Sectors</option>
              {(teacher?.assignedClasses || []).map((className: string) => (
                <option key={className} value={className}>Sector {className}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="folusho-card !p-8 border-folusho-cream-200">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] px-2">
              Matrix Focus (Subject)
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-folusho !py-5"
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
            <div className="flex items-center gap-4 px-2">
              <Timer className="w-5 h-5 text-folusho-coral-500" />
              <h2 className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.45em]">
                Active Temporal Constraints
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="folusho-card group hover:border-folusho-coral-300 transition-all !p-8 bg-gradient-to-br from-folusho-coral-500/[0.03] to-transparent border-folusho-cream-200"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 bg-folusho-coral-50 text-folusho-coral-500 text-[10px] font-black rounded-full border border-folusho-coral-100 uppercase tracking-widest">
                      {deadline.type.replace("_", " ")}
                    </div>
                    <Clock className="w-5 h-5 text-folusho-coral-300 group-hover:text-folusho-coral-500 transition-colors" />
                  </div>
                  <h3 className="text-xl font-black text-folusho-slate-900 mb-2 tracking-tight group-hover:text-folusho-coral-600 transition-colors">
                    {deadline.title}
                  </h3>
                  <p className="text-xs text-folusho-slate-400 mb-8 line-clamp-2 leading-relaxed font-bold">
                    {deadline.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-folusho-coral-500 font-black text-[10px] uppercase tracking-widest">
                      <Calendar size={14} />
                      {new Date(deadline.deadline_date).toLocaleDateString()}
                    </div>
                    <div className="px-4 py-1.5 bg-folusho-cream-50 rounded-xl text-[10px] font-black text-folusho-slate-400 border border-folusho-cream-100">
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
        <div className="folusho-card !p-8 group hover:border-folusho-sage-300 transition-all border-folusho-cream-200">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.35em]">Sectors</p>
            <Users className="w-5 h-5 text-folusho-sage-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.classesCount}</p>
        </div>
        <div className="folusho-card !p-8 group hover:border-folusho-yellow-300 transition-all border-folusho-cream-200">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-folusho-yellow-600 uppercase tracking-[0.35em]">Personnel</p>
            <BookOpen className="w-5 h-5 text-folusho-yellow-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.studentsCount}</p>
        </div>
        <div className="folusho-card !p-8 group hover:border-folusho-coral-300 transition-all border-folusho-cream-200">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.35em]">Archives</p>
            <AlertCircle className="w-5 h-5 text-folusho-coral-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.resultsRecorded}</p>
        </div>
        <div className="folusho-card !p-8 group hover:border-folusho-sage-300 transition-all border-folusho-cream-200">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.35em]">Efficiency</p>
            <TrendingUp className="w-5 h-5 text-folusho-sage-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{stats.averageClassScore}%</p>
        </div>
      </div>

      {/* Tab Interface */}
      <div className="space-y-10">
        <div className="flex gap-4 bg-folusho-cream-50 p-3 rounded-[2rem] border border-folusho-cream-200 w-fit mx-auto overflow-x-auto shadow-sm">
          {(["results", "messages", "insights", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-folusho-sage-400 text-white shadow-folusho"
                  : "text-folusho-slate-400 hover:text-folusho-sage-600 hover:bg-white"
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
            <div className="folusho-card !p-0 border-folusho-cream-200">
              <div className="p-10 border-b border-folusho-cream-100 bg-folusho-cream-50/50">
                <h2 className="text-3xl font-black text-folusho-slate-900 tracking-tighter uppercase leading-none">
                  Squad <br /> <span className="text-folusho-slate-400">Archive</span>
                </h2>
              </div>
              {tableData.length > 0 ? (
                <Table columns={columns} data={tableData} />
              ) : (
                <div className="text-center py-40">
                  <p className="text-folusho-slate-400 font-bold uppercase tracking-widest text-sm">Zero data protocols detected in squad.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="folusho-card !p-12 border-folusho-cream-200">
              <div className="mb-12">
                <h2 className="text-3xl font-black text-folusho-slate-900 tracking-tighter uppercase leading-none">
                  Neural <br /> <span className="text-folusho-slate-400">Interface</span>
                </h2>
                <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.4em] mt-6">Direct uplink to High Command</p>
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
