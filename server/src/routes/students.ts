import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { sendStudentRegistrationEmail } from '../utils/email'
import { sendParentCredentialsSMS } from '../utils/sms'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapStudent = (s: any) => ({
  id: s.id,
  studentId: s.student_id,
  firstName: s.first_name,
  lastName: s.last_name,
  class: s.class_id,
  level: s.level,
  status: s.status,
  parentName: s.parent_name,
  parentEmail: s.parent_email,
  parentPhone: s.parent_phone,
  parentUsername: s.parent_username,
  parentPassword: s.parent_password,
  image: s.image,
  enrollmentDate: s.enrollment_date,
  createdAt: s.created_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (s: any) => ({
  student_id: s.studentId,
  first_name: s.firstName,
  last_name: s.lastName,
  class_id: s.class,
  level: s.level,
  status: s.status,
  parent_name: s.parentName,
  parent_email: s.parentEmail,
  parent_phone: s.parentPhone,
  parent_username: s.parentUsername,
  parent_password: s.parentPassword,
  image: s.image,
  enrollment_date: s.enrollmentDate
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
    
    if (error) throw error
    res.json(data?.map(mapStudent) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.params.id)
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Student not found' })
    res.json(mapStudent(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const dbData = mapToDB(req.body)
    const user = req.user

    // If teacher, verify they are assigned to this class
    if (user?.role === 'Teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('assigned_classes')
        .eq('id', user.id)
        .single()
      
      if (!teacher?.assigned_classes?.includes(dbData.class_id)) {
        return res.status(403).json({ error: 'You can only add students to your assigned classes' })
      }
    }

    const { data, error } = await supabase
      .from('students')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    
    // Send email notification
    if (data.parent_email) {
      sendStudentRegistrationEmail(data.parent_email, `${data.first_name} ${data.last_name}`, data.student_id, data.id)
        .catch(err => console.error('Failed to send registration email', err))
    }

    // Send SMS notification
    if (data.parent_phone) {
      sendParentCredentialsSMS(
        data.parent_phone, 
        `${data.first_name} ${data.last_name}`, 
        data.parent_username, 
        data.parent_password,
        data.id
      ).catch(err => console.error('Failed to send registration SMS', err))
    }
    
    res.status(201).json(mapStudent(data))
  } catch (error) {
    console.error('[STUDENTS] Create error:', error)
    res.status(400).json({ error: 'Failed to create student' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('students')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Student not found' })
    res.json(mapStudent(data))
  } catch (error) {
    console.error('[STUDENTS] Update error:', error)
    res.status(400).json({ error: 'Failed to update student' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Student deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

export default router
