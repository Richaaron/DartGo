import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase
const mapAttendance = (a: any) => ({
  id: a.id,
  studentId: a.student_id,
  classId: a.class_id,
  date: a.date,
  status: a.status,
  remarks: a.remarks,
  recordedBy: a.recorded_by,
  createdAt: a.created_at
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { classId, date } = req.query
    let query = supabase.from('attendance').select('*')
    
    if (classId) query = query.eq('class_id', classId)
    if (date) query = query.eq('date', date)

    const { data, error } = await query
    if (error) throw error
    res.json(data?.map(mapAttendance) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
})

router.post('/bulk', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const { date, records } = req.body
    const recordedBy = req.user?.id

    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload. Expected { date, records }' })
    }

    const mappedRecords = records.map((r: any) => ({
      student_id: r.studentId,
      class_id: r.classId,
      date: date,
      status: r.status?.toUpperCase() || 'PRESENT',
      remarks: r.remarks || '',
      recorded_by: recordedBy
    }))

    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        mappedRecords,
        { onConflict: 'student_id,date' }
      )
      .select()
    
    if (error) {
      console.error('[ATTENDANCE] Supabase Upsert Error:', error)
      return res.status(400).json({ error: `DATABASE_ERROR: ${error.message}` })
    }
    res.json(data)
  } catch (error: any) {
    console.error('[ATTENDANCE] Route Exception:', error)
    return res.status(500).json({ error: `SERVER_EXCEPTION: ${error.message}` })
  }
})

export default router
