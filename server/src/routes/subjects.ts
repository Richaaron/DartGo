import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// New subjects curriculum - these are the authoritative subjects
// Subject categories mapping
const CATEGORY_MAP: Record<string, string> = {
  'CORE': 'General',
  'ELECTIVE': 'Art',
  'VOCATIONAL': 'Commercial',
  'General': 'General',
  'Science': 'Science',
  'Art': 'Art',
  'Commercial': 'Commercial'
};

// Helper to map DB to camelCase for frontend
const mapSubject = (s: any) => {
  // Map DB categories back to user-friendly ones for Senior Secondary
  let category = s.subject_category === 'CORE' ? 'General' : 
                 s.subject_category === 'ELECTIVE' ? 'Art' : 
                 s.subject_category === 'VOCATIONAL' ? 'Commercial' : s.subject_category;

  // Further refine based on specific names if needed for legacy data
  const name = s.name.toLowerCase();
  if (s.level === 'Secondary' && (!category || category === 'General')) {
    if (name.includes('physics') || name.includes('chemistry')) category = 'Science';
    if (name.includes('accounting') || name.includes('commerce')) category = 'Commercial';
    if (name.includes('government') || name.includes('literature in english')) category = 'Art';
  }

  return {
    id: s.id,
    code: s.code,
    name: s.name,
    level: s.level,
    category: category || 'General',
    description: s.description,
    topics: s.topics || [],
    creditUnits: s.credit_units,
    createdAt: s.created_at
  }
}

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (s: any) => ({
  code: s.code,
  name: s.name,
  level: s.level,
  subject_category: s.subjectCategory === 'General' ? 'CORE' : 
                    s.subjectCategory === 'Science' ? 'CORE' :
                    s.subjectCategory === 'Art' ? 'ELECTIVE' :
                    s.subjectCategory === 'Commercial' ? 'VOCATIONAL' : 'CORE',
  description: s.description,
  credit_units: s.creditUnits || 2
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    if (data && data.length > 0) {
      return res.json(data.map(s => {
        const mapped = mapSubject(s);
        return {
          ...mapped,
          subjectCategory: mapped.category // For frontend compatibility
        };
      }))
    }
    
    // If DB is empty, return empty array
    res.json([])
  } catch (error) {
    console.error('[SUBJECTS] Fetch error:', error)
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
