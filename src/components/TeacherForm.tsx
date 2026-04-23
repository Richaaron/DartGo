import { useState, useRef, useEffect, useMemo } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Upload, User as UserIcon } from 'lucide-react'
import { Teacher, Subject, Student } from '../types'
import { fetchSubjects, fetchStudents } from '../services/api'

const STANDARD_CLASSES = [
  'Pre-Nursery',
  'Nursery 1',
  'Nursery 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SSS 1',
  'SSS 2',
  'SSS 3',
]

const LEVEL_CLASS_MAP: Record<Teacher['level'], string[]> = {
  'Pre-Nursery': ['Pre-Nursery'],
  'Nursery': ['Nursery 1', 'Nursery 2'],
  'Primary': ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5'],
  'Secondary': ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'],
}

interface TeacherFormProps {
  onSubmit: (teacher: Teacher | Omit<Teacher, 'id'>) => void
  initialData?: Teacher
  onCancel: () => void
  isEditing?: boolean
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
        : (initialData?.subject || '')
            .split(',')
            .map((subject) => subject.trim())
            .filter(Boolean),
    [initialData]
  )
  const fileInputRef = useRef<any>(null)
  const [formData, setFormData] = useState<Omit<Teacher, 'id'> & { id?: string }>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Teacher',
    teacherId: '',
    subject: initialAssignedSubjects.join(', '),
    assignedSubjects: initialAssignedSubjects,
    level: 'Primary',
    assignedClasses: [],
    image: '',
    ...(initialData && initialData),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [isFormTeacher, setIsFormTeacher] = useState(true)
  const [isSubjectTeacher, setIsSubjectTeacher] = useState(initialAssignedSubjects.length > 0)

  useEffect(() => {
    if (initialData) {
      setIsSubjectTeacher(initialAssignedSubjects.length > 0)
      setIsFormTeacher(true)
    }
  }, [initialData, initialAssignedSubjects])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [subjectsData, studentsData] = await Promise.all([
          fetchSubjects(),
          fetchStudents(),
        ])

        setAvailableSubjects(subjectsData)

        const studentClasses = studentsData.map((student: Student) => student.class).filter(Boolean)
        const classOptions = [...new Set([...STANDARD_CLASSES, ...studentClasses])]
        setAvailableClasses(classOptions)
      } catch (error) {
        console.error('Failed to load teacher form options', error)
      }
    }

    loadOptions()
  }, [])

  const levelSubjects = useMemo(
    () => availableSubjects.filter((subject) => subject.level === formData.level),
    [availableSubjects, formData.level]
  )

  const levelClasses = useMemo(() => {
    const preferredClasses = LEVEL_CLASS_MAP[formData.level] || []
    const extraClasses = availableClasses.filter((className) => !preferredClasses.includes(className))
    return [...preferredClasses, ...extraClasses]
  }, [availableClasses, formData.level])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required'
    // Username/password are auto-generated for new teachers; validate only when editing.
    if (isEditing && !formData.username.trim()) newErrors.username = 'Username is required'
    if (!isFormTeacher && !isSubjectTeacher) newErrors.teacherType = 'Select at least one teaching assignment type'
    if (formData.assignedClasses.length === 0) newErrors.assignedClasses = 'At least one class is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = (e: ChangeEvent<any>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new window.FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChange = (
    e: ChangeEvent<any>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const addSubject = () => {
    if (selectedSubject && !formData.assignedSubjects?.includes(selectedSubject)) {
      setFormData(prev => ({
        ...prev,
        assignedSubjects: [...(prev.assignedSubjects || []), selectedSubject],
        subject: [...(prev.assignedSubjects || []), selectedSubject].join(', ')
      }))
      setSelectedSubject('')
    }
  }

  const removeSubject = (subjectName: string) => {
    setFormData(prev => {
      const assignedSubjects = (prev.assignedSubjects || []).filter(subject => subject !== subjectName)
      return {
        ...prev,
        assignedSubjects,
        subject: assignedSubjects.join(', ')
      }
    })
  }

  const addClass = () => {
    if (selectedClass && !formData.assignedClasses.includes(selectedClass)) {
      setFormData(prev => ({
        ...prev,
        assignedClasses: [...prev.assignedClasses, selectedClass]
      }))
      setSelectedClass('')
    }
  }

  const removeClass = (className: string) => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.filter(c => c !== className)
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        ...formData,
        assignedSubjects: isSubjectTeacher ? (formData.assignedSubjects || []) : [],
        subject: isSubjectTeacher ? (formData.assignedSubjects || []).join(', ') : '',
        teacherType: isFormTeacher && isSubjectTeacher
          ? 'Form + Subject Teacher'
          : isSubjectTeacher
            ? 'Subject Teacher'
            : 'Form Teacher'
      } as any)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-4 group">
            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 group-hover:border-blue-500 transition-colors">
              {formData.image ? (
                <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
              title="Upload Photo"
            >
              <Upload size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500">Upload profile photo</p>
        </div>

        {/* Account Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={isEditing ? "" : "Auto-generated"}
                disabled={!isEditing}
                className={`input-field ${errors.username ? 'border-red-500' : ''} ${!isEditing ? 'bg-gray-50 opacity-60' : ''}`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {isEditing ? '(Leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? "" : "Auto-generated"}
                disabled={!isEditing}
                className={`input-field ${errors.password ? 'border-red-500' : ''} ${!isEditing ? 'bg-gray-50 opacity-60' : ''}`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teaching Assignment Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsFormTeacher((prev) => !prev)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  isFormTeacher
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold">Form Teacher {isFormTeacher ? 'On' : 'Off'}</p>
                <p className="text-xs mt-1 text-inherit opacity-80">Handles class welfare, coordination, and assigned class oversight.</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSubjectTeacher((prev) => {
                    const nextValue = !prev
                    if (!nextValue) {
                      setFormData((current) => ({
                        ...current,
                        assignedSubjects: [],
                        subject: '',
                      }))
                    }
                    return nextValue
                  })
                }}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  isSubjectTeacher
                    ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold">Subject Teacher {isSubjectTeacher ? 'On' : 'Off'}</p>
                <p className="text-xs mt-1 text-inherit opacity-80">Teaches selected subjects for assigned classes.</p>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A teacher can be both a form teacher and a subject teacher at the same time.
            </p>
            {errors.teacherType && (
              <p className="text-red-500 text-sm mt-2">{errors.teacherType}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher ID
              </label>
              <input
                type="text"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                placeholder="Auto-generated"
                className="input-field bg-gray-50"
                disabled
              />
            </div>

            <div>
              {isSubjectTeacher ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Subjects
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select subject...</option>
                      {levelSubjects.map((subject) => (
                        <option key={subject.id} value={subject.name}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addSubject}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.assignedSubjects || []).map((subjectName) => (
                      <span
                        key={subjectName}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium"
                      >
                        {subjectName}
                        <button
                          type="button"
                          onClick={() => removeSubject(subjectName)}
                          className="hover:text-amber-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select one or more subjects this teacher handles.</p>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                  This teacher is marked as a form teacher, so subject assignment is not required.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Pre-Nursery">Pre-Nursery</option>
                <option value="Nursery">Nursery</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Classes *
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select class...</option>
                  {levelClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addClass}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.assignedClasses.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeClass(c)}
                      className="hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              {errors.assignedClasses && (
                <p className="text-red-500 text-sm mt-1">{errors.assignedClasses}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {isEditing ? 'Save Changes' : 'Create Teacher'}
          </button>
        </div>
      </form>
    </div>
  )
}
