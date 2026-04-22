import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapCurriculum = (c: any) => ({
  id: c.id,
  name: c.name,
  version: c.version,
  level: c.level,
  yearsOfStudy: c.years_of_study,
  subjects: c.subjects || [],
  implementationDate: c.implementation_date,
  description: c.description,
  curriculum: c.curriculum,
  status: c.status,
  createdBy: c.created_by,
  createdAt: c.created_at,
  updatedAt: c.updated_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (c: any) => ({
  name: c.name,
  version: c.version,
  level: c.level,
  years_of_study: c.yearsOfStudy,
  subjects: c.subjects,
  implementation_date: c.implementationDate,
  description: c.description,
  curriculum: c.curriculum,
  status: c.status
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { level, status } = req.query
    let query = supabase.from('curriculums').select('*')
    if (level) query = query.eq('level', level)
    if (status) query = query.eq('status', status)
    
    const { data, error } = await query
    if (error) throw error
    res.json(data?.map(mapCurriculum) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch curriculums' })
  }
})

router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('curriculums')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    res.status(201).json(mapCurriculum(data))
  } catch (error) {
    res.status(400).json({ error: 'Failed to create curriculum' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('curriculums')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Curriculum not found' })
    res.json(mapCurriculum(data))
  } catch (error) {
    res.status(400).json({ error: 'Failed to update curriculum' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('curriculums')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Curriculum deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete curriculum' })
  }
})

export default router
