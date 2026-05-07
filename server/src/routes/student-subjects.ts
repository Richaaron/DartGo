import express, { Request, Response } from 'express'
import { authenticate, authorize } from '../middleware/auth'
import { supabase } from '../config/supabase'

const router = express.Router()

// Map DB row to frontend StudentSubject shape
const mapStudentSubject = (r: any) => ({
  id: r.id,
  studentId: r.student_id,
  subjectId: r.subject_id,
  enrollmentDate: r.enrollment_date || r.created_at || '',
  status: r.status || 'Active',
  academicYear: r.academic_year || '',
  term: r.term ? String(r.term) : '',
  assignedBy: r.assigned_by || '',
  notes: r.notes || '',
})

// GET /student-subjects — fetch all student-subject assignments
router.get('/', authenticate, authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('student_subjects').select('*')
    if (error) throw error
    res.json((data || []).map(mapStudentSubject))
  } catch (err: any) {
    console.error('[STUDENT-SUBJECTS] GET / error:', err)
    // Return empty array instead of 500 so the frontend degrades gracefully
    res.json([])
  }
})

// GET /student-subjects/:studentId — fetch assignments for one student
router.get('/:studentId', authenticate, authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('student_subjects')
      .select('*')
      .eq('student_id', req.params.studentId)
    if (error) throw error
    res.json((data || []).map(mapStudentSubject))
  } catch (err: any) {
    console.error('[STUDENT-SUBJECTS] GET /:studentId error:', err)
    res.json([])
  }
})

// POST /student-subjects — assign a subject to a student
router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, academicYear, term, assignedBy, notes, status } = req.body
    const { data, error } = await supabase
      .from('student_subjects')
      .insert([{
        student_id: studentId,
        subject_id: subjectId,
        academic_year: academicYear,
        term: term,
        assigned_by: assignedBy,
        notes: notes,
        status: status || 'Active',
      }])
      .select()
      .single()
    if (error) throw error
    res.status(201).json(mapStudentSubject(data))
  } catch (err: any) {
    console.error('[STUDENT-SUBJECTS] POST / error:', err)
    res.status(400).json({ error: err.message || 'Failed to assign subject' })
  }
})

// PUT /student-subjects/:id — update an assignment
router.put('/:id', authenticate, authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  try {
    const { status, notes, academicYear, term } = req.body
    const { data, error } = await supabase
      .from('student_subjects')
      .update({ status, notes, academic_year: academicYear, term })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(mapStudentSubject(data))
  } catch (err: any) {
    console.error('[STUDENT-SUBJECTS] PUT /:id error:', err)
    res.status(400).json({ error: err.message || 'Failed to update assignment' })
  }
})

// DELETE /student-subjects/:id — remove an assignment
router.delete('/:id', authenticate, authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('student_subjects').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'Subject assignment deleted' })
  } catch (err: any) {
    console.error('[STUDENT-SUBJECTS] DELETE /:id error:', err)
    res.status(400).json({ error: err.message || 'Failed to delete assignment' })
  }
})

export default router



