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
      className="relative overflow-hidden bg-nebula-slate-950/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-nebula-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-nebula-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-nebula-teal-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-12">
          <div>
            <motion.h2 
              className="text-4xl font-black uppercase tracking-tighter leading-none text-white mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Student <br /> <span className="text-nebula-indigo-400">Registration</span>
            </motion.h2>
            <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-[0.3em]">
              Institutional Enrollment Matrix
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 hover:border-white/10 text-nebula-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Personal Information */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-nebula-indigo-500" />
              I. Personal Intelligence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.firstName ? 'border-red-500/50' : ''}`}
                  placeholder="e.g. Olayinka"
                />
                {errors.firstName && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.lastName ? 'border-red-500/50' : ''}`}
                  placeholder="e.g. Adeyemi"
                />
                {errors.lastName && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.dateOfBirth ? 'border-red-500/50' : ''}`}
                />
                {errors.dateOfBirth && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">{errors.dateOfBirth}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Biological Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-nebula w-full"
                >
                  <option value="Male">Alpha (Male)</option>
                  <option value="Female">Beta (Female)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Parent Information */}
          <section className="space-y-6 pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-nebula-pink-500" />
              II. Guardian Protocols
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.parentName ? 'border-red-500/50' : ''}`}
                  placeholder="Enter full name..."
                />
                {errors.parentName && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">{errors.parentName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Contact Frequency (Phone)
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.parentPhone ? 'border-red-500/50' : ''}`}
                  placeholder="+234..."
                />
                {errors.parentPhone && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">{errors.parentPhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                Digital Contact (Email)
              </label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="input-nebula w-full"
                placeholder="optional@nebula.com"
              />
            </div>
          </section>

          {/* School Information */}
          <section className="space-y-6 pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-nebula-teal-500" />
              III. Institutional Mapping
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Reg Code
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  className="input-nebula w-full bg-white/5 opacity-50 cursor-not-allowed"
                  placeholder="Auto-Matrixed"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Academic Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="input-nebula w-full"
                >
                  <option value="Pre-Nursery">Pre-Nursery</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Target Class
                </label>
                {allowedClasses.length > 0 ? (
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    className="input-nebula w-full"
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
                    className="input-nebula w-full"
                    placeholder="e.g. Primary 1"
                  />
                )}
              </div>
            </div>

            {/* Department selector for SSS students */}
            {formData.level === 'Secondary' && (formData.class.toUpperCase().startsWith('SSS') || formData.class.toUpperCase().startsWith('SS')) && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">
                  Strategic Department
                </label>
                <select
                  name="arm"
                  value={formData.arm || ''}
                  onChange={handleChange}
                  className={`input-nebula w-full ${errors.arm ? 'border-red-500/50' : ''}`}
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
            <section className="space-y-8 pt-6 border-t border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <h3 className="text-[10px] font-black text-nebula-indigo-400 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-nebula-amber-500" />
                  IV. Subject Synchronization
                </h3>
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search Protocols..."
                    value={subjectSearchTerm}
                    onChange={(e) => setSubjectSearchTerm(e.target.value)}
                    className="input-nebula w-full pl-10 text-xs"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nebula-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects
                  .filter(s => s.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()))
                  .map(subject => (
                    <label
                      key={subject.id}
                      className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${
                        selectedSubjects.includes(subject.id)
                          ? 'bg-nebula-indigo-500/10 border-nebula-indigo-500/40 shadow-inner'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() => toggleSubject(subject.id)}
                        className="w-5 h-5 bg-nebula-slate-900 border-white/10 text-nebula-indigo-600 rounded-lg focus:ring-nebula-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{subject.name}</p>
                        <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest">{subject.code}</p>
                      </div>
                    </label>
                  ))}
              </div>
            </section>
          )}

          {/* Credentials Display */}
          {formData.parentUsername && (
            <motion.div 
              className="p-8 rounded-[2rem] bg-nebula-slate-900/40 border border-nebula-indigo-500/20 space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-nebula-indigo-500/10 rounded-2xl text-nebula-indigo-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter">Access Credentials</h4>
                  <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest">Parent Portal Protocols</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">Access Key (User)</p>
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-xs font-mono text-nebula-indigo-300">
                    {formData.parentUsername}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-nebula-slate-500 uppercase tracking-widest px-2">Secure Cipher (Pass)</p>
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-xs font-mono text-nebula-teal-300">
                    {formData.parentPassword}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-6 pt-10">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 text-[10px] font-black text-nebula-slate-400 uppercase tracking-[0.3em] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-10 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-lg hover:shadow-white/10 hover:scale-105 active:scale-95 transition-all"
            >
              {isEditing ? 'Sync Matrix' : 'Initialize Student'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
