import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Upload, User as UserIcon } from 'lucide-react'
import { Student } from '../types'
import { generateParentCredentials } from '../utils/calculations'

interface StudentFormProps {
  onSubmit: (student: Student | Omit<Student, 'id'>) => void
  initialData?: Student
  onCancel: () => void
  isEditing?: boolean
  allowedClasses?: string[]
  defaultClass?: string
  lockClass?: boolean
}

export default function StudentForm({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false,
  allowedClasses = [],
  defaultClass = '',
  lockClass = false,
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

  useEffect(() => {
    if (!isEditing && defaultClass) {
      setFormData((prev) => ({ ...prev, class: defaultClass }))
    }
  }, [defaultClass, isEditing])

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
      onSubmit(formData as any)
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
        <div className="flex flex-col items-center mb-8 p-6 bg-gradient-to-br from-purple-50 dark:from-purple-900/20 to-gold-50 dark:to-gold-900/10 rounded-2xl border border-purple-200/50 dark:border-purple-700/30">
          <div className="relative w-36 h-36 mb-4 group">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 dark:from-slate-700 to-gray-200 dark:to-slate-800 flex items-center justify-center overflow-hidden border-4 border-purple-300 dark:border-purple-600 group-hover:border-gold-400 transition-all shadow-lg">
              {formData.image ? (
                <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-20 h-20 text-purple-400 dark:text-purple-300" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-3 bg-gradient-to-br from-gold-400 to-gold-500 dark:from-gold-500 dark:to-gold-600 text-white rounded-full hover:scale-110 transition-all shadow-lg hover:shadow-gold-500/50"
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
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-widest">Click to upload photo</p>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-purple-600 pl-3">👤 Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`input-field ${errors.dateOfBirth ? 'border-red-500' : ''}`}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

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
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">School Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Auto-generated"
                className="input-field bg-gray-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
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
                Class *
              </label>
              {allowedClasses.length > 0 ? (
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className={`input-field ${errors.class ? 'border-red-500' : ''}`}
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
                  className={`input-field ${errors.class ? 'border-red-500' : ''}`}
                />
              )}
              {errors.class && (
                <p className="text-red-500 text-sm mt-1">{errors.class}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enrollment Date
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent/Guardian Name *
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className={`input-field ${errors.parentName ? 'border-red-500' : ''}`}
              />
              {errors.parentName && (
                <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent/Guardian Phone *
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className={`input-field ${errors.parentPhone ? 'border-red-500' : ''}`}
              />
              {errors.parentPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.parentPhone}</p>
              )}
            </div>
          </div>

          {formData.parentUsername && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div>
                <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  Parent Portal Username
                </label>
                <div className="font-mono text-sm bg-white p-2 rounded border border-blue-200">
                  {formData.parentUsername}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  Parent Portal Password
                </label>
                <div className="font-mono text-sm bg-white p-2 rounded border border-blue-200">
                  {formData.parentPassword}
                </div>
              </div>
              <p className="text-xs text-blue-500 col-span-2 mt-2">
                Share these auto-generated credentials with the parent to allow them to view their child's results.
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Student' : 'Add Student'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
