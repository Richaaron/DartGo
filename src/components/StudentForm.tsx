import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { X, BookOpen, Search } from 'lucide-react'
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

  // Filter subjects based on student level
  const filteredSubjects = (Array.isArray(availableSubjects) ? availableSubjects : []).filter(s => {
    if (!s || s.level !== formData.level) return false
    
    // For Secondary level, further distinguish between JSS and SSS
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
    
    if (formData.level === 'Secondary' && (formData.class.toUpperCase().startsWith('SSS') || formData.class.toUpperCase().startsWith('SS'))) {
      if (!formData.arm) newErrors.arm = 'Department is required for SSS students'
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
      className="relative overflow-hidden bg-white border border-folusho-cream-200 rounded-[3rem] p-12 shadow-folusho"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-100/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-16">
          <div>
            <motion.h2 
              className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-folusho-slate-900 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Student <br /> <span className="text-folusho-sage-500">Registration</span>
            </motion.h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em]">
              Institutional Enrollment Matrix
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-4 hover:bg-folusho-cream-50 rounded-2xl transition-all border border-folusho-cream-200 text-folusho-slate-400 hover:text-folusho-slate-900"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-16">
          {/* Personal Information */}
          <section className="space-y-8">
            <h3 className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-folusho-sage-500" />
              I. Personal Intelligence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-folusho w-full ${errors.firstName ? 'border-folusho-coral-300' : ''}`}
                  placeholder="e.g. Olayinka"
                />
                {errors.firstName && (
                  <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest px-2">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-folusho w-full ${errors.lastName ? 'border-folusho-coral-300' : ''}`}
                  placeholder="e.g. Adeyemi"
                />
                {errors.lastName && (
                  <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest px-2">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`input-folusho w-full ${errors.dateOfBirth ? 'border-folusho-coral-300' : ''}`}
                />
                {errors.dateOfBirth && (
                  <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest px-2">{errors.dateOfBirth}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Biological Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-folusho w-full"
                >
                  <option value="Male">Alpha (Male)</option>
                  <option value="Female">Beta (Female)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Parent Information */}
          <section className="space-y-8 pt-8 border-t border-folusho-cream-100">
            <h3 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-folusho-coral-500" />
              II. Guardian Protocols
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className={`input-folusho w-full ${errors.parentName ? 'border-folusho-coral-300' : ''}`}
                  placeholder="Enter full name..."
                />
                {errors.parentName && (
                  <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest px-2">{errors.parentName}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Contact Frequency (Phone)
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className={`input-folusho w-full ${errors.parentPhone ? 'border-folusho-coral-300' : ''}`}
                  placeholder="+234..."
                />
                {errors.parentPhone && (
                  <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest px-2">{errors.parentPhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                Digital Contact (Email)
              </label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="input-folusho w-full"
                placeholder="optional@folusho.com"
              />
            </div>
          </section>

          {/* School Information */}
          <section className="space-y-8 pt-8 border-t border-folusho-cream-100">
            <h3 className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.45em] px-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-folusho-sage-500" />
              III. Institutional Mapping
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Reg Code
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  className="input-folusho w-full bg-folusho-cream-50/50 opacity-60 cursor-not-allowed"
                  placeholder="Auto-Matrixed"
                  disabled
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Academic Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="input-folusho w-full"
                >
                  <option value="Pre-Nursery">Pre-Nursery</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Target Class
                </label>
                {allowedClasses.length > 0 ? (
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    className="input-folusho w-full"
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
                    className="input-folusho w-full"
                    placeholder="e.g. Primary 1"
                  />
                )}
              </div>
            </div>

            {/* Department selector for SSS students */}
            {formData.level === 'Secondary' && (formData.class.toUpperCase().startsWith('SSS') || formData.class.toUpperCase().startsWith('SS')) && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">
                  Strategic Department
                </label>
                <select
                  name="arm"
                  value={formData.arm || ''}
                  onChange={handleChange}
                  className={`input-folusho w-full ${errors.arm ? 'border-folusho-coral-300' : ''}`}
                >
                  <option value="">Select Department</option>
                  <option value="Science">Science Matrix</option>
                  <option value="Art">Creative Arts</option>
                  <option value="Commercial">Commercial Logistics</option>
                </select>
              </motion.div>
            )}
          </section>

          {/* Subject Selection */}
          {!isEditing && filteredSubjects.length > 0 && (
            <section className="space-y-8 pt-8 border-t border-folusho-cream-100">
              <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                <h3 className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-folusho-yellow-500" />
                  IV. Subject Synchronization
                </h3>
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Search Protocols..."
                    value={subjectSearchTerm}
                    onChange={(e) => setSubjectSearchTerm(e.target.value)}
                    className="input-folusho !pl-14 text-xs"
                  />
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-folusho-slate-300" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSubjects
                  .filter(s => s.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()))
                  .map(subject => (
                    <label
                      key={subject.id}
                      className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer ${
                        selectedSubjects.includes(subject.id)
                          ? 'bg-folusho-sage-50 border-folusho-sage-200 shadow-sm'
                          : 'bg-white border-folusho-cream-100 hover:border-folusho-sage-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() => toggleSubject(subject.id)}
                        className="w-6 h-6 border-folusho-cream-200 text-folusho-sage-500 rounded-lg focus:ring-folusho-sage-400"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black truncate transition-colors ${selectedSubjects.includes(subject.id) ? 'text-folusho-sage-600' : 'text-folusho-slate-900'}`}>{subject.name}</p>
                        <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">{subject.code}</p>
                      </div>
                    </label>
                  ))}
              </div>
            </section>
          )}

          {/* Credentials Display */}
          {formData.parentUsername && (
            <motion.div 
              className="p-10 rounded-[3rem] bg-folusho-cream-50/50 border border-folusho-cream-200 space-y-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-folusho-sage-50 rounded-2xl text-folusho-sage-500 border border-folusho-sage-100">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-folusho-slate-900 uppercase tracking-tighter">Access Credentials</h4>
                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1">Parent Portal Protocols</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">Access Key (User)</p>
                  <div className="p-5 bg-white rounded-[1.5rem] border border-folusho-cream-200 text-sm font-mono font-bold text-folusho-sage-600 shadow-sm">
                    {formData.parentUsername}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">Secure Cipher (Pass)</p>
                  <div className="p-5 bg-white rounded-[1.5rem] border border-folusho-cream-200 text-sm font-mono font-bold text-folusho-coral-500 shadow-sm">
                    {formData.parentPassword}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-8 pt-12 border-t border-folusho-cream-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-10 py-5 text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.35em] hover:text-folusho-sage-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-14 py-5 bg-folusho-sage-400 text-white rounded-full font-black text-[10px] uppercase tracking-[0.35em] shadow-folusho hover:bg-folusho-sage-500 hover:scale-105 active:scale-95 transition-all"
            >
              {isEditing ? 'Sync Matrix' : 'Initialize Student'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
