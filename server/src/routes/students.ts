import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { sendStudentRegistrationEmail } from '../utils/email'
import { sendParentCredentialsSMS } from '../utils/sms'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapStudent = (s: any) => ({
  id: s.id,
  studentId: s.registration_number || s.student_id,
  firstName: s.first_name,
  lastName: s.last_name,
  class: s.class_id,
  level: s.level,
  gender: s.gender,
  dateOfBirth: s.date_of_birth,
  status: s.status,
  parentName: s.parent_name,
  parentEmail: s.parent_email,
  parentPhone: s.parent_phone,
  parentUsername: s.parent_username,
  parentPassword: s.parent_password,
  address: s.address,
  image: s.image,
  enrollmentDate: s.enrollment_date,
  createdAt: s.created_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (s: any) => {
  const mapped: any = {
    registration_number: s.registrationNumber || s.studentId,
    first_name: s.firstName,
    last_name: s.lastName,
    class_id: s.class,
    class_name: s.class, // Add class_name to satisfy DB constraint
    level: s.level,
    gender: s.gender,
    status: s.status,
    parent_name: s.parentName,
    parent_email: s.parentEmail,
    parent_phone: s.parentPhone,
    parent_username: s.parentUsername,
    parent_password: s.parentPassword,
    address: s.address,
    image: s.image,
    enrollment_date: s.enrollmentDate
  }

  // Handle dateOfBirth conversion carefully
  if (s.dateOfBirth) {
    try {
      mapped.date_of_birth = new Date(s.dateOfBirth).toISOString()
    } catch (e) {
      console.warn('[STUDENTS] Invalid date of birth provided:', s.dateOfBirth)
    }
  }

  return mapped
}

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
  } catch (error: any) {
    console.error('[STUDENTS] PUT /:id error:', error)
    res.status(error.status || 500).json({ 
      error: error.message || 'Failed to update student',
      details: error.details || undefined
    })
  }
})

router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const dbData = mapToDB(req.body)
    const user = req.user

    console.log('[STUDENTS] Creating student with data:', JSON.stringify(dbData, null, 2))

    // If teacher, verify they are assigned to this class
    if (user?.role === 'Teacher') {
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('assigned_classes')
        .eq('id', user.id)
        .single()
      
      if (teacherError) {
        console.error('[STUDENTS] Failed to fetch teacher assigned classes:', teacherError)
        return res.status(500).json({ error: 'Failed to verify teacher permissions' })
      }

      if (!teacher?.assigned_classes?.includes(dbData.class_id)) {
        console.warn(`[STUDENTS] Teacher ${user.id} tried to add student to unassigned class: ${dbData.class_id}. Assigned:`, teacher?.assigned_classes)
        return res.status(403).json({ error: 'You can only add students to your assigned classes' })
      }
    }

    const { data, error } = await supabase
      .from('students')
      .insert([dbData])
      .select()
      .maybeSingle() // Use maybeSingle to prevent PGRST116 error if something unexpected happens
    
    if (error) {
      console.error('[STUDENTS] Database insert error:', JSON.stringify(error, null, 2))
      return res.status(400).json({ 
        error: error.message || 'Database error',
        details: error.details,
        hint: error.hint
      })
    }

    if (!data) {
      throw new Error('No data returned from database after insert')
    }
    
    console.log('[STUDENTS] Student created successfully:', data.id)
    
    // Send email notification (Background - but awaited to ensure completion in serverless)
    if (data.parent_email) {
      try {
        console.log(`[STUDENTS] Sending registration email to: ${data.parent_email}`)
        await sendStudentRegistrationEmail(data.parent_email, `${data.first_name} ${data.last_name}`, data.registration_number || data.student_id, data.parent_username, data.parent_password, data.id)
      } catch (err) {
        console.error('[STUDENTS] Failed to send registration email:', err)
      }
    }

    // Send SMS notification (Background - but awaited to ensure completion in serverless)
    if (data.parent_phone) {
      try {
        console.log(`[STUDENTS] Sending registration SMS to: ${data.parent_phone}`)
        await sendParentCredentialsSMS(
          data.parent_phone, 
          `${data.first_name} ${data.last_name}`, 
          data.parent_username, 
          data.parent_password,
          data.id
        )
      } catch (err) {
        console.error('[STUDENTS] Failed to send registration SMS:', err)
      }
    }
    
    return res.status(201).json(mapStudent(data))
  } catch (error: any) {
    console.error('[STUDENTS] POST / error:', error)
    return res.status(error.status || 500).json({ 
      error: error.message || 'Failed to create student',
      details: error.details || undefined,
      hint: error.hint || undefined
    })
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
  } catch (error: any) {
    console.error('[STUDENTS] DELETE /:id error:', error)
    res.status(error.status || 500).json({ 
      error: error.message || 'Failed to delete student',
      details: error.details || undefined
    })
  }
})

export default router
