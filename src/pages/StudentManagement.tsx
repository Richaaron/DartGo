import { useState, useEffect, useMemo } from "react";
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
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase">
            School Management
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Student <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Database.</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold max-w-xl leading-relaxed tracking-tight">
            {isTeacher
              ? isFormCapableTeacher
                ? "Manage students and academic records for your assigned classes."
                : "View student information and class lists."
              : "Complete institutional registry and student management system."}
          </p>
        </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <button
            onClick={() => setShowBulkAssign(true)}
            className="btn-vibrant !bg-slate-900/40 border border-white/5 !text-white shadow-2xl backdrop-blur-md"
          >
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Bulk Assign
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border border-white/5 hover:bg-slate-800 transition-all"
          >
            <Download className="w-5 h-5 text-rose-500" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowForm(true);
            }}
            disabled={isTeacher && !isFormCapableTeacher}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-30"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </div>

      {/* ── Intelligence Filters ───────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
              Search Student
            </label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input !pl-16 !bg-slate-50 dark:!bg-slate-950/50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
              Academic Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value as any);
                setSelectedClass("All");
              }}
              className="input !bg-slate-50 dark:!bg-slate-950/50"
            >
              <option value="All">All Levels</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input !bg-slate-50 dark:!bg-slate-950/50"
            >
              <option value="All">All Classes</option>
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg overflow-hidden">
        <Table
          columns={columns}
          data={filteredStudents}
          renderCell={(student, key) => {
            if (key === "actions") {
              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenAdvancedEditor(student)}
                    className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all border border-indigo-500/10"
                    title="Edit Student"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenSubjectAssignment(student)}
                    className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all border border-amber-500/10"
                    title="Assign Subjects"
                  >
                    <BookOpen size={16} />
                  </button>
                  {permissions.canDelete && (
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all border border-rose-500/10"
                      title="Delete Student"
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
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/5"
                }`}>
                  {student.status}
                </span>
              );
            }
            if (key === "registrationNumber") {
              return <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{student[key]}</span>;
            }
            return <span className="font-bold text-white">{student[key]}</span>;
          }}
        />
      </div>

      {/* ── Modals ────────────────────────────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white dark:bg-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
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
            </div>
          </div>
        )}

        {showSubjectForm && selectedStudentForSubjects && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white dark:bg-slate-900 max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
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
            </div>
          </div>
        )}

      {showBulkAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full !p-0 overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">
                  Bulk Subject <br /> <span className="text-white/80">Assignment</span>
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-80">
                  Assign subjects to students in a class
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
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.35em] px-2">
                    1. Select Class
                  </label>
                  <select
                    value={bulkAssignClass}
                    onChange={(e) => {
                      setBulkAssignClass(e.target.value);
                      setBulkAssignArm("");
                      setBulkAssignSubjects([]);
                    }}
                    className="input !bg-slate-50 dark:!bg-slate-950/50"
                  >
                    <option value="">Choose a class...</option>
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
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.35em] px-2">
                      2. Select Department
                    </label>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2">
                      Common subjects are auto-mapped. Select department below.
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
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' 
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:border-indigo-500/30'
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
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.45em] px-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          {bulkAssignArm} Subjects
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === bulkAssignArm)
                            .map(subject => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? 'bg-indigo-500/10 border-indigo-500/30 shadow-inner'
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-50 hover:opacity-100'
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
                                  className="w-5 h-5 bg-white border-slate-300 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-slate-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subject.code}</p>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* === General subjects (SSS only) – unchecked, manual pick === */}
                    {bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.45em] px-2 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                           General Core Matrix (Manual Selection)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === 'General')
                            .map(subject => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? 'bg-amber-50 border-amber-300 shadow-inner'
                                    : 'bg-slate-50/30 border-slate-100 hover:bg-white transition-all'
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
                                  className="w-5 h-5 bg-white border-slate-200 text-amber-600 rounded-lg focus:ring-amber-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-slate-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subject.code}</p>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* === Non-SSS classes (JSS / Primary) – standard subject picker === */}
                    {!bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.45em] px-2">
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
                                    ? 'bg-indigo-50 border-indigo-300 shadow-inner'
                                    : 'bg-slate-50/30 border-slate-100 hover:bg-white transition-all'
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
                                  className="w-5 h-5 bg-white border-slate-200 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-slate-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subject.code}</p>
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
            <div className="flex gap-6 mt-12">
              <button
                type="button"
                onClick={() => setShowBulkAssign(false)}
                className="flex-1 py-4 px-8 bg-white/5 border border-white/10 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
              >
                Cancel Protocol
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkAssignClass || bulkAssignSubjects.length === 0}
                className="flex-1 py-4 px-8 bg-indigo-400 text-white rounded-[2rem] font-black shadow-2xl hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Synchronize Matrix
              </button>
            </div>
          </div>
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



      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="card bg-indigo-500/5 text-center border-indigo-500/10 !p-10">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mb-4">Total Scholars</p>
          <p className="text-5xl font-black text-white tracking-tighter">{filteredStudents.length}</p>
        </div>
        <div className="card bg-indigo-500/5 text-center border-indigo-500/10 !p-10">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mb-4">Active Registry</p>
          <p className="text-5xl font-black text-indigo-400 tracking-tighter">
            {filteredStudents.filter((s) => s.status === "Active").length}
          </p>
        </div>
        <div className="card bg-rose-500/5 text-center border-rose-500/10 !p-10">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] mb-4">Inactive Protocols</p>
          <p className="text-5xl font-black text-rose-400 tracking-tighter">
            {filteredStudents.filter((s) => s.status !== "Active").length}
          </p>
        </div>
      </div>
    </div>
  );
}
