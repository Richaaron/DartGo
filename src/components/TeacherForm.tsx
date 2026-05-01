import { useState, useRef, useEffect, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { X, Upload, User as UserIcon } from "lucide-react";
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
  const fileInputRef = useRef<any>(null);
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

  const levelSubjects = useMemo(
    () =>
      availableSubjects.filter((subject) => subject.level === formData.level),
    [availableSubjects, formData.level],
  );

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

  const handleImageChange = (e: ChangeEvent<any>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size - limit to 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert("Image file is too large. Maximum size is 2MB. Please compress the image and try again.");
        return;
      }

      // Create image preview with compression
      const reader = new window.FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // For large images, compress before storing
        const img = new Image();
        img.onload = () => {
          // Create canvas and draw resized image
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Resize if too large
          const maxDimension = 800;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed JPEG
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          setFormData((prev) => ({ 
            ...prev, 
            image: compressedBase64,
            _imageModified: true  // Flag to indicate image was changed
          }));
        };
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    }
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

  const addSubject = () => {
    if (
      selectedSubject &&
      !formData.assignedSubjects?.includes(selectedSubject)
    ) {
      setFormData((prev) => ({
        ...prev,
        assignedSubjects: [...(prev.assignedSubjects || []), selectedSubject],
        subject: [...(prev.assignedSubjects || []), selectedSubject].join(", "),
      }));
      setSelectedSubject("");
    }
  };

  const removeSubject = (subjectName: string) => {
    setFormData((prev) => {
      const assignedSubjects = (prev.assignedSubjects || []).filter(
        (subject) => subject !== subjectName,
      );
      return {
        ...prev,
        assignedSubjects,
        subject: assignedSubjects.join(", "),
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
      className="p-6 bg-gradient-to-br from-royal-gold-50 via-white to-royal-purple-50 dark:bg-gradient-to-br dark:from-royal-black-900 dark:via-royal-purple-900/10 dark:to-royal-black-900"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <motion.h2 
          className="text-3xl font-black bg-gradient-to-r from-royal-purple-600 to-royal-gold-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {isEditing ? "Edit Squad Member" : "Add New Squad Member"}
        </motion.h2>
        <motion.button
          onClick={onCancel}
          className="p-2 hover:bg-royal-purple-100 dark:hover:bg-royal-purple-900/30 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X size={24} className="text-royal-purple-600 dark:text-royal-gold-400" />
        </motion.button>
      </div>

      <motion.form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Section */}
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="relative w-32 h-32 mb-4 group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-royal-gold-100 to-royal-purple-100 dark:from-royal-purple-900/50 dark:to-royal-gold-900/30 flex items-center justify-center overflow-hidden border-4 border-royal-gold-300 dark:border-royal-purple-600 group-hover:border-royal-purple-500 transition-colors shadow-lg">
              {formData.image ? (
                <img
                  src={formData.image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-16 h-16 text-royal-purple-300 dark:text-royal-gold-400" />
              )}
            </div>
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-royal-purple-600 to-royal-purple-700 text-white rounded-full hover:from-royal-purple-700 hover:to-royal-purple-800 transition-all shadow-lg"
              title="Upload Photo"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload size={16} />
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </motion.div>
          <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 font-semibold">Upload profile photo</p>
        </motion.div>

        {/* Account Information */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-black text-royal-purple-600 dark:text-royal-gold-400 uppercase tracking-widest">
            Account Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field border-2 ${errors.name ? "border-red-500" : "border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field border-2 ${errors.email ? "border-red-500" : "border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={isEditing ? "" : "Auto-generated"}
                disabled={!isEditing}
                className={`input-field border-2 ${errors.username ? "border-red-500" : "border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"} ${!isEditing ? "bg-royal-black-50 dark:bg-royal-purple-900/20 opacity-70" : ""}`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Password {isEditing ? "(Leave blank to keep current)" : "*"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? "" : "Auto-generated"}
                disabled={!isEditing}
                className={`input-field border-2 ${errors.password ? "border-red-500" : "border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"} ${!isEditing ? "bg-royal-black-50 dark:bg-royal-purple-900/20 opacity-70" : ""}`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.password}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Professional Information */}
        <motion.div 
          className="space-y-4 border-t-2 border-royal-gold-200 dark:border-royal-purple-700/50 pt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-black text-royal-purple-600 dark:text-royal-gold-400 uppercase tracking-widest">
            Professional Information
          </h3>

          <div>
            <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-3">
              Teaching Assignment Type
            </label>
            <div className="space-y-3">
              {/* Form Teacher Toggle */}
              <motion.div
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  isFormTeacher
                    ? "border-royal-purple-400 bg-gradient-to-r from-royal-purple-50 to-royal-gold-50 dark:from-royal-purple-900/30 dark:to-royal-gold-900/20"
                    : "border-royal-gold-200 dark:border-royal-purple-700/50 bg-white dark:bg-royal-black-800"
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div>
                  <p className="font-bold text-royal-purple-900 dark:text-white">Form Teacher</p>
                  <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 mt-0.5 font-medium">
                    Handles class welfare, coordination and assigned class
                    oversight.
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setIsFormTeacher((prev) => !prev)}
                  role="switch"
                  aria-checked={isFormTeacher}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-royal-purple-500 focus:ring-offset-2 ${
                    isFormTeacher ? "bg-gradient-to-r from-royal-purple-600 to-royal-purple-700" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 ${
                      isFormTeacher ? "translate-x-6" : "translate-x-1"
                    }`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </motion.div>

              {/* Subject Teacher Toggle */}
              <motion.div
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSubjectTeacher
                    ? "border-royal-gold-400 bg-gradient-to-r from-royal-gold-50 to-royal-purple-50 dark:from-royal-gold-900/30 dark:to-royal-purple-900/20"
                    : "border-royal-gold-200 dark:border-royal-purple-700/50 bg-white dark:bg-royal-black-800"
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div>
                  <p className="font-bold text-royal-purple-900 dark:text-white">Subject Teacher</p>
                  <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 mt-0.5 font-medium">
                    Teaches selected subjects for assigned classes.
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsSubjectTeacher((prev) => {
                      const nextValue = !prev;
                      if (!nextValue) {
                        setFormData((current) => ({
                          ...current,
                          assignedSubjects: [],
                          subject: "",
                        }));
                      }
                      return nextValue;
                    });
                  }}
                  role="switch"
                  aria-checked={isSubjectTeacher}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-royal-gold-500 focus:ring-offset-2 ${
                    isSubjectTeacher ? "bg-gradient-to-r from-royal-gold-500 to-royal-gold-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 ${
                      isSubjectTeacher ? "translate-x-6" : "translate-x-1"
                    }`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </motion.div>
            </div>
            <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 mt-2 font-medium">
              A teacher can be both a form teacher and a subject teacher at the
              same time.
            </p>
            {errors.teacherType && (
              <p className="text-red-500 text-sm mt-2 font-semibold">{errors.teacherType}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Teacher ID
              </label>
              <input
                type="text"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                placeholder="Auto-generated"
                className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 bg-royal-black-50 dark:bg-royal-purple-900/20"
                disabled
              />
            </div>

            <div>
              {formData.level === "Secondary" ? (
                isSubjectTeacher ? (
                  <>
                    <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                      Assigned Subjects *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
                      >
                        <option value="">Select subject...</option>
                        {levelSubjects.map((subject) => (
                          <option key={subject.id} value={subject.name}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      <motion.button
                        type="button"
                        onClick={addSubject}
                        className="px-4 py-2 bg-gradient-to-r from-royal-purple-600 to-royal-purple-700 text-white rounded-lg hover:from-royal-purple-700 hover:to-royal-purple-800 transition-all font-semibold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Add
                      </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.assignedSubjects || []).map((subjectName) => (
                        <motion.span
                          key={subjectName}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-royal-gold-50 to-royal-purple-50 dark:from-royal-gold-900/40 dark:to-royal-purple-900/40 text-royal-gold-700 dark:text-royal-gold-300 rounded-full text-sm font-bold border border-royal-gold-300 dark:border-royal-gold-700/50"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          {subjectName}
                          <motion.button
                            type="button"
                            onClick={() => removeSubject(subjectName)}
                            className="hover:text-royal-gold-900 dark:hover:text-royal-gold-200"
                            whileHover={{ scale: 1.2 }}
                          >
                            <X size={14} />
                          </motion.button>
                        </motion.span>
                      ))}
                    </div>
                    {errors.assignedSubjects && (
                      <p className="text-red-500 text-sm mt-1 font-semibold">
                        {errors.assignedSubjects}
                      </p>
                    )}
                    <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 mt-2 font-medium">
                      Select one or more subjects this teacher handles.
                    </p>
                  </>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-royal-purple-300 dark:border-royal-purple-600/50 bg-royal-purple-50 dark:bg-royal-purple-900/20 px-4 py-5 text-sm text-royal-purple-700 dark:text-royal-purple-300 font-semibold">
                    This teacher is marked as a form teacher only, so subject
                    assignment is not required.
                  </div>
                )
              ) : (
                <div className="rounded-xl border-2 border-dashed border-royal-gold-300 dark:border-royal-gold-600/50 bg-royal-gold-50 dark:bg-royal-gold-900/20 px-4 py-5 text-sm text-royal-gold-700 dark:text-royal-gold-300">
                  <p className="font-black uppercase tracking-widest text-[10px] mb-1">
                    Automatic Assignment
                  </p>
                  As a <span className="font-bold">{formData.level}</span>{" "}
                  teacher, you will automatically handle all subjects for your
                  assigned classes.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                School Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
              >
                <option value="Pre-Nursery">Pre-Nursery</option>
                <option value="Nursery">Nursery</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Assign Classes {isFormTeacher && "*"}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
                >
                  <option value="">Select class...</option>
                  {levelClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
                <motion.button
                  type="button"
                  onClick={addClass}
                  className="px-4 py-2 bg-gradient-to-r from-royal-purple-600 to-royal-purple-700 text-white rounded-lg hover:from-royal-purple-700 hover:to-royal-purple-800 transition-all font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.assignedClasses.map((c) => (
                  <motion.span
                    key={c}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-royal-purple-50 to-royal-gold-50 dark:from-royal-purple-900/40 dark:to-royal-gold-900/40 text-royal-purple-700 dark:text-royal-purple-300 rounded-full text-sm font-bold border border-royal-purple-300 dark:border-royal-purple-700/50"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {c}
                    <motion.button
                      type="button"
                      onClick={() => removeClass(c)}
                      className="hover:text-royal-purple-900 dark:hover:text-royal-purple-200"
                      whileHover={{ scale: 1.2 }}
                    >
                      <X size={14} />
                    </motion.button>
                  </motion.span>
                ))}
              </div>
              {errors.assignedClasses && (
                <p className="text-red-500 text-sm mt-1 font-semibold">
                  {errors.assignedClasses}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-royal-gold-200 dark:border-royal-purple-700/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border-2 border-royal-gold-300 dark:border-royal-purple-600 text-royal-purple-700 dark:text-royal-gold-300 rounded-lg hover:bg-royal-gold-50 dark:hover:bg-royal-purple-900/30 transition-colors font-bold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            className="px-8 py-2 bg-gradient-to-r from-royal-purple-600 to-royal-purple-700 text-white rounded-lg hover:from-royal-purple-700 hover:to-royal-purple-800 transition-all font-bold shadow-lg shadow-royal-purple-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isEditing ? "Save Changes" : "Create Squad Member"}
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
