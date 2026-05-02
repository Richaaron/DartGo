import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// New subjects curriculum - these are the authoritative subjects
const DEFAULT_SUBJECTS = [
  // Pre-Nursery Subjects (8 subjects)
  { id: 'pre-1', name: 'Mathematics', code: 'MTH', level: 'Pre-Nursery', creditUnits: 1 },
  { id: 'pre-2', name: 'English Language', code: 'ENG', level: 'Pre-Nursery', creditUnits: 1 },
  { id: 'pre-3', name: 'Social Habits', code: 'SOH', level: 'Pre-Nursery', creditUnits: 1 },
  { id: 'pre-4', name: 'Health Habits', code: 'HHB', level: 'Pre-Nursery', creditUnits: 1 },
  { id: 'pre-5', name: 'Rhymes', code: 'RHM', level: 'Pre-Nursery', creditUnits: 1 },
  { id: 'pre-6', name: 'Primary Science', code: 'PSC', level: 'Pre-Nursery', creditUnits: 1 },
  { id: 'pre-7', name: 'Identification of Numbers', code: 'ION', level: 'Pre-Nursery', creditUnits: 1 },
  { id: 'pre-8', name: 'Identification of Letters', code: 'IOL', level: 'Pre-Nursery', creditUnits: 1 },
  
  // Nursery Subjects (8 subjects)
  { id: 'nur-1', name: 'Mathematics', code: 'MTH', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-2', name: 'English Language', code: 'ENG', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-3', name: 'Social Habits', code: 'SOH', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-4', name: 'Health Habits', code: 'HHB', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-5', name: 'Rhymes', code: 'RHM', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-6', name: 'Primary Science', code: 'PSC', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-7', name: 'Identification of Numbers', code: 'ION', level: 'Nursery', creditUnits: 2 },
  { id: 'nur-8', name: 'Identification of Letters', code: 'IOL', level: 'Nursery', creditUnits: 2 },
  
  // Primary Subjects (16 subjects)
  { id: 'pri-1', name: 'Mathematics', code: 'MTH', level: 'Primary', creditUnits: 2 },
  { id: 'pri-2', name: 'English Language', code: 'ENG', level: 'Primary', creditUnits: 2 },
  { id: 'pri-3', name: 'Basic Science', code: 'BSC', level: 'Primary', creditUnits: 2 },
  { id: 'pri-4', name: 'Basic Technology', code: 'BTE', level: 'Primary', creditUnits: 2 },
  { id: 'pri-5', name: 'Agricultural Science', code: 'AGS', level: 'Primary', creditUnits: 2 },
  { id: 'pri-6', name: 'Physical & Health Education', code: 'PHE', level: 'Primary', creditUnits: 2 },
  { id: 'pri-7', name: 'Vocational Aptitude', code: 'VAP', level: 'Primary', creditUnits: 2 },
  { id: 'pri-8', name: 'Quantitative Reasoning', code: 'QTR', level: 'Primary', creditUnits: 2 },
  { id: 'pri-9', name: 'Verbal Reasoning', code: 'VRR', level: 'Primary', creditUnits: 2 },
  { id: 'pri-10', name: 'Writing', code: 'WRT', level: 'Primary', creditUnits: 2 },
  { id: 'pri-11', name: 'Creative Arts', code: 'CAR', level: 'Primary', creditUnits: 2 },
  { id: 'pri-12', name: 'National Values', code: 'NVL', level: 'Primary', creditUnits: 2 },
  { id: 'pri-13', name: 'Religious Studies', code: 'RES', level: 'Primary', creditUnits: 2 },
  { id: 'pri-14', name: 'Computer Studies', code: 'CST', level: 'Primary', creditUnits: 2 },
  { id: 'pri-15', name: 'Phonics', code: 'PHN', level: 'Primary', creditUnits: 2 },
  { id: 'pri-16', name: 'Literature', code: 'LIT', level: 'Primary', creditUnits: 2 },
  
  // Secondary Subjects - Junior Secondary (13 subjects)
  { id: 'jss-1', name: 'Mathematics', code: 'MTH', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-2', name: 'English Language', code: 'ENG', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-3', name: 'Basic Science', code: 'BSC', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-4', name: 'Basic Technology', code: 'BTE', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-5', name: 'Agricultural Science', code: 'AGS', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-6', name: 'National Values', code: 'NVL', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-7', name: 'Fine Arts', code: 'FAA', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'jss-8', name: 'Business Studies', code: 'BUS', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
  { id: 'jss-9', name: 'Physical & Health Education', code: 'PHE', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-10', name: 'Computer Studies', code: 'CST', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-11', name: 'Hausa', code: 'HAU', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-12', name: 'Home Economics', code: 'HEC', level: 'Secondary', creditUnits: 2 },
  { id: 'jss-13', name: 'Religious Studies', code: 'REL', level: 'Secondary', creditUnits: 2 },
  
  // Secondary Subjects - Senior Secondary (15 subjects)
  { id: 'ss-1', name: 'Mathematics', code: 'MTH', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-2', name: 'English Language', code: 'ENG', level: 'Secondary', creditUnits: 3, subjectCategory: 'Art' },
  { id: 'ss-3', name: 'Biology', code: 'BIO', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-4', name: 'Chemistry', code: 'CHM', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-5', name: 'Physics', code: 'PHY', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-6', name: 'Accounting', code: 'ACC', level: 'Secondary', creditUnits: 3, subjectCategory: 'Commercial' },
  { id: 'ss-7', name: 'Commerce', code: 'COM', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
  { id: 'ss-8', name: 'Government', code: 'GOV', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'ss-9', name: 'Literature in English', code: 'LIT', level: 'Secondary', creditUnits: 3, subjectCategory: 'Art' },
  { id: 'ss-10', name: 'Marketing', code: 'MKT', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
  { id: 'ss-11', name: 'Civic Education', code: 'CVE', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'ss-12', name: 'Economics', code: 'ECO', level: 'Secondary', creditUnits: 3, subjectCategory: 'Commercial' },
  { id: 'ss-13', name: 'Geography', code: 'GEO', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-14', name: 'Religious Studies', code: 'RES', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'ss-15', name: 'I.C.T', code: 'ICT', level: 'Secondary', creditUnits: 2, subjectCategory: 'Science' },
]

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
    // Return the new subjects directly instead of from Supabase
    res.json(DEFAULT_SUBJECTS)
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
