import { useState, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Upload, User as UserIcon } from 'lucide-react'
import { Teacher } from '../types'

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
  const fileInputRef = useRef<any>(null)
  const [formData, setFormData] = useState<Omit<Teacher, 'id'> & { id?: string }>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Teacher',
    teacherId: '',
    subject: '',
    level: 'Primary',
    assignedClasses: [],
    image: '',
    ...(initialData && initialData),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newClass, setNewClass] = useState('')

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required'
    // Username/password are auto-generated for new teachers; validate only when editing.
    if (isEditing && !formData.username.trim()) newErrors.username = 'Username is required'
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
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

  const addClass = () => {
    if (newClass.trim() && !formData.assignedClasses.includes(newClass.trim())) {
      setFormData(prev => ({
        ...prev,
        assignedClasses: [...prev.assignedClasses, newClass.trim()]
      }))
      setNewClass('')
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
      onSubmit(formData as any)
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`input-field ${errors.subject ? 'border-red-500' : ''}`}
              />
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
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
                <input
                  type="text"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="e.g., SSS1A"
                  className="input-field"
                />
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
