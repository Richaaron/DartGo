import { useState, useRef, useEffect, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { X, Search, Plus, AlertCircle } from "lucide-react";
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
      const unique = new Map();
      filtered.forEach(s => { if (!unique.has(s.name)) unique.set(s.name, s); });
      return Array.from(unique.values());
    }
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
    if (isEditing && !formData.username.trim())
      newErrors.username = "Username is required";

    if (!isFormTeacher && !isSubjectTeacher) {
      newErrors.teacherType = "Select at least one teaching assignment type";
    }

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
      const dataToSubmit: any = {
        ...formData,
        assignedSubjects: isSubjectTeacher
          ? formData.assignedSubjects || []
          : [],
        subject: isSubjectTeacher
          ? (formData.assignedSubjects || []).join(", ")
          : "",
      };

      if (isEditing && !dataToSubmit._imageModified && dataToSubmit.image) {
        if (!dataToSubmit.image.startsWith('data:')) {
          delete dataToSubmit.image;
        }
      }

      delete dataToSubmit._imageModified;
      onSubmit(dataToSubmit as Teacher | Omit<Teacher, "id">);
    } else {
      const errorMessages = Object.values(errors).join("\n");
      if (errorMessages) {
        window.alert("Please fix the following errors:\n" + errorMessages);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-lg">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update teacher profile and teaching assignments.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Details */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="john@school.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={isEditing ? "" : "Auto-generated"}
                disabled={!isEditing}
                className={`input ${!isEditing ? "bg-slate-50 dark:bg-slate-800 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? "Leave blank to keep current" : "Auto-generated"}
                disabled={!isEditing}
                className={`input ${!isEditing ? "bg-slate-50 dark:bg-slate-800 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
        </section>

        {/* Teaching Assignment */}
        <section className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Teaching Assignment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsFormTeacher((prev) => !prev)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                isFormTeacher
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200"
              }`}
            >
              <div className="flex justify-between items-center w-full mb-2">
                <span className="text-sm font-bold">Form Teacher</span>
                <div className={`w-2 h-2 rounded-full ${isFormTeacher ? 'bg-indigo-600' : 'bg-slate-300'}`} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Responsible for class management and student welfare.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setIsSubjectTeacher((prev) => !prev)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                isSubjectTeacher
                  ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200"
              }`}
            >
              <div className="flex justify-between items-center w-full mb-2">
                <span className="text-sm font-bold">Subject Teacher</span>
                <div className={`w-2 h-2 rounded-full ${isSubjectTeacher ? 'bg-rose-600' : 'bg-slate-300'}`} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Responsible for specific subject instruction and grading.
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  School Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="Pre-Nursery">Pre-Nursery</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </div>

              {(formData.level !== "Secondary" || isFormTeacher) && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Assigned Classes
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="input"
                    >
                      <option value="">Select Class...</option>
                      {levelClasses.map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addClass}
                      className="px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.assignedClasses.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700"
                      >
                        {c}
                        <button onClick={() => removeClass(c)} className="text-slate-400 hover:text-rose-500">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {formData.level === "Secondary" ? (
                isSubjectTeacher ? (
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Assigned Subjects
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search subjects..."
                        value={subjectSearchTerm}
                        onChange={(e) => setSubjectSearchTerm(e.target.value)}
                        className="input pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1">
                      {levelSubjects
                        .filter(s => s.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()))
                        .map(subject => (
                          <label
                            key={subject.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              (formData.assignedSubjects || []).includes(subject.name)
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={(formData.assignedSubjects || []).includes(subject.name)}
                              onChange={() => toggleSubject(subject.name)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-medium">{subject.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center justify-center">
                    <AlertCircle className="text-slate-400 mb-2" size={32} />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Teacher is not assigned to any subjects.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-6 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">Automatic Subject Sync</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    As a {formData.level} teacher, all subjects for this level will be automatically assigned to you.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            {isEditing ? 'Save Changes' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}
