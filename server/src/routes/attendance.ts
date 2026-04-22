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
    const attendanceRecords = req.body
    const recordedBy = req.user?.id

    const mappedRecords = attendanceRecords.map((r: any) => ({
      student_id: r.studentId,
      class_id: r.classId,
      date: r.date,
      status: r.status?.toUpperCase(),
      remarks: r.remarks,
      recorded_by: recordedBy
    }))

    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        mappedRecords,
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
