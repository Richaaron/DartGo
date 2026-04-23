import { useState, useEffect, useMemo } from 'react'
import { Calendar, Save, CheckCircle, XCircle, Clock, AlertCircle, Check } from 'lucide-react'
import { fetchStudents, saveBulkAttendance, fetchAttendance } from '../services/api'
import { Student } from '../types'

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string, remarks: string }>>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const classes = useMemo(() => [...new Set(students.map(s => s.class))], [students])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [studentsData, existingAttendance] = await Promise.all([
          fetchStudents(),
          fetchAttendance({ date: selectedDate })
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
      } finally {
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
    setMessage({ type: '', text: '' })
    try {
      const recordsToSave = filteredStudents.map((s: Student) => ({
        studentId: s.id,
        ...attendanceRecords[s.id]
      }))
      await saveBulkAttendance(selectedDate, recordsToSave)
      setMessage({ type: 'success', text: 'Attendance saved successfully!' })
      window.setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to save attendance. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const presentCount = filteredStudents.filter(s => attendanceRecords[s.id]?.status === 'Present').length
  const absentCount = filteredStudents.filter(s => attendanceRecords[s.id]?.status === 'Absent').length
  const lateCount = filteredStudents.filter(s => attendanceRecords[s.id]?.status === 'Late').length

  if (isLoading) return <div className="p-8 text-center">Loading attendance...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Attendance</h1>
          <p className="text-gray-600 mt-2">Mark daily student attendance with present or absent status</p>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="date" 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
            <select 
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="All">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-3xl font-bold text-green-700">{presentCount}</span>
          </div>
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Present</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <XCircle className="w-6 h-6 text-red-600" />
            <span className="text-3xl font-bold text-red-700">{absentCount}</span>
          </div>
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Absent</p>
        </div>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-6 h-6 text-yellow-600" />
            <span className="text-3xl font-bold text-yellow-700">{lateCount}</span>
          </div>
          <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Late</p>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Student</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Reg No.</th>
              <th className="text-center p-4 text-sm font-bold text-gray-600">Present</th>
              <th className="text-center p-4 text-sm font-bold text-gray-600">Absent</th>
              <th className="text-center p-4 text-sm font-bold text-gray-600">Late</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => {
              const currentStatus = attendanceRecords[student.id]?.status || 'Present'
              return (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-gray-500">{student.class}</p>
                  </td>
                  <td className="p-4 text-gray-600 font-medium">{student.registrationNumber}</td>
                  
                  {/* Present Column */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'Present')}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl font-bold mx-auto ${
                        currentStatus === 'Present'
                          ? 'bg-green-500 text-white shadow-lg shadow-green-200 scale-110'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                      title="Mark Present"
                    >
                      {currentStatus === 'Present' ? '✓' : ''}
                    </button>
                  </td>
                  
                  {/* Absent Column */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'Absent')}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl font-bold mx-auto ${
                        currentStatus === 'Absent'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110'
                          : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'
                      }`}
                      title="Mark Absent"
                    >
                      {currentStatus === 'Absent' ? '✗' : ''}
                    </button>
                  </td>
                  
                  {/* Late Column */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'Late')}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl font-bold mx-auto ${
                        currentStatus === 'Late'
                          ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200 scale-110'
                          : 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
                      }`}
                      title="Mark Late"
                    >
                      {currentStatus === 'Late' ? '◐' : ''}
                    </button>
                  </td>
                  
                  <td className="p-4">
                    <input 
                      type="text" 
                      placeholder="Add note..." 
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none py-1 text-sm text-gray-600"
                      value={attendanceRecords[student.id]?.remarks || ''}
                      onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
        >
          <Save size={20} /> {isSaving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}