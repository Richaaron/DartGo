import { useState, useEffect, useMemo } from 'react'
import { Calendar, Save, CheckCircle, XCircle, Clock, AlertCircle, Check } from 'lucide-react'
import { Student } from '../types'

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string, remarks: string }>>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [apiError, setApiError] = useState<string | null>(null)

  const classes = useMemo(() => [...new Set(students.map(s => s.class))], [students])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setApiError(null)
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setApiError('Loading timeout. Please check your connection and try again.')
        setIsLoading(false)
      }, 10000) // 10 second timeout

      try {
        // Try to import and use API functions
        const { fetchStudents, fetchAttendance } = await import('../services/api')
        
        const [studentsData, existingAttendance] = await Promise.all([
          fetchStudents().catch(err => {
            console.warn('Failed to fetch students, using fallback:', err)
            return [] // Return empty array as fallback
          }),
          fetchAttendance({ date: selectedDate }).catch(err => {
            console.warn('Failed to fetch attendance, using fallback:', err)
            return [] // Return empty array as fallback
          })
        ])
        
        setStudents(studentsData)
        
        const records: Record<string, { status: string, remarks: string }> = {}
        studentsData.forEach((s: Student) => {
          const existing = existingAttendance.find((a: any) => 
            a.studentId?._id === s.id || a.studentId === s.id
          )
          records[s.id] = existing 
            ? { status: existing.status, remarks: existing.remarks || '' } 
            : { status: 'Present', remarks: '' }
        })
        setAttendanceRecords(records)
      } catch (error: any) {
        console.error('Failed to load attendance data', error)
        setApiError('Failed to load data. Please try again.')
        // Set empty data to prevent crashes
        setStudents([])
        setAttendanceRecords({})
      } finally {
        clearTimeout(timeoutId)
        setIsLoading(false)
      }
    }
    loadData()
  }, [selectedDate])

  const filteredStudents = useMemo(() => {
    return selectedClass === 'All' 
      ? students 
      : students.filter((s: Student) => s.class === selectedClass)
  }, [students, selectedClass])

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { saveBulkAttendance } = await import('../services/api')
      const attendanceData = Object.entries(attendanceRecords).map(([studentId, record]) => ({
        studentId,
        date: selectedDate,
        status: record.status,
        remarks: record.remarks
      }))
      
      await saveBulkAttendance(attendanceData)
      setMessage({ type: 'success', text: 'Attendance saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to save attendance:', error)
      setMessage({ type: 'error', text: 'Failed to save attendance' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetry = () => {
    // Trigger data reload
    const loadData = async () => {
      setIsLoading(true)
      setApiError(null)
      
      try {
        const { fetchStudents, fetchAttendance } = await import('../services/api')
        
        const [studentsData, existingAttendance] = await Promise.all([
          fetchStudents().catch(err => {
            console.warn('Failed to fetch students, using fallback:', err)
            return []
          }),
          fetchAttendance({ date: selectedDate }).catch(err => {
            console.warn('Failed to fetch attendance, using fallback:', err)
            return []
          })
        ])
        
        setStudents(studentsData)
        
        const records: Record<string, { status: string, remarks: string }> = {}
        studentsData.forEach((s: Student) => {
          const existing = existingAttendance.find((a: any) => 
            a.studentId?._id === s.id || a.studentId === s.id
          )
          records[s.id] = existing 
            ? { status: existing.status, remarks: existing.remarks || '' } 
            : { status: 'Present', remarks: '' }
        })
        setAttendanceRecords(records)
      } catch (error: any) {
        console.error('Failed to load attendance data', error)
        setApiError('Failed to load data. Please try again.')
        setStudents([])
        setAttendanceRecords({})
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }

  if (apiError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Data Loading Error</h2>
        <p className="text-gray-600 mb-4">{apiError}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading attendance data...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Mark and manage student attendance</p>
        </div>
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="card-lg mb-8">
        <div className="flex gap-4 mb-6">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          >
            <option value="All">All Classes</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Student</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Registration</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b dark:border-gray-700">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{student.class}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {student.registrationNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'Present')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          attendanceRecords[student.id]?.status === 'Present'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Check size={16} />
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Absent')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          attendanceRecords[student.id]?.status === 'Absent'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <XCircle size={16} />
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Late')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          attendanceRecords[student.id]?.status === 'Late'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Clock size={16} />
                        Late
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={attendanceRecords[student.id]?.remarks || ''}
                      onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                      placeholder="Add remarks..."
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
