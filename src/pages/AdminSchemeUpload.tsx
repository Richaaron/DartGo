import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, File, Trash2, Search, Filter } from 'lucide-react'
import { Subject, Teacher, Curriculum, SchemeOfWork, SchoolLevel } from '../types'
import { fetchSubjects, fetchTeachers, fetchCurriculums, uploadSchemeOfWorkFile, fetchSchemesOfWork, deleteSchemeOfWork } from '../services/api'

export default function AdminSchemeUpload() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [existingSchemes, setExistingSchemes] = useState<SchemeOfWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    teacherId: '',
    subjectId: '',
    classId: '',
    academicYear: new Date().getFullYear().toString() + '/' + (new Date().getFullYear() + 1).toString(),
    term: 1,
    curriculumId: '',
    notes: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Filter State
  const [filterSubject, setFilterSubject] = useState('All')
  const [filterLevel, setFilterLevel] = useState<SchoolLevel | 'All'>('All')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      const [subjectsData, teachersData, curriculumsData] = await Promise.all([
        fetchSubjects(),
        fetchTeachers(),
        fetchCurriculums({ status: 'ACTIVE' })
      ])
      setSubjects(subjectsData)
      setTeachers(teachersData)
      setCurriculums(curriculumsData)
      
      // Load some initial schemes (maybe the most recent ones)
      // For now, let's just load all if they are not too many
      // In a real app, we'd paginate or filter
      const allSchemes = await Promise.all(
        subjectsData.slice(0, 10).map(s => fetchSchemesOfWork(s.id))
      )
      setExistingSchemes(allSchemes.flat())
    } catch (error) {
      console.error('Failed to load initial data', error)
      setMessage({ type: 'error', text: 'Failed to load required data' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt']
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      
      if (!allowedTypes.includes(ext)) {
        setMessage({ type: 'error', text: 'Invalid file type. Only PDF, DOCS, and TXT allowed.' })
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' })
      return
    }

    if (!formData.teacherId || !formData.subjectId || !formData.classId || !formData.curriculumId) {
      setMessage({ type: 'error', text: 'Please fill all required fields' })
      return
    }

    setIsUploading(true)
    const uploadFormData = new FormData()
    uploadFormData.append('file', selectedFile)
    uploadFormData.append('teacherId', formData.teacherId)
    uploadFormData.append('subjectId', formData.subjectId)
    uploadFormData.append('classId', formData.classId)
    uploadFormData.append('academicYear', formData.academicYear)
    uploadFormData.append('term', formData.term.toString())
    uploadFormData.append('curriculumId', formData.curriculumId)
    uploadFormData.append('notes', formData.notes)

    try {
      const newScheme = await uploadSchemeOfWorkFile(uploadFormData)
      setMessage({ type: 'success', text: 'Scheme of Work uploaded successfully!' })
      setExistingSchemes([newScheme, ...existingSchemes])
      setShowUploadModal(false)
      resetForm()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload file' })
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      teacherId: '',
      subjectId: '',
      classId: '',
      academicYear: new Date().getFullYear().toString() + '/' + (new Date().getFullYear() + 1).toString(),
      term: 1,
      curriculumId: '',
      notes: '',
    })
    setSelectedFile(null)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheme?')) {
      try {
        await deleteSchemeOfWork(id)
        setExistingSchemes(existingSchemes.filter(s => s.id !== id))
        setMessage({ type: 'success', text: 'Scheme deleted successfully' })
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete scheme' })
      }
    }
  }

  const filteredSchemes = existingSchemes.filter(scheme => {
    const matchesSubject = filterSubject === 'All' || scheme.subjectId === filterSubject
    const subject = subjects.find(s => s.id === scheme.subjectId)
    const matchesLevel = filterLevel === 'All' || (subject && subject.level === filterLevel)
    return matchesSubject && matchesLevel
  })

  if (isLoading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Scheme of Work <span className="text-indigo-600 dark:text-indigo-400">Repository</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Upload and manage institutional schemes of work as documents.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg"
        >
          <Upload className="w-5 h-5" />
          Upload Scheme
        </motion.button>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-bold text-sm">{message.text}</p>
          <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto">
            <X className="w-4 h-4 opacity-50" />
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Filter by Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as SchoolLevel | 'All')}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
            >
              <option value="All">All Levels</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Filter by Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
            >
              <option value="All">All Subjects</option>
              {subjects.filter(s => filterLevel === 'All' || s.level === filterLevel).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFilterLevel('All'); setFilterSubject('All'); }}
              className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.length === 0 ? (
          <div className="col-span-full py-20 text-center card-lg">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No file-based schemes found</p>
          </div>
        ) : (
          filteredSchemes.map((scheme) => (
            <motion.div
              key={scheme.id}
              whileHover={{ y: -5 }}
              className="card-lg group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600">
                  <File className="w-6 h-6" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {scheme.fileUrl && (
                    <a
                      href={`http://localhost:3001${scheme.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(scheme.id)}
                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">{scheme.fileName || 'Untitled Scheme'}</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                  {subjects.find(s => s.id === scheme.subjectId)?.name || 'Unknown Subject'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {scheme.classId}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Term {scheme.term}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {scheme.academicYear}
                  </span>
                </div>
                {scheme.notes && (
                  <p className="mt-4 text-xs text-gray-500 italic line-clamp-2">"{scheme.notes}"</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isUploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 border border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Upload New <span className="text-indigo-600">Scheme</span></h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Teacher</label>
                    <select
                      required
                      value={formData.teacherId}
                      onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.email}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                    <select
                      required
                      value={formData.subjectId}
                      onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Class ID</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. JSS 1A"
                      value={formData.classId}
                      onChange={e => setFormData({ ...formData, classId: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Curriculum Catalog</label>
                    <select
                      required
                      value={formData.curriculumId}
                      onChange={e => setFormData({ ...formData, curriculumId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Curriculum</option>
                      {curriculums.map(c => (
                        <option key={c.id} value={c.id}>{c.name} (v{c.version})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Term</label>
                    <select
                      required
                      value={formData.term}
                      onChange={e => setFormData({ ...formData, term: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={1}>1st Term</option>
                      <option value={2}>2nd Term</option>
                      <option value={3}>3rd Term</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Academic Year</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 2024/2025"
                      value={formData.academicYear}
                      onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Administrative Notes</label>
                  <textarea
                    placeholder="Add optional notes for the teacher..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field h-24 resize-none"
                  />
                </div>

                <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] p-8 text-center hover:border-indigo-500 transition-colors group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-sm">{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-sm">Drop file or click to browse</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">PDF, DOCS, or TXT (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Finalize Upload
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
