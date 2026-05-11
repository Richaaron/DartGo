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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Champions{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              Management
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">
            {isTeacher
              ? isFormCapableTeacher
                ? "Manage students in your assigned class"
                : "View students in your assigned classes"
              : "Manage all students in the school"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkAssign(true)}
            className="btn-accent flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base"
          >
            <BookOpen size={20} />
            <span className="hidden sm:inline">Bulk Assign Subjects</span>
            <span className="sm:hidden">Bulk Assign</span>
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowForm(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isTeacher && !isFormCapableTeacher}
            title={
              isTeacher && !isFormCapableTeacher
                ? "Only form teachers can add students"
                : "Add student"
            }
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, parent email or reg. no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value as any);
                setSelectedClass("All");
              }}
              className="input-field"
            >
              <option value="All">All Levels</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-2 uppercase tracking-widest">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field"
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

      {/* Subject Assignment Modal */}
      {showSubjectForm && selectedStudentForSubjects && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

      {/* Bulk Subject Assignment Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border-4 border-dashed border-school-blue">
            <div className="p-6 bg-gradient-to-r from-school-blue to-school-green text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Bulk Subject Assignment
                </h2>
                <p className="text-xs font-medium opacity-90">
                  Assign subjects to all students in a class
                </p>
              </div>
              <button
                onClick={() => setShowBulkAssign(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-black text-school-blue mb-2 uppercase tracking-widest">
                  1. Select Class
                </label>
                <select
                  value={bulkAssignClass}
                  onChange={(e) => {
                    setBulkAssignClass(e.target.value);
                    setBulkAssignArm("");
                    setBulkAssignSubjects([]);
                  }}
                  className="input-field"
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
                <div>
                  <label className="block text-sm font-black text-school-blue mb-2 uppercase tracking-widest">
                    2. Select Arm
                  </label>
                  <p className="text-xs text-gray-500 mb-3 font-medium">
                    9 general subjects are auto-included. Tick additional arm subjects below.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Science', 'Art', 'Commercial'] as const).map((arm) => (
                      <button
                        key={arm}
                        onClick={() => {
                          setBulkAssignArm(arm);
                          // Auto-check the arm-specific subjects; General subjects left unchecked for manual pick
                          const armIds = subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === arm)
                            .map(s => s.id);
                          setBulkAssignSubjects(armIds);
                        }}
                        className={`py-3 px-4 rounded-2xl border-2 font-black text-sm transition-all ${bulkAssignArm === arm
                            ? arm === 'Science' ? 'bg-blue-600 text-white border-blue-600' :
                              arm === 'Art' ? 'bg-purple-600 text-white border-purple-600' :
                                'bg-amber-600 text-white border-amber-600'
                            : 'bg-white border-brand-200 text-gray-700 hover:border-school-blue/50'
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
                  <div className="space-y-5">

                    {/* === Arm subjects (SSS only) – auto-checked, can uncheck === */}
                    {bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div>
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
                          ✓ {bulkAssignArm} Arm Subjects — Auto-included (uncheck to remove)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === bulkAssignArm)
                            .map(subject => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? 'bg-blue-50 border-blue-400 shadow-sm'
                                    : 'bg-white border-gray-200 opacity-60'
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
                                  className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-gray-300"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-gray-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subject.code}</p>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* === General subjects (SSS only) – unchecked, manual pick === */}
                    {bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div>
                        <label className="block text-sm font-black text-school-blue mb-2 uppercase tracking-widest">
                          3. Add General Subjects (manual)
                        </label>
                        <p className="text-xs text-gray-500 mb-3 font-medium">
                          Tick any of the 9 general subjects you also want to assign.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {subjects
                            .filter(s => (s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory)) && s.subjectCategory === 'General')
                            .map(subject => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? 'bg-school-blue/10 border-school-blue shadow-md'
                                    : 'bg-white border-brand-200 hover:border-school-blue/50'
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
                                  className="w-5 h-5 text-school-blue rounded-lg focus:ring-school-blue border-brand-300"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-gray-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subject.code}</p>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}
                    {/* === Non-SSS classes (JSS / Primary) \u2013 standard subject picker === */}
                    {!bulkAssignClass.toUpperCase().includes('SSS') && (
                      <div>
                        <label className="block text-sm font-black text-school-blue mb-2 uppercase tracking-widest">
                          2. Select Subjects
                        </label>
                        <p className="text-xs text-gray-500 mb-3 font-medium">
                          Select subjects to assign to all students in {bulkAssignClass}.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {subjects
                            .filter((s) => {
                              if (!s) return false;
                              const classLevel = students.find(
                                (student) => student && student.class === bulkAssignClass,
                              )?.level;
                              if (!classLevel || s.level !== classLevel) return false;
                              // Specific rule: Writing is only for P1-3
                              if (s.name === 'Writing' && (bulkAssignClass.includes('4') || bulkAssignClass.includes('5') || bulkAssignClass.includes('6'))) {
                                return false;
                              }
                              return !(s.code?.startsWith('SSS-') || (s.level === 'Secondary' && s.subjectCategory));
                            })
                            .map((subject) => (
                              <label
                                key={subject.id}
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${bulkAssignSubjects.includes(subject.id)
                                    ? "bg-school-blue/10 border-school-blue shadow-md"
                                    : "bg-white border-brand-200 hover:border-school-blue/50"
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={bulkAssignSubjects.includes(subject.id)}
                                  onChange={() => {
                                    setBulkAssignSubjects((prev) =>
                                      prev.includes(subject.id)
                                        ? prev.filter((id) => id !== subject.id)
                                        : [...prev, subject.id],
                                    );
                                  }}
                                  className="w-5 h-5 text-school-blue rounded-lg focus:ring-school-blue border-brand-300"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-gray-900 truncate">{subject.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {subject.code}
                                  </p>
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

            <div className="p-6 bg-brand-50 border-t-4 border-dashed border-brand-200 flex gap-3">
              <button
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

      {/* Table Replacement: Scholar Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="professional-card p-6 group hover:bg-brand-900/60 transition-all duration-300 relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${student.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                  {student.status}
                </span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <h3 className="text-white font-black uppercase tracking-tight text-lg mb-1">{student.firstName} {student.lastName}</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{student.registrationNumber}</p>

                <div className="w-full flex justify-center gap-2 mb-6">
                  <span className="px-3 py-1 bg-brand-800 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest border border-brand-700">
                    {student.class}
                  </span>
                  <span className="px-3 py-1 bg-brand-800 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest border border-brand-700">
                    {student.level}
                  </span>
                </div>

                <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-indigo-500/10">
                  <button
                    onClick={() => handleOpenAdvancedEditor(student)}
                    disabled={!permissions.canEditStudent && !permissions.canManageSubjects}
                    className="p-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Edit Profile"
                  >
                    <Edit2 size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleOpenSubjectAssignment(student)}
                    disabled={!permissions.canAssignSubjectsToStudent}
                    className="p-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Assign Subjects"
                  >
                    <BookOpen size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    disabled={!permissions.canDeleteStudent}
                    className="p-2 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Delete Scholar"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>

                {/* Parent Credentials */}
                <div className="mt-4 pt-4 border-t border-indigo-500/5 w-full">
                  <div className="flex flex-col gap-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase tracking-widest">Username</span>
                      <span className="text-gray-300 font-black">{student.parentUsername || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase tracking-widest">Password</span>
                      <span className="text-gray-300 font-black">{student.parentPassword || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center card-lg border-brand-800/40">
            <Search size={48} className="mx-auto text-brand-700/50 mb-4" />
            <p className="text-brand-400 font-bold uppercase tracking-widest">No scholars found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="card-lg bg-indigo-50/50 dark:bg-indigo-900/10 text-center border-indigo-500/20">
          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2">Total Scholars</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{filteredStudents.length}</p>
        </div>
        <div className="card-lg bg-emerald-50/50 dark:bg-emerald-900/10 text-center border-emerald-500/20">
          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-2">Active</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {filteredStudents.filter((s) => s.status === "Active").length}
          </p>
        </div>
        <div className="card-lg bg-rose-50/50 dark:bg-rose-900/10 text-center border-rose-500/20">
          <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] mb-2">Inactive</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {filteredStudents.filter((s) => s.status !== "Active").length}
          </p>
        </div>
      </div>
    </div>
  );
}
