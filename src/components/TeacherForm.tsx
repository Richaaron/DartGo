import { useState, useRef, useEffect, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { X, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Teacher, Subject, Student } from "../types";
import { fetchSubjects, fetchStudents } from "../services/api";

const STANDARD_CLASSES = [
  "Pre-Nursery",
  "Nursery 1",
  "Nursery 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

const LEVEL_CLASS_MAP: Record<Teacher["level"], string[]> = {
  "Pre-Nursery": ["Pre-Nursery"],
  Nursery: ["Nursery 1", "Nursery 2"],
  Primary: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5"],
  Secondary: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"],
};

interface TeacherFormProps {
  onSubmit: (teacher: Teacher | Omit<Teacher, "id">) => void;
  initialData?: Teacher;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function TeacherForm({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false,
}: TeacherFormProps) {
  const initialAssignedSubjects = useMemo(
    () =>
      initialData?.assignedSubjects && initialData.assignedSubjects.length > 0
        ? initialData.assignedSubjects
        : (initialData?.subject || "")
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean),
    [initialData],
  );
  const [formData, setFormData] = useState<
    Omit<Teacher, "id"> & { id?: string; _imageModified?: boolean }
  >({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "Teacher",
    teacherId: "",
    subject: initialAssignedSubjects.join(", "),
    assignedSubjects: initialAssignedSubjects,
    level: "Primary",
    assignedClasses: [],
    image: "",
    _imageModified: false,
    ...(initialData && initialData),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isFormTeacher, setIsFormTeacher] = useState(true);
  const [isSubjectTeacher, setIsSubjectTeacher] = useState(
    initialAssignedSubjects.length > 0,
  );
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");

  useEffect(() => {
    if (initialData) {
      setIsSubjectTeacher(initialAssignedSubjects.length > 0);
      setIsFormTeacher(true);
    }
  }, [initialData, initialAssignedSubjects]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [subjectsData, studentsData] = await Promise.all([
          fetchSubjects(),
          fetchStudents(),
        ]);

        setAvailableSubjects(subjectsData);

        const studentClasses = studentsData
          .map((student: Student) => student.class)
          .filter(Boolean);
        const classOptions = [
          ...new Set([...STANDARD_CLASSES, ...studentClasses]),
        ];
        setAvailableClasses(classOptions);
      } catch (error) {
        console.error("Failed to load teacher form options", error);
      }
    };

    loadOptions();
  }, []);

  const levelSubjects = useMemo(() => {
    const filtered = availableSubjects.filter((subject) => subject.level === formData.level);
    if (formData.level !== 'Secondary') {
      // Non-secondary: deduplicate by name (no sub-levels)
      const unique = new Map();
      filtered.forEach(s => { if (!unique.has(s.name)) unique.set(s.name, s); });
      return Array.from(unique.values());
    }
    // Secondary: keep JSS (no subjectCategory) and SSS (has subjectCategory) as separate items
    // Deduplicate within each tier
    const jssMap = new Map<string, Subject>();
    const sssMap = new Map<string, Subject>();
    filtered.forEach(s => {
      const isSSS = s.code?.toUpperCase().startsWith('SSS') || !!s.subjectCategory;
      const isJSS = s.code?.toUpperCase().startsWith('JSS') || (s.level === 'Secondary' && !s.subjectCategory);
      
      if (isSSS) {
        if (!sssMap.has(s.name)) sssMap.set(s.name, { ...s, name: `${s.name} (SSS)` });
      } else if (isJSS) {
        if (!jssMap.has(s.name)) jssMap.set(s.name, { ...s, name: `${s.name} (JSS)` });
      } else {
        // Fallback for older data or other secondary tiers
        if (!sssMap.has(s.name)) sssMap.set(s.name, { ...s, name: s.name });
      }
    });
    return [...Array.from(jssMap.values()), ...Array.from(sssMap.values())];
  }, [availableSubjects, formData.level]);

  const levelClasses = useMemo(() => {
    const preferredClasses = LEVEL_CLASS_MAP[formData.level] || [];
    const extraClasses = availableClasses.filter(
      (className) => !preferredClasses.includes(className),
    );
    return [...preferredClasses, ...extraClasses];
  }, [availableClasses, formData.level]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.includes("@"))
      newErrors.email = "Valid email is required";
    // Username/password are auto-generated for new teachers; validate only when editing.
    if (isEditing && !formData.username.trim())
      newErrors.username = "Username is required";

    if (!isFormTeacher && !isSubjectTeacher) {
      newErrors.teacherType = "Select at least one teaching assignment type";
    }

    // Level-based validation
    if (formData.level === "Secondary") {
      if (isSubjectTeacher && (formData.assignedSubjects || []).length === 0) {
        newErrors.assignedSubjects =
          "At least one subject is required for Secondary Subject Teachers";
      }
      if (isFormTeacher && formData.assignedClasses.length === 0) {
        newErrors.assignedClasses =
          "At least one class is required for Form Teachers";
      }
    } else {
      // Primary, Nursery, Pre-Nursery
      if (formData.assignedClasses.length === 0) {
        newErrors.assignedClasses = `At least one class is required for ${formData.level} teachers`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleSubject = (subjectName: string) => {
    setFormData((prev) => {
      const currentSubjects = prev.assignedSubjects || [];
      const isAdding = !currentSubjects.includes(subjectName);
      
      const updatedSubjects = isAdding
        ? [...currentSubjects, subjectName]
        : currentSubjects.filter((s) => s !== subjectName);

      let updatedClasses = [...prev.assignedClasses];
      
      // Auto-sync classes for JSS/SSS subject roles
      if (isAdding) {
        if (subjectName.endsWith('(JSS)')) {
          const jssClasses = ['JSS 1', 'JSS 2', 'JSS 3'];
          jssClasses.forEach(cls => {
            if (!updatedClasses.includes(cls)) updatedClasses.push(cls);
          });
        } else if (subjectName.endsWith('(SSS)')) {
          const sssClasses = ['SSS 1', 'SSS 2', 'SSS 3'];
          sssClasses.forEach(cls => {
            if (!updatedClasses.includes(cls)) updatedClasses.push(cls);
          });
        }
      }

      return {
        ...prev,
        assignedSubjects: updatedSubjects,
        subject: updatedSubjects.join(", "),
        assignedClasses: updatedClasses,
      };
    });
  };

  const addClass = () => {
    if (selectedClass && !formData.assignedClasses.includes(selectedClass)) {
      setFormData((prev) => ({
        ...prev,
        assignedClasses: [...prev.assignedClasses, selectedClass],
      }));
      setSelectedClass("");
    }
  };

  const removeClass = (className: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedClasses: prev.assignedClasses.filter((c) => c !== className),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Prepare data for submission
      const dataToSubmit: any = {
        ...formData,
        assignedSubjects: isSubjectTeacher
          ? formData.assignedSubjects || []
          : [],
        subject: isSubjectTeacher
          ? (formData.assignedSubjects || []).join(", ")
          : "",
      };

      // If editing and image wasn't modified, don't send the old image to reduce payload
      if (isEditing && !dataToSubmit._imageModified && dataToSubmit.image) {
        // Keep existing image by sending it as-is, or remove to keep database value
        // Only send image if it's a new base64 (starts with 'data:')
        if (!dataToSubmit.image.startsWith('data:')) {
          delete dataToSubmit.image;
        }
      }

      // Remove the _imageModified flag before sending
      delete dataToSubmit._imageModified;

      onSubmit(dataToSubmit as Teacher | Omit<Teacher, "id">);
    } else {
      // Show alert if validation fails
      const errorMessages = Object.values(errors).join("\n");
      if (errorMessages) {
        window.alert("Please fix the following errors:\n" + errorMessages);
      }
    }
  };

  return (
    <motion.div 
      className="relative overflow-hidden bg-nebula-slate-950/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-nebula-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-nebula-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-nebula-pink-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-12">
          <div>
            <motion.h2 
              className="text-4xl font-black uppercase tracking-tighter leading-none text-white mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Squad <br /> <span className="text-nebula-purple-400">Assignment</span>
            </motion.h2>
            <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em]">
              Faculty Intelligence Mapping
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 hover:border-white/10 text-nebula-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Account Information */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-nebula-purple-400 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-nebula-purple-500" />
              I. Identity Protocol
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.name ? "border-red-500/50" : ""}`}
                  placeholder="e.g. Dr. Emmanuel"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Digital Identity (Email)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.email ? "border-red-500/50" : ""}`}
                  placeholder="name@institution.edu"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Access Key (User)
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={isEditing ? "" : "Auto-Generated"}
                  disabled={!isEditing}
                  className={`input-nebula w-full ${!isEditing ? "bg-white/5 opacity-50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Secure Cipher (Pass)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditing ? "Keep Existing" : "Auto-Generated"}
                  disabled={!isEditing}
                  className={`input-nebula w-full ${!isEditing ? "bg-white/5 opacity-50" : ""}`}
                />
              </div>
            </div>
          </section>

          {/* Professional Information */}
          <section className="space-y-8 pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-black text-nebula-purple-400 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-nebula-pink-500" />
              II. Professional Matrix
            </h3>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                Teaching Assignment Protocols
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Form Teacher Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFormTeacher((prev) => !prev)}
                  className={`flex flex-col items-start p-6 rounded-[2rem] border transition-all text-left ${
                    isFormTeacher
                      ? "bg-nebula-purple-500/10 border-nebula-purple-500/40 shadow-inner"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-4">
                    <p className="text-xs font-black text-white uppercase tracking-tighter">Form Governance</p>
                    <div className={`w-3 h-3 rounded-full ${isFormTeacher ? 'bg-nebula-purple-500 nebula-pulse' : 'bg-white/10'}`} />
                  </div>
                  <p className="text-[10px] font-black text-nebula-slate-500 uppercase leading-relaxed">
                    Institutional oversight and student welfare synchronization for assigned cohorts.
                  </p>
                </button>

                {/* Subject Teacher Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSubjectTeacher((prev) => !prev)}
                  className={`flex flex-col items-start p-6 rounded-[2rem] border transition-all text-left ${
                    isSubjectTeacher
                      ? "bg-nebula-teal-500/10 border-nebula-teal-500/40 shadow-inner"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-4">
                    <p className="text-xs font-black text-white uppercase tracking-tighter">Subject Specialist</p>
                    <div className={`w-3 h-3 rounded-full ${isSubjectTeacher ? 'bg-nebula-teal-500 nebula-pulse' : 'bg-white/10'}`} />
                  </div>
                  <p className="text-[10px] font-black text-nebula-slate-500 uppercase leading-relaxed">
                    Precision instruction and academic matrix evaluation for specialized subjects.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                    Institutional Level
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="input-nebula w-full"
                  >
                    <option value="Pre-Nursery">Pre-Nursery</option>
                    <option value="Nursery">Nursery</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary Matrix</option>
                  </select>
                </div>

                {(formData.level !== "Secondary" || isFormTeacher) && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                      Cohort Allocation (Classes)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="input-nebula flex-1"
                      >
                        <option value="">Select Cohort...</option>
                        {levelClasses.map((className) => (
                          <option key={className} value={className}>{className}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addClass}
                        className="p-4 bg-white text-black rounded-2xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.assignedClasses.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-nebula-purple-500/10 border border-nebula-purple-500/30 text-nebula-purple-300 rounded-full text-[10px] font-black uppercase tracking-widest"
                        >
                          {c}
                          <button onClick={() => removeClass(c)} className="hover:text-white">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {formData.level === "Secondary" ? (
                  isSubjectTeacher ? (
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                        Subject Specialization Matrix
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search Protocols..."
                          value={subjectSearchTerm}
                          onChange={(e) => setSubjectSearchTerm(e.target.value)}
                          className="input-nebula w-full pl-10 text-xs"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nebula-slate-500" />
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {levelSubjects
                          .filter(s => s.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()))
                          .map(subject => (
                            <label
                              key={subject.id}
                              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                (formData.assignedSubjects || []).includes(subject.name)
                                  ? 'bg-nebula-teal-500/10 border-nebula-teal-500/40 shadow-inner'
                                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={(formData.assignedSubjects || []).includes(subject.name)}
                                onChange={() => toggleSubject(subject.name)}
                                className="w-4 h-4 bg-nebula-slate-900 border-white/10 text-nebula-teal-600 rounded focus:ring-nebula-teal-500"
                              />
                              <p className="text-xs font-black text-white">{subject.name}</p>
                            </label>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-[2rem] bg-nebula-slate-900/40 border border-white/5 flex flex-col items-center text-center justify-center h-full">
                      <AlertCircle className="text-nebula-slate-500 mb-4" size={32} />
                      <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest leading-relaxed">
                        Governance only. Subject instruction protocols disabled.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-8 rounded-[2rem] bg-nebula-teal-500/5 border border-nebula-teal-500/20 h-full">
                    <p className="text-[10px] font-black text-nebula-teal-400 uppercase tracking-[0.3em] mb-4">Global Matrix Sync</p>
                    <p className="text-[10px] font-black text-nebula-slate-500 uppercase leading-relaxed">
                      As a <span className="text-white">{formData.level}</span> specialist, instruction protocols for all level-relevant subjects are auto-synchronized.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 text-[10px] font-black text-nebula-slate-400 uppercase tracking-[0.3em] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-10 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-lg hover:shadow-white/10 hover:scale-105 active:scale-95 transition-all"
            >
              {isEditing ? 'Sync Profile' : 'Initialize Squad Member'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
