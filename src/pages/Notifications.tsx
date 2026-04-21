import React from 'react'
import { Bell } from 'lucide-react'
import NotificationDashboard from '../components/NotificationDashboard'

export const NotificationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Email Notifications</h1>
          </div>
          <p className="text-gray-600">
            Monitor and manage all email notifications sent to parents and staff
          </p>
        </div>

        {/* Dashboard */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <NotificationDashboard />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Student Registration</h3>
            <p className="text-sm text-blue-800">
              Sent when a new student is registered in the system
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Results Published</h3>
            <p className="text-sm text-green-800">
              Sent when exam results are entered for a student
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Attendance Warning</h3>
            <p className="text-sm text-yellow-800">
              Sent when attendance drops below 75%
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Low Grades Alert</h3>
            <p className="text-sm text-red-800">
              Sent when a student scores below 60% in a subject
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Fee Reminder</h3>
            <p className="text-sm text-purple-800">
              Sent as a reminder for upcoming fee payment deadlines
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">Teacher Assigned</h3>
            <p className="text-sm text-indigo-800">
              Sent when a teacher is assigned to a class or subject
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
