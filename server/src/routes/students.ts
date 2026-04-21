import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'
import { sendStudentRegistrationEmail } from '../utils/email'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
    
    if (error) throw error
    res.json(data)
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
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([req.body])
      .select()
      .single()
    
    if (error) throw error
    
    // Send email notification
    if (data.parent_email) {
      sendStudentRegistrationEmail(data.parent_email, `${data.first_name} ${data.last_name}`, data.student_id, data.id)
        .catch(err => console.error('Failed to send registration email', err))
    }
    
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create student' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Student not found' })
    res.json(data)
  } catch (error) {
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
