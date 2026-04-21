import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { classId, date } = req.query
    let query = supabase.from('attendance').select('*')
    
    if (classId) query = query.eq('class_id', classId)
    if (date) query = query.eq('date', date)

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
})

router.post('/bulk', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const attendanceRecords = req.body
    const recordedBy = req.user?.id

    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        attendanceRecords.map((r: any) => ({ ...r, recorded_by: recordedBy })),
        { onConflict: 'student_id,date' }
      )
      .select()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to save attendance' })
  }
})

export default router
