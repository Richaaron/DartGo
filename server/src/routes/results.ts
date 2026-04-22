import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapResult = (r: any) => ({
  id: r.id,
  studentId: r.student_id,
  subjectId: r.subject_id,
  term: r.term,
  academicYear: r.academic_year,
  caScore: r.ca_score,
  examScore: r.exam_score,
  totalScore: r.total_score,
  grade: r.grade,
  remark: r.remark,
  teacherId: r.teacher_id,
  createdAt: r.created_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (r: any) => ({
  student_id: r.studentId,
  subject_id: r.subjectId,
  term: r.term,
  academic_year: r.academicYear,
  ca_score: r.caScore,
  exam_score: r.examScore,
  total_score: r.totalScore,
  grade: r.grade,
  remark: r.remark,
  teacher_id: r.teacherId
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, term, academicYear } = req.query
    let query = supabase.from('subject_results').select('*')
    
    if (studentId) query = query.eq('student_id', studentId)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)

    const { data, error } = await query
    if (error) throw error
    res.json(data?.map(mapResult) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

router.post('/bulk', authenticate, authorize(['Admin', 'Teacher']), async (req, res) => {
  try {
    const results = req.body.map(mapToDB)
    const { data, error } = await supabase
      .from('subject_results')
      .upsert(results, { onConflict: 'student_id,subject_id,term,academic_year' })
      .select()
    
    if (error) throw error
    res.json(data?.map(mapResult) || [])
  } catch (error) {
    console.error('[RESULTS] Bulk update error:', error)
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
    res.json(data?.map(mapResult) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student results' })
  }
})

export default router
