import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('school_config')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 is 'no rows found'

    let config = data
    if (!config) {
      const { data: newConfig, error: insertError } = await supabase
        .from('school_config')
        .insert({
          current_term: '1st Term',
          current_academic_year: '2023/2024',
          available_classes: ['Pre-Nursery', 'Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Secondary 1', 'Secondary 2', 'Secondary 3']
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      config = newConfig
    }
    res.json(config)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school config' })
  }
})

router.put('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('school_config')
      .upsert({ ...req.body, id: req.body.id || undefined }) // Use existing ID if provided
      .select()
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update school config' })
  }
})

export default router
