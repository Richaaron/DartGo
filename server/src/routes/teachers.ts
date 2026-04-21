import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' })
  }
})

router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .insert([req.body])
      .select()
      .single()
    
    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create teacher' })
  }
})

router.put('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Teacher not found' })
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update teacher' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Teacher deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete teacher' })
  }
})

export default router
