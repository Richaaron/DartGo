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

    const studentIds = [...new Set(mappedRecords.map((record: any) => record.student_id).filter(Boolean))]
    const { data: existingRows, error: existingError } = await supabase
      .from('attendance')
      .select('id, student_id, date')
      .eq('date', date)
      .in('student_id', studentIds)

    if (existingError) {
      console.error('[ATTENDANCE] Failed to check existing records:', existingError)
      return res.status(400).json({ error: `DATABASE_ERROR: ${existingError.message}` })
    }

    const existingByStudentId = new Map(
      (existingRows || []).map((row: any) => [row.student_id, row.id])
    )

    const recordsToUpdate = mappedRecords.filter((record: any) => existingByStudentId.has(record.student_id))
    const recordsToInsert = mappedRecords.filter((record: any) => !existingByStudentId.has(record.student_id))

    const updateResults = await Promise.all(
      recordsToUpdate.map(async (record: any) => {
        const { data, error } = await supabase
          .from('attendance')
          .update({
            class_id: record.class_id,
            status: record.status,
            remarks: record.remarks,
            recorded_by: record.recorded_by
          })
          .eq('id', existingByStudentId.get(record.student_id))
          .select()
          .single()

        if (error) throw error
        return data
      })
    )

    let insertedRows: any[] = []
    if (recordsToInsert.length > 0) {
      const { data, error } = await supabase
        .from('attendance')
        .insert(recordsToInsert)
        .select()

      if (error) {
        console.error('[ATTENDANCE] Supabase Insert Error:', error)
        return res.status(400).json({ error: `DATABASE_ERROR: ${error.message}` })
      }

      insertedRows = data || []
    }

    res.json([...updateResults, ...insertedRows].map(mapAttendance))
  } catch (error: any) {
    console.error('[ATTENDANCE] Route Exception:', error)
    return res.status(500).json({ error: `SERVER_EXCEPTION: ${error.message}` })
  }
})

export default router
