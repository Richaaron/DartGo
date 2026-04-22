import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapSubject = (s: any) => ({
  id: s.id,
  code: s.code,
  name: s.name,
  level: s.level,
  category: s.category,
  description: s.description,
  createdAt: s.created_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (s: any) => ({
  code: s.code,
  name: s.name,
  level: s.level,
  category: s.category,
  description: s.description
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
    
    if (error) throw error
    res.json(data?.map(mapSubject) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', req.params.id)
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Subject not found' })
    res.json(mapSubject(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subject' })
  }
})

router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('subjects')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    res.status(201).json(mapSubject(data))
  } catch (error) {
    console.error('[SUBJECTS] Create error:', error)
    res.status(400).json({ error: 'Failed to create subject' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('subjects')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Subject not found' })
    res.json(mapSubject(data))
  } catch (error) {
    console.error('[SUBJECTS] Update error:', error)
    res.status(400).json({ error: 'Failed to update subject' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Subject deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject' })
  }
})

export default router
