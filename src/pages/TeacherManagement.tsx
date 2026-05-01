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
        console.error("Failed to load teachers", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadTeachers() {
    try {
      const data = await fetchTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Failed to load teachers", error);
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
      Classes: teacher.assignedClasses.join(", "),
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
    <motion.div 
      className="p-4 md:p-8 bg-gradient-to-br from-royal-gold-50 via-white to-royal-purple-50 dark:bg-gradient-to-br dark:from-royal-black-900 dark:via-royal-purple-900/10 dark:to-royal-black-900 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <motion.h1 
            className="text-4xl font-black bg-gradient-to-r from-royal-purple-600 via-royal-black-700 to-royal-gold-500 bg-clip-text text-transparent tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Squad Management
          </motion.h1>
          <motion.p 
            className="text-royal-purple-600 dark:text-royal-gold-400 mt-2 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Manage teachers and class assignments
          </motion.p>
        </div>
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <motion.button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={20} />
            Export
          </motion.button>
          <motion.button
            onClick={() => {
              setEditingTeacher(null);
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={20} />
            Add Squad Member
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        className="card-lg mb-8 border-2 border-royal-gold-200 dark:border-royal-purple-700/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-royal-purple-400 dark:text-royal-gold-400" />
              <input
                type="text"
                placeholder="Search by name, username, email or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value as SchoolLevel | "All")
              }
              className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
            >
              <option value="All">All Levels</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </motion.div>
        </div>
      </motion.div>

      {/* Form Modal */}
      {showForm && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white dark:bg-royal-black-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-royal-gold-300 dark:border-royal-purple-600"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
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

      {/* Table */}
      <motion.div 
        className="card-lg border-2 border-royal-gold-200 dark:border-royal-purple-700/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Table
          columns={columns}
          data={filteredTeachers.map((teacher) => ({
            ...teacher,
            subjects: (
              <div className="flex flex-wrap gap-1">
                {getTeacherSubjects(teacher).length > 0 ? (
                  getTeacherSubjects(teacher).map((subject) => (
                    <motion.span
                      key={subject}
                      className="px-2 py-0.5 bg-gradient-to-r from-royal-purple-50 to-royal-gold-50 dark:from-royal-purple-900/40 dark:to-royal-gold-900/40 text-royal-purple-700 dark:text-royal-purple-300 rounded-md text-xs font-bold border border-royal-purple-300 dark:border-royal-purple-700/50"
                      whileHover={{ scale: 1.05 }}
                    >
                      {subject}
                    </motion.span>
                  ))
                ) : (
                  <motion.span 
                    className="px-2 py-0.5 bg-gradient-to-r from-royal-gold-100 to-royal-gold-50 dark:from-royal-gold-900/40 dark:to-royal-gold-800/30 text-royal-gold-700 dark:text-royal-gold-300 rounded-md text-xs font-bold border border-royal-gold-300 dark:border-royal-gold-700/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    Form Teacher
                  </motion.span>
                )}
              </div>
            ),
            profile: (
              <motion.div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-royal-purple-100 to-royal-gold-100 dark:from-royal-purple-900/40 dark:to-royal-gold-900/40 flex items-center justify-center overflow-hidden border-2 border-royal-gold-300 dark:border-royal-purple-600/50 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                {teacher.image ? (
                  <img
                    src={teacher.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-royal-purple-600 dark:text-royal-gold-400" />
                )}
              </motion.div>
            ),
            classes: (
              <div className="flex flex-wrap gap-1">
                {(teacher.assignedClasses || []).map((c) => (
                  <motion.span
                    key={c}
                    className="px-2 py-0.5 bg-gradient-to-r from-royal-gold-50 to-royal-gold-100 dark:from-royal-gold-900/30 dark:to-royal-gold-900/50 text-royal-gold-700 dark:text-royal-gold-300 rounded-md text-xs font-bold border border-royal-gold-300 dark:border-royal-gold-700/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            ),
            actions: (
              <div className="flex gap-2">
                <motion.button
                  onClick={() => {
                    setEditingTeacher(teacher);
                    setShowForm(true);
                  }}
                  className="p-1 text-royal-purple-600 dark:text-royal-gold-400 hover:bg-royal-purple-100 dark:hover:bg-royal-purple-900/30 rounded transition-colors"
                  title="Edit"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit2 size={18} />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 size={18} />
                </motion.button>
              </div>
            ),
          }))}
        />
        {filteredTeachers.length === 0 && (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-royal-purple-600 dark:text-royal-gold-400 font-semibold">No squad members found</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
