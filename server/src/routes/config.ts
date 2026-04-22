import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapConfig = (c: any) => ({
  id: c.id,
  schoolName: c.school_name,
  currentTerm: c.current_term,
  currentAcademicYear: c.current_academic_year,
  themeColor: c.theme_color,
  schoolLogo: c.school_logo,
  availableClasses: c.available_classes,
  updatedAt: c.updated_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (c: any) => ({
  id: c.id,
  school_name: c.schoolName,
  current_term: c.currentTerm,
  current_academic_year: c.currentAcademicYear,
  theme_color: c.themeColor,
  school_logo: c.schoolLogo,
  available_classes: c.availableClasses
})

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
    res.json(mapConfig(config))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school config' })
  }
})

router.put('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('school_config')
      .upsert({ ...dbData, id: dbData.id || undefined }) // Use existing ID if provided
      .select()
      .single()
    
    if (error) throw error
    res.json(mapConfig(data))
  } catch (error) {
    console.error('[CONFIG] Update error:', error)
    res.status(400).json({ error: 'Failed to update school config' })
  }
})

export default router
