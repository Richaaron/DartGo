import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Edit, Trash2, CheckCircle, Send, Download, File } from 'lucide-react'
import { SchemeOfWork, Subject, Topic } from '../types'
import { fetchSchemesOfWork, fetchSubjects, deleteSchemeOfWork, submitSchemeOfWork, updateSchemeOfWork } from '../services/api'

interface SchemeOfWorkManagerProps {
  teacherId: string
}

export default function SchemeOfWorkManager({ teacherId }: SchemeOfWorkManagerProps) {
  const [schemes, setSchemes] = useState<SchemeOfWork[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<SchemeOfWork | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError(null)

    Promise.all([fetchSchemesOfWork(teacherId), fetchSubjects()])
      .then(([schemeData, subjectData]) => {
        if (!isMounted) return
        setSchemes(schemeData)
        setSubjects(subjectData)
      })
      .catch((error: any) => {
        if (!isMounted) return
        console.error('Failed to load schemes of work', error)
        setError(error.message || 'Failed to load schemes. Check connection or permissions.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [teacherId])

  const loadSchemesAndSubjects = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [schemeData, subjectData] = await Promise.all([
        fetchSchemesOfWork(teacherId),
        fetchSubjects(),
      ])
      setSchemes(schemeData)
      setSubjects(subjectData)
    } catch (error: any) {
      console.error('Failed to load schemes of work', error)
      setError(error.message || 'Failed to load schemes. Check connection or permissions.')
    } finally {
      setIsLoading(false)
    }
  }

  const getSubjectName = (subjectId: string) => {
    const matchedSubject = subjects.find((subject) => subject.id === subjectId)
    return matchedSubject?.name || subjectId
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheme of work?')) {
      try {
        await deleteSchemeOfWork(id)
        setSchemes(schemes.filter(s => s.id !== id))
        if (selectedScheme?.id === id) setSelectedScheme(null)
      } catch (error) {
        console.error('Failed to delete scheme', error)
      }
    }
  }

  const handleSubmit = async (id: string) => {
    try {
      const result = await submitSchemeOfWork(id)
      setSchemes(schemes.map(s => s.id === id ? result : s))
      if (selectedScheme?.id === id) setSelectedScheme(result)
    } catch (error) {
      console.error('Failed to submit scheme', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700'
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-700'
      case 'APPROVED':
        return 'bg-green-100 text-green-700'
      case 'ACTIVE':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getProgressPercentage = (scheme: SchemeOfWork) => {
    if (!scheme.topics || scheme.topics.length === 0) return 0
    const completed = scheme.topics.filter(t => t.status === 'COMPLETED').length
    return Math.round((completed / scheme.topics.length) * 100)
  }

  const classOrder = [
    'pre nursery',
    'nursery',
    'primary 1',
    'primary 2',
    'primary 3',
    'primary 4',
    'primary 5',
    'primary 6',
    'jss 1',
    'jss 2',
    'jss 3',
    'sss 1',
    'sss 2',
    'sss 3',
  ]

  const getClassSortValue = (classId: string) => {
    const normalizedClassId = classId
      .trim()
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')

    const classIndex = classOrder.findIndex((className) =>
      normalizedClassId.startsWith(className.toLowerCase())
    )

    return classIndex === -1 ? Number.MAX_SAFE_INTEGER : classIndex
  }

  const sortedSchemes = [...schemes].sort((a, b) => {
    const orderDifference = getClassSortValue(a.classId) - getClassSortValue(b.classId)

    if (orderDifference !== 0) return orderDifference

    return a.classId.localeCompare(b.classId, undefined, { numeric: true, sensitivity: 'base' })
  })

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading schemes of work...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={loadSchemesAndSubjects}
              className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 ml-3"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scheme of Work</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => console.log('Create new scheme of work')}
          className="flex items-center gap-2 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Scheme</span>
          <span className="sm:hidden">New</span>
        </motion.button>
      </div>

      {schemes.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">No schemes of work found</p>
          <p className="text-sm">Create your first scheme or contact admin if you expect existing schemes.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={loadSchemesAndSubjects}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Refresh
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSchemes.map((scheme) => (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-l-4 border-green-600 dark:border-green-500 bg-gradient-to-r from-green-50 dark:from-green-900/10 to-transparent p-4 rounded-lg hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{scheme.classId}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(scheme.status)}`}>
                      {scheme.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getSubjectName(scheme.subjectId)} • Term {scheme.term} • {scheme.academicYear}
                  </p>
                  {scheme.fileUrl && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg w-fit">
                      <File className="w-3 h-3" />
                      <span>Document Attached: {scheme.fileName}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(scheme)}%` }}
                        className="bg-green-600 dark:bg-green-500 h-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {getProgressPercentage(scheme)}% Complete
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedScheme(scheme)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="View details"
                  >
                    <Edit className="w-5 h-5" />
                  </motion.button>
                  {scheme.status === 'DRAFT' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(scheme.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Delete scheme"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedScheme && (
          <SchemeDetailModal 
            scheme={selectedScheme} 
            onClose={() => setSelectedScheme(null)}
            onUpdate={loadSchemesAndSubjects}
            getSubjectName={getSubjectName}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface SchemeDetailModalProps {
  scheme: SchemeOfWork
  onClose: () => void
  onUpdate: () => void
  getSubjectName: (subjectId: string) => string
}

function SchemeDetailModal({ scheme, onClose, onUpdate, getSubjectName }: SchemeDetailModalProps) {
  const [topics, setTopics] = useState<Topic[]>(scheme.topics || [])
  const [newTopic, setNewTopic] = useState<Partial<Topic>>({
    weekNumber: (scheme.topics?.length || 0) + 1,
    topic: '',
    duration: 1,
    objectives: [],
    resources: [],
    assessmentMethod: '',
  })

  const handleAddTopic = () => {
    if (newTopic.topic) {
      setTopics([...topics, { ...newTopic as Topic }])
      setNewTopic({
        weekNumber: topics.length + 2,
        topic: '',
        duration: 1,
        objectives: [],
        resources: [],
        assessmentMethod: '',
      })
    }
  }

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      await updateSchemeOfWork(scheme.id, { topics })
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Failed to update scheme', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 shadow-2xl border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {scheme.classId} - {getSubjectName(scheme.subjectId)}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
          >
            <CheckCircle size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-black text-sm uppercase tracking-widest text-gray-400">Curriculum Topics</h4>
            </div>
            
            <div className="space-y-3">
              {topics.map((topic, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded uppercase tracking-tighter">
                        Week {topic.weekNumber}
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white">{topic.topic}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration: {topic.duration} {topic.duration === 1 ? 'week' : 'weeks'}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveTopic(idx)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-6">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Add New Topic</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Week Number</label>
                <input
                  type="number"
                  value={newTopic.weekNumber}
                  onChange={(e) => setNewTopic({ ...newTopic, weekNumber: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Topic Title</label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Algebra"
                  value={newTopic.topic}
                  onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={handleAddTopic}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
                >
                  Add Topic to Scheme
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-200 dark:shadow-green-900/40"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
