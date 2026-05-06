import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, Upload, User as UserIcon, BookOpen, Search } from 'lucide-react'
import { motion } from 'framer-motion'
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

  // Filter subjects based on student level
  const filteredSubjects = (Array.isArray(availableSubjects) ? availableSubjects : []).filter(s => s && s.level === formData.level)

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
      // Check file size - limit to 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert("Image file is too large. Maximum size is 2MB. Please compress the image and try again.");
        return;
      }

      // Create image preview with compression
      const reader = new window.FileReader()
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
      const dataToSubmit = { ...formData };
      
      // If editing and image wasn't modified, don't send the old image to reduce payload
      if (isEditing && !dataToSubmit._imageModified && dataToSubmit.image) {
        // Only send image if it's a new base64 (starts with 'data:')
        if (!dataToSubmit.image.startsWith('data:')) {
          delete dataToSubmit.image;
        }
      }
      
      // Remove the _imageModified flag before sending
      delete dataToSubmit._imageModified;
      
      onSubmit(dataToSubmit as any, selectedSubjects)
    }
  }

  return (
    <motion.div 
      className="p-6 bg-gradient-to-br from-royal-gold-50 via-white to-royal-purple-50 dark:bg-gradient-to-br dark:from-royal-black-900 dark:via-royal-purple-900/10 dark:to-royal-black-900"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <motion.h2 
            className="text-3xl font-black bg-gradient-to-r from-royal-purple-600 to-royal-gold-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {isEditing ? 'Edit Student' : 'Add New Student'}
          </motion.h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 font-medium">
            {isEditing ? 'Update student information' : 'Register a new student in the system'}
          </p>
        </div>
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
                <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
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

        {/* Personal Information */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-black text-royal-purple-600 dark:text-royal-gold-400 uppercase tracking-widest">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`input-field border-2 ${errors.firstName ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`input-field border-2 ${errors.lastName ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`input-field border-2 ${errors.dateOfBirth ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Parent Information */}
        <motion.div 
          className="space-y-4 border-t-2 border-royal-gold-200 dark:border-royal-purple-700/50 pt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-black text-royal-purple-600 dark:text-royal-gold-400 uppercase tracking-widest">
            Parent/Guardian Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Parent/Guardian Name *
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className={`input-field border-2 ${errors.parentName ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
              />
              {errors.parentName && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.parentName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Parent/Guardian Phone *
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className={`input-field border-2 ${errors.parentPhone ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
              />
              {errors.parentPhone && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.parentPhone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
              Parent Email (Optional)
            </label>
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              placeholder="parent@example.com (Optional)"
              className={`input-field border-2 ${errors.parentEmail ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
            />
            {errors.parentEmail && (
              <p className="text-red-500 text-sm mt-1 font-semibold">{errors.parentEmail}</p>
            )}
          </div>
        </motion.div>

        {/* School Information */}
        <motion.div 
          className="space-y-4 border-t-2 border-royal-gold-200 dark:border-royal-purple-700/50 pt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-black text-royal-purple-600 dark:text-royal-gold-400 uppercase tracking-widest">
            School Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Auto-generated"
                className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 bg-royal-black-50 dark:bg-royal-purple-900/20"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Level
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
                Class *
              </label>
              {allowedClasses.length > 0 ? (
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className={`input-field border-2 ${errors.class ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
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
                  className={`input-field border-2 ${errors.class ? 'border-red-500' : 'border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500'}`}
                />
              )}
              {errors.class && (
                <p className="text-red-500 text-sm mt-1 font-semibold">{errors.class}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Enrollment Date
              </label>
              <input
                type="date"
                name="enrollmentDate"
                value={formData.enrollmentDate}
                onChange={handleChange}
                className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Subject Selection (Only for New Students) */}
        {!isEditing && filteredSubjects.length > 0 && (
          <motion.div 
            className="space-y-4 pt-6 border-t-2 border-royal-gold-200 dark:border-royal-purple-700/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-sm font-black text-royal-purple-600 dark:text-royal-gold-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={16} className="text-royal-purple-500" />
              Assign Subjects (Optional)
            </h3>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Assign subjects to the student now for immediate result recording.
              </p>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  className="input-field pl-9 border-2 border-royal-gold-200 dark:border-royal-purple-700/50 focus:border-royal-purple-500 w-full"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-royal-purple-400 dark:text-royal-gold-400" />
              </div>
            </div>
            
            {(() => {
              const isSSSStudent = 
                formData.level === 'Secondary' && 
                (formData.class.toUpperCase().startsWith('SSS') || formData.class.toUpperCase().startsWith('SS'))
              
              const categoryOrder = ['Science', 'Art', 'Commercial', 'General']
              
              const searchedSubjects = filteredSubjects.filter(s => 
                s.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                s.code.toLowerCase().includes(subjectSearchTerm.toLowerCase())
              )

              const subjectsByCategory = searchedSubjects.reduce((acc, subject) => {
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
                  <h4 className="text-sm font-bold text-royal-purple-700 dark:text-royal-gold-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-royal-gold-500"></span>
                    {category} {isSSSStudent ? 'Stream' : 'Subjects'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subjectsByCategory[category].map(subject => (
                      <label
                        key={subject.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 shadow-sm ${
                          selectedSubjects.includes(subject.id)
                            ? 'bg-royal-purple-50 dark:bg-royal-purple-900/30 border-royal-purple-500'
                            : 'bg-white dark:bg-royal-black-800 border-royal-gold-200 dark:border-royal-purple-700/50 hover:border-royal-purple-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                          className="mt-1 w-4 h-4 text-royal-purple-600 border-royal-gold-300 rounded focus:ring-royal-purple-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-royal-purple-900 dark:text-white text-sm truncate">{subject.name}</p>
                          <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 font-semibold uppercase tracking-widest">{subject.code}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            })()}
          </motion.div>
        )}

        {formData.parentUsername && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gradient-to-r from-royal-gold-50 to-royal-purple-50 dark:from-royal-gold-900/20 dark:to-royal-purple-900/20 border-2 border-dashed border-royal-gold-400 dark:border-royal-purple-600/50 rounded-lg p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div>
              <label className="block text-xs font-bold text-royal-purple-700 dark:text-royal-gold-300 uppercase tracking-widest mb-1">
                Parent Portal Username
              </label>
              <div className="font-mono text-sm bg-white dark:bg-royal-black-800 p-2 rounded-lg border border-royal-gold-200 dark:border-royal-purple-700/50">
                {formData.parentUsername}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-royal-purple-700 dark:text-royal-gold-300 uppercase tracking-widest mb-1">
                Parent Portal Password
              </label>
              <div className="font-mono text-sm bg-white dark:bg-royal-black-800 p-2 rounded-lg border border-royal-gold-200 dark:border-royal-purple-700/50">
                {formData.parentPassword}
              </div>
            </div>
            <p className="text-xs text-royal-purple-600 dark:text-royal-gold-400 col-span-2 mt-2 font-medium">
              Share these auto-generated credentials with the parent to allow them to view their child's results.
            </p>
          </motion.div>
        )}

        {/* Form Actions */}
        <motion.div 
          className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-royal-gold-200 dark:border-royal-purple-700/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
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
            {isEditing ? 'Save Changes' : 'Create Student'}
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
