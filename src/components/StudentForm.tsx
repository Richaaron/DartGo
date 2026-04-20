import { useState, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Upload, User as UserIcon } from 'lucide-react'
import { Student } from '../types'

interface StudentFormProps {
  onSubmit: (student: Student | Omit<Student, 'id'>) => void
  initialData?: Student
  onCancel: () => void
  isEditing?: boolean
}

function generateParentCredentials(firstName: string, lastName: string): { parentUsername: string; parentPassword: string } {
  const timestamp = Date.now().toString().slice(-4)
  const parentUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}${timestamp}`
  const parentPassword = `FS${timestamp}${Math.random().toString(36).slice(-2).toUpperCase()}`
  return { parentUsername, parentPassword }
}

export default function StudentForm({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false,
}: StudentFormProps) {
  const fileInputRef = useRef<any>(null)
  
  const [formData, setFormData] = useState<Omit<Student, 'id'> & { id?: string }>(() => {
    if (initialData && initialData.parentUsername && initialData.parentPassword) {
      return { ...initialData }
    }
    if (initialData?.firstName && initialData?.lastName) {
      const creds = generateParentCredentials(initialData.firstName, initialData.lastName)
      return { ...initialData, ...creds }
    }
    return {
      firstName: '',
      lastName: '',
      registrationNumber: '',
      dateOfBirth: '',
      gender: 'Male',
      level: 'Primary',
      class: '',
      parentName: '',
      parentPhone: '',
      email: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      image: '',
      ...initialData,
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.includes('@') || !formData.email.includes('.'))
      newErrors.email = 'Valid email is required'
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Student' : 'Add New Student'}
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

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

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
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleChange}
                placeholder="e.g., Primary 1"
                className={`input-field ${errors.class ? 'border-red-500' : ''}`}
              />
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

          {isEditing && formData.parentUsername && (
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
                Share these credentials with the parent to allow them to view their child's results.
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
