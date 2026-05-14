import { useState, useEffect } from 'react'
import { analyticsService, StudentInsight } from '../services/analyticsService'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Lightbulb, Search, BarChart3 } from 'lucide-react'

export default function PerformanceInsights() {
  const [insights, setInsights] = useState<StudentInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'at-risk' | 'improving'>('all')

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      setLoading(true)
      setError(false)
      const data = await analyticsService.getStudentInsights()
      setInsights(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const filteredInsights = insights.filter(i => {
    if (!i || !i.studentName) return false
    const matchesSearch = i.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (i.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filter === 'at-risk') return matchesSearch && i.isAtRisk
    if (filter === 'improving') return matchesSearch && i.trend === 'improving'
    return matchesSearch
  })

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Insights</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analysis of student performance and trends.</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="input pl-9 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="input px-3 py-2 text-sm w-32"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="at-risk">At Risk</option>
            <option value="improving">Improving</option>
          </select>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Loading insights...</p>
          </div>
        ) : error ? (
          <div className="col-span-full py-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">Insights unavailable.</p>
            <button
              onClick={loadInsights}
              className="mt-3 text-xs text-indigo-600 hover:underline font-bold"
            >
              Try again
            </button>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No insights found.
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <div
              key={insight.studentId}
              className={`p-5 rounded-xl border transition-all ${
                insight.isAtRisk 
                  ? 'border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10' 
                  : insight.trend === 'improving' 
                    ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10' 
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{insight.studentName}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-wider">
                    {insight.registrationNumber} • {insight.class}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  insight.trend === 'improving' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 
                  insight.trend === 'declining' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 
                  'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                }`}>
                  {insight.trend === 'improving' ? <TrendingUp size={16} /> : 
                   insight.trend === 'declining' ? <TrendingDown size={16} /> : 
                   <CheckCircle2 size={16} />}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Avg Performance</span>
                  <span className={`text-sm font-bold ${
                    insight.averageScore >= 70 ? 'text-emerald-600' : 
                    insight.averageScore >= 50 ? 'text-indigo-600' : 'text-rose-600'
                  }`}>
                    {Math.round(insight.averageScore)}%
                  </span>
                </div>

                <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{insight.recommendation}"
                  </p>
                </div>

                {insight.weakSubjects.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Scores In:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {insight.weakSubjects.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded text-[10px] font-bold">
                          {s.subjectName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                  insight.isAtRisk ? 'bg-rose-100/50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <AlertCircle size={14} />
                  <p className="text-[10px] font-medium leading-tight">{insight.trendMessage}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
