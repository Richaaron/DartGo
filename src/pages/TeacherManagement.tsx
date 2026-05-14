import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  User as UserIcon,
} from "lucide-react";
import { Teacher, SchoolLevel } from "../types";
import TeacherForm from "../components/TeacherForm";
import Table from "../components/Table";
import { exportToCSV } from "../utils/calculations";
import {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "../services/api";

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | "All">(
    "All",
  );
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchTeachers()
      .then((data) => {
        if (isMounted) setTeachers(data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error("Failed to load teachers", error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadTeachers() {
    try {
      const data = await fetchTeachers();
      setTeachers(data);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to load teachers", error);
      }
    }
  }

  const getTeacherSubjects = (teacher: Teacher) =>
    teacher.assignedSubjects && teacher.assignedSubjects.length > 0
      ? teacher.assignedSubjects
      : (teacher.subject || "")
          .split(",")
          .map((subject) => subject.trim())
          .filter(Boolean);

  const filteredTeachers = teachers.filter((teacher) => {
    const teacherSubjects = getTeacherSubjects(teacher);
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.username?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherSubjects.some((subject) =>
        subject.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesLevel =
      selectedLevel === "All" || teacher.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const handleAddTeacher = async (newTeacher: Omit<Teacher, "id">) => {
    try {
      const firstName = newTeacher.name.split(" ")[0].toLowerCase();
      const uniqueNum = Math.floor(1000 + Math.random() * 9000);

      const teacherData = {
        ...newTeacher,
        teacherId: `T${uniqueNum}`,
        username: `${firstName}@folusho.com`,
        password: `fvs@${uniqueNum}`,
      };

      await createTeacher(teacherData);
      await loadTeachers();
      setShowForm(false);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to add teacher";
      console.error("Teacher creation error:", error);
      window.alert("Error adding teacher: " + errorMessage);
    }
  };

  const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
    try {
      await updateTeacher(updatedTeacher.id, updatedTeacher);
      await loadTeachers();
      setEditingTeacher(null);
      setShowForm(false);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update teacher";
      console.error("Teacher update error:", error);
      window.alert("Error updating teacher: " + errorMessage);
    }
  };

  const handleSubmitTeacher = (teacher: Teacher | Omit<Teacher, "id">) => {
    if ("id" in teacher) {
      handleUpdateTeacher(teacher as Teacher);
    } else {
      handleAddTeacher(teacher as Omit<Teacher, "id">);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this teacher? This will also remove their access to the system.",
      )
    ) {
      try {
        await deleteTeacher(id);
        await loadTeachers();
      } catch {
        window.alert("Failed to delete teacher");
      }
    }
  };

  const handleExport = () => {
    const dataToExport = filteredTeachers.map((teacher) => ({
      "Teacher ID": teacher.teacherId,
      Name: teacher.name,
      Username: teacher.username,
      Email: teacher.email,
      Subjects: getTeacherSubjects(teacher).join(", "),
      Level: teacher.level,
      Classes: (teacher.assignedClasses || []).join(", "),
    }));
    exportToCSV(dataToExport, "teachers_report");
  };

  const columns = [
    { key: "profile", label: "Photo" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "subjects", label: "Subjects" },
    { key: "level", label: "Level" },
    { key: "classes", label: "Classes" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-12">
      {/* ── Dynamic Header ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Staff Management
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Teacher <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">Directory.</span>
          </h1>
          <p className="text-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Manage the list of teachers and their assignments.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <button
            onClick={handleExport}
            className="btn-vibrant bg-white/5 !text-slate-400 border border-white/5 hover:border-indigo-500/30 shadow-sm"
          >
            <Download className="w-5 h-5 text-indigo-400" />
            Export Staff CSV
          </button>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setShowForm(true);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* ── Intelligence Filters ───────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] px-2">
              Search Staff
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
              Filter by Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value as SchoolLevel | "All")
              }
              className="input !py-5 !bg-slate-50 dark:!bg-slate-950/50"
            >
              <option value="All">All Levels</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Data Matrix ────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg overflow-hidden">
        <Table
          columns={columns}
          data={filteredTeachers.map((teacher) => ({
            ...teacher,
            subjects: (
              <div className="flex flex-wrap gap-2">
                {getTeacherSubjects(teacher).length > 0 ? (
                  getTeacherSubjects(teacher).map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5">
                    No Subject Assigned
                  </span>
                )}
              </div>
            ),
            profile: (
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center overflow-hidden border border-indigo-500/10 shadow-sm">
                {teacher.image ? (
                  <img
                    src={teacher.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
            ),
            name: <span className="font-bold text-slate-900 dark:text-white text-lg">{teacher.name}</span>,
            email: <span className="font-mono text-slate-500 text-sm">{teacher.email}</span>,
            classes: (
              <div className="flex flex-wrap gap-2">
                {(teacher.assignedClasses || []).map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ),
            actions: (
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setEditingTeacher(teacher);
                    setShowForm(true);
                  }}
                  className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all border border-indigo-500/10 shadow-sm"
                  title="Edit Teacher"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all border border-rose-500/10 shadow-sm"
                  title="Delete Teacher"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          }))}
        />
        {filteredTeachers.length === 0 && (
          <div className="text-center py-24">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No teachers found.</p>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
            <div className="bg-white dark:bg-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
              <TeacherForm
                onSubmit={handleSubmitTeacher}
                initialData={editingTeacher || undefined}
                onCancel={() => setShowForm(false)}
                isEditing={!!editingTeacher}
              />
            </div>
          </div>
        )}
    </div>
  );
}
