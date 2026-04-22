import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Get all deadlines
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deadlines')
      .select('*')
      .order('deadline_date', { ascending: true })
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deadlines' })
  }
})

// Create a deadline (Admin only)
router.post('/', authenticate, authorize(['Admin']), async (req: AuthRequest, res) => {
  try {
    const { title, description, deadline_date, type } = req.body
    const { data, error } = await supabase
      .from('deadlines')
      .insert({
        title,
        description,
        deadline_date,
        type,
        created_by: req.user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create deadline' })
  }
})

// Update a deadline (Admin only)
router.put('/:id', authenticate, authorize(['Admin']), async (req: AuthRequest, res) => {
  try {
    const { title, description, deadline_date, type, status } = req.body
    const { data, error } = await supabase
      .from('deadlines')
      .update({
        title,
        description,
        deadline_date,
        type,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update deadline' })
  }
})

// Delete a deadline (Admin only)
router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('deadlines')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Deadline deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete deadline' })
  }
})

export default router
