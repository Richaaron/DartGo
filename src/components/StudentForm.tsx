import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, BookOpen, Search } from 'lucide-react'
import { Student, Subject } from '../types'
import { generateParentCredentials } from '../utils/calculations'

interface StudentFormProps {
  onSubmit: (student: Student | Omit<Student, 'id'>, selectedSubjects?: string[]) => void
  initialData?: Student
  onCancel: () => void
  isEditing?: boolean
  allowedClasses?: string[]
  defaultClass?: string
  lockClass?: boolean
  availableSubjects?: Subject[]
}

export default function StudentForm({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false,
  allowedClasses = [],
  defaultClass = '',
  lockClass = false,
  availableSubjects = [],
}: StudentFormProps) {
  const [formData, setFormData] = useState<Omit<Student, 'id'> & { id?: string; _imageModified?: boolean }>(() => {
    return {
      firstName: '',
      lastName: '',
      registrationNumber: '',
      dateOfBirth: '',
      gender: 'Male',
      level: 'Primary',
      class: defaultClass || '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      image: '',
      parentUsername: '',
      parentPassword: '',
      arm: '',
      _imageModified: false,
      ...initialData,
    }
  })

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('')

  useEffect(() => {
    if (!isEditing && defaultClass) {
      setFormData((prev) => ({ ...prev, class: defaultClass }))
    }
  }, [defaultClass, isEditing])

  const filteredSubjects = (Array.isArray(availableSubjects) ? availableSubjects : []).filter(s => {
    if (!s || s.level !== formData.level) return false
    
    if (formData.level === 'Secondary') {
      const isSSSStudent = formData.class.toUpperCase().startsWith('SSS') || formData.class.toUpperCase().startsWith('SS ')
      const isJSSStudent = formData.class.toUpperCase().startsWith('JSS')
      
      if (isSSSStudent) return s.code?.startsWith('SSS-') || (s.level === 'Secondary' && !!s.subjectCategory)
      if (isJSSStudent) return s.code?.startsWith('JSS-') || (s.level === 'Secondary' && !s.subjectCategory)
    }
    
    return true
  })

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  useEffect(() => {
    if (!isEditing && formData.firstName && formData.lastName) {
      const creds = generateParentCredentials(formData.firstName, formData.lastName)
      setFormData(prev => ({
        ...prev,
        parentUsername: creds.username,
        parentPassword: creds.password
      }))
    }
  }, [formData.firstName, formData.lastName, isEditing])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    
    if (formData.parentEmail && (!formData.parentEmail.includes('@') || !formData.parentEmail.includes('.'))) {
      newErrors.parentEmail = 'Valid email is required'
    }
    
    if (!formData.class.trim()) newErrors.class = 'Class is required'
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required'
    if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required'
    
    if (formData.level === 'Secondary' && (formData.class.toUpperCase().startsWith('SSS') || formData.class.toUpperCase().startsWith('SS'))) {
      if (!formData.arm) newErrors.arm = 'Department is required'
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    } else {
      const dob = new Date(formData.dateOfBirth)
      if (dob > new Date()) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const dataToSubmit = { ...formData };
      
      if (isEditing && !dataToSubmit._imageModified && dataToSubmit.image) {
        if (!dataToSubmit.image.startsWith('data:')) {
          delete dataToSubmit.image;
        }
      }
      
      delete dataToSubmit._imageModified;
      onSubmit(dataToSubmit as any, selectedSubjects)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-lg">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Student' : 'Student Registration'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fill in student and guardian details for enrollment.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Personal Info */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="e.g. John"
              />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="e.g. Doe"
              />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`input ${errors.dateOfBirth ? 'border-red-500' : ''}`}
              />
              {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </section>

        {/* Guardian Info */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Guardian Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Guardian Name</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className={`input ${errors.parentName ? 'border-red-500' : ''}`}
                placeholder="Full Name"
              />
              {errors.parentName && <p className="text-xs text-red-500 mt-1">{errors.parentName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className={`input ${errors.parentPhone ? 'border-red-500' : ''}`}
                placeholder="+234..."
              />
              {errors.parentPhone && <p className="text-xs text-red-500 mt-1">{errors.parentPhone}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Address (Optional)</label>
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              className="input"
              placeholder="parent@example.com"
            />
          </div>
        </section>

        {/* Enrollment Info */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Enrollment Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Reg Number</label>
              <input
                type="text"
                value={formData.registrationNumber}
                className="input bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-60"
                placeholder="Auto-generated"
                disabled
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Academic Level</label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Assigned Class</label>
              {allowedClasses.length > 0 ? (
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="input"
                  disabled={lockClass}
                >
                  <option value="">Select...</option>
                  {allowedClasses.map((className) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. Primary 1"
                />
              )}
            </div>
          </div>

          {formData.level === 'Secondary' && (formData.class.toUpperCase().startsWith('SSS') || formData.class.toUpperCase().startsWith('SS')) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Department</label>
              <select
                name="arm"
                value={formData.arm || ''}
                onChange={handleChange}
                className={`input ${errors.arm ? 'border-red-500' : ''}`}
              >
                <option value="">Select Department</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
              </select>
              {errors.arm && <p className="text-xs text-red-500 mt-1">{errors.arm}</p>}
            </div>
          )}
        </section>

        {/* Subject Selection */}
        {!isEditing && filteredSubjects.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Assign Subjects
              </h3>
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Filter subjects..."
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  className="input pl-10 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubjects
                .filter(s => s.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()))
                .map(subject => (
                  <label
                    key={subject.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedSubjects.includes(subject.id)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${selectedSubjects.includes(subject.id) ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{subject.name}</p>
                      <p className="text-[10px] text-slate-500">{subject.code}</p>
                    </div>
                  </label>
                ))}
            </div>
          </section>
        )}

        {/* Credentials Display */}
        {formData.parentUsername && (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                <BookOpen size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Parent Portal Credentials</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Username</p>
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {formData.parentUsername}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Password</p>
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formData.parentPassword}
                </div>
              </div>
            </div>
          </div>
        )}

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
            {isEditing ? 'Save Changes' : 'Register Student'}
          </button>
        </div>
      </form>
    </div>
  )
}
