import { useState, useEffect } from 'react'
import { Eye, Clock, User, Info, Search } from 'lucide-react'
import { activityService, Activity } from '../services/activityService'

export default function TeacherActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeacher] = useState<string>('all')

  useEffect(() => {
    loadActivities()
    const interval = setInterval(loadActivities, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [selectedTeacher])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = selectedTeacher === 'all' 
        ? await activityService.getActivities()
        : await activityService.getTeacherActivities(selectedTeacher)
      setActivities(data)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(a => 
    a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.details.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getActionColor = (action: string) => {
    if (action.includes('POST')) return 'bg-green-100 text-green-700'
    if (action.includes('PUT') || action.includes('PATCH')) return 'bg-blue-100 text-blue-700'
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  const formatAction = (action: string) => {
    const [method, url] = action.split(' ')
    const parts = url.split('/')
    const resource = parts[parts.length - 1] || parts[parts.length - 2] || 'Resource'
    return `${method} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Teacher Activity Monitor
          </h2>
          <p className="text-xs text-gray-500">Real-time tracking of teacher moves and updates</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={loadActivities}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <Clock className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading activities...
                </td>
              </tr>
            ) : filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No activity logs found.
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => (
                <tr key={activity._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-1.5 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{activity.userName}</div>
                        <div className="text-[10px] text-gray-500">{activity.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getActionColor(activity.action)}`}>
                      {formatAction(activity.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{activity.details}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500 flex flex-col">
                      <span className="font-medium text-gray-700">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {activities.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-500 italic">Showing the last 100 activities. Logs are automatically captured for all teacher actions.</p>
        </div>
      )}
    </div>
  )
}
