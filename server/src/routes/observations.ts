import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase
const mapObservation = (o: any) => ({
  id: o.id,
  studentId: o.student_id,
  term: o.term,
  academicYear: o.academic_year,
  recordedBy: o.recorded_by,
  punctuality: o.punctuality,
  neatness: o.neatness,
  politeness: o.politeness,
  honesty: o.honesty,
  relationshipWithOthers: o.relationship_with_others,
  leadership: o.leadership,
  emotionalStability: o.emotional_stability,
  health: o.health,
  selfControl: o.self_control,
  attendance: o.attendance,
  cooperation: o.cooperation,
  reliability: o.reliability,
  socialHabits: o.social_habits,
  manualSkills: o.manual_skills,
  dexterity: o.dexterity,
  fluency: o.fluency,
  handwriting: o.handwriting,
  sports: o.sports,
  crafts: o.crafts,
  hobbies: o.hobbies,
  createdAt: o.created_at,
  updatedAt: o.updated_at
})

// Helper to map camelCase to DB snake_case
const mapToDB = (o: any) => ({
  student_id: o.studentId,
  term: o.term,
  academic_year: o.academicYear,
  punctuality: o.punctuality,
  neatness: o.neatness,
  politeness: o.politeness,
  honesty: o.honesty,
  relationship_with_others: o.relationshipWithOthers,
  leadership: o.leadership,
  emotional_stability: o.emotionalStability,
  health: o.health,
  self_control: o.selfControl,
  attendance: o.attendance,
  cooperation: o.cooperation,
  reliability: o.reliability,
  social_habits: o.socialHabits,
  manual_skills: o.manualSkills,
  dexterity: o.dexterity,
  fluency: o.fluency,
  handwriting: o.handwriting,
  sports: o.sports,
  crafts: o.crafts,
  hobbies: o.hobbies
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, term, academicYear } = req.query
    let query = supabase.from('observations').select('*')
    
    if (studentId) query = query.eq('student_id', studentId)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)

    const { data, error } = await query
    if (error) throw error
    res.json(data?.map(mapObservation) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch observations' })
  }
})

router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const dbData = mapToDB(req.body)
    const recordedBy = req.user?.id

    const { data, error } = await supabase
      .from('observations')
      .upsert({ ...dbData, recorded_by: recordedBy }, { onConflict: 'student_id,term,academic_year' })
      .select()
      .single()
    
    if (error) throw error
    res.json(mapObservation(data))
  } catch (error) {
    console.error('[OBSERVATIONS] Save error:', error)
    res.status(400).json({ error: 'Failed to save observation' })
  }
})

export default router
