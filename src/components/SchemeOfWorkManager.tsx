import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit, Trash2, CheckCircle, Send } from 'lucide-react'
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Scheme of Work</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => console.log('Create new scheme of work')}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Scheme</span>
          <span className="sm:hidden">New</span>
        </motion.button>
      </div>

      {schemes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium text-gray-700 mb-1">No schemes of work found</p>
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
              className="border-l-4 border-green-600 bg-gradient-to-r from-green-50 to-transparent p-4 rounded-lg hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{scheme.classId}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(scheme.status)}`}>
                      {scheme.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getSubjectName(scheme.subjectId)} • Term {scheme.term} • {scheme.academicYear}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs overflow-hidden">
                      <motion.div
                        className="bg-green-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(scheme)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {getProgressPercentage(scheme)}% Complete
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedScheme(scheme)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200 transition text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </motion.button>

                  {scheme.status === 'DRAFT' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleSubmit(scheme.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-orange-100 text-orange-600 px-3 py-2 rounded hover:bg-orange-200 transition text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Submit</span>
                    </motion.button>
                  )}

                  {scheme.status === 'APPROVED' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-green-100 text-green-600 px-3 py-2 rounded text-sm cursor-not-allowed opacity-75"
                      disabled
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Approved</span>
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleDelete(scheme.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedScheme && (
        <SchemeDetailModal
          scheme={selectedScheme}
          onClose={() => setSelectedScheme(null)}
          onUpdate={loadSchemesAndSubjects}
          getSubjectName={getSubjectName}
        />
      )}
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg max-w-3xl w-full max-h-96 overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-4">{scheme.classId} - {getSubjectName(scheme.subjectId)}</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Topics</h4>
            {topics.map((topic, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded mb-2 flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Week {topic.weekNumber}: {topic.topic}</p>
                  <p className="text-sm text-gray-600">Duration: {topic.duration} weeks</p>
                </div>
                <button
                  onClick={() => handleRemoveTopic(idx)}
                  className="text-red-600 hover:text-red-700"
                  title="Remove topic"
                  aria-label={`Remove topic ${topic.topic}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Add Topic</h4>
            <input
              type="text"
              placeholder="Topic name"
              value={newTopic.topic || ''}
              onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                placeholder="Duration (weeks)"
                value={newTopic.duration || 1}
                onChange={(e) => setNewTopic({ ...newTopic, duration: parseInt(e.target.value) })}
                className="w-24 border rounded px-3 py-2"
              />
              <button
                onClick={handleAddTopic}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Topic
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Save Scheme
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
