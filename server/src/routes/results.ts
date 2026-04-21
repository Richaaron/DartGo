import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, term, academicYear } = req.query
    let query = supabase.from('subject_results').select('*')
    
    if (studentId) query = query.eq('student_id', studentId)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

router.post('/bulk', authenticate, authorize(['Admin', 'Teacher']), async (req, res) => {
  try {
    const results = req.body
    const { data, error } = await supabase
      .from('subject_results')
      .upsert(results, { onConflict: 'student_id,subject_id,term,academic_year' })
      .select()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to save results' })
  }
})

router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subject_results')
      .select('*')
      .eq('student_id', req.params.studentId)
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student results' })
  }
})

export default router
