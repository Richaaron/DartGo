/* global confirm */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Edit, Trash2, CheckCircle, Eye } from 'lucide-react'
import { Curriculum } from '../types'
import { fetchCurriculums, deleteCurriculum } from '../services/api'

interface CurriculumManagerProps {
  level: string
}

export default function CurriculumManager({ level }: CurriculumManagerProps) {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)

  useEffect(() => {
    let isMounted = true

    fetchCurriculums({ level, status: 'ACTIVE' })
      .then((data) => {
        if (isMounted) setCurriculums(data)
      })
      .catch((error) => {
        console.error('Failed to load curriculums', error)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [level])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this curriculum?')) {
      try {
        await deleteCurriculum(id)
        setCurriculums(curriculums.filter(c => c.id !== id))
      } catch (error) {
        console.error('Failed to delete curriculum', error)
      }
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading curriculums...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Curriculum Catalog</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Curriculum</span>
          <span className="sm:hidden">New</span>
        </motion.button>
      </div>

      {curriculums.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No curriculums available for {level}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {curriculums.map((curriculum) => (
            <motion.div
              key={curriculum.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{curriculum.name}</h3>
                  <p className="text-sm text-gray-600">v{curriculum.version}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  curriculum.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {curriculum.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{curriculum.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <p className="font-semibold">{curriculum.yearsOfStudy} Years</p>
                </div>
                <div>
                  <span className="text-gray-600">Subjects:</span>
                  <p className="font-semibold">{curriculum.subjects.length}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedCurriculum(curriculum)}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200 transition text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">View</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex-1 flex items-center justify-center gap-1 bg-green-100 text-green-600 px-3 py-2 rounded hover:bg-green-200 transition text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Scheme</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition"
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleDelete(curriculum.id)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedCurriculum && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCurriculum(null)}
        >
          <motion.div
            className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4">{selectedCurriculum.name}</h3>
            <p className="text-gray-600 mb-4">{selectedCurriculum.description}</p>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Subjects ({selectedCurriculum.subjects.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                {selectedCurriculum.subjects.map((subject: any, index: number) => {
                  const normalizedSubject = typeof subject === 'string'
                    ? {
                        id: `${selectedCurriculum.id}-subject-${index}`,
                        name: subject,
                        code: subject.slice(0, 3).toUpperCase(),
                        description: `${subject} curriculum content overview`,
                        topics: [
                          {
                            weekNumber: 1,
                            topicName: `Introduction to ${subject}`,
                            duration: 1,
                            objectives: [`Understand the basic ideas in ${subject}`],
                            resources: ['Teacher guide', 'Workbook'],
                            assessmentMethod: 'Class discussion',
                          },
                          {
                            weekNumber: 2,
                            topicName: `${subject} practical activities`,
                            duration: 1,
                            objectives: [`Apply foundational knowledge in ${subject}`],
                            resources: ['Class notes', 'Practice exercise'],
                            assessmentMethod: 'Worksheet',
                          },
                        ],
                      }
                    : {
                        ...subject,
                        topics: subject.topics && subject.topics.length > 0
                          ? subject.topics
                          : [
                              {
                                weekNumber: 1,
                                topicName: `Introduction to ${subject.name || subject.code || 'this subject'}`,
                                duration: 1,
                                objectives: [`Understand the foundational concepts in ${subject.name || 'this subject'}`],
                                resources: ['Teacher guide', 'Class notes'],
                                assessmentMethod: 'Class exercise',
                              },
                              {
                                weekNumber: 2,
                                topicName: `${subject.name || subject.code || 'Subject'} activities and examples`,
                                duration: 1,
                                objectives: [`Practice and explain key points in ${subject.name || 'this subject'}`],
                                resources: ['Workbook', 'Board work'],
                                assessmentMethod: 'Oral assessment',
                              },
                            ],
                      }

                  return (
                    <motion.div
                      key={normalizedSubject._id || normalizedSubject.id || normalizedSubject.name}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSubject(normalizedSubject)}
                      className="bg-gray-100 p-3 rounded text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition"
                    >
                      <p className="font-semibold">
                        {normalizedSubject.name || normalizedSubject.code || normalizedSubject._id}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {normalizedSubject.topics?.length || 0} topic contents
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedCurriculum(null)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {selectedSubject && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSubject(null)}
        >
          <motion.div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              {typeof selectedSubject === 'string' ? selectedSubject : selectedSubject.name}
            </h3>
            
            {typeof selectedSubject !== 'string' && (
              <div className="space-y-3">
                {selectedSubject.code && (
                  <div>
                    <p className="text-sm text-gray-600">Subject Code</p>
                    <p className="font-semibold text-gray-900">{selectedSubject.code}</p>
                  </div>
                )}
                {selectedSubject.level && (
                  <div>
                    <p className="text-sm text-gray-600">Level</p>
                    <p className="font-semibold text-gray-900">{selectedSubject.level}</p>
                  </div>
                )}
                {selectedSubject.creditUnits && (
                  <div>
                    <p className="text-sm text-gray-600">Credit Units</p>
                    <p className="font-semibold text-gray-900">{selectedSubject.creditUnits}</p>
                  </div>
                )}
                {selectedSubject.description && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-900">{selectedSubject.description}</p>
                  </div>
                )}
                
                {selectedSubject.topics && selectedSubject.topics.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Weekly Topics</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedSubject.topics.map((topic: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded">
                          <h5 className="font-semibold text-gray-900">Week {topic.weekNumber}: {topic.topicName}</h5>
                          <p className="text-xs text-gray-600 mt-1">Duration: {topic.duration} hours</p>
                          
                          {topic.objectives && topic.objectives.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700">Objectives:</p>
                              <ul className="text-xs text-gray-600 list-disc list-inside">
                                {topic.objectives.map((obj: string, i: number) => (
                                  <li key={i}>{obj}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {topic.resources && topic.resources.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700">Resources:</p>
                              <p className="text-xs text-gray-600">{topic.resources.join(', ')}</p>
                            </div>
                          )}
                          
                          {topic.assessmentMethod && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700">Assessment: <span className="font-normal">{topic.assessmentMethod}</span></p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedSubject(null)}
              className="w-full mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
