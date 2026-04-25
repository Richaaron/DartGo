import { useState, useEffect } from 'react'
import { analyticsService, StudentInsight } from '../services/analyticsService'
import { Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Lightbulb, Search } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PerformanceInsights() {
  const [insights, setInsights] = useState<StudentInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'at-risk' | 'improving'>('all')

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      setLoading(true)
      const data = await analyticsService.getStudentInsights()
      setInsights(data)
    } catch (error) {
      console.error('Failed to load insights:', error)
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Student Insight Engine
          </h2>
          <p className="text-xs text-gray-500">Automated performance analysis and risk detection</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Insights</option>
            <option value="at-risk">At Risk</option>
            <option value="improving">Improving</option>
          </select>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            Analyzing student data...
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            No insights found matching your criteria.
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <motion.div
              key={insight.studentId}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                insight.isAtRisk 
                  ? 'border-red-100 bg-red-50/30' 
                  : insight.trend === 'improving' 
                    ? 'border-green-100 bg-green-50/30' 
                    : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{insight.studentName}</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black">{insight.registrationNumber} • {insight.class}</p>
                </div>
                <div className={`p-1.5 rounded-lg ${
                  insight.trend === 'improving' ? 'bg-green-100' : 
                  insight.trend === 'declining' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {insight.trend === 'improving' ? <TrendingUp className="w-4 h-4 text-green-600" /> : 
                   insight.trend === 'declining' ? <TrendingDown className="w-4 h-4 text-red-600" /> : 
                   <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Average Performance</span>
                  <span className={`text-sm font-bold ${
                    insight.averageScore >= 70 ? 'text-green-600' : 
                    insight.averageScore >= 50 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {Math.round(insight.averageScore)}%
                  </span>
                </div>

                <div className="p-2 bg-white/50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-3 h-3 text-purple-600" />
                    <span className="text-[10px] font-bold text-purple-600 uppercase">AI Recommendation</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    "{insight.recommendation}"
                  </p>
                </div>

                {insight.weakSubjects.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Attention Required In:</p>
                    <div className="flex flex-wrap gap-1">
                      {insight.weakSubjects.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold">
                          {s.subjectName} ({Math.round(s.score)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`mt-2 flex items-center gap-2 p-2 rounded-lg ${
                  insight.isAtRisk ? 'bg-red-100/50 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-medium leading-tight">{insight.trendMessage}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
