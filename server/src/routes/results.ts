import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

const parseAssignedSubjects = (subjectValue: string | null | undefined) =>
  (subjectValue || '')
    .split(',')
    .map((subject) => subject.trim())
    .filter(Boolean)

// Helper to map DB to camelCase for frontend
const mapResult = (r: any) => ({
  id: r.id,
  studentId: r.student_id,
  subjectId: r.subject_id,
  classId: r.class_id,
  term: r.term,
  academicYear: r.academic_year,
  ca1Score: r.ca1_score || 0,
  ca2Score: r.ca2_score || 0,
  caScore: r.ca_score || (Number(r.ca1_score || 0) + Number(r.ca2_score || 0)),
  examScore: r.exam_score || 0,
  totalScore: r.total_score || 0,
  grade: r.grade,
  remark: r.remark,
  teacherId: r.teacher_id,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (r: any) => ({
  student_id: r.studentId,
  subject_id: r.subjectId,
  class_id: r.classId,
  term: r.term,
  academic_year: r.academicYear,
  ca1_score: r.ca1Score || 0,
  ca2_score: r.ca2Score || 0,
  ca_score: r.caScore || (Number(r.ca1Score || 0) + Number(r.ca2Score || 0)),
  exam_score: r.examScore || 0,
  total_score: r.totalScore || (Number(r.caScore || 0) + Number(r.ca1Score || 0) + Number(r.ca2Score || 0) + Number(r.examScore || 0)),
  grade: r.grade,
  remark: r.remark,
  teacher_id: r.teacherId,
  status: r.status || 'DRAFT'
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, classId, term, academicYear } = req.query
    let query = supabase.from('subject_results').select('*')
    
    if (studentId) query = query.eq('student_id', studentId)
    if (classId) query = query.eq('class_id', classId)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)

    const { data, error } = await query
    if (error) throw error
    res.json(data?.map(mapResult) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

router.post('/bulk', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid payload. Expected an array of results.' })
    }
    const results = req.body.map(mapToDB)
    const user = req.user

    // If teacher, verify they only update their assigned subject
    if (user?.role === 'Teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('subject')
        .eq('id', user.id)
        .single()

      const allowedSubjectNames = parseAssignedSubjects(teacher?.subject)
      const { data: teacherSubjects, error: teacherSubjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .in('name', allowedSubjectNames.length > 0 ? allowedSubjectNames : [''])

      if (teacherSubjectsError) throw teacherSubjectsError

      const allowedSubjectIds = new Set((teacherSubjects || []).map((subject: any) => subject.id))
      const unauthorized = results.some((r: any) => !allowedSubjectIds.has(r.subject_id))
      if (unauthorized) {
        return res.status(403).json({ error: 'You can only enter results for your assigned subjects' })
      }
    }

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
