import { Router } from 'express'
import { Attendance } from '../models/Attendance.js'
import { Student } from '../models/Student.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'
import { sendAttendanceWarningEmail } from '../utils/email.js'

const router = Router()

// Get attendance for a specific date or student
router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, date, startDate, endDate } = req.query
    const filter: any = {}
    
    if (studentId) filter.studentId = studentId
    if (date) filter.date = date
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate }
    }
    
    const records = await Attendance.find(filter).populate('studentId', 'firstName lastName registrationNumber class')
    res.json(records)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance records' })
  }
})

// Bulk save attendance for a class on a specific date
router.post('/bulk', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const { date, records } = req.body // records: Array<{ studentId, status, remarks }>
    const recordedBy = req.user?.id

    const ops = records.map((record: any) => ({
      updateOne: {
        filter: { studentId: record.studentId, date },
        update: { ...record, date, recordedBy },
        upsert: true
      }
    }))

    await Attendance.bulkWrite(ops)
    
    // Check for low attendance and send warnings
    for (const record of records) {
      if (record.status === 'Absent') {
        const student = await Student.findById(record.studentId)
        if (student) {
          const attendanceRecords = await Attendance.find({ studentId: record.studentId })
          const presentCount = attendanceRecords.filter(r => r.status === 'Present').length
          const attendancePercentage = (presentCount / attendanceRecords.length) * 100
          
          if (attendancePercentage < 75 && student.email) {
            sendAttendanceWarningEmail(student.email, `${student.firstName} ${student.lastName}`, attendancePercentage, student._id.toString())
              .catch(err => console.error('Failed to send attendance warning', err))
          }
        }
      }
    }
    
    res.json({ message: 'Attendance updated successfully' })
  } catch (error) {
    res.status(400).json({ error: 'Failed to save attendance' })
  }
})

export default router
