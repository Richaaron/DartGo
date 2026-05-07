import { useState, useEffect, useMemo, useRef } from "react";
import {
  Printer,
  Search,
  FileText,
  ChevronLeft,
  Save,
  Star,
  GraduationCap,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Student, SubjectResult, Subject } from "../types";
import {
  fetchStudents,
  fetchResults,
  fetchSubjects,
  fetchObservations,
  saveObservation,
  fetchConfig,
  fetchTeachers,
} from "../services/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export default function Reports() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<"overview" | "report-card" | "broadsheet">(
    "overview",
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingObservation, setIsEditingObservation] = useState(false);
  const reportRef = useRef<any>(null);

  const [editObservation, setEditObservation] = useState<any>({
    affectiveDomain: {
      punctuality: 3,
      neatness: 3,
      honesty: 3,
      leadership: 3,
      cooperation: 3,
      selfControl: 3,
    },
    psychomotorSkills: { handwriting: 3, sports: 3, arts: 3, fluency: 3 },
    teacherComment: "",
    principalComment: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          studentsData,
          resultsData,
          subjectsData,
          observationsData,
          configData,
          teachersData,
        ] = await Promise.all([
          fetchStudents(),
          fetchResults(),
          fetchSubjects(),
          fetchObservations(),
          fetchConfig(),
          fetchTeachers(),
        ]);
        setStudents(studentsData);
        setTeachers(teachersData);
        setResults(resultsData);
        setSubjects(subjectsData);
        setObservations(observationsData);
        setConfig(configData);
      } catch (error: any) {
        console.error("Failed to load report data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedStudent = useMemo(
    () => students.find((s: Student) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  const studentResults = useMemo(
    () =>
      results.filter((r: SubjectResult) => r.studentId === selectedStudentId),
    [results, selectedStudentId],
  );

  const studentObservation = useMemo(
    () => observations.find((o: any) => o.studentId === selectedStudentId),
    [observations, selectedStudentId],
  );

  // Find the form teacher assigned to the selected student's class
  const classTeacher = useMemo(() => {
    if (!selectedStudent?.class) return null;
    return (
      teachers.find((t) => {
        const isFormCapable =
          t.teacherType === "Form Teacher" ||
          t.teacherType === "Form + Subject Teacher" ||
          (!t.teacherType &&
            Array.isArray(t.assignedClasses) &&
            t.assignedClasses.length > 0);
        return (
          isFormCapable &&
          Array.isArray(t.assignedClasses) &&
          t.assignedClasses.includes(selectedStudent.class)
        );
      }) || null
    );
  }, [teachers, selectedStudent]);

  useEffect(() => {
    if (studentObservation) {
      setEditObservation(studentObservation);
    } else {
      setEditObservation({
        affectiveDomain: {
          punctuality: 3,
          neatness: 3,
          honesty: 3,
          leadership: 3,
          cooperation: 3,
          selfControl: 3,
        },
        psychomotorSkills: { handwriting: 3, sports: 3, arts: 3, fluency: 3 },
        teacherComment: "",
        principalComment: "",
      });
    }
  }, [studentObservation, selectedStudentId]);

  const studentPerformanceData = useMemo(() => {
    // Optimization: Group results by studentId first
    const resultsByStudent = results.reduce(
      (acc, r) => {
        if (!acc[r.studentId]) acc[r.studentId] = [];
        acc[r.studentId].push(r);
        return acc;
      },
      {} as Record<string, SubjectResult[]>,
    );

    return students
      .map((student) => {
        const sResults = resultsByStudent[student.id] || [];
        const avgScore =
          sResults.length > 0
            ? Math.round(
                sResults.reduce((sum, r) => sum + r.percentage, 0) /
                  sResults.length,
              )
            : 0;

        return {
          ...student,
          avgScore,
          subjectsCount: sResults.length,
        };
      })
      .filter(
        (s) =>
          s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [students, results, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    try {
      setIsLoading(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${selectedStudent?.firstName}_${selectedStudent?.lastName}_Report_Card.pdf`,
      );
    } catch (error) {
      console.error("Failed to export PDF:", error);
      window.alert("Failed to generate PDF. Please try printing instead.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveObservation = async () => {
    try {
      const saved = await saveObservation({
        ...editObservation,
        studentId: selectedStudentId,
        term: config?.currentTerm || "2nd Term",
        academicYear: config?.currentAcademicYear || "2023/2024",
      });
      setObservations((prev) => {
        const index = prev.findIndex((o) => o.studentId === selectedStudentId);
        if (index > -1) {
          const newObs = [...prev];
          newObs[index] = saved;
          return newObs;
        }
        return [...prev, saved];
      });
      setIsEditingObservation(false);
    } catch {
      window.alert("Failed to save observation");
    }
  };

  const renderRating = (val: number) => (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          fill={i <= val ? "var(--primary)" : "none"}
          className={
            i <= val
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-gray-200 dark:text-gray-800"
          }
        />
      ))}
    </div>
  );

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

  if (reportType === "report-card" && selectedStudent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-8 max-w-5xl mx-auto space-y-8"
      >
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => {
              setReportType("overview");
              setIsEditingObservation(false);
            }}
            className="group flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-all"
          >
            <ChevronLeft size={16} /> Back to Reports
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => setIsEditingObservation(!isEditingObservation)}
              className={`btn-secondary text-xs`}
            >
              {isEditingObservation ? "Cancel Edit" : "Edit Observations"}
            </button>
            <button
              onClick={exportToPDF}
              className="btn-secondary text-xs flex items-center gap-2"
            >
              <Download size={16} /> Download PDF
            </button>
            <button onClick={handlePrint} className="btn-primary text-xs">
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isEditingObservation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden print:hidden"
            >
              <div className="card-lg border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-500/5">
                <h2 className="text-xs font-black text-indigo-900 dark:text-indigo-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText size={16} /> Edit Observations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Affective Domain (1-5)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.keys(editObservation.affectiveDomain).map(
                        (key) => (
                          <div
                            key={key}
                            className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                          >
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={editObservation.affectiveDomain[key]}
                              onChange={(e) =>
                                setEditObservation({
                                  ...editObservation,
                                  affectiveDomain: {
                                    ...editObservation.affectiveDomain,
                                    [key]: parseInt(e.target.value),
                                  },
                                })
                              }
                              className="w-10 h-8 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Psychomotor Skills (1-5)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.keys(editObservation.psychomotorSkills).map(
                        (key) => (
                          <div
                            key={key}
                            className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                          >
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 capitalize">
                              {key}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={editObservation.psychomotorSkills[key]}
                              onChange={(e) =>
                                setEditObservation({
                                  ...editObservation,
                                  psychomotorSkills: {
                                    ...editObservation.psychomotorSkills,
                                    [key]: parseInt(e.target.value),
                                  },
                                })
                              }
                              className="w-10 h-8 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Teacher's Narrative
                    </label>
                    <textarea
                      className="input-field h-32 resize-none text-sm"
                      value={editObservation.teacherComment}
                      onChange={(e) =>
                        setEditObservation({
                          ...editObservation,
                          teacherComment: e.target.value,
                        })
                      }
                      placeholder="Enter qualitative feedback..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Principal's Narrative
                    </label>
                    <textarea
                      className="input-field h-32 resize-none text-sm"
                      value={editObservation.principalComment}
                      onChange={(e) =>
                        setEditObservation({
                          ...editObservation,
                          principalComment: e.target.value,
                        })
                      }
                      placeholder="Final remarks and authorization..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveObservation}
                    className="btn-primary px-10"
                  >
                    <Save size={18} /> Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="bg-white p-12 rounded-[2rem] shadow-2xl border border-gray-100 print:shadow-none print:border-none relative overflow-hidden"
          ref={reportRef}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 opacity-20 rounded-full -mt-32 -mr-32 blur-3xl"></div>

          {/* School Header */}
          <div className="text-center border-b-4 border-indigo-600 pb-10 mb-10 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-8">
              {config?.schoolLogo ? (
                <img
                  src={config.schoolLogo}
                  alt="Logo"
                  className="w-24 h-24 object-contain shadow-lg rounded-2xl p-2 bg-white"
                />
              ) : (
                <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <GraduationCap size={48} />
                </div>
              )}
              <div className="text-left">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-1">
                  {config?.schoolName || "FOLUSHO VICTORY SCHOOLS"}
                </h1>
                <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em]">
                  Excellence in Learning & Character
                </p>
                <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">
                  {config?.schoolAddress || "123 Victory Lane, Lagos, Nigeria"}{" "}
                  | {config?.schoolPhone || "+234 800 000 0000"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl inline-block">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                  Report Status
                </p>
                <p className="text-sm font-black uppercase tracking-tighter">
                  Official Document
                </p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-10 mb-12 bg-gray-50/80 p-8 rounded-[1.5rem] border border-gray-100">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Full Name
                </p>
                <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    ID Number
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {selectedStudent.registrationNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Classification
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {selectedStudent.class}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Academic Level
                </p>
                <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  {selectedStudent.level}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Term
                  </p>
                  <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">
                    {config?.currentTerm || "2nd Term"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Session
                  </p>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    {config?.currentAcademicYear || "2023/2024"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-[1.5rem] overflow-hidden border-2 border-gray-100 mb-12 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest">
                    Subject
                  </th>
                  <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">
                    CA 1 (20)
                  </th>
                  <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">
                    CA 2 (20)
                  </th>
                  <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">
                    Exam (60)
                  </th>
                  <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">
                    Total
                  </th>
                  <th className="p-5 text-center text-[10px] font-black uppercase tracking-widest">
                    Grade
                  </th>
                  <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentResults.map((r) => {
                  const subject = subjects.find((s) => s.id === r.subjectId);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-5 font-black text-gray-900 text-sm tracking-tight">
                        {subject?.name || "Unknown"}
                      </td>
                      <td className="p-5 text-center font-bold text-gray-600">
                        {r.firstCA}
                      </td>
                      <td className="p-5 text-center font-bold text-gray-600">
                        {r.secondCA}
                      </td>
                      <td className="p-5 text-center font-bold text-gray-600">
                        {r.exam}
                      </td>
                      <td className="p-5 text-center font-black text-gray-900">
                        {r.totalScore}
                      </td>
                      <td className="p-5 text-center">
                        <span
                          className={`px-3 py-1 rounded-lg font-black text-xs ${
                            ["A", "B"].includes(r.grade)
                              ? "bg-emerald-100 text-emerald-700"
                              : r.grade === "C"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {r.grade}
                        </span>
                      </td>
                      <td className="p-5 text-xs font-bold italic text-gray-500">
                        {r.remarks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Behavioral and Psychomotor Sections */}
          <div className="grid grid-cols-2 gap-16 mb-16">
            <div className="space-y-6">
              <h3 className="font-black text-indigo-600 text-[10px] uppercase tracking-[0.3em] pb-3 border-b-2 border-indigo-50">
                Affective Domain
              </h3>
              <div className="space-y-4">
                {Object.entries(editObservation.affectiveDomain).map(
                  ([key, val]: [string, any]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center group"
                    >
                      <span className="text-xs text-gray-500 font-black tracking-widest group-hover:text-gray-900 transition-colors capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      {renderRating(val)}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="font-black text-indigo-600 text-[10px] uppercase tracking-[0.3em] pb-3 border-b-2 border-indigo-50">
                Psychomotor Skills
              </h3>
              <div className="space-y-4">
                {Object.entries(editObservation.psychomotorSkills).map(
                  ([key, val]: [string, any]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center group"
                    >
                      <span className="text-xs text-gray-500 font-black tracking-widest group-hover:text-gray-900 transition-colors capitalize">
                        {key}
                      </span>
                      {renderRating(val)}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Summary & Metrics */}
          <div className="grid grid-cols-3 gap-8 mb-16">
            <div className="p-8 bg-indigo-50/50 rounded-[1.5rem] border-2 border-indigo-100/50 text-center group hover:bg-indigo-600 transition-all duration-500">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 group-hover:text-indigo-200">
                Enrolled Units
              </p>
              <p className="text-4xl font-black text-indigo-900 tracking-tighter group-hover:text-white">
                {studentResults.length}
              </p>
            </div>
            <div className="p-8 bg-emerald-50/50 rounded-[1.5rem] border-2 border-emerald-100/50 text-center group hover:bg-emerald-600 transition-all duration-500">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 group-hover:text-emerald-200">
                Mean Percentage
              </p>
              <p className="text-4xl font-black text-emerald-900 tracking-tighter group-hover:text-white">
                {studentResults.length > 0
                  ? Math.round(
                      studentResults.reduce((sum, r) => sum + r.percentage, 0) /
                        studentResults.length,
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="p-8 bg-violet-50/50 rounded-[1.5rem] border-2 border-violet-100/50 text-center group hover:bg-violet-600 transition-all duration-500">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2 group-hover:text-violet-200">
                Scholastic Index (GPA)
              </p>
              <p className="text-4xl font-black text-violet-900 tracking-tighter group-hover:text-white">
                {studentResults.length > 0
                  ? (
                      studentResults.reduce((sum, r) => sum + r.gradePoint, 0) /
                      studentResults.length
                    ).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>

          <div className="space-y-8 mb-20">
            <div className="bg-gray-50/50 p-8 rounded-[1.5rem] border-l-8 border-indigo-600">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">
                Class Teacher's Narrative Evaluation
              </p>
              <p className="text-gray-900 italic font-bold text-lg leading-relaxed">
                "
                {editObservation.teacherComment ||
                  "No qualitative feedback provided for this session."}
                "
              </p>
            </div>
            <div className="bg-gray-50/50 p-8 rounded-[1.5rem] border-l-8 border-gray-900">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
                {config?.principalName
                  ? `${config.principalName} — Principal's Remarks`
                  : "Principal's Remarks"}
              </p>
              <p className="text-gray-900 italic font-bold text-lg leading-relaxed">
                "
                {editObservation.principalComment ||
                  "Official remarks pending authorization."}
                "
              </p>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-10 mt-4 border-t-2 border-gray-100">
            {/* Class Teacher — cursive signature from assigned form teacher */}
            <div className="text-center">
              <div className="h-16 mb-1 flex items-end justify-center overflow-hidden pb-1">
                {classTeacher ? (
                  <span
                    style={{
                      fontFamily:
                        "'Dancing Script', 'Brush Script MT', cursive",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "#1e3a8a",
                      lineHeight: 1,
                      display: "inline-block",
                      transform: "rotate(-2.5deg)",
                      transformOrigin: "bottom center",
                      letterSpacing: "0.02em",
                      textShadow: "0.5px 0.5px 0 rgba(30,58,138,0.15)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {classTeacher.name}
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-300 uppercase tracking-widest border border-dashed border-gray-200 rounded px-3 py-2 select-none">
                    Sign here
                  </span>
                )}
              </div>
              <div className="h-px bg-gray-400 mb-2 w-full" />
              {classTeacher && (
                <p className="text-xs font-bold text-gray-700 mb-0.5 tracking-tight">
                  {classTeacher.name}
                </p>
              )}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Class Teacher
              </p>
            </div>

            {/* Principal — cursive signature */}
            <div className="text-center">
              <div className="h-16 mb-1 flex items-end justify-center overflow-hidden pb-1">
                {config?.principalName ? (
                  <span
                    style={{
                      fontFamily:
                        "'Dancing Script', 'Brush Script MT', cursive",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "#1e3a8a",
                      lineHeight: 1,
                      display: "inline-block",
                      transform: "rotate(-3deg)",
                      transformOrigin: "bottom center",
                      letterSpacing: "0.02em",
                      textShadow: "0.5px 0.5px 0 rgba(30,58,138,0.15)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {config.principalName}
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-300 uppercase tracking-widest border border-dashed border-gray-200 rounded px-3 py-2 select-none">
                    Not set
                  </span>
                )}
              </div>
              <div className="h-px bg-gray-400 mb-2 w-full" />
              {config?.principalName && (
                <p className="text-xs font-bold text-gray-700 mb-0.5 tracking-tight">
                  {config.principalName}
                </p>
              )}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Principal
              </p>
            </div>

            {/* Proprietress — cursive signature */}
            <div className="text-center">
              <div className="h-16 mb-1 flex items-end justify-center overflow-hidden pb-1">
                {config?.proprietressName ? (
                  <span
                    style={{
                      fontFamily:
                        "'Dancing Script', 'Brush Script MT', cursive",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "#1e3a8a",
                      lineHeight: 1,
                      display: "inline-block",
                      transform: "rotate(-2deg)",
                      transformOrigin: "bottom center",
                      letterSpacing: "0.02em",
                      textShadow: "0.5px 0.5px 0 rgba(30,58,138,0.15)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {config.proprietressName}
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-300 uppercase tracking-widest border border-dashed border-gray-200 rounded px-3 py-2 select-none">
                    Not set
                  </span>
                )}
              </div>
              <div className="h-px bg-gray-400 mb-2 w-full" />
              {config?.proprietressName && (
                <p className="text-xs font-bold text-gray-700 mb-0.5 tracking-tight">
                  {config.proprietressName}
                </p>
              )}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Proprietress
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 space-y-8"
    >
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Reports{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Vault</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium tracking-tight">
            Access and generate high-fidelity performance records.
          </p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors w-4 h-4" />
          <input
            type="text"
            placeholder="Query identification..."
            className="pl-11 pr-6 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl w-80 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all text-sm font-bold placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        <div className="bg-gray-100 dark:bg-royal-black-800 p-1.5 rounded-2xl flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
          <button
            onClick={() => {
              setReportType("overview");
              setSelectedStudentId("");
            }}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${reportType === "overview" ? "bg-white dark:bg-royal-purple-600 text-royal-purple-600 dark:text-white shadow-xl scale-105" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setReportType("report-card");
              if (!selectedStudentId && studentPerformanceData.length > 0) {
                // Keep overview if no student selected yet
                setReportType("overview");
                window.alert("Please select a student from the overview grid first.");
              }
            }}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${reportType === "report-card" ? "bg-white dark:bg-royal-purple-600 text-royal-purple-600 dark:text-white shadow-xl scale-105" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
          >
            Report Cards
          </button>
          <button
            onClick={() => setReportType("broadsheet")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${reportType === "broadsheet" ? "bg-white dark:bg-royal-purple-600 text-royal-purple-600 dark:text-white shadow-xl scale-105" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
          >
            Broadsheet
          </button>
        </div>

        {reportType === "broadsheet" && (
          <div className="relative w-full sm:w-64">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field pl-4 border-2 border-indigo-100 dark:border-indigo-900/30 focus:border-indigo-500"
            >
              <option value="">Select Class...</option>
              {[...new Set(students.map((s) => s.class))].sort().map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        )}
      </motion.div>

      {reportType === "overview" ? (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {studentPerformanceData.length > 0 ? (
            studentPerformanceData.map((student) => (
              <motion.div
                key={student.id}
                variants={itemVariants}
                onClick={() => {
                  setSelectedStudentId(student.id);
                  setReportType("report-card");
                }}
                className="professional-card p-6 cursor-pointer group hover:bg-brand-900/60 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <h3 className="text-white font-black uppercase tracking-tight text-lg mb-1">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                    {student.class}
                  </p>
                  
                  <div className="w-full pt-4 border-t border-indigo-500/10 grid grid-cols-2 gap-4">
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Efficiency</p>
                      <p className={`text-lg font-black ${student.avgScore >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {student.avgScore}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Units</p>
                      <p className="text-lg font-black text-white">{student.subjectsCount}</p>
                    </div>
                  </div>

                  <div className="w-full mt-4 flex justify-center">
                    <span className="px-4 py-2 bg-indigo-600/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all">
                      Open Record
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center card-lg border-brand-800/40">
              <Search size={48} className="mx-auto text-brand-700/50 mb-4" />
              <p className="text-brand-400 font-bold uppercase tracking-widest">No scholars found matching your query.</p>
            </div>
          )}
        </motion.div>
      ) : reportType === "broadsheet" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-royal-black-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 overflow-hidden"
        >
          {selectedClass ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                    {selectedClass} Academic Broadsheet
                  </h2>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
                    Term: {config?.currentTerm || "2nd Term"} | Session: {config?.currentAcademicYear || "2023/2024"}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => window.print()} className="btn-primary text-xs flex items-center gap-2">
                    <Printer size={16} /> Print Broadsheet
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto relative rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-gray-900 text-white">
                      <th className="p-4 text-left sticky left-0 z-30 bg-gray-900 border-r border-gray-800 min-w-[200px]">
                        Student Name
                      </th>
                      {(() => {
                        const classStudents = students.filter(s => s.class === selectedClass);
                        const classSubjectIds = [...new Set(results.filter(r => classStudents.some(s => s.id === r.studentId)).map(r => r.subjectId))];
                        const classSubjects = subjects.filter(s => classSubjectIds.includes(s.id));
                        
                        return classSubjects.map(sub => (
                          <th key={sub.id} className="p-0 border-r border-gray-800 min-w-[300px]" colSpan={5}>
                            <div className="p-2 border-b border-gray-800 font-black uppercase tracking-widest text-center truncate">
                              {sub.name}
                            </div>
                            <div className="grid grid-cols-5 text-[8px] font-black uppercase">
                              <div className="p-1 border-r border-gray-800">1st CA</div>
                              <div className="p-1 border-r border-gray-800">2nd CA</div>
                              <div className="p-1 border-r border-gray-800">Exam</div>
                              <div className="p-1 border-r border-gray-800 text-royal-gold-400">Total</div>
                              <div className="p-1">Grd</div>
                            </div>
                          </th>
                        ));
                      })()}
                      <th className="p-4 bg-indigo-900 min-w-[80px]">Grand Total</th>
                      <th className="p-4 bg-emerald-900 min-w-[80px]">Avg</th>
                      <th className="p-4 bg-violet-900 min-w-[80px]">Pos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(() => {
                      const classStudents = students.filter(s => s.class === selectedClass);
                      const classSubjectIds = [...new Set(results.filter(r => classStudents.some(s => s.id === r.studentId)).map(r => r.subjectId))];
                      const classSubjects = subjects.filter(s => classSubjectIds.includes(s.id));

                      // Calculate performance for ranking
                      const performance = classStudents.map(student => {
                        const sResults = results.filter(r => r.studentId === student.id);
                        const total = sResults.reduce((sum, r) => sum + r.totalScore, 0);
                        const avg = sResults.length > 0 ? total / sResults.length : 0;
                        return { id: student.id, total, avg };
                      }).sort((a, b) => b.avg - a.avg);

                      return classStudents.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(student => {
                        const studentPerformance = performance.find(p => p.id === student.id);
                        const position = performance.findIndex(p => p.id === student.id) + 1;
                        const suffix = (pos: number) => {
                          if (pos % 10 === 1 && pos % 100 !== 11) return "st";
                          if (pos % 10 === 2 && pos % 100 !== 12) return "nd";
                          if (pos % 10 === 3 && pos % 100 !== 13) return "rd";
                          return "th";
                        };

                        return (
                          <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="p-4 font-black text-gray-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-royal-black-900 border-r border-gray-100 dark:border-gray-800 uppercase tracking-tighter">
                              {student.lastName}, {student.firstName}
                            </td>
                            {classSubjects.map(sub => {
                              const res = results.find(r => r.studentId === student.id && r.subjectId === sub.id);
                              return (
                                <td key={sub.id} className="p-0 border-r border-gray-100 dark:border-gray-800" colSpan={5}>
                                  <div className="grid grid-cols-5 text-center font-bold h-full">
                                    <div className="p-2 border-r border-gray-100 dark:border-gray-800 text-gray-500">{res?.firstCA ?? '-'}</div>
                                    <div className="p-2 border-r border-gray-100 dark:border-gray-800 text-gray-500">{res?.secondCA ?? '-'}</div>
                                    <div className="p-2 border-r border-gray-100 dark:border-gray-800 text-gray-500">{res?.examScore ?? '-'}</div>
                                    <div className="p-2 border-r border-gray-100 dark:border-gray-800 bg-royal-gold-50/50 dark:bg-royal-gold-900/10 text-royal-gold-600 dark:text-royal-gold-400 font-black">{res?.totalScore ?? '-'}</div>
                                    <div className="p-2 font-black text-indigo-600 dark:text-indigo-400">{res?.grade ?? '-'}</div>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-4 text-center font-black bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400">
                              {studentPerformance?.total ?? 0}
                            </td>
                            <td className="p-4 text-center font-black bg-emerald-50/30 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400">
                              {studentPerformance?.avg.toFixed(1) ?? "0.0"}
                            </td>
                            <td className="p-4 text-center font-black bg-violet-50/30 dark:bg-violet-900/10 text-violet-700 dark:text-violet-400">
                              {position}{suffix(position)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4 animate-bounce" />
              <p className="text-gray-500 font-black uppercase tracking-widest">Select a class to generate the Broadsheet</p>
            </div>
          )}
        </motion.div>
      ) : null}

    </motion.div>
  );
}
