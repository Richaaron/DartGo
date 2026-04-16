import { Router } from 'express'
import { Student } from '../models/Student'
import { authenticate, authorize } from '../middleware/auth'
import { sendStudentRegistrationEmail } from '../utils/email'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const students = await Student.find()
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ error: 'Student not found' })
    res.json(student)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const student = new Student(req.body)
    await student.save()
    
    // Send email notification
    if (student.email) {
      sendStudentRegistrationEmail(student.email, `${student.firstName} ${student.lastName}`, student.registrationNumber, student._id.toString())
        .catch(err => console.error('Failed to send registration email', err))
    }
    
    res.status(201).json(student)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create student' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!student) return res.status(404).json({ error: 'Student not found' })
    res.json(student)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update student' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id)
    if (!student) return res.status(404).json({ error: 'Student not found' })
    res.json({ message: 'Student deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

export default router
