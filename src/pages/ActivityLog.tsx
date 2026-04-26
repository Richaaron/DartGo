import { Eye } from 'lucide-react'
import TeacherActivityLog from '../components/TeacherActivityLog'

export default function ActivityLog() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Activity <span className="text-blue-600 dark:text-blue-400">Log</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Every action your teachers take is recorded here and emailed to{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">folushovictoryschool@gmail.com</span>
          </p>
        </div>
      </div>

      {/* Activity Log Table */}
      <TeacherActivityLog />
    </div>
  )
}
