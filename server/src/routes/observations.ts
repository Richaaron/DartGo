import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, term, academicYear } = req.query
    let query = supabase.from('observations').select('*')
    
    if (studentId) query = query.eq('student_id', studentId)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch observations' })
  }
})

router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const { student_id, term, academic_year } = req.body
    const recordedBy = req.user?.id

    const { data, error } = await supabase
      .from('observations')
      .upsert({ ...req.body, recorded_by: recordedBy }, { onConflict: 'student_id,term,academic_year' })
      .select()
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to save observation' })
  }
})

export default router
