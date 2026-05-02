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
// Returns both backend names AND frontend aliases (firstCA, secondCA, exam, remarks)
// so the SubjectResult type is satisfied after a create/update
const mapResult = (r: any) => {
  const ca1 = Number(r.ca1_score || 0)
  const ca2 = Number(r.ca2_score || 0)
  const exam = Number(r.exam_score || 0)
  const total = Number(r.total_score || 0)
  const percentage = total  // out of 100 (20+20+60)

  // Map integer term back to string for frontend
  const termMap: Record<number, string> = { 1: 'First', 2: 'Second', 3: 'Third' }
  const termString = termMap[Number(r.term)] || r.term

  return {
    id: r.id,
    studentId: r.student_id,
    subjectId: r.subject_id,
    classId: r.class_id,
    term: termString,
    academicYear: r.academic_year,
    // Backend field names
    ca1Score: ca1,
    ca2Score: ca2,
    examScore: exam,
    // Frontend-compatible aliases (matches SubjectResult type)
    firstCA: ca1,
    secondCA: ca2,
    exam: exam,
    totalScore: total,
    percentage: percentage,
    grade: r.grade,
    gradePoint: 0, // calculated client-side
    remarks: r.remark || '',
    remark: r.remark || '',
    teacherId: r.teacher_id,
    recordedBy: r.teacher_id || '',
    dateRecorded: r.created_at || '',
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

// Helper to map frontend camelCase to DB snake_case
// Supports both frontend field names (firstCA/secondCA/exam/remarks) and
// backend field names (ca1Score/ca2Score/examScore/remark) for compatibility
const mapToDB = (r: any) => {
  // Resolve CA scores — frontend uses firstCA/secondCA, backend uses ca1Score/ca2Score
  const ca1 = Number(r.firstCA ?? r.ca1Score ?? 0)
  const ca2 = Number(r.secondCA ?? r.ca2Score ?? 0)
  const examScore = Number(r.exam ?? r.examScore ?? 0)
  const caTotal = ca1 + ca2
  const totalScore = Number(r.totalScore ?? (caTotal + examScore))

  // Map string term to integer for database
  const termMap: Record<string, number> = { 'First': 1, 'Second': 2, 'Third': 3 }
  const termInt = termMap[r.term] || (isNaN(Number(r.term)) ? 1 : Number(r.term))

  return {
    student_id: r.studentId,
    subject_id: r.subjectId,
    class_id: r.classId || r.class || '',
    term: termInt,
    academic_year: r.academicYear,
    ca1_score: ca1,
    ca2_score: ca2,
    exam_score: examScore,
    total_score: totalScore,
    grade: r.grade,
    remark: r.remark ?? r.remarks ?? '',
    teacher_id: r.teacherId ?? r.recordedBy,
    status: r.status || 'DRAFT'
  }
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, classId, term, academicYear } = req.query
    let query = supabase.from('subject_results').select('*')
    
    if (studentId) query = query.eq('student_id', studentId)
    if (classId) query = query.eq('class_id', classId)
    
    if (term) {
      const termMap: Record<string, number> = { 'First': 1, 'Second': 2, 'Third': 3 }
      const termInt = termMap[term as string] || (isNaN(Number(term)) ? null : Number(term))
      if (termInt !== null) query = query.eq('term', termInt)
    }
    
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

// POST / - Create a single result
router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const mapped = mapToDB(req.body)

    // For teachers: verify they are allowed to enter result for this subject
    const user = req.user
    if (user?.role === 'Teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('subject, assigned_subjects, teacher_type, assigned_classes')
        .eq('id', user.id)
        .single()

      const teacherType = teacher?.teacher_type || ''
      const isFormTeacher = teacherType === 'Form Teacher' || teacherType === 'Form + Subject Teacher'
      const isSubjectTeacher = teacherType === 'Subject Teacher' || teacherType === 'Form + Subject Teacher'

      // Subject teachers: only allowed their assigned subjects
      if (isSubjectTeacher && !isFormTeacher) {
        const allowedNames = parseAssignedSubjects(teacher?.subject)
        const assignedArr: string[] = Array.isArray(teacher?.assigned_subjects) ? teacher.assigned_subjects : []
        const allAllowed = new Set([...allowedNames, ...assignedArr])
        const { data: allowedSubjects } = await supabase.from('subjects').select('id').in('name', [...allAllowed])
        const allowedIds = new Set((allowedSubjects || []).map((s: any) => s.id))
        if (mapped.subject_id && !allowedIds.has(mapped.subject_id)) {
          return res.status(403).json({ error: 'You can only enter results for your assigned subjects' })
        }
      }
    }

    const { data, error } = await supabase
      .from('subject_results')
      .insert(mapped)
      .select()
      .single()

    if (error) throw error
    res.status(201).json(mapResult(data))
  } catch (error: any) {
    console.error('[RESULTS] Create error:', error)
    res.status(400).json({ error: error.message || 'Failed to create result' })
  }
})

// PUT /:id - Update a single result
router.put('/:id', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const mapped = mapToDB(req.body)

    // Verify result belongs to this teacher's scope (optional extra guard)
    const { data: existing, error: fetchErr } = await supabase
      .from('subject_results')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Result not found' })
    }

    const { data, error } = await supabase
      .from('subject_results')
      .update(mapped)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(mapResult(data))
  } catch (error: any) {
    console.error('[RESULTS] Update error:', error)
    res.status(400).json({ error: error.message || 'Failed to update result' })
  }
})

// DELETE /:id - Delete a single result
router.delete('/:id', authenticate, authorize(['Admin', 'Teacher']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('subject_results')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Result deleted successfully' })
  } catch (error: any) {
    console.error('[RESULTS] Delete error:', error)
    res.status(400).json({ error: error.message || 'Failed to delete result' })
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
