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
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
              Teacher: {teacher.name}
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter">
              Inspire <br />
              The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600">Future.</span>
            </h1>
            <p className="text-xl text-slate-500 font-bold max-w-lg leading-relaxed tracking-tight">
              Managing {(assignedSubjects.length > 0 ? assignedSubjects.join(", ") : "Form Teacher") || "Form Teacher"} | Level: {teacher.level}
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <Link to="/subject-results" className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
              <BookOpen className="w-5 h-5" />
              Enter Results
            </Link>
            <button className="flex items-center gap-5 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 hover:text-indigo-600 transition-all group">
              School Schedule
              <Calendar className="w-5 h-5 group-hover:translate-x-2 transition-transform text-indigo-500" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg group hover:border-indigo-500/30 transition-all">
           <div className="flex items-center gap-6 mb-12">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Teacher Details</h2>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 opacity-80">Status: Verified</p>
              </div>
           </div>

           <div className="space-y-10">
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1 shadow-sm" />
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.35em] mb-2">Assigned Classes</h3>
                  <p className="text-sm text-slate-900 dark:text-white font-bold leading-relaxed tracking-tight">{(teacher.assignedClasses || []).join(", ")}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shadow-sm" />
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.35em] mb-2">Subject</h3>
                  <p className="text-sm text-slate-900 dark:text-white font-bold leading-relaxed tracking-tight">{assignedSubjects.join(", ") || "General Subjects"}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-3 h-3 rounded-full bg-rose-500 mt-1 shadow-sm" />
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.35em] mb-2">Certification</h3>
                  <p className="text-sm text-slate-900 dark:text-white font-bold leading-relaxed tracking-tight">Authorized Instructor</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Intelligence Filters */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
            >
              <option value="All" className="bg-white dark:bg-slate-900">All Classes</option>
              {(teacher?.assignedClasses || []).map((className: string) => (
                <option key={className} value={className} className="bg-white dark:bg-slate-900">Class {className}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
            >
              <option value="All" className="bg-white dark:bg-slate-900">All Subjects</option>
              {assignedSubjects.map((subject: string) => (
                <option key={subject} value={subject} className="bg-white dark:bg-slate-900">{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Temporal Constraints */}
        {deadlines.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Timer className="w-5 h-5 text-rose-500" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.45em]">
                Active Deadlines
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg group hover:border-rose-500/30 transition-all bg-gradient-to-br from-rose-500/[0.03] to-transparent"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-full border border-rose-500/20 uppercase tracking-widest">
                      {deadline.type.replace("_", " ")}
                    </div>
                    <Clock className="w-5 h-5 text-rose-400/40 group-hover:text-rose-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {deadline.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-8 line-clamp-2 leading-relaxed font-bold">
                    {deadline.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500 font-black text-[10px] uppercase tracking-widest">
                      <Calendar size={14} />
                      {new Date(deadline.deadline_date).toLocaleDateString()}
                    </div>
                    <div className="px-4 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black text-slate-500 border border-slate-200 dark:border-white/5">
                      {Math.ceil((new Date(deadline.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} DAYS REMAINING
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.35em]">Classes</p>
            <Users className="w-5 h-5 text-indigo-600 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.classesCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.35em]">Students</p>
            <BookOpen className="w-5 h-5 text-amber-500 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.studentsCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.35em]">Results</p>
            <AlertCircle className="w-5 h-5 text-rose-500 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.resultsRecorded}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.35em]">Avg Score</p>
            <TrendingUp className="w-5 h-5 text-indigo-600 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.averageClassScore}%</p>
        </div>
      </div>

      {/* Tab Interface */}
      <div className="space-y-10">
        <div className="flex gap-4 bg-slate-100 dark:bg-slate-900/40 p-2 rounded-3xl border border-slate-200 dark:border-white/5 w-fit mx-auto overflow-x-auto shadow-xl">
          {(["results", "messages", "insights", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-500 hover:text-indigo-600"
              }`}
            >
              {tab === "results" && "Results"}
              {tab === "messages" && "Messages"}
              {tab === "insights" && "Insights"}
              {tab === "analytics" && "Analytics"}
            </button>
          ))}
        </div>

        <div
          key={activeTab}
          className="min-h-[400px]"
        >
          {activeTab === "results" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg overflow-hidden">
              <div className="p-10 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                  Student <br /> <span className="text-slate-500">Results</span>
                </h2>
              </div>
              {tableData.length > 0 ? (
                <Table columns={columns} data={tableData} />
              ) : (
                <div className="text-center py-40">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No results found.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg">
              <div className="mb-12">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                  Message <br /> <span className="text-slate-500">Center</span>
                </h2>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-6">Direct communication with admin</p>
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
        </div>
      </div>
    </div>
  );
}
