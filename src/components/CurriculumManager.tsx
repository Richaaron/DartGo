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
    <div className="space-y-12 relative">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-folusho-sage-100/50 rounded-2xl text-folusho-sage-600 border border-folusho-sage-200 shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-folusho-slate-900 leading-none">Curriculum <br /> <span className="text-folusho-sage-500">Catalog</span></h2>
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em] mt-1">Institutional Academic Blueprint</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-vibrant !px-12 !py-5"
        >
          <Plus className="w-5 h-5" />
          <span>New Matrix</span>
        </motion.button>
      </div>

      {curriculums.length === 0 ? (
        <div className="folusho-card flex flex-col items-center justify-center py-32 bg-folusho-cream-50/20 border-dashed">
          <div className="p-8 bg-folusho-cream-50 rounded-full w-fit mx-auto mb-8 border border-folusho-cream-100 shadow-inner">
            <BookOpen className="w-12 h-12 text-folusho-slate-300 opacity-50" />
          </div>
          <p className="text-sm font-black text-folusho-slate-400 uppercase tracking-[0.4em]">No Active Matrix for {level}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {curriculums.map((curriculum) => (
            <motion.div
              key={curriculum.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="folusho-card !p-8 group hover:border-folusho-sage-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-folusho-slate-900 uppercase tracking-tighter leading-none group-hover:text-folusho-sage-600 transition-colors">{curriculum.name}</h3>
                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-2">Matrix Protocol v{curriculum.version}</p>
                </div>
                <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  curriculum.status === 'ACTIVE' 
                    ? 'bg-folusho-sage-50 border-folusho-sage-100 text-folusho-sage-600' 
                    : 'bg-folusho-cream-50 border-folusho-cream-100 text-folusho-slate-400'
                }`}>
                  {curriculum.status}
                </span>
              </div>

              <p className="text-xs font-black text-folusho-slate-400 uppercase leading-relaxed tracking-wide mb-8 h-12 overflow-hidden line-clamp-2">{curriculum.description}</p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-folusho-cream-50 rounded-2xl border border-folusho-cream-100">
                  <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Duration Cycle</span>
                  <p className="text-sm font-black text-folusho-slate-900 mt-1">{curriculum.yearsOfStudy} Academic Years</p>
                </div>
                <div className="p-4 bg-folusho-cream-50 rounded-2xl border border-folusho-cream-100">
                  <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Unit Count</span>
                  <p className="text-sm font-black text-folusho-slate-900 mt-1">{curriculum.subjects.length} Subjects</p>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedCurriculum(curriculum)}
                  className="flex-1 flex items-center justify-center gap-3 bg-folusho-sage-50 text-folusho-sage-600 px-4 py-3 rounded-2xl border border-folusho-sage-100 text-[10px] font-black uppercase tracking-widest hover:bg-folusho-sage-100 transition shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-3 bg-folusho-cream-50 text-folusho-slate-400 rounded-2xl border border-folusho-cream-100 hover:bg-white hover:text-folusho-sage-600 transition"
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleDelete(curriculum.id)}
                  className="px-4 py-3 bg-folusho-coral-50 text-folusho-coral-600 rounded-2xl border border-folusho-coral-100 hover:bg-folusho-coral-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedCurriculum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedCurriculum(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="folusho-card max-w-2xl w-full !p-0 overflow-hidden shadow-folusho-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10 bg-folusho-sage-500 text-white flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{selectedCurriculum.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 mt-3">Matrix Detailed Protocol</p>
                </div>
                <button
                  onClick={() => setSelectedCurriculum(null)}
                  className="p-4 hover:bg-white/10 rounded-2xl transition-all relative z-10"
                >
                  <X size={24} />
                </button>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              </div>

              <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.4em] px-2">Mission Parameters</h4>
                  <p className="text-xs font-black text-folusho-slate-400 uppercase leading-relaxed tracking-wide px-2">{selectedCurriculum.description}</p>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-folusho-sage-600 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-folusho-sage-500" />
                    Protocol Units ({selectedCurriculum.subjects.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <motion.button
                          key={normalizedSubject._id || normalizedSubject.id || normalizedSubject.name}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedSubject(normalizedSubject)}
                          className="p-5 bg-folusho-cream-50 border border-folusho-cream-200 rounded-3xl text-left hover:bg-folusho-sage-50 hover:border-folusho-sage-200 transition-all group"
                        >
                          <p className="text-sm font-black text-folusho-slate-900 uppercase tracking-tighter group-hover:text-folusho-sage-600 transition-colors">
                            {normalizedSubject.name || normalizedSubject.code || normalizedSubject._id}
                          </p>
                          <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-1.5">
                            {normalizedSubject.topics?.length || 0} Phase Operations
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-folusho-cream-50/50 border-t border-folusho-cream-100">
                <button
                  onClick={() => setSelectedCurriculum(null)}
                  className="btn-vibrant !bg-white !text-folusho-slate-600 border border-folusho-cream-200 w-full shadow-sm hover:border-folusho-coral-200"
                >
                  Close Registry
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-folusho-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[60]"
            onClick={() => setSelectedSubject(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="folusho-card max-w-md w-full !p-0 overflow-hidden shadow-folusho-lg border-folusho-coral-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 bg-folusho-coral-500 text-white flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-tighter leading-none">
                    {typeof selectedSubject === 'string' ? selectedSubject : selectedSubject.name}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 mt-2">Unit Protocol Detail</p>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="p-3 hover:bg-white/10 rounded-xl transition-all relative z-10"
                >
                  <X size={20} />
                </button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              </div>
              
              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {typeof selectedSubject !== 'string' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 bg-folusho-cream-50 rounded-2xl border border-folusho-cream-100">
                        <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Logic Code</p>
                        <p className="text-sm font-black text-folusho-slate-900 mt-1">{selectedSubject.code || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-folusho-cream-50 rounded-2xl border border-folusho-cream-100">
                        <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Weighting</p>
                        <p className="text-sm font-black text-folusho-slate-900 mt-1">{selectedSubject.creditUnits || 'N/A'} Units</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest px-2">Operational Description</p>
                      <p className="text-xs font-black text-folusho-slate-400 uppercase leading-relaxed tracking-wide px-2">{selectedSubject.description || 'No description available for this unit protocol.'}</p>
                    </div>
                    
                    {selectedSubject.topics && selectedSubject.topics.length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-folusho-coral-500" />
                          Phase Operations
                        </h4>
                        <div className="space-y-4">
                          {selectedSubject.topics.map((topic: any, idx: number) => (
                            <div key={idx} className="p-5 bg-folusho-cream-50 border-l-4 border-folusho-coral-400 rounded-r-2xl shadow-sm">
                              <h5 className="text-xs font-black text-folusho-slate-900 uppercase tracking-tight">Phase {topic.weekNumber}: {topic.topicName}</h5>
                              <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-2">Duration: {topic.duration} Operation Hours</p>
                              
                              {topic.objectives && topic.objectives.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-[10px] font-black text-folusho-coral-500 uppercase tracking-widest mb-2">Objectives:</p>
                                  <ul className="space-y-1.5">
                                    {topic.objectives.map((obj: string, i: number) => (
                                      <li key={i} className="text-[10px] font-black text-folusho-slate-400 uppercase leading-tight flex gap-2">
                                        <div className="w-1 h-1 rounded-full bg-folusho-cream-300 mt-1" />
                                        {obj}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {topic.assessmentMethod && (
                                <div className="mt-4 pt-4 border-t border-folusho-cream-100 flex items-center justify-between">
                                  <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Assessment</p>
                                  <span className="px-3 py-1 bg-folusho-coral-50 text-folusho-coral-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-folusho-coral-100">{topic.assessmentMethod}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-8 bg-folusho-cream-50/50 border-t border-folusho-cream-100">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="btn-vibrant !bg-white !text-folusho-slate-600 border border-folusho-cream-200 w-full shadow-sm hover:border-folusho-coral-200"
                >
                  Return to Matrix
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
