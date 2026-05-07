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
    <div className="space-y-6 animate-fadeInUp">
      {/* Header & Progress Bar */}
      <div className="professional-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Unlock className="w-5 h-5 text-yellow-400" />
              Release Results to Parents
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Select students below, then click "Release" to make results visible to parents.
            </p>
          </div>

          {/* Term & Year Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <select
                value={selectedTerm}
                onChange={e => { setSelectedTerm(e.target.value); setSelectedIds(new Set()) }}
                className="input-field pr-8 pl-4 py-2 text-sm min-w-[130px]"
              >
                {TERMS.map(t => <option key={t} value={t}>{t} Term</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setSelectedIds(new Set()) }}
                className="input-field pr-8 pl-4 py-2 text-sm min-w-[130px]"
              >
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: totalStudents > 0 ? `${(totalReleased / totalStudents) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-sm font-semibold text-white/80 whitespace-nowrap">
            {totalReleased} / {totalStudents} Released
          </span>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border animate-fadeInDown ${
          message.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name or class..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-10 py-2 text-sm w-full"
          />
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRelease}
            disabled={selectedIds.size === 0 || isReleasing}
            className="btn-primary flex items-center gap-2 py-2 px-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isReleasing ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            Release {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          <button
            onClick={handleUnrelease}
            disabled={selectedIds.size === 0 || isUnreleasing}
            className="btn-secondary flex items-center gap-2 py-2 px-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUnreleasing ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Unrelease {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="professional-card p-12 text-center">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">
            No students with results found for <strong>{selectedTerm} Term {selectedYear}</strong>
          </p>
        </div>
      ) : (
        <div className="professional-card overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-white/10 bg-white/5">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-yellow-400 cursor-pointer"
              title="Select all"
            />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider flex-1">Student</span>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider w-28 text-center hidden sm:block">Class</span>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider w-28 text-center hidden sm:block">Subjects</span>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider w-28 text-center">Status</span>
          </div>

          {/* Student Rows */}
          <div className="divide-y divide-white/5">
            {filteredStudents.map(({ student, totalSubjects, released, isFullyReleased, isPartiallyReleased }) => (
              <div
                key={student.id}
                onClick={() => toggleSelect(student.id)}
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                  selectedIds.has(student.id) ? 'bg-yellow-500/10 border-l-2 border-yellow-400' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(student.id)}
                  onChange={() => toggleSelect(student.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-yellow-400 cursor-pointer flex-shrink-0"
                />
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 border border-white/10">
                  {student.image
                    ? <img src={student.image} alt="" className="w-full h-full rounded-full object-cover" />
                    : <span className="text-xs font-bold text-white/80">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-white/40">{student.registrationNumber}</p>
                </div>

                <span className="text-xs text-white/60 w-28 text-center hidden sm:block">{student.class}</span>

                <span className="text-xs text-white/60 w-28 text-center hidden sm:block">
                  {released}/{totalSubjects} subjects
                </span>

                {/* Status Badge */}
                <div className="w-28 flex justify-center">
                  {isFullyReleased ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Released
                    </span>
                  ) : isPartiallyReleased ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 rounded-full px-3 py-1">
                      <Clock className="w-3.5 h-3.5" />
                      Partial
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-white/50 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                      <Lock className="w-3.5 h-3.5" />
                      Draft
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
