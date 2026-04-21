import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { level } = req.query
    let query = supabase.from('curriculums').select('*')
    if (level) query = query.eq('level', level)
    
    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch curriculums' })
  }
})

router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('curriculums')
      .insert([req.body])
      .select()
      .single()
    
    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create curriculum' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('curriculums')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Curriculum not found' })
    res.json(data)
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
