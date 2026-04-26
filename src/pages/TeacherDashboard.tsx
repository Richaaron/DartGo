import { useMemo, useEffect, useState } from "react";
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
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "results" | "messages" | "insights"
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
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const teacherResults = useMemo(() => {
    return results.filter((r) => {
      const student = students.find((s) => s.id === r.studentId);
      const subject = subjects.find((sub) => sub.id === r.subjectId);
      const matchesClass =
        student && teacher?.assignedClasses?.includes(student.class);
      const matchesSubject =
        assignedSubjects.length === 0 ||
        assignedSubjects.includes(subject?.name);
      const matchesSelectedClass =
        selectedClass === "All" || student?.class === selectedClass;
      const matchesSelectedSubject =
        selectedSubject === "All" || subject?.name === selectedSubject;
      return (
        matchesClass &&
        matchesSubject &&
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
        percentage: `${result.percentage.toFixed(2)}%`,
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
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {teacher.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Squads —{" "}
          {(assignedSubjects.length > 0
            ? assignedSubjects.join(", ")
            : "Form Teacher") || "Form Teacher"}{" "}
          | Level: {teacher.level}
        </p>
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p>Assigned Classes: {teacher.assignedClasses.join(", ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
            My Classes
          </p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field"
          >
            <option value="All">All Assigned Classes</option>
            {(teacher?.assignedClasses || []).map((className: string) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Filter students and results by class.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
            My Subjects
          </p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="input-field"
          >
            <option value="All">All Assigned Subjects</option>
            {assignedSubjects.map((subject: string) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Filter results by your assigned subjects.
          </p>
        </div>
      </div>

      {/* Deadlines Section */}
      {deadlines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              Upcoming Deadlines
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Clock className="w-12 h-12 text-amber-200/50 dark:text-amber-800/30 -rotate-12 group-hover:scale-110 transition-transform" />
                </div>
                <div className="relative z-10">
                  <div className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 text-[10px] font-black rounded-full w-fit mb-3 uppercase tracking-widest">
                    {deadline.type.replace("_", " ")}
                  </div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                    {deadline.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-1">
                    {deadline.description}
                  </p>
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    <Calendar size={14} />
                    <span>
                      Due:{" "}
                      {new Date(deadline.deadline_date).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-md">
                      {Math.ceil(
                        (new Date(deadline.deadline_date).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}{" "}
                      days left
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-8 h-8" />}
          label="Classes"
          value={stats.classesCount}
          color="blue"
        />
        <StatCard
          icon={<BookOpen className="w-8 h-8" />}
          label="Students"
          value={stats.studentsCount}
          color="green"
        />
        <StatCard
          icon={<AlertCircle className="w-8 h-8" />}
          label="Results Recorded"
          value={stats.resultsRecorded}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          label="Class Average"
          value={`${stats.averageClassScore}%`}
          color="purple"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(["results", "messages", "insights"] as const).map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {tab === "results" && "Results"}
            {tab === "messages" && "Messages"}
            {tab === "insights" && "Insights"}
          </motion.button>
        ))}
      </div>

      {/* Results Tab */}
      {activeTab === "results" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Squad Results
          </h2>
          {tableData.length > 0 ? (
            <Table columns={columns} data={tableData} />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No results recorded yet for your squad.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Message the Admin
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send a message to the school admin
            </p>
          </div>
          <ChatSystem />
        </motion.div>
      )}

      {/* Insights Tab */}
      {activeTab === "insights" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PerformanceInsights />
        </motion.div>
      )}
    </div>
  );
}
