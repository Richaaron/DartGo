import { Router } from 'express'
import { SubjectResult } from '../models/SubjectResult.js'
import { Student } from '../models/Student.js'
import { Subject } from '../models/Subject.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'
import { sendResultPublishedEmail, sendLowGradesEmail } from '../utils/email.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, term, academicYear } = req.query
    const filter: any = {}
    if (studentId) filter.studentId = studentId
    if (term) filter.term = term
    if (academicYear) filter.academicYear = academicYear
    
    const results = await SubjectResult.find(filter)
      .populate('studentId')
      .populate('subjectId')
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await SubjectResult.findById(req.params.id)
      .populate('studentId')
      .populate('subjectId')
    if (!result) return res.status(404).json({ error: 'Result not found' })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch result' })
  }
})

router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req, res) => {
  try {
    const result = new SubjectResult(req.body)
    await result.save()
    
    // Fetch student to get parent email
    const student = await Student.findById(result.studentId)
    if (student && student.email) {
      sendResultPublishedEmail(student.email, `${student.firstName} ${student.lastName}`, result.term, result.academicYear, result.studentId.toString())
        .catch(err => console.error('Failed to send result email', err))
      
      // Check for low grades and send alert
      if (result.percentage < 60) {
        const subject = await Subject.findById(result.subjectId)
        const subjectName = subject?.name || 'Unknown Subject'
        sendLowGradesEmail(student.email, `${student.firstName} ${student.lastName}`, [subjectName], result.studentId.toString())
          .catch(err => console.error('Failed to send low grades email', err))
      }
    }
    
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create result' })
  }
})

router.put('/:id', authenticate, authorize(['Admin', 'Teacher']), async (req, res) => {
  try {
    const result = await SubjectResult.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!result) return res.status(404).json({ error: 'Result not found' })
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update result' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const result = await SubjectResult.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Result not found' })
    res.json({ message: 'Result deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete result' })
  }
})

router.post('/bulk', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const { term, academicYear, results } = req.body // results: Array<{ registrationNumber, subjectId, firstCA, secondCA, exam, remarks }>
    const recordedBy = req.user?.id

    const ops = []
    const emailNotifications: Array<{ email: string; name: string; subjects: string[] }> = []

    for (const item of results) {
      const student = await Student.findOne({ registrationNumber: item.registrationNumber })
      if (!student) continue

      const totalScore = item.firstCA + item.secondCA + item.exam
      const percentage = totalScore // total is out of 100
      
      // Calculate grade (simple logic for now)
      let grade = 'F'
      let gradePoint = 0
      if (percentage >= 70) { grade = 'A'; gradePoint = 5 }
      else if (percentage >= 60) { grade = 'B'; gradePoint = 4 }
      else if (percentage >= 50) { grade = 'C'; gradePoint = 3 }
      else if (percentage >= 45) { grade = 'D'; gradePoint = 2 }
      else if (percentage >= 40) { grade = 'E'; gradePoint = 1 }

      ops.push({
        updateOne: {
          filter: { studentId: student._id, subjectId: item.subjectId, term, academicYear },
          update: { 
            ...item, 
            studentId: student._id, 
            totalScore, 
            percentage, 
            grade, 
            gradePoint, 
            recordedBy,
            dateRecorded: new Date().toISOString()
          },
          upsert: true
        }
      })

      // Track low grades for email notification
      if (percentage < 60 && student.email) {
        const subject = await Subject.findById(item.subjectId)
        const subjectName = subject?.name || 'Unknown Subject'
        const existingNotif = emailNotifications.find(n => n.email === student.email)
        if (existingNotif) {
          existingNotif.subjects.push(subjectName)
        } else {
          emailNotifications.push({
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
            subjects: [subjectName]
          })
        }
      }
    }

    if (ops.length > 0) {
      await SubjectResult.bulkWrite(ops)
    }

    // Send low grades emails
    for (const notif of emailNotifications) {
      sendLowGradesEmail(notif.email, notif.name, notif.subjects)
        .catch(err => console.error('Failed to send low grades email', err))
    }
    
    res.json({ message: `Successfully processed ${ops.length} results` })
  } catch (error) {
    res.status(400).json({ error: 'Failed to process bulk results' })
  }
})

export default router
