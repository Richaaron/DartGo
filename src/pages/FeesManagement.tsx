import { useState, useEffect, useMemo } from 'react'
import { Mail, Download, AlertCircle, CheckCircle2, Clock, DollarSign } from 'lucide-react'
import { Student, FeePaymentTracker } from '../types'
import { useAuthContext } from '../context/AuthContext'
import Table from '../components/Table'
import { formatDate, exportToCSV } from '../utils/calculations'
import { fetchStudents } from '../services/api'
import apiService from '../services/apiService'

export default function FeesManagement() {
  const { user } = useAuthContext()
  const [students, setStudents] = useState<Student[]>([])
  const [feeTracking, setFeeTracking] = useState<FeePaymentTracker[]>([])
  const [filterTerm, setFilterTerm] = useState('')
  const [filterClass, setFilterClass] = useState('All')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'outstanding'>('outstanding')
  const [selectedTerm, setSelectedTerm] = useState<string>('First')
  const [currentYear] = useState(new Date().getFullYear().toString())
  const [sending, setSending] = useState<string | null>(null)
  const [isBulkSending, setIsBulkSending] = useState(false)
  const [sendMessage, setSendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load data on mount
  useEffect(() => {
    let isMounted = true

    fetchStudents()
      .then((data) => {
        if (!isMounted) return
        setStudents(data)
      })
      .catch((error) => {
        console.error('Failed to load students:', error)
      })

    // Load fee tracking from localStorage
    try {
      const savedTracking = localStorage.getItem('feePaymentTracking')
      if (savedTracking) {
        setFeeTracking(JSON.parse(savedTracking))
      }
    } catch (error) {
      console.error('Failed to load fee tracking:', error)
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Save fee tracking to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('feePaymentTracking', JSON.stringify(feeTracking))
  }, [feeTracking])

  // Initialize fee tracking for all students
  const initializeStudentFeeTracking = (studentList: Student[]) => {
    const newTracking: FeePaymentTracker[] = []

    studentList.forEach((student) => {
      if (!student.parentEmail) return

      const existingTracking = feeTracking.find(
        (t) => t.studentId === student.id && t.term === selectedTerm && t.academicYear === currentYear
      )

      if (!existingTracking) {
        newTracking.push({
          id: `${student.id}-${selectedTerm}-${currentYear}-${Date.now()}`,
          studentId: student.id,
          term: selectedTerm,
          academicYear: currentYear,
          amountDue: 50000, // Example amount - can be configurable
          amountPaid: student.feePaid ? 50000 : 0,
          feePaid: student.feePaid || false,
          parentEmail: student.parentEmail,
          status: student.feePaid ? 'paid' : 'outstanding',
        })
      }
    })

    if (newTracking.length > 0) {
      setFeeTracking([...feeTracking, ...newTracking])
    }
  }

  // Filter students based on criteria
  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        const matchesSearch =
          student.firstName.toLowerCase().includes(filterTerm.toLowerCase()) ||
          student.lastName.toLowerCase().includes(filterTerm.toLowerCase()) ||
          student.registrationNumber.toLowerCase().includes(filterTerm.toLowerCase())

        const matchesClass = filterClass === 'All' || student.class === filterClass

        // Get fee status for this student
        const feeStatus = feeTracking.find(
          (t) => t.studentId === student.id && t.term === selectedTerm && t.academicYear === currentYear
        )

        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'paid' && feeStatus?.feePaid) ||
          (filterStatus === 'outstanding' && !feeStatus?.feePaid)

        return matchesSearch && matchesClass && matchesStatus
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
  }, [students, feeTracking, filterTerm, filterClass, filterStatus, selectedTerm, currentYear])

  // Get unique classes
  const availableClasses = useMemo(() => {
    return ['All', ...new Set(students.map((s) => s.class))]
  }, [students])

  // Get outstanding fees list
  const outstandingFees = useMemo(() => {
    return filteredStudents
      .map((student) => {
        const feeStatus = feeTracking.find(
          (t) => t.studentId === student.id && t.term === selectedTerm && t.academicYear === currentYear
        )
        return { student, feeStatus }
      })
      .filter((item) => !item.feeStatus?.feePaid && item.feeStatus)
  }, [filteredStudents, feeTracking, selectedTerm, currentYear])

  // Mark fee as paid
  const handleMarkAsPaid = (studentId: string) => {
    const updatedTracking = feeTracking.map((t) => {
      if (
        t.studentId === studentId &&
        t.term === selectedTerm &&
        t.academicYear === currentYear
      ) {
        return {
          ...t,
          feePaid: true,
          amountPaid: t.amountDue,
          status: 'paid',
        }
      }
      return t
    })

    // Also update student record
    const updatedStudents = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          feePaid: true,
          feeLastPaymentDate: new Date().toISOString(),
        }
      }
      return s
    })

    setFeeTracking(updatedTracking)
    setStudents(updatedStudents)
  }

  // Send fee reminder to single parent
  const handleSendFeeReminder = async (studentId: string) => {
    try {
      setSending(studentId)
      const student = students.find((s) => s.id === studentId)
      if (!student || !student.parentEmail) {
        setSendMessage({ type: 'error', text: 'Parent email not found' })
        return
      }

      const feeStatus = feeTracking.find(
        (t) => t.studentId === studentId && t.term === selectedTerm && t.academicYear === currentYear
      )

      if (!feeStatus) {
        setSendMessage({ type: 'error', text: 'Fee information not found' })
        return
      }

      // Send email via backend
      await apiService.post('/send-fee-reminder-email', {
        parentEmail: student.parentEmail,
        studentName: `${student.firstName} ${student.lastName}`,
        registrationNumber: student.registrationNumber,
        amountDue: feeStatus.amountDue,
        term: selectedTerm,
        academicYear: currentYear,
        studentId: studentId,
      })

      // Mark notification as sent
      const updatedTracking = feeTracking.map((t) => {
        if (
          t.studentId === studentId &&
          t.term === selectedTerm &&
          t.academicYear === currentYear
        ) {
          return {
            ...t,
            notificationSentDate: new Date().toISOString(),
            notificationSentBy: user?.id || 'unknown',
          }
        }
        return t
      })
      setFeeTracking(updatedTracking)

      setSendMessage({
        type: 'success',
        text: `Fee reminder sent to ${student.parentName}`,
      })
    } catch (error) {
      console.error('Failed to send fee reminder:', error)
      setSendMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send fee reminder',
      })
    } finally {
      setSending(null)
    }
  }

  // Bulk send to all outstanding
  const handleBulkSendFeeReminders = async () => {
    if (outstandingFees.length === 0) {
      setSendMessage({ type: 'error', text: 'No outstanding fees to remind' })
      return
    }

    try {
      setIsBulkSending(true)
      let successCount = 0
      let failureCount = 0

      for (const item of outstandingFees) {
        try {
          const student = item.student
          if (!student || !student.parentEmail) continue

          const feeStatus = item.feeStatus
          if (!feeStatus) continue

          await apiService.post('/send-fee-reminder-email', {
            parentEmail: student.parentEmail,
            studentName: `${student.firstName} ${student.lastName}`,
            registrationNumber: student.registrationNumber,
            amountDue: feeStatus.amountDue,
            term: selectedTerm,
            academicYear: currentYear,
            studentId: student.id,
          })

          // Mark notification as sent
          const updatedTracking = feeTracking.map((t) => {
            if (
              t.studentId === student.id &&
              t.term === selectedTerm &&
              t.academicYear === currentYear
            ) {
              return {
                ...t,
                notificationSentDate: new Date().toISOString(),
                notificationSentBy: user?.id || 'unknown',
              }
            }
            return t
          })
          setFeeTracking(updatedTracking)

          successCount++
        } catch (error) {
          console.error('Failed to send to individual parent:', error)
          failureCount++
        }
      }

      setSendMessage({
        type: successCount > 0 ? 'success' : 'error',
        text: `Bulk send completed: ${successCount} successful${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      })
    } catch (error) {
      console.error('Bulk send error:', error)
      setSendMessage({
        type: 'error',
        text: 'Failed to initiate bulk send',
      })
    } finally {
      setIsBulkSending(false)
    }
  }

  // Export fees report
  const handleExport = () => {
    const dataToExport = filteredStudents.map((student) => {
      const feeStatus = feeTracking.find(
        (t) => t.studentId === student.id && t.term === selectedTerm && t.academicYear === currentYear
      )
      return {
        'Student Name': `${student.firstName} ${student.lastName}`,
        'Registration Number': student.registrationNumber,
        Class: student.class,
        'Parent Name': student.parentName,
        'Parent Email': student.parentEmail,
        'Amount Due': feeStatus?.amountDue || 0,
        'Amount Paid': feeStatus?.amountPaid || 0,
        Status: feeStatus?.status || 'unknown',
        'Notification Sent': feeStatus?.notificationSentDate ? 'Yes' : 'No',
      }
    })
    exportToCSV(dataToExport, `fees_report_${selectedTerm}_${currentYear}`)
  }

  const columns = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'registrationNumber', label: 'Registration' },
    { key: 'class', label: 'Class' },
    { key: 'parentName', label: 'Parent' },
    { key: 'parentEmail', label: 'Parent Email' },
  ]

  // Calculate statistics
  const stats = useMemo(() => {
    const tracking = feeTracking.filter(
      (t) => t.term === selectedTerm && t.academicYear === currentYear
    )
    return {
      total: tracking.length,
      paid: tracking.filter((t) => t.feePaid).length,
      outstanding: tracking.filter((t) => !t.feePaid).length,
      totalAmount: tracking.reduce((sum, t) => sum + t.amountDue, 0),
      collectedAmount: tracking.reduce((sum, t) => sum + t.amountPaid, 0),
    }
  }, [feeTracking, selectedTerm, currentYear])

  return (
    <div className="p-8">
      {sendMessage && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            sendMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <AlertCircle size={20} />
          <span>{sendMessage.text}</span>
          <button
            onClick={() => setSendMessage(null)}
            className="ml-auto text-lg font-semibold"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">School Fees Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track student fee payments and send reminders</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Export Report
          </button>
          <button
            onClick={handleBulkSendFeeReminders}
            disabled={isBulkSending || outstandingFees.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-black shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isBulkSending ? (
              <>
                <Mail size={20} className="animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Mail size={20} />
                Send to Outstanding ({outstandingFees.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="card-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Students</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
            </div>
            <DollarSign className="text-blue-500 opacity-20" size={48} />
          </div>
        </div>

        <div className="card-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-300">Fees Paid</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.paid}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Students</p>
            </div>
            <CheckCircle2 className="text-green-500 opacity-20" size={48} />
          </div>
        </div>

        <div className="card-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-300">Outstanding</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.outstanding}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Students</p>
            </div>
            <Clock className="text-orange-500 opacity-20" size={48} />
          </div>
        </div>

        <div className="card-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700">
          <div>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Total Due</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₦{stats.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border border-indigo-200 dark:border-indigo-700">
          <div>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Collected</p>
            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              ₦{stats.collectedAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Student
            </label>
            <input
              type="text"
              placeholder="Name or registration..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="input-field">
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fee Status
            </label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="input-field">
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="outstanding">Outstanding</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Term
            </label>
            <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="input-field">
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              &nbsp;
            </label>
            <button
              onClick={() => initializeStudentFeeTracking(students)}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Initialize Fees
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card-lg">
        <Table
          columns={columns}
          data={filteredStudents.map((student) => {
            const feeStatus = feeTracking.find(
              (t) => t.studentId === student.id && t.term === selectedTerm && t.academicYear === currentYear
            )
            return {
              ...student,
              statusBadge: feeStatus?.feePaid ? (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  ✓ Paid
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                  ✗ Outstanding
                </span>
              ),
              actions: (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleSendFeeReminder(student.id)}
                    disabled={sending === student.id}
                    className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send fee reminder"
                  >
                    {sending === student.id ? (
                      <Mail size={18} className="animate-pulse" />
                    ) : (
                      <Mail size={18} />
                    )}
                  </button>
                  {!feeStatus?.feePaid && (
                    <button
                      onClick={() => handleMarkAsPaid(student.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Mark fees as paid"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              ),
            }
          })}
          columns={[
            ...columns,
            { key: 'statusBadge', label: 'Fee Status' },
          ]}
        />
        {filteredStudents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No students found</p>
          </div>
        )}
      </div>
    </div>
  )
}
