import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-folusho-sage-500/10 border border-folusho-sage-500/20 text-folusho-sage-400 text-[10px] font-black tracking-[0.35em] uppercase">
            Human Resources
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
            Faculty <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-folusho-sage-500 via-folusho-coral-400 to-folusho-sage-600">Command.</span>
          </h1>
          <p className="text-folusho-slate-500 text-base font-bold max-w-xl leading-relaxed tracking-tight">
            Orchestrate the elite educators behind the Folusho academic citadel.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <button
            onClick={handleExport}
            className="btn-vibrant bg-white/5 !text-folusho-slate-400 border border-white/5 hover:border-folusho-sage-500/30 shadow-sm"
          >
            <Download className="w-5 h-5 text-folusho-sage-400" />
            Personnel Export
          </button>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setShowForm(true);
            }}
            className="btn-vibrant bg-folusho-sage-400 shadow-folusho"
          >
            <Plus className="w-5 h-5" />
            Enlist Member
          </button>
        </div>
      </div>

      {/* ── Intelligence Filters ───────────────────────── */}
      <div className="folusho-card !p-12 border-white/5 bg-folusho-slate-900/40 backdrop-blur-md shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">
              Personnel Search
            </label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-folusho-slate-500 group-focus-within:text-folusho-sage-400 transition-colors" />
              <input
                type="text"
                placeholder="Name, Email or Specialized Skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-folusho !pl-16 !bg-folusho-slate-950/50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-folusho-sage-400 uppercase tracking-[0.4em] px-2">
              Operational Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value as SchoolLevel | "All")
              }
              className="input-folusho !py-5 !bg-folusho-slate-950/50"
            >
              <option value="All">Global Operations</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Data Matrix ────────────────────────────────── */}
      <div className="folusho-card !p-0 border-white/5 bg-folusho-slate-900/40 backdrop-blur-md shadow-2xl overflow-hidden">
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
                      className="px-3 py-1 bg-folusho-sage-500/10 text-folusho-sage-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-folusho-sage-500/20"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-folusho-coral-500/10 text-folusho-coral-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-folusho-coral-500/20">
                    Lead Mentor
                  </span>
                )}
              </div>
            ),
            profile: (
              <div className="w-14 h-14 rounded-2xl bg-folusho-sage-500/10 flex items-center justify-center overflow-hidden border border-white/5 shadow-sm">
                {teacher.image ? (
                  <img
                    src={teacher.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-folusho-sage-400" />
                )}
              </div>
            ),
            name: <span className="font-bold text-white text-lg">{teacher.name}</span>,
            email: <span className="font-mono text-folusho-slate-500 text-sm">{teacher.email}</span>,
            classes: (
              <div className="flex flex-wrap gap-2">
                {(teacher.assignedClasses || []).map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-folusho-yellow-500/10 text-folusho-yellow-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-folusho-yellow-500/20"
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
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-folusho-sage-400 transition-all border border-white/5 shadow-sm"
                  title="Modify Entry"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-folusho-coral-400 transition-all border border-white/5 shadow-sm"
                  title="Expel Member"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          }))}
        />
        {filteredTeachers.length === 0 && (
          <div className="text-center py-24">
            <p className="text-folusho-slate-500 font-bold uppercase tracking-widest text-sm">No specialized personnel detected in this sector.</p>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-8"
          >
            <motion.div 
              initial={{ scale: 0.98, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 10 }}
              className="folusho-card max-w-2xl w-full max-h-[90vh] overflow-y-auto !p-0 border-white/5 shadow-2xl bg-folusho-slate-900"
            >
              <TeacherForm
                onSubmit={handleSubmitTeacher}
                initialData={editingTeacher || undefined}
                onCancel={() => setShowForm(false)}
                isEditing={!!editingTeacher}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
