import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  User as UserIcon,
} from "lucide-react";
import { motion } from "framer-motion";
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
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-nebula-teal-500/10 border border-nebula-teal-500/20 text-nebula-teal-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md">
            Human Resources
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Faculty <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nebula-indigo-400 via-nebula-teal-400 to-nebula-pink-400">Command.</span>
          </h1>
          <p className="text-nebula-slate-400 text-lg font-bold max-w-xl leading-relaxed tracking-tight">
            Orchestrate the elite educators behind the digital citadel.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <button
            onClick={handleExport}
            className="btn-vibrant from-white/5 to-white/10 !text-white border border-white/10 hover:border-nebula-teal-500/50 shadow-none"
          >
            <Download className="w-5 h-5 text-nebula-teal-400" />
            Personnel Export
          </button>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setShowForm(true);
            }}
            className="btn-vibrant from-nebula-indigo-600 to-nebula-indigo-800"
          >
            <Plus className="w-5 h-5" />
            Enlist Member
          </button>
        </div>
      </div>

      {/* ── Intelligence Filters ───────────────────────── */}
      <div className="nebula-card !p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
              Personnel Search
            </label>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-nebula-indigo-500 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Name, Email or Specialized Skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-nebula pl-14"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.3em] px-2">
              Operational Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value as SchoolLevel | "All")
              }
              className="input-nebula !py-4"
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
      <div className="nebula-card !p-0 overflow-hidden">
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
                      className="px-3 py-1 bg-nebula-indigo-500/10 text-nebula-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-nebula-indigo-500/20"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-nebula-pink-500/10 text-nebula-pink-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-nebula-pink-500/20">
                    Lead Mentor
                  </span>
                )}
              </div>
            ),
            profile: (
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-nebula">
                {teacher.image ? (
                  <img
                    src={teacher.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-nebula-indigo-400" />
                )}
              </div>
            ),
            name: <span className="font-bold text-white text-lg">{teacher.name}</span>,
            email: <span className="font-mono text-nebula-slate-400 text-sm">{teacher.email}</span>,
            classes: (
              <div className="flex flex-wrap gap-2">
                {(teacher.assignedClasses || []).map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-nebula-teal-500/10 text-nebula-teal-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-nebula-teal-500/20"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ),
            actions: (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingTeacher(teacher);
                    setShowForm(true);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-nebula-indigo-500/20 text-nebula-indigo-400 transition-all border border-white/5"
                  title="Modify Entry"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-nebula-pink-500/20 text-nebula-pink-400 transition-all border border-white/5"
                  title="Expel Member"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          }))}
        />
        {filteredTeachers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-nebula-slate-500 font-bold uppercase tracking-widest text-sm">No specialized personnel detected in this sector.</p>
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
            className="fixed inset-0 bg-nebula-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="nebula-card max-w-2xl w-full max-h-[90vh] overflow-y-auto !p-0 border-white/10"
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
