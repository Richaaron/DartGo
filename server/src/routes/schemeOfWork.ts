import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, term, academicYear } = req.query
    let query = supabase.from('schemes_of_work').select('*')
    
    if (studentId) query = query.eq('student_id', studentId)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schemes of work' })
  }
})

router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const uploadedBy = req.user?.id
    const { data, error } = await supabase
      .from('schemes_of_work')
      .insert([{ ...req.body, uploaded_by: uploadedBy }])
      .select()
      .single()
    
    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create scheme of work' })
  }
})

router.put('/:id', authenticate, authorize(['Admin', 'Teacher']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schemes_of_work')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Scheme of work not found' })
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update scheme of work' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('schemes_of_work')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Scheme of work deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scheme of work' })
  }
})

export default router
