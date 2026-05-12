import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  BookOpen,
  X,
} from "lucide-react";
import { Student, SchoolLevel } from "../types";
import StudentForm from "../components/StudentForm";
import StudentSubjectForm from "../components/StudentSubjectForm";
import StudentEditor from "../components/StudentEditor";
import Table from "../components/Table";
import {
  exportToCSV,
  formatDate,
  generateRegistrationNumber,
  generateParentCredentials,
} from "../utils/calculations";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  fetchSubjects,
  fetchStudentSubjects,
  createStudentSubject,
  deleteStudentSubject,
} from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import { getUserPermissions } from "../utils/rolePermissions";

export default function StudentManagement() {
  const { user } = useAuthContext();
  const permissions = getUserPermissions(user);
  const isTeacher = user?.role === "Teacher";
  const teacherType = isTeacher ? (user as any)?.teacherType : undefined;
  const isSubjectOnlyTeacher = isTeacher && teacherType === "Subject Teacher";
  const isFormCapableTeacher =
    isTeacher &&
    (!teacherType ||
      teacherType === "Form Teacher" ||
      teacherType === "Form + Subject Teacher");
  const assignedClasses = (user as any)?.assignedClasses || [];

  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | "All">(
    "All",
  );
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [selectedStudentForSubjects, setSelectedStudentForSubjects] =
    useState<Student | null>(null);
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssignClass, setBulkAssignClass] = useState("");
  const [bulkAssignArm, setBulkAssignArm] = useState<'Science' | 'Art' | 'Commercial' | ''>("");
  const [bulkAssignSubjects, setBulkAssignSubjects] = useState<string[]>([]);

  const availableClassesForLevel = useMemo(() => {
    let filtered = students;
    if (selectedLevel !== "All") {
      filtered = students.filter((s) => s.level === selectedLevel);
    }
    return [...new Set(filtered.filter(Boolean).map((s) => s.class))].sort();
  }, [students, selectedLevel]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchStudents(), fetchSubjects()])
      .then(([studentData, subjectData]) => {
        if (isMounted) {
          const safeStudents = Array.isArray(studentData) ? studentData : [];
          const safeSubjects = Array.isArray(subjectData) ? subjectData : [];

          if (isSubjectOnlyTeacher) {
            setStudents(
              safeStudents.filter((s: Student) => s?.level === "Secondary"),
            );
          } else if (isTeacher) {
            // Form-capable teachers: only students in assigned classes
            setStudents(
              safeStudents.filter((s: Student) =>
                assignedClasses.includes(s?.class),
              ),
            );
          } else {
            setStudents(safeStudents);
          }
          setSubjects(safeSubjects);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error("Failed to load students or subjects", error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isTeacher, isSubjectOnlyTeacher, assignedClasses]);

  useEffect(() => {
    if (isTeacher && assignedClasses.length > 0 && selectedClass === "All") {
      setSelectedClass(assignedClasses[0]);
    }
  }, [isTeacher, assignedClasses, selectedClass]);

  async function loadStudents() {
    try {
      const data = await fetchStudents();
      const safeData = Array.isArray(data) ? data : [];

      if (isSubjectOnlyTeacher) {
        setStudents(safeData.filter((s: Student) => s?.level === "Secondary"));
      } else if (isTeacher) {
        setStudents(
          safeData.filter((s: Student) => assignedClasses.includes(s?.class)),
        );
      } else {
        setStudents(safeData);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to load students", error);
      }
      setStudents([]);
    }
  }

  const handleOpenSubjectAssignment = async (student: Student) => {
    setSelectedStudentForSubjects(student);
    try {
      const subjects = await fetchStudentSubjects(student.id);
      setStudentSubjects(subjects);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to load student subjects", error);
      }
      setStudentSubjects([]);
    }
    setShowSubjectForm(true);
  };

  const handleAssignSubjects = async (assignments: any[]) => {
    try {
      // Delete old assignments and create new ones
      for (const oldSubject of studentSubjects) {
        try {
          await deleteStudentSubject(oldSubject.id);
        } catch (error) {
          console.error("Failed to delete old subject assignment", error);
        }
      }

      // Create new assignments
      for (const assignment of assignments) {
        try {
          await createStudentSubject(assignment);
        } catch (error) {
          console.error("Failed to create subject assignment", error);
        }
      }

      setShowSubjectForm(false);
      setSelectedStudentForSubjects(null);
      setStudentSubjects([]);
      window.alert("Subjects assigned successfully!");
    } catch (error) {
      window.alert("Failed to assign subjects");
      console.error("Error assigning subjects:", error);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignClass || bulkAssignSubjects.length === 0) {
      window.alert("Please select a class and at least one subject");
      return;
    }

    const studentsInClass = students.filter((s) => s && s.class === bulkAssignClass);
    if (studentsInClass.length === 0) {
      window.alert("No students found in the selected class");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to assign these subjects to all ${studentsInClass.length} students in ${bulkAssignClass}?`,
      )
    ) {
      return;
    }

    try {
      const academicYear = new Date().getFullYear().toString();
      const term = "First";

      for (const student of studentsInClass) {
        for (const subjectId of bulkAssignSubjects) {
          try {
            await createStudentSubject({
              studentId: student.id,
              subjectId,
              enrollmentDate: new Date().toISOString().split("T")[0],
              status: "Active",
              academicYear,
              term,
              assignedBy: user?.name || "Admin",
            });
          } catch (error) {
            console.error(
              `Failed to assign subject ${subjectId} to student ${student.id}:`,
              error,
            );
          }
        }
      }

      window.alert("Subjects assigned to class successfully!");
      setShowBulkAssign(false);
      setBulkAssignClass("");
      setBulkAssignArm("");
      setBulkAssignSubjects([]);
    } catch (error) {
      console.error("Bulk assignment failed:", error);
      window.alert("Failed to complete bulk assignment");
    }
  };

  const filteredStudents = students.filter((student) => {
    if (!student) return false;

    const firstName = student.firstName || "";
    const lastName = student.lastName || "";
    const regNum = student.registrationNumber || "";
    const parentEmail = student.parentEmail || "";

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parentEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel =
      selectedLevel === "All" || (student && student.level === selectedLevel);
    const matchesClass =
      !isFormCapableTeacher ||
      selectedClass === "All" ||
      (student && student.class === selectedClass);

    return matchesSearch && matchesLevel && matchesClass;
  });

  const handleAddStudent = async (
    newStudent: Omit<Student, "id">,
    selectedSubjects?: string[],
  ) => {
    try {
      const studentData = {
        ...newStudent,
        registrationNumber: generateRegistrationNumber(newStudent.level),
      };
      const createdStudent = await createStudent(studentData);

      // Assign subjects if any were selected
      if (selectedSubjects && selectedSubjects.length > 0) {
        const academicYear = new Date().getFullYear().toString();
        const term = "First"; // Default to first term

        for (const subjectId of selectedSubjects) {
          try {
            await createStudentSubject({
              studentId: createdStudent.id,
              subjectId,
              enrollmentDate: new Date().toISOString().split("T")[0],
              status: "Active",
              academicYear,
              term,
              assignedBy: user?.name || "Admin",
            });
          } catch (error) {
            console.error(
              `Failed to assign subject ${subjectId} to new student:`,
              error,
            );
          }
        }
      }

      await loadStudents();
      setShowForm(false);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message || "Failed to add student";
      const details = error.response?.data?.details
        ? `\nDetails: ${error.response.data.details}`
        : "";
      const hint = error.response?.data?.hint
        ? `\nHint: ${error.response.data.hint}`
        : "";
      window.alert(`Error: ${errorMsg}${details}${hint}`);
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      await updateStudent(updatedStudent.id, updatedStudent);
      await loadStudents();
      setEditingStudent(null);
      setShowForm(false);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to update student";
      const details = error.response?.data?.details
        ? `\nDetails: ${error.response.data.details}`
        : "";
      window.alert(`Error: ${errorMsg}${details}`);
    }
  };

  const handleSubmitStudent = (
    student: Student | Omit<Student, "id">,
    selectedSubjects?: string[],
  ) => {
    if ("id" in student) {
      handleUpdateStudent(student as Student);
    } else {
      handleAddStudent(student as Omit<Student, "id">, selectedSubjects);
    }
  };

  const handleOpenAdvancedEditor = async (student: Student) => {
    setEditingStudent(student);
    try {
      const subjectAssignments = await fetchStudentSubjects(student.id);
      setStudentSubjects(subjectAssignments);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to load student subjects", error);
      }
      setStudentSubjects([]);
    }
    setShowAdvancedEditor(true);
  };

  const handleAdvancedUpdateStudent = async (updatedStudent: Student) => {
    try {
      await updateStudent(updatedStudent.id, updatedStudent);
      await loadStudents();
      setEditingStudent(null);
      setShowAdvancedEditor(false);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to update student";
      window.alert(`Error: ${errorMsg}`);
    }
  };

  const handleAdvancedUpdateSubjects = async (assignments: any[]) => {
    try {
      // Delete old assignments
      for (const oldSubject of studentSubjects) {
        try {
          await deleteStudentSubject(oldSubject.id);
        } catch (error) {
          console.error("Failed to delete old subject assignment", error);
        }
      }

      // Create new assignments
      for (const assignment of assignments) {
        try {
          await createStudentSubject(assignment);
        } catch (error) {
          console.error("Failed to create subject assignment", error);
        }
      }

      setShowAdvancedEditor(false);
      setEditingStudent(null);
      setStudentSubjects([]);
      window.alert("Subjects updated successfully!");
    } catch (error) {
      window.alert("Failed to update subjects");
      console.error("Error updating subjects:", error);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(id);
        await loadStudents();
      } catch {
        window.alert("Failed to delete student");
      }
    }
  };

  const handleExport = () => {
    const dataToExport = filteredStudents.map((student) => ({
      "Registration No": student.registrationNumber,
      "First Name": student.firstName,
      "Last Name": student.lastName,
      "Date of Birth": formatDate(student.dateOfBirth),
      Gender: student.gender,
      Level: student.level,
      Class: student.class,
      "Parent Name": student.parentName,
      "Parent Phone": student.parentPhone,
      "Parent Email": student.parentEmail || "N/A",
      "Enrollment Date": formatDate(student.enrollmentDate),
      Status: student.status,
    }));
    exportToCSV(dataToExport, "students_report");
  };

  const columns = [
    { key: "registrationNumber", label: "Reg. No." },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "level", label: "Level" },
    { key: "class", label: "Class" },
    { key: "arm", label: "Dept/Arm" },
    { key: "parentUsername", label: "Parent Username" },
    { key: "parentPassword", label: "Parent Password" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-50 border border-folusho-sage-100 text-folusho-sage-500 text-[10px] font-black tracking-[0.3em] uppercase">
            Academic Governance
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-folusho-slate-900 tracking-tighter leading-none">
            Champion <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Inventory.</span>
          </h1>
          <p className="text-folusho-slate-400 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
            {isTeacher
              ? isFormCapableTeacher
                ? "Oversee the development and academic journey of your assigned champions."
                : "View the academic growth and registry of your student cohorts."
              : "Global institutional oversight and registry of the student population."}
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <button
            onClick={() => setShowBulkAssign(true)}
            className="btn-vibrant bg-white border border-folusho-cream-200 !text-folusho-slate-900 shadow-sm"
          >
            <BookOpen className="w-5 h-5 text-folusho-sage-500" />
            Bulk Matrix
          </button>
          <button
            onClick={handleExport}
            className="btn-vibrant bg-white border border-folusho-cream-200 !text-folusho-slate-900 shadow-sm"
          >
            <Download className="w-5 h-5 text-folusho-coral-500" />
            Vault Export
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowForm(true);
            }}
            disabled={isTeacher && !isFormCapableTeacher}
            className="btn-vibrant bg-folusho-sage-400 disabled:opacity-30"
          >
            <Plus className="w-5 h-5" />
            New Identity
          </button>
        </div>
      </div>

      {/* ── Intelligence Filters ───────────────────────── */}
      <div className="folusho-card !p-10 border-folusho-cream-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.35em] px-2">
              Identity Search
            </label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-folusho-sage-400 group-focus-within:text-folusho-sage-600 transition-colors" />
              <input
                type="text"
                placeholder="Name, ID or Registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-folusho !pl-16"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.35em] px-2">
              Academic Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value as any);
                setSelectedClass("All");
              }}
              className="input-folusho"
            >
              <option value="All">All Operations</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.35em] px-2">
              Squad / Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-folusho"
            >
              <option value="All">Global Deployment</option>
              {(isTeacher ? assignedClasses : availableClassesForLevel).map(
                (className: string) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ── Data Matrix ────────────────────────────────── */}
      <div className="folusho-card !p-0 border-folusho-cream-200">
        <Table
          columns={columns}
          data={filteredStudents}
          renderCell={(student, key) => {
            if (key === "actions") {
              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenAdvancedEditor(student)}
                    className="p-3 rounded-2xl bg-folusho-sage-50 hover:bg-folusho-sage-100 text-folusho-sage-600 transition-all border border-folusho-sage-100"
                    title="Intelligence Editor"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenSubjectAssignment(student)}
                    className="p-3 rounded-2xl bg-folusho-yellow-50 hover:bg-folusho-yellow-100 text-folusho-yellow-700 transition-all border border-folusho-yellow-100"
                    title="Matrix Assignment"
                  >
                    <BookOpen size={16} />
                  </button>
                  {permissions.canDelete && (
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-3 rounded-2xl bg-folusho-coral-50 hover:bg-folusho-coral-100 text-folusho-coral-600 transition-all border border-folusho-coral-100"
                      title="Terminate Identity"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            }
            if (key === "status") {
              return (
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  student.status === "Active" 
                    ? "bg-folusho-sage-100 text-folusho-sage-600 border border-folusho-sage-200" 
                    : "bg-folusho-cream-200 text-folusho-slate-400 border border-folusho-cream-300"
                }`}>
                  {student.status}
                </span>
              );
            }
            if (key === "registrationNumber") {
              return <span className="font-mono font-black text-folusho-sage-600">{student[key]}</span>;
            }
            return <span className="font-bold text-folusho-slate-900">{student[key]}</span>;
          }}
        />
      </div>

      {/* ── Modals ────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="folusho-card max-w-2xl w-full max-h-[90vh] overflow-y-auto !p-0 border-folusho-cream-300 shadow-folusho-lg"
            >
              <StudentForm
                onSubmit={handleSubmitStudent}
                initialData={editingStudent || undefined}
                onCancel={() => setShowForm(false)}
                isEditing={!!editingStudent}
                allowedClasses={
                  !isTeacher ? availableClassesForLevel : undefined
                }
                defaultClass={
                  isTeacher && isFormCapableTeacher && selectedClass !== "All"
                    ? selectedClass
                    : ""
                }
                lockClass={
                  isTeacher &&
                  isFormCapableTeacher &&
                  selectedClass !== "All" &&
                  !editingStudent
                }
                availableSubjects={subjects}
              />
            </motion.div>
          </motion.div>
        )}

        {showSubjectForm && selectedStudentForSubjects && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="folusho-card max-w-4xl w-full max-h-[90vh] overflow-y-auto !p-0 border-folusho-cream-300 shadow-folusho-lg"
            >
              <StudentSubjectForm
                student={selectedStudentForSubjects}
                subjects={subjects}
                currentSubjects={studentSubjects}
                onSubmit={handleAssignSubjects}
                onCancel={() => {
                  setShowSubjectForm(false);
                  setSelectedStudentForSubjects(null);
                  setStudentSubjects([]);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Subject Assignment Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="folusho-card max-w-2xl w-full !p-0 overflow-hidden border-folusho-cream-300 shadow-folusho-lg"
          >
            <div className="p-10 bg-folusho-sage-400 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">
                  Bulk Matrix <br /> <span className="text-white/80">Synchronization</span>
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-80">
                  Assign protocols to student cohorts
                </p>
              </div>
              <button
                onClick={() => setShowBulkAssign(false)}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.35em] px-2">
                  1. Target Cohort / Class
                </label>
                <select
                  value={bulkAssignClass}
                  onChange={(e) => {
                    setBulkAssignClass(e.target.value);
                    setBulkAssignArm("");
                    setBulkAssignSubjects([]);
                  }}
                  className="input-folusho"
                >
                  <option value="">Choose a target...</option>
                  {[
                    ...new Set(
                      students.filter((s) => s && s.class).map((s) => s.class),
                    ),
                  ]
                    .sort()
                    .map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                </select>
              </div>

              {/* Arm selector – only visible for SSS classes */}
              {bulkAssignClass && bulkAssignClass.toUpperCase().includes('SSS') && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.35em] px-2">
                    2. Strategic Department
                  </label>
                  <p className="text-[10px] text-folusho-slate-400 font-bold uppercase tracking-widest px-2">
                    General protocols are auto-mapped. Select specialized department below.
                  </p>
                  <div className="grid grid-cols-3 gap-6">
                    {(['Science', 'Art', 'Commercial'] as const).map((arm) => (
                      <button
                        key={arm}
                        onClick={() => {
                          setBulkAssignArm(arm);
                          const armIds = subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === arm)
                            .map(s => s.id);
                          setBulkAssignSubjects(armIds);
                        }}
                        className={`py-4 px-6 rounded-3xl border-2 font-black text-[10px] tracking-widest uppercase transition-all ${bulkAssignArm === arm
                            ? 'bg-folusho-sage-400 text-white border-folusho-sage-500 shadow-folusho' 
                            : 'bg-white border-folusho-cream-200 text-folusho-slate-400 hover:border-folusho-sage-300'
                          }`}
                      >
                        {arm}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject list – shown when class selected (and arm selected for SSS) */}
              {bulkAssignClass && (
                (!bulkAssignClass.toUpperCase().includes('SSS') || bulkAssignArm) && (
                  <div className="space-y-8">

                    {/* === Arm subjects (SSS only) – auto-checked, can uncheck === */}
                    {bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-folusho-sage-500" />
                          {bulkAssignArm} Specialized Matrix
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === bulkAssignArm)
                            .map(subject => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? 'bg-folusho-sage-50 border-folusho-sage-300 shadow-inner'
                                    : 'bg-folusho-cream-50/30 border-folusho-cream-100 opacity-50 hover:opacity-100'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={bulkAssignSubjects.includes(subject.id)}
                                  onChange={() => {
                                    setBulkAssignSubjects(prev =>
                                      prev.includes(subject.id)
                                        ? prev.filter(id => id !== subject.id)
                                        : [...prev, subject.id]
                                    );
                                  }}
                                  className="w-5 h-5 bg-white border-folusho-cream-200 text-folusho-sage-600 rounded-lg focus:ring-folusho-sage-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-folusho-slate-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">{subject.code}</p>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* === General subjects (SSS only) – unchecked, manual pick === */}
                    {bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-folusho-yellow-600 uppercase tracking-[0.45em] px-2 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-folusho-yellow-500" />
                           General Core Matrix (Manual Selection)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === 'General')
                            .map(subject => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? 'bg-folusho-yellow-50 border-folusho-yellow-300 shadow-inner'
                                    : 'bg-folusho-cream-50/30 border-folusho-cream-100 hover:bg-white transition-all'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={bulkAssignSubjects.includes(subject.id)}
                                  onChange={() => {
                                    setBulkAssignSubjects(prev =>
                                      prev.includes(subject.id)
                                        ? prev.filter(id => id !== subject.id)
                                        : [...prev, subject.id]
                                    );
                                  }}
                                  className="w-5 h-5 bg-white border-folusho-cream-200 text-folusho-yellow-600 rounded-lg focus:ring-folusho-yellow-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-folusho-slate-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">{subject.code}</p>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* === Non-SSS classes (JSS / Primary) – standard subject picker === */}
                    {!bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-folusho-sage-500 uppercase tracking-[0.45em] px-2">
                          2. Synchronize Protocols
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {subjects
                            .filter((s) => {
                              if (!s) return false;
                              const classLevel = students.find(
                                (student) => student && student.class === bulkAssignClass,
                              )?.level;
                              if (!classLevel || s.level !== classLevel) return false;
                              if (s.name === 'Writing' && (bulkAssignClass.includes('4') || bulkAssignClass.includes('5') || bulkAssignClass.includes('6'))) {
                                return false;
                              }
                              return !(s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory));
                            })
                            .map((subject) => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? 'bg-folusho-sage-50 border-folusho-sage-300 shadow-inner'
                                    : 'bg-folusho-cream-50/30 border-folusho-cream-100 hover:bg-white transition-all'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={bulkAssignSubjects.includes(subject.id)}
                                  onChange={() => {
                                    setBulkAssignSubjects(prev =>
                                      prev.includes(subject.id)
                                        ? prev.filter(id => id !== subject.id)
                                        : [...prev, subject.id]
                                    );
                                  }}
                                  className="w-5 h-5 bg-white border-folusho-cream-200 text-folusho-sage-600 rounded-lg focus:ring-folusho-sage-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-folusho-slate-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">{subject.code}</p>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowBulkAssign(false)}
                className="flex-1 py-3 px-6 bg-white border-2 border-brand-200 text-brand-600 rounded-full font-black hover:bg-brand-100 transition-all uppercase tracking-widest text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkAssignClass || bulkAssignSubjects.length === 0}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-school-blue to-school-green text-white rounded-full font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Assign to Class
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Advanced Student Editor Modal */}
      {showAdvancedEditor && editingStudent && (
        <StudentEditor
          student={editingStudent}
          subjects={subjects}
          studentSubjects={studentSubjects}
          onUpdateStudent={handleAdvancedUpdateStudent}
          onUpdateSubjects={handleAdvancedUpdateSubjects}
          onCancel={() => {
            setShowAdvancedEditor(false);
            setEditingStudent(null);
            setStudentSubjects([]);
          }}
          allowedClasses={
            !isTeacher ? availableClassesForLevel : undefined
          }
        />
      )}

      {/* Table Replacement: Scholar Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="folusho-card p-8 group hover:bg-white hover:border-folusho-sage-300 transition-all duration-300 relative overflow-hidden border-folusho-cream-200"
            >
              {/* Status Badge */}
              <div className="absolute top-6 right-6">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${student.status === 'Active' ? 'bg-folusho-sage-50 text-folusho-sage-600 border border-folusho-sage-100' : 'bg-folusho-coral-50 text-folusho-coral-500 border border-folusho-coral-100'
                  }`}>
                  {student.status}
                </span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-folusho-sage-50 flex items-center justify-center text-folusho-sage-500 font-black text-3xl mb-6 group-hover:bg-folusho-sage-500 group-hover:text-white transition-all duration-500 shadow-inner">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <h3 className="text-folusho-slate-900 font-black uppercase tracking-tight text-xl mb-1">{student.firstName} {student.lastName}</h3>
                <p className="text-folusho-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mb-6">{student.registrationNumber}</p>

                <div className="w-full flex justify-center gap-3 mb-8">
                  <span className="px-4 py-1.5 bg-folusho-cream-50 rounded-xl text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest border border-folusho-cream-100">
                    {student.class}
                  </span>
                  <span className="px-4 py-1.5 bg-folusho-cream-50 rounded-xl text-[10px] font-black text-folusho-slate-500 uppercase tracking-widest border border-folusho-cream-100">
                    {student.level}
                  </span>
                </div>

                <div className="w-full grid grid-cols-3 gap-3 pt-6 border-t border-folusho-cream-100">
                  <button
                    onClick={() => handleOpenAdvancedEditor(student)}
                    disabled={!permissions.canEditStudent && !permissions.canManageSubjects}
                    className="p-3 bg-folusho-sage-50 text-folusho-sage-600 hover:bg-folusho-sage-500 hover:text-white rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-folusho-sage-100 shadow-sm"
                    title="Edit Profile"
                  >
                    <Edit2 size={18} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleOpenSubjectAssignment(student)}
                    disabled={!permissions.canAssignSubjectsToStudent}
                    className="p-3 bg-folusho-yellow-50 text-folusho-yellow-600 hover:bg-folusho-yellow-500 hover:text-white rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-folusho-yellow-100 shadow-sm"
                    title="Assign Subjects"
                  >
                    <BookOpen size={18} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    disabled={!permissions.canDeleteStudent}
                    className="p-3 bg-folusho-coral-50 text-folusho-coral-500 hover:bg-folusho-coral-500 hover:text-white rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-folusho-coral-100 shadow-sm"
                    title="Delete Scholar"
                  >
                    <Trash2 size={18} className="mx-auto" />
                  </button>
                </div>

                {/* Parent Credentials */}
                <div className="mt-6 pt-6 border-t border-folusho-cream-100 w-full bg-folusho-cream-50/50 rounded-2xl p-4">
                  <div className="flex flex-col gap-2 text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="text-folusho-slate-400 font-bold uppercase tracking-widest">Username</span>
                      <span className="text-folusho-slate-700 font-black tracking-tight">{student.parentUsername || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-folusho-slate-400 font-bold uppercase tracking-widest">Password</span>
                      <span className="text-folusho-slate-700 font-black tracking-tight">{student.parentPassword || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center folusho-card border-folusho-cream-200">
            <Search size={56} className="mx-auto text-folusho-cream-300 mb-6" />
            <p className="text-folusho-slate-400 font-black uppercase tracking-widest text-sm">No scholars found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="folusho-card bg-folusho-sage-50/50 text-center border-folusho-sage-100 !p-10">
          <p className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.25em] mb-3">Total Scholars</p>
          <p className="text-4xl font-black text-folusho-slate-900 tracking-tighter">{filteredStudents.length}</p>
        </div>
        <div className="folusho-card bg-folusho-yellow-50/50 text-center border-folusho-yellow-100 !p-10">
          <p className="text-[10px] font-black text-folusho-yellow-600 uppercase tracking-[0.25em] mb-3">Active</p>
          <p className="text-4xl font-black text-folusho-yellow-600 tracking-tighter">
            {filteredStudents.filter((s) => s.status === "Active").length}
          </p>
        </div>
        <div className="folusho-card bg-folusho-coral-50/50 text-center border-folusho-coral-100 !p-10">
          <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.25em] mb-3">Inactive</p>
          <p className="text-4xl font-black text-folusho-coral-500 tracking-tighter">
            {filteredStudents.filter((s) => s.status !== "Active").length}
          </p>
        </div>
      </div>
    </div>
  );
}
