import { useState, useMemo } from 'react'
import { CheckCircle2, Clock, Lock, Unlock, Users, AlertCircle, Search, RefreshCw } from 'lucide-react'
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
      await releaseResults([...selectedIds], selectedTerm, selectedYear)
      showMessage('success', 'Results released successfully')
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
      await unreleaseResults([...selectedIds], selectedTerm, selectedYear)
      showMessage('success', 'Results recalled successfully')
      setSelectedIds(new Set())
      onRefresh()
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to recall results')
    } finally {
      setIsUnreleasing(false)
    }
  }

  const totalReleased = studentReleaseStatus.filter(s => s.isFullyReleased).length
  const totalStudents = studentReleaseStatus.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Unlock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Release Results</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Publish or recall student results for the portal.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Term</label>
              <select
                value={selectedTerm}
                onChange={e => { setSelectedTerm(e.target.value); setSelectedIds(new Set()) }}
                className="input py-1.5 px-3 text-xs w-32"
              >
                {TERMS.map(t => <option key={t} value={t}>{t} Term</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Session</label>
              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setSelectedIds(new Set()) }}
                className="input py-1.5 px-3 text-xs w-32"
              >
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Progress summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-400">Release Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              {totalReleased} / {totalStudents} Students Released
            </span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: totalStudents > 0 ? `${(totalReleased / totalStudents) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-9 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleRelease}
            disabled={selectedIds.size === 0 || isReleasing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm disabled:opacity-50"
          >
            {isReleasing ? <RefreshCw size={18} className="animate-spin" /> : <Unlock size={18} />}
            Release {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          <button
            onClick={handleUnrelease}
            disabled={selectedIds.size === 0 || isUnreleasing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-bold text-sm hover:border-rose-300 disabled:opacity-50"
          >
            {isUnreleasing ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
            Recall {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Class</th>
                <th className="px-6 py-4 text-center">Results</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map(({ student, totalSubjects, released, isFullyReleased, isPartiallyReleased }) => (
                <tr
                  key={student.id}
                  onClick={() => toggleSelect(student.id)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${
                    selectedIds.has(student.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {student.image ? <img src={student.image} alt="" className="w-full h-full object-cover" /> : `${student.firstName[0]}${student.lastName[0]}`}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{student.registrationNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-400">{student.class}</td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{released} / {totalSubjects}</p>
                    <p className="text-[10px] text-slate-500">Subjects</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {isFullyReleased ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle2 size={12} />
                          RELEASED
                        </span>
                      ) : isPartiallyReleased ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-100 dark:border-amber-900/30">
                          <Clock size={12} />
                          PARTIAL
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-bold rounded-full border border-slate-200 dark:border-slate-700">
                          <Lock size={12} />
                          PENDING
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-16 text-center">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500">No students found for this period.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
