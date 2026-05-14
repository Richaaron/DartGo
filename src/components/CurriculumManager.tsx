/* global confirm */

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Edit, Trash2, Eye, X } from 'lucide-react'
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
    return (
      <div className="py-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        Loading...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Curriculum Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage academic plans and subjects for {level}.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all">
          <Plus size={20} />
          <span>Add Curriculum</span>
        </button>
      </div>

      {curriculums.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No active curriculums found for {level}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {curriculums.map((curriculum) => (
            <div
              key={curriculum.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all shadow-sm group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{curriculum.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Version {curriculum.version}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-100 dark:border-emerald-900/30 uppercase">
                  {curriculum.status}
                </span>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6">{curriculum.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{curriculum.yearsOfStudy} Years</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subjects</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{curriculum.subjects.length} Units</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCurriculum(curriculum)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition shadow-sm"
                >
                  <Eye size={18} />
                  <span>View Details</span>
                </button>
                <button className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg border border-slate-100 dark:border-slate-800 hover:text-indigo-600 transition">
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(curriculum.id)}
                  className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Curriculum Details Modal */}
      {selectedCurriculum && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{selectedCurriculum.name}</h3>
                <p className="text-xs text-indigo-100 mt-1 uppercase tracking-wider font-bold">Curriculum Details</p>
              </div>
              <button
                onClick={() => setSelectedCurriculum(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedCurriculum.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4">Subjects ({selectedCurriculum.subjects.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCurriculum.subjects.map((subject: any, index: number) => {
                    const name = typeof subject === 'string' ? subject : (subject.name || subject.code || 'Unnamed Subject');
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSubject(typeof subject === 'string' ? { name: subject, topics: [] } : subject)}
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-left hover:border-indigo-300 transition-all"
                      >
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{name}</p>
                        <p className="text-[10px] text-slate-500 uppercase mt-1">Click to view topics</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setSelectedCurriculum(null)}
                className="px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-rose-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Details Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{selectedSubject.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">Subject Details</p>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Code</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedSubject.code || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Weight</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedSubject.creditUnits || 'N/A'} Units</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-2">Description</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedSubject.description || 'No description available.'}</p>
              </div>
              
              {selectedSubject.topics && selectedSubject.topics.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Topics ({selectedSubject.topics.length})</h4>
                  <div className="space-y-3">
                    {selectedSubject.topics.map((topic: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 border-l-4 border-indigo-500 rounded-r-lg">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">Week {topic.weekNumber}: {topic.topicName}</h5>
                        <p className="text-[10px] text-slate-500 mt-1">Duration: {topic.duration} Week(s)</p>
                        
                        {topic.objectives && topic.objectives.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Objectives:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {topic.objectives.map((obj: string, i: number) => (
                                <li key={i} className="text-[10px] text-slate-500">{obj}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedSubject(null)}
                className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-indigo-300 transition-all"
              >
                Back to Curriculum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
