import { useState, useMemo } from 'react'
import { CheckCircle2, Clock, Lock, Unlock, Users, AlertCircle, ChevronDown, Search } from 'lucide-react'
import { Student, SubjectResult } from '../types'
import { releaseResults, unreleaseResults } from '../services/api'

interface Props {
  students: Student[]
  results: SubjectResult[]
  onRefresh: () => void
}

const TERMS = ['First', 'Second', 'Third']
const ACADEMIC_YEARS = ['2024/2025', '2025/2026', '2026/2027']

export default function ReleaseResultsPanel({ students, results, onRefresh }: Props) {
  const [selectedTerm, setSelectedTerm] = useState('Third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isReleasing, setIsReleasing] = useState(false)
  const [isUnreleasing, setIsUnreleasing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Map each student's release status for the selected term/year
  const studentReleaseStatus = useMemo(() => {
    return students.map(student => {
      const studentResults = results.filter(
        r => r.studentId === student.id &&
          r.term === selectedTerm &&
          r.academicYear === selectedYear
      )
      const totalSubjects = studentResults.length
      const released = studentResults.filter(r => r.status === 'RELEASED').length
      const isFullyReleased = totalSubjects > 0 && released === totalSubjects
      const isPartiallyReleased = released > 0 && released < totalSubjects

      return {
        student,
        totalSubjects,
        released,
        isFullyReleased,
        isPartiallyReleased,
        hasDraftResults: totalSubjects > 0
      }
    }).filter(s => s.hasDraftResults || s.isFullyReleased)
  }, [students, results, selectedTerm, selectedYear])

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return studentReleaseStatus
    const q = searchTerm.toLowerCase()
    return studentReleaseStatus.filter(s =>
      `${s.student.firstName} ${s.student.lastName}`.toLowerCase().includes(q) ||
      s.student.class?.toLowerCase().includes(q)
    )
  }, [studentReleaseStatus, searchTerm])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.student.id)))
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleRelease = async () => {
    if (selectedIds.size === 0) return
    setIsReleasing(true)
    try {
      const resp = await releaseResults([...selectedIds], selectedTerm, selectedYear)
      showMessage('success', `✅ ${resp.message}`)
      setSelectedIds(new Set())
      onRefresh()
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to release results')
    } finally {
      setIsReleasing(false)
    }
  }

  const handleUnrelease = async () => {
    if (selectedIds.size === 0) return
    setIsUnreleasing(true)
    try {
      const resp = await unreleaseResults([...selectedIds], selectedTerm, selectedYear)
      showMessage('success', `↩️ ${resp.message}`)
      setSelectedIds(new Set())
      onRefresh()
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to unrelease results')
    } finally {
      setIsUnreleasing(false)
    }
  }

  const totalReleased = studentReleaseStatus.filter(s => s.isFullyReleased).length
  const totalStudents = studentReleaseStatus.length

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-folusho-sage-100/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-folusho-coral-100/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Header & Progress Bar */}
      <div className="folusho-card !p-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-folusho-coral-100/50 rounded-2xl text-folusho-coral-500 border border-folusho-coral-200 shadow-sm">
              <Unlock size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-folusho-slate-900 leading-none">
                Governance <br /> <span className="text-folusho-coral-500">Release</span>
              </h2>
              <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em] mt-2">
                External Publication Protocol
              </p>
            </div>
          </div>

          {/* Term & Year Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">Cycle Phase</label>
              <select
                value={selectedTerm}
                onChange={e => { setSelectedTerm(e.target.value); setSelectedIds(new Set()) }}
                className="input-folusho !py-4 !px-6 text-xs min-w-[150px]"
              >
                {TERMS.map(t => <option key={t} value={t}>{t} Phase</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest px-2">Session Vector</label>
              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setSelectedIds(new Set()) }}
                className="input-folusho !py-4 !px-6 text-xs min-w-[150px]"
              >
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Progress summary */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest">Global Diffusion Progress</span>
            <span className="text-xs font-black text-folusho-sage-600 uppercase tracking-tighter">
              {totalReleased} / {totalStudents} Personnel Published
            </span>
          </div>
          <div className="bg-folusho-cream-100 rounded-full h-4 overflow-hidden border border-folusho-cream-200 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: totalStudents > 0 ? `${(totalReleased / totalStudents) * 100}%` : '0%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-folusho-sage-400 to-folusho-sage-600 rounded-full shadow-lg relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center gap-4 p-6 rounded-[2rem] border relative z-10 shadow-sm ${
              message.type === 'success'
                ? 'bg-folusho-sage-50 border-folusho-sage-200 text-folusho-sage-700'
                : 'bg-folusho-coral-50 border-folusho-coral-200 text-folusho-coral-700'
            }`}
          >
            {message.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between relative z-10">
        {/* Search */}
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-folusho-slate-400 group-focus-within:text-folusho-sage-500 transition-colors" />
          <input
            type="text"
            placeholder="Scan Personnel Registry..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-folusho !pl-16 !py-4 text-xs"
          />
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex gap-4 w-full lg:w-auto">
          <button
            onClick={handleRelease}
            disabled={selectedIds.size === 0 || isReleasing}
            className="btn-vibrant !py-4 flex-1 lg:flex-none shadow-folusho"
          >
            {isReleasing ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            Publish {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          <button
            onClick={handleUnrelease}
            disabled={selectedIds.size === 0 || isUnreleasing}
            className="btn-vibrant !bg-white !text-folusho-coral-500 border border-folusho-coral-200 !py-4 flex-1 lg:flex-none hover:bg-folusho-coral-50"
          >
            {isUnreleasing ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Recall {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="folusho-card !p-0 overflow-hidden relative z-10">
        {filteredStudents.length === 0 ? (
          <div className="p-24 text-center bg-folusho-cream-50/20">
            <Users className="w-16 h-16 text-folusho-slate-200 mx-auto mb-6 opacity-50" />
            <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.4em]">
              No Personnel Intel for <span className="text-folusho-slate-900">{selectedTerm} Vector {selectedYear}</span>
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="flex items-center gap-6 px-10 py-6 border-b border-folusho-cream-100 bg-folusho-cream-50/50">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                onChange={toggleAll}
                className="w-6 h-6 rounded-xl border-folusho-cream-300 text-folusho-sage-500 focus:ring-folusho-sage-400 cursor-pointer"
                title="Select all"
              />
              <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em] flex-1">Personnel Detail</span>
              <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em] w-32 text-center hidden sm:block">Cohort</span>
              <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em] w-32 text-center hidden sm:block">Logics</span>
              <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-[0.3em] w-32 text-center">Status</span>
            </div>

            {/* Student Rows */}
            <div className="divide-y divide-folusho-cream-100">
              {filteredStudents.map(({ student, totalSubjects, released, isFullyReleased, isPartiallyReleased }) => (
                <div
                  key={student.id}
                  onClick={() => toggleSelect(student.id)}
                  className={`group flex items-center gap-6 px-10 py-6 cursor-pointer transition-all duration-300 hover:bg-folusho-sage-50/30 ${
                    selectedIds.has(student.id) ? 'bg-folusho-sage-50/50 shadow-inner' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(student.id)}
                    onChange={() => toggleSelect(student.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-6 h-6 rounded-xl border-folusho-cream-300 text-folusho-sage-500 focus:ring-folusho-sage-400 cursor-pointer flex-shrink-0"
                  />
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-3xl bg-folusho-cream-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm overflow-hidden group-hover:scale-110 transition-transform">
                    {student.image
                      ? <img src={student.image} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs font-black text-folusho-slate-400">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-folusho-slate-900 leading-none group-hover:text-folusho-sage-600 transition-colors">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest mt-2">{student.registrationNumber}</p>
                  </div>

                  <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest w-32 text-center hidden sm:block">{student.class}</span>

                  <span className="text-[10px] font-black text-folusho-slate-400 uppercase tracking-widest w-32 text-center hidden sm:block">
                    {released}/{totalSubjects} Logics
                  </span>

                  {/* Status Badge */}
                  <div className="w-32 flex justify-center">
                    {isFullyReleased ? (
                      <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-folusho-sage-600 bg-folusho-sage-50 border border-folusho-sage-100 rounded-full px-4 py-2 shadow-sm">
                        <CheckCircle2 size={12} />
                        Published
                      </span>
                    ) : isPartiallyReleased ? (
                      <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-folusho-coral-500 bg-folusho-coral-50 border border-folusho-coral-100 rounded-full px-4 py-2 shadow-sm">
                        <Clock size={12} />
                        Partial
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-folusho-slate-300 bg-folusho-cream-50 border border-folusho-cream-100 rounded-full px-4 py-2">
                        <Lock size={12} />
                        Registry
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
