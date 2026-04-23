import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { sendTeacherCredentialsEmail } from '../utils/email'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapTeacher = (t: any) => ({
  id: t.id,
  teacherId: t.teacher_id,
  name: t.name,
  username: t.username,
  email: t.email,
  subject: t.subject || 'Form Teacher',
  level: t.level,
  assignedClasses: t.assigned_classes || [],
  image: t.image,
  createdAt: t.created_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (t: any) => {
  const mapped: any = {
    teacher_id: t.teacherId,
    name: t.name,
    username: t.username,
    email: t.email,
    subject: t.subject || '',
    level: t.level,
    assigned_classes: t.assignedClasses,
    image: t.image
  }

  if (typeof t.password === 'string' && t.password.trim()) {
    mapped.password = t.password
  }

  return mapped
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
    
    if (error) throw error
    res.json(data?.map(mapTeacher) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' })
  }
})

router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const originalPassword = req.body.password

    if (dbData.password) {
      dbData.password = await bcrypt.hash(dbData.password, 10)
    }

    const { data, error } = await supabase
      .from('teachers')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error

    // Send credentials email to teacher
    if (data.email) {
      try {
        await sendTeacherCredentialsEmail(
          data.email,
          data.name,
          data.username,
          originalPassword
        )
      } catch (emailError) {
        console.error('[TEACHERS] Failed to send credentials email:', emailError)
        // We don't fail the whole request if email fails, but we log it
      }
    }

    res.status(201).json(mapTeacher(data))
  } catch (error) {
    console.error('[TEACHERS] Create error:', error)
    res.status(400).json({ error: 'Failed to create teacher' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)

    if (dbData.password) {
      const { data: currentTeacher } = await supabase
        .from('teachers')
        .select('password')
        .eq('id', req.params.id)
        .single()

      if (currentTeacher && dbData.password !== currentTeacher.password) {
        dbData.password = await bcrypt.hash(dbData.password, 10)
      }
    }

    const { data, error } = await supabase
      .from('teachers')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Teacher not found' })
    res.json(mapTeacher(data))
  } catch (error) {
    console.error('[TEACHERS] Update error:', error)
    res.status(400).json({ error: 'Failed to update teacher' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Teacher deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete teacher' })
  }
})

export default router
