import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Upload, User as UserIcon, BookOpen } from 'lucide-react'
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
  const fileInputRef = useRef<any>(null)
  
  const [formData, setFormData] = useState<Omit<Student, 'id'> & { id?: string }>(() => {
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
      ...initialData,
    }
  })

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  useEffect(() => {
    if (!isEditing && defaultClass) {
      setFormData((prev) => ({ ...prev, class: defaultClass }))
    }
  }, [defaultClass, isEditing])

  // Filter subjects based on student level
  const filteredSubjects = availableSubjects.filter(s => s.level === formData.level)

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  // Auto-generate credentials when names change (only for new students)
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
    
    // Email is now optional
    if (formData.parentEmail && (!formData.parentEmail.includes('@') || !formData.parentEmail.includes('.'))) {
      newErrors.parentEmail = 'Valid email is required'
    }
    
    if (!formData.class.trim()) newErrors.class = 'Class is required'
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required'
    if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required'

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData as any, selectedSubjects)
    }
  }

  return (
    <div className="p-6 bg-gradient-to-b from-white dark:from-slate-800 to-slate-50 dark:to-slate-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-gold-600 bg-clip-text text-transparent">
            {isEditing ? '✏️ Edit Student' : '➕ Add New Student'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 font-medium">
            {isEditing ? 'Update student information' : 'Register a new student in the system'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all hover:scale-110"
        >
          <X size={24} className="text-red-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-8 p-6 bg-gradient-to-br from-school-yellow/20 dark:from-school-blue/20 to-school-pink/10 dark:to-school-green/10 rounded-3xl border-4 border-dashed border-school-blue dark:border-school-yellow shadow-lg">
          <div className="relative w-36 h-36 mb-4 group">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-school-yellow/30 dark:from-school-blue/30 to-school-orange/20 dark:to-school-green/20 flex items-center justify-center overflow-hidden border-4 border-school-yellow dark:border-school-yellow group-hover:border-school-red transition-all shadow-lg animate-bounce-slow">
              {formData.image ? (
                <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-20 h-20 text-school-red dark:text-school-yellow animate-pulse-bright" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-3 bg-gradient-to-br from-school-red to-school-pink text-white rounded-full hover:scale-125 transition-all shadow-lg hover:shadow-school-red/50 animate-bounce-slow hover:animate-none"
              title="Upload Photo"
            >
              <Upload size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <p className="text-xs font-black text-school-blue dark:text-school-yellow uppercase tracking-widest">📸 Click to upload photo</p>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-school-red pl-3 animate-cartoon-bounce">👤 Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`input-field ${errors.firstName ? 'border-school-red' : ''}`}
              />
              {errors.firstName && (
                <p className="text-school-red text-sm mt-1 font-black animate-shake">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`input-field ${errors.lastName ? 'border-school-red' : ''}`}
              />
              {errors.lastName && (
                <p className="text-school-red text-sm mt-1 font-black animate-shake">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`input-field ${errors.dateOfBirth ? 'border-school-red' : ''}`}
              />
              {errors.dateOfBirth && (
                <p className="text-school-red text-sm mt-1 font-black animate-shake">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Male">👦 Male</option>
                <option value="Female">👧 Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subject Selection (Only for New Students) */}
        {!isEditing && filteredSubjects.length > 0 && (
          <div className="space-y-4 pt-4 border-t-4 border-dashed border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-purple-500 pl-3 flex items-center gap-2">
              <BookOpen className="text-purple-500" />
              Assign Subjects (Optional)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Assign subjects to the student now for immediate result recording.
            </p>
            
            {(() => {
              const isSSSStudent = ['SSS 1', 'SSS 2', 'SSS 3'].includes(formData.class)
              const categoryOrder = ['Science', 'Art', 'Commercial', 'General']
              const subjectsByCategory = filteredSubjects.reduce((acc, subject) => {
                const category = isSSSStudent ? (subject.subjectCategory || 'General') : 'General'
                if (!acc[category]) {
                  acc[category] = []
                }
                acc[category].push(subject)
                return acc
              }, {} as Record<string, Subject[]>)

              const sortedCategories = Object.keys(subjectsByCategory).sort(
                (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
              )

              return sortedCategories.map(category => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-black text-school-blue dark:text-school-yellow uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-school-red animate-pulse"></span>
                    {category} {isSSSStudent ? 'Stream' : 'Subjects'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subjectsByCategory[category].map(subject => (
                      <label
                        key={subject.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedSubjects.includes(subject.id)
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                          className="w-5 h-5 text-purple-600 rounded-lg focus:ring-purple-500 border-slate-300"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 dark:text-white truncate">{subject.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subject.code}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Email (Optional)
            </label>
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              placeholder="parent@example.com (Optional)"
              className={`input-field ${errors.parentEmail ? 'border-red-500' : ''}`}
            />
            {errors.parentEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.parentEmail}</p>
            )}
          </div>
        </div>

        {/* School Information */}
        <div className="space-y-4 border-t-4 border-school-yellow pt-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-school-purple pl-3 animate-cartoon-bounce">🏫 School Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                📝 Registration Number
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Auto-generated"
                className="input-field bg-school-yellow/10 dark:bg-school-blue/10"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                📚 Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Pre-Nursery">👶 Pre-Nursery</option>
                <option value="Nursery">🍼 Nursery</option>
                <option value="Primary">✏️ Primary</option>
                <option value="Secondary">📖 Secondary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                🎓 Class *
              </label>
              {allowedClasses.length > 0 ? (
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className={`input-field ${errors.class ? 'border-school-red' : ''}`}
                  disabled={lockClass}
                >
                  <option value="">Select class</option>
                  {allowedClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  placeholder="e.g., Primary 1"
                  className={`input-field ${errors.class ? 'border-school-red' : ''}`}
                />
              )}
              {errors.class && (
                <p className="text-school-red text-sm mt-1 font-black animate-shake">{errors.class}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                📅 Enrollment Date
              </label>
              <input
                type="date"
                name="enrollmentDate"
                value={formData.enrollmentDate}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                ✨ Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Active">✅ Active</option>
                <option value="Inactive">⏸️ Inactive</option>
                <option value="Suspended">🚫 Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="space-y-4 border-t-4 border-school-yellow pt-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-school-green pl-3 animate-cartoon-bounce">👨‍👩‍👧 Parent/Guardian Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                Parent/Guardian Name *
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className={`input-field ${errors.parentName ? 'border-school-red' : ''}`}
              />
              {errors.parentName && (
                <p className="text-school-red text-sm mt-1 font-black animate-shake">{errors.parentName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-school-blue dark:text-school-yellow mb-1">
                Parent/Guardian Phone *
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className={`input-field ${errors.parentPhone ? 'border-school-red' : ''}`}
              />
              {errors.parentPhone && (
                <p className="text-school-red text-sm mt-1 font-black animate-shake">{errors.parentPhone}</p>
              )}
            </div>
          </div>

          {formData.parentUsername && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gradient-to-br from-school-yellow/20 to-school-orange/10 p-4 rounded-2xl border-2 border-dashed border-school-yellow">
              <div>
                <label className="block text-xs font-black text-school-red uppercase tracking-wider mb-1">
                  📱 Parent Portal Username
                </label>
                <div className="font-mono text-sm bg-white dark:bg-slate-800 p-2 rounded-lg border-2 border-school-blue">
                  {formData.parentUsername}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-school-red uppercase tracking-wider mb-1">
                  🔐 Parent Portal Password
                </label>
                <div className="font-mono text-sm bg-white dark:bg-slate-800 p-2 rounded-lg border-2 border-school-blue">
                  {formData.parentPassword}
                </div>
              </div>
              <p className="text-xs text-school-blue dark:text-school-yellow col-span-2 mt-2 font-black">
                ✨ Share these auto-generated credentials with the parent to allow them to view their child's results.
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t-4 border-school-yellow">
          <button type="submit" className="btn-primary animate-pulse-bright hover:animate-none">
            {isEditing ? '✏️ Update Student' : '➕ Add Student'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary hover:scale-105"
          >
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
