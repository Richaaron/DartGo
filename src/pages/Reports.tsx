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
  BookOpen,
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

import { useAuthContext } from "../context/AuthContext";

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
  const { user } = useAuthContext();
  const userRole = user?.role || "Student";
  const userAssignedClasses = (user as any)?.assignedClasses;
  const assignedClasses = Array.isArray(userAssignedClasses) ? userAssignedClasses : [];

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
  const [selectedArm, setSelectedArm] = useState<string>("All");
  const [classFilter, setClassFilter] = useState<string>("");
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
        setStudents(studentsData || []);
        setTeachers(teachersData || []);
        setResults(resultsData || []);
        setSubjects(subjectsData || []);
        setObservations(observationsData || []);
        setConfig(configData);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Failed to load report data", error);
        }
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

  const grandTotal = useMemo(() => 
    studentResults.reduce((sum, r) => sum + (r.totalScore || 0), 0),
    [studentResults]
  );

  const meanPercentage = useMemo(() => 
    studentResults.length > 0
      ? Math.round(studentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / studentResults.length)
      : 0,
    [studentResults]
  );

  const classRanking = useMemo(() => {
    if (!selectedStudent || !selectedStudent.class) return null;
    
    // Get all students in the same class
    const classStudents = students.filter(s => s.class === selectedStudent.class);
    const classStudentIds = new Set(classStudents.map(s => s.id));
    
    // Get results for these students
    const classResults = results.filter(r => r && r.studentId && classStudentIds.has(r.studentId));
    
    // Calculate average for each student
    const scores = classStudents.map(s => {
      const sResults = classResults.filter(r => r.studentId === s.id);
      const avg = sResults.length > 0 
        ? sResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / sResults.length
        : 0;
      return { id: s.id, avg };
    }).sort((a, b) => b.avg - a.avg);

    const rank = scores.findIndex(s => s.id === selectedStudentId) + 1;
    
    // Helper for ordinal suffix
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return rank > 0 ? getOrdinal(rank) : "N/A";
  }, [students, results, selectedStudent, selectedStudentId]);

  const overallGrade = useMemo(() => {
    if (meanPercentage >= 80) return "A1";
    if (meanPercentage >= 75) return "B2";
    if (meanPercentage >= 70) return "B3";
    if (meanPercentage >= 65) return "C4";
    if (meanPercentage >= 60) return "C5";
    if (meanPercentage >= 55) return "C6";
    if (meanPercentage >= 50) return "D7";
    if (meanPercentage >= 45) return "E8";
    return "F9";
  }, [meanPercentage]);

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
      // Map flat DB structure to nested frontend structure if needed
      if (!studentObservation.affectiveDomain) {
        setEditObservation({
          affectiveDomain: {
            punctuality: studentObservation.punctuality || 3,
            neatness: studentObservation.neatness || 3,
            honesty: studentObservation.honesty || 3,
            leadership: studentObservation.leadership || 3,
            cooperation: studentObservation.cooperation || 3,
            selfControl: studentObservation.selfControl || 3,
          },
          psychomotorSkills: {
            handwriting: studentObservation.handwriting || 3,
            sports: studentObservation.sports || 3,
            arts: studentObservation.arts || studentObservation.crafts || 3,
            fluency: studentObservation.fluency || 3,
          },
          teacherComment: studentObservation.teacherComment || "",
          principalComment: studentObservation.principalComment || "",
          ...studentObservation,
        });
      } else {
        setEditObservation(studentObservation);
      }
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

    let filteredStudents = userRole === "Admin" 
      ? students 
      : students.filter(s => assignedClasses.includes(s.class));

    if (classFilter) {
      filteredStudents = filteredStudents.filter(s => s.class === classFilter);
    }
    
    if (selectedArm !== 'All') {
      filteredStudents = filteredStudents.filter(s => s.arm === selectedArm);
    }

    return filteredStudents
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
          (s.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.registrationNumber || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [students, results, searchTerm, userRole, assignedClasses, classFilter]);

  const broadsheetData = useMemo(() => {
    if (reportType !== "broadsheet" || !selectedClass) return null;

    const isSSS = selectedClass.startsWith('SSS') || selectedClass.startsWith('SS');
    const classStudents = students.filter(s => 
      s.class === selectedClass && (selectedArm === 'All' || !isSSS || s.arm === selectedArm)
    );
    const classStudentIds = new Set(classStudents.map(s => s.id));
    
    // Filter results for students in this class
    const classResults = results.filter(r => r && r.studentId && classStudentIds.has(r.studentId));
    
    // Find unique subjects taken by these students
    const classSubjectIds = [...new Set(classResults.map(r => r.subjectId))];
    const classSubjects = subjects.filter(s => classSubjectIds.includes(s.id));

    // Calculate performance for ranking
    const performance = classStudents.map(student => {
      const sResults = classResults.filter(r => r.studentId === student.id);
      const total = sResults.reduce((sum, r) => sum + (r.totalScore || 0), 0);
      const avg = sResults.length > 0 ? total / sResults.length : 0;
      return { id: student.id, total, avg };
    }).sort((a, b) => b.avg - a.avg);

    // Sorted students for display
    const sortedStudents = [...classStudents].sort((a, b) => 
      (a.lastName || "").localeCompare(b.lastName || "")
    );

    return {
      students: sortedStudents,
      subjects: classSubjects,
      performance,
      results: classResults
    };
  }, [reportType, selectedClass, students, results, subjects]);

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
      // Flatten the data for the API
      const flatData = {
        studentId: selectedStudentId,
        term: config?.currentTerm || "2nd Term",
        academicYear: config?.currentAcademicYear || "2023/2024",
        teacherComment: editObservation.teacherComment,
        principalComment: editObservation.principalComment,
        ...editObservation.affectiveDomain,
        ...editObservation.psychomotorSkills,
        // Map arts to crafts for the backend if needed
        crafts: editObservation.psychomotorSkills.arts,
      };

      const saved = await saveObservation(flatData);
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
          className="bg-white dark:bg-black p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-double border-royal-gold-500/30 print:shadow-none print:border-8 print:border-royal-gold-500 relative overflow-hidden"
          ref={reportRef}
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-royal-gold-500/10 rounded-full -mt-48 -mr-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-royal-purple-500/10 rounded-full -mb-48 -ml-48 blur-3xl"></div>

          {/* School Header */}
          <div className="text-center border-b-8 border-double border-royal-gold-500 pb-12 mb-12 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-8">
              <img
                src={config?.schoolLogo || "/school_logo.png"}
                alt="Logo"
                className="w-28 h-28 object-contain shadow-2xl rounded-3xl p-3 bg-white border-2 border-royal-gold-500"
              />
              <div className="text-left">
                <h1 
                  className="text-5xl font-black text-royal-black-900 dark:text-royal-gold-500 tracking-tight uppercase mb-2"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {config?.schoolName || "FOLUSHO VICTORY SCHOOLS"}
                </h1>
                <p 
                  className="text-royal-purple-600 dark:text-royal-gold-400 font-black text-sm uppercase tracking-[0.4em]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {config?.motto || "Fountain of Knowledge"}
                </p>
                <p className="text-xs text-gray-500 font-bold mt-3 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-2 h-2 bg-royal-gold-500 rounded-full"></span>
                  {config?.schoolAddress || "123 Victory Lane, Lagos, Nigeria"}
                  <span className="w-2 h-2 bg-royal-gold-500 rounded-full"></span>
                  {config?.schoolPhone || "+234 800 000 0000"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-br from-royal-purple-900 to-black text-white px-8 py-5 rounded-[2rem] shadow-2xl border-2 border-royal-gold-500 relative overflow-hidden group">
                <div className="absolute inset-0 bg-royal-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p 
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold-400 mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Official Record
                </p>
                <p className="text-lg font-black uppercase tracking-tighter text-white">
                  Academic Report
                </p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-12 mb-16 bg-royal-black-900 dark:bg-black/40 p-10 rounded-[2.5rem] border-2 border-royal-gold-500/20 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-royal-gold-500/5 rotate-45 transform translate-x-16 -translate-y-16"></div>
            <div className="space-y-6 relative z-10">
              <div>
                <p 
                  className="text-[10px] font-black text-royal-gold-500 uppercase tracking-[0.3em] mb-2"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Learner Identification
                </p>
                <p 
                  className="text-3xl font-black text-white uppercase tracking-tight"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Reg. Number
                  </p>
                  <p className="text-md font-black text-royal-gold-400">
                    {selectedStudent.registrationNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Class Group
                  </p>
                  <p className="text-md font-black text-royal-gold-400">
                    {selectedStudent.class}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6 text-right relative z-10">
              <div>
                <p 
                  className="text-[10px] font-black text-royal-gold-500 uppercase tracking-[0.3em] mb-2"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Academic Standing
                </p>
                <p 
                  className="text-3xl font-black text-white uppercase tracking-tight"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {selectedStudent.level}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Current Term
                  </p>
                  <p className="text-md font-black text-royal-gold-400 uppercase tracking-widest">
                    {config?.currentTerm || "2nd Term"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Session
                  </p>
                  <p className="text-md font-black text-royal-gold-400 uppercase tracking-widest">
                    {config?.currentAcademicYear || "2023/2024"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-hidden rounded-[2rem] border-2 border-royal-gold-500/20 shadow-2xl mb-16">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-royal-purple-900 to-royal-black-900 text-white">
                  <th 
                    className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Subject
                  </th>
                  <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                    CA (40)
                  </th>
                  <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                    Exam (60)
                  </th>
                  <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                    Total (100)
                  </th>
                  <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                    Grade
                  </th>
                  <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-royal-gold-500/30">
                    Comment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-royal-gold-500/10">
                {studentResults.map((result, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-royal-gold-50/50 dark:hover:bg-royal-gold-500/5 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-royal-purple-600 dark:group-hover:text-royal-gold-500 transition-colors">
                        {subjects.find((s) => s.id === result.subjectId)
                          ?.name || "Unknown"}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-gray-600 dark:text-gray-400">
                      {result.caScore}
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-gray-600 dark:text-gray-400">
                      {result.examScore}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-md font-black text-royal-purple-900 dark:text-royal-gold-500">
                        {result.totalScore}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black border-2 ${
                          result.grade === "A1"
                            ? "bg-royal-gold-500 text-white border-royal-gold-600"
                            : "bg-royal-purple-50 text-royal-purple-600 border-royal-purple-200"
                        }`}
                      >
                        {result.grade}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {result.comment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Behavioral and Psychomotor Sections */}
          <div className="grid grid-cols-2 gap-20 mb-20">
            <div className="space-y-8">
              <h3 
                className="font-black text-royal-purple-900 dark:text-royal-gold-500 text-[10px] uppercase tracking-[0.4em] pb-4 border-b-4 border-royal-gold-500/20"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Affective Domain
              </h3>
              <div className="space-y-5">
                {Object.entries(editObservation.affectiveDomain).map(
                  ([key, val]: [string, any]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center group bg-royal-gold-50/30 dark:bg-royal-gold-500/5 p-3 rounded-2xl border border-transparent hover:border-royal-gold-500/30 transition-all"
                    >
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-black tracking-widest group-hover:text-royal-purple-900 dark:group-hover:text-royal-gold-500 transition-colors capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      {renderRating(val)}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-8">
              <h3 
                className="font-black text-royal-purple-900 dark:text-royal-gold-500 text-[10px] uppercase tracking-[0.4em] pb-4 border-b-4 border-royal-gold-500/20"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Psychomotor Skills
              </h3>
              <div className="space-y-5">
                {Object.entries(editObservation.psychomotorSkills).map(
                  ([key, val]: [string, any]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center group bg-royal-gold-50/30 dark:bg-royal-gold-500/5 p-3 rounded-2xl border border-transparent hover:border-royal-gold-500/30 transition-all"
                    >
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-black tracking-widest group-hover:text-royal-purple-900 dark:group-hover:text-royal-gold-500 transition-colors capitalize">
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
                Grand Total
              </p>
              <p className="text-4xl font-black text-indigo-900 tracking-tighter group-hover:text-white">
                {grandTotal}
              </p>
            </div>
            <div className="p-8 bg-emerald-50/50 rounded-[1.5rem] border-2 border-emerald-100/50 text-center group hover:bg-emerald-600 transition-all duration-500">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 group-hover:text-emerald-200">
                Percentage
              </p>
              <p className="text-4xl font-black text-emerald-900 tracking-tighter group-hover:text-white">
                {meanPercentage}%
              </p>
            </div>
            <div className="p-8 bg-violet-50/50 rounded-[1.5rem] border-2 border-violet-100/50 text-center group hover:bg-violet-600 transition-all duration-500">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2 group-hover:text-violet-200">
                {selectedStudent?.level === "Secondary" && 
                 (selectedStudent?.class.startsWith("SSS") || selectedStudent?.class.startsWith("SS")) 
                  ? "Overall Grade" 
                  : "Class Position"}
              </p>
              <p className="text-4xl font-black text-violet-900 tracking-tighter group-hover:text-white">
                {selectedStudent?.level === "Secondary" && 
                 (selectedStudent?.class.startsWith("SSS") || selectedStudent?.class.startsWith("SS")) 
                  ? overallGrade 
                  : classRanking}
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
          <div className="grid grid-cols-2 gap-16 pt-12 mt-4 border-t-4 border-double border-royal-gold-500/30">
            {/* Class Teacher — typed name */}
            <div className="text-center">
              <div className="h-20 mb-2 flex items-end justify-center">
                {classTeacher ? (
                  <span
                    className="text-xl font-black text-royal-purple-900 dark:text-royal-gold-500 uppercase tracking-tight"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {classTeacher.name}
                  </span>
                ) : (
                  <span className="text-[9px] text-royal-gold-500/50 uppercase tracking-widest border border-dashed border-royal-gold-500/30 rounded-xl px-4 py-3 select-none">
                    Unassigned
                  </span>
                )}
              </div>
              <div className="h-0.5 bg-royal-gold-500/40 mb-3 w-full" />
              <p 
                className="text-[10px] font-black text-royal-gold-600 uppercase tracking-[0.4em]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Form Teacher
              </p>
            </div>

            {/* Principal — script signature */}
            <div className="text-center">
              <div className="h-20 mb-2 flex items-end justify-center overflow-hidden pb-1 relative">
                {/* Decorative Stamp Effect */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                   <div className="w-16 h-16 border-4 border-royal-gold-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase text-royal-gold-600 rotate-12">Certified</span>
                   </div>
                </div>
                {config?.principalName ? (
                  <span
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                      fontSize: "3.2rem",
                      fontWeight: 400,
                      color: "#1a1a1a",
                      lineHeight: 0.8,
                      display: "inline-block",
                      transform: "rotate(-2deg)",
                      textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {config.principalName}
                  </span>
                ) : (
                  <span className="text-[9px] text-royal-gold-500/50 uppercase tracking-widest border border-dashed border-royal-gold-500/30 rounded-xl px-4 py-3 select-none">
                    Office Seal
                  </span>
                )}
              </div>
              <div className="h-0.5 bg-royal-gold-500/40 mb-3 w-full" />
              {config?.principalName && (
                <p className="text-xs font-black text-royal-black-900 dark:text-white mb-0.5 tracking-tight uppercase">
                  {config.principalName}
                </p>
              )}
              <p 
                className="text-[10px] font-black text-royal-gold-600 uppercase tracking-[0.4em]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                School Principal
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
        <div className="flex flex-col sm:flex-row gap-4 items-center">
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

          <div className="relative w-full sm:w-64">
            <select
              value={reportType === "broadsheet" ? selectedClass : classFilter}
              onChange={(e) => {
                if (reportType === "broadsheet") {
                  setSelectedClass(e.target.value);
                } else {
                  setClassFilter(e.target.value);
                }
              }}
              className="input-field pl-4 border-2 border-indigo-100 dark:border-indigo-900/30 focus:border-indigo-500"
            >
              <option value="">{reportType === "broadsheet" ? "Select Class for Broadsheet..." : "Filter Overview by Class..."}</option>
              {(() => {
                const uniqueClasses = [...new Set(students.map((s) => s.class))].sort();
                const filteredClasses = userRole === "Admin" 
                  ? uniqueClasses 
                  : uniqueClasses.filter(c => assignedClasses.includes(c));
                
                return filteredClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ));
              })()}
            </select>
          </div>

          {/* Arm Filter */}
          {((reportType === "broadsheet" ? selectedClass : classFilter).startsWith('SSS') || (reportType === "broadsheet" ? selectedClass : classFilter).startsWith('SS')) && (
            <div className="relative w-full sm:w-48">
              <select
                value={selectedArm}
                onChange={(e) => setSelectedArm(e.target.value)}
                className="input-field pl-4 border-2 border-indigo-100 dark:border-indigo-900/30 focus:border-indigo-500"
              >
                <option value="All">All Departments</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commerce</option>
              </select>
            </div>
          )}
        </div>
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
          {broadsheetData ? (
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
                      {broadsheetData.subjects.map(sub => (
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
                      ))}
                      <th className="p-4 bg-indigo-900 min-w-[80px]">Grand Total</th>
                      <th className="p-4 bg-emerald-900 min-w-[80px]">Avg</th>
                      <th className="p-4 bg-violet-900 min-w-[80px]">Pos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {broadsheetData.students.map(student => {
                      const studentPerformance = broadsheetData.performance.find(p => p.id === student.id);
                      const position = broadsheetData.performance.findIndex(p => p.id === student.id) + 1;
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
                          {broadsheetData.subjects.map(sub => {
                            const res = broadsheetData.results.find(r => r.studentId === student.id && r.subjectId === sub.id);
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
                    })}
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
