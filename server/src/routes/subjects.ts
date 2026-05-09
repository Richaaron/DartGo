import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// New subjects curriculum - these are the authoritative subjects
const DEFAULT_SUBJECTS = [
  // Pre-Nursery & Nursery (7 subjects)
  ...['Pre-Nursery', 'Nursery'].flatMap(level => {
    const prefix = level === 'Pre-Nursery' ? 'PN' : 'NUR';
    return [
      { id: `${level.toLowerCase().substring(0, 3)}-1`, name: 'Mathematics', code: `${prefix}-MTH`, level, creditUnits: 1 },
      { id: `${level.toLowerCase().substring(0, 3)}-2`, name: 'English', code: `${prefix}-ENG`, level, creditUnits: 1 },
      { id: `${level.toLowerCase().substring(0, 3)}-3`, name: 'Social Habits', code: `${prefix}-SOH`, level, creditUnits: 1 },
      { id: `${level.toLowerCase().substring(0, 3)}-4`, name: 'Health Habits', code: `${prefix}-HHB`, level, creditUnits: 1 },
      { id: `${level.toLowerCase().substring(0, 3)}-5`, name: 'Rhymes', code: `${prefix}-RHM`, level, creditUnits: 1 },
      { id: `${level.toLowerCase().substring(0, 3)}-6`, name: 'Primary Science', code: `${prefix}-PSC`, level, creditUnits: 1 },
      { id: `${level.toLowerCase().substring(0, 3)}-7`, name: 'Phonics', code: `${prefix}-PHN`, level, creditUnits: 1 },
    ];
  }),
  
  // Primary 1-3 (17 subjects)
  ...[1, 2, 3].flatMap(p => [
    { id: `pri-${p}-1`, name: 'Mathematics', code: 'PRI-MTH', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-2`, name: 'English Language', code: 'PRI-ENG', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-3`, name: 'National Values', code: 'PRI-NVL', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-4`, name: 'Basic Technology', code: 'PRI-BTE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-5`, name: 'Basic Science', code: 'PRI-BSC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-6`, name: 'Physical & Health Education', code: 'PRI-PHE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-7`, name: 'Computer studies', code: 'PRI-CST', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-8`, name: 'Religious studies', code: 'PRI-REL', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-9`, name: 'Phonics', code: 'PRI-PHN', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-10`, name: 'Home Economics', code: 'PRI-HEC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-11`, name: 'Literature', code: 'PRI-LIT', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-12`, name: 'Vocational Aptitude', code: 'PRI-VAP', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-13`, name: 'Writing', code: 'PRI-WRT', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-14`, name: 'Creative Arts', code: 'PRI-CAR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-15`, name: 'Verbal Reasoning', code: 'PRI-VRR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-16`, name: 'Quantitative Reasoning', code: 'PRI-QTR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-17`, name: 'Agricultural Science', code: 'PRI-AGS', level: 'Primary', creditUnits: 2 },
  ]),

  // Primary 4-6 (16 subjects - same as P1-3 but without Writing)
  ...[4, 5, 6].flatMap(p => [
    { id: `pri-${p}-1`, name: 'Mathematics', code: 'PRI-MTH', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-2`, name: 'English Language', code: 'PRI-ENG', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-3`, name: 'National Values', code: 'PRI-NVL', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-4`, name: 'Basic Technology', code: 'PRI-BTE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-5`, name: 'Basic Science', code: 'PRI-BSC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-6`, name: 'Physical & Health Education', code: 'PRI-PHE', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-7`, name: 'Computer studies', code: 'PRI-CST', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-8`, name: 'Religious studies', code: 'PRI-REL', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-9`, name: 'Phonics', code: 'PRI-PHN', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-10`, name: 'Home Economics', code: 'PRI-HEC', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-11`, name: 'Literature', code: 'PRI-LIT', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-12`, name: 'Vocational Aptitude', code: 'PRI-VAP', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-14`, name: 'Creative Arts', code: 'PRI-CAR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-15`, name: 'Verbal Reasoning', code: 'PRI-VRR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-16`, name: 'Quantitative Reasoning', code: 'PRI-QTR', level: 'Primary', creditUnits: 2 },
    { id: `pri-${p}-17`, name: 'Agricultural Science', code: 'PRI-AGS', level: 'Primary', creditUnits: 2 },
  ]),
  
  // Junior Secondary (13 subjects)
  ...['JSS1', 'JSS2', 'JSS3'].flatMap(level => [
    { id: `${level.toLowerCase()}-1`, name: 'Mathematics', code: 'JSS-MTH', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-2`, name: 'English Language', code: 'JSS-ENG', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-3`, name: 'Basic Technology', code: 'JSS-BTE', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-4`, name: 'Basic Science', code: 'JSS-BSC', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-5`, name: 'Computer Studies', code: 'JSS-CST', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-6`, name: 'Religious Studies', code: 'JSS-REL', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-7`, name: 'Physical & Health Education', code: 'JSS-PHE', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-8`, name: 'Fine Arts', code: 'JSS-FAA', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-9`, name: 'Business Studies', code: 'JSS-BUS', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-10`, name: 'National Values', code: 'JSS-NVL', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-11`, name: 'Agricultural science', code: 'JSS-AGS', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-12`, name: 'Home Economics', code: 'JSS-HEC', level: 'Secondary', creditUnits: 2 },
    { id: `${level.toLowerCase()}-13`, name: 'Hausa', code: 'JSS-HAU', level: 'Secondary', creditUnits: 2 },
  ]),
  
  // Senior Secondary (Science, Art, Commerce, General)
  // General (Core)
  { id: 'ss-g-1', name: 'Mathematics', code: 'SSS-MTH', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-2', name: 'English Language', code: 'SSS-ENG', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-3', name: 'Biology', code: 'SSS-BIO', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-4', name: 'Geography', code: 'SSS-GEO', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-5', name: 'Agricultural Science', code: 'SSS-AGS', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  { id: 'ss-g-6', name: 'Civic Education', code: 'SSS-CVE', level: 'Secondary', creditUnits: 2, subjectCategory: 'General' },
  { id: 'ss-g-7', name: 'Marketing', code: 'SSS-MKT', level: 'Secondary', creditUnits: 2, subjectCategory: 'General' },
  { id: 'ss-g-8', name: 'ICT', code: 'SSS-ICT', level: 'Secondary', creditUnits: 2, subjectCategory: 'General' },
  { id: 'ss-g-9', name: 'Economics', code: 'SSS-ECO', level: 'Secondary', creditUnits: 3, subjectCategory: 'General' },
  
  // Science
  { id: 'ss-sci-1', name: 'Chemistry', code: 'SSS-CHM', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  { id: 'ss-sci-2', name: 'Physics', code: 'SSS-PHY', level: 'Secondary', creditUnits: 3, subjectCategory: 'Science' },
  
  // Art
  { id: 'ss-art-1', name: 'Government', code: 'SSS-GOV', level: 'Secondary', creditUnits: 2, subjectCategory: 'Art' },
  { id: 'ss-art-2', name: 'Literature In English', code: 'SSS-LIT', level: 'Secondary', creditUnits: 3, subjectCategory: 'Art' },
  
  // Commerce
  { id: 'ss-com-1', name: 'Accounting', code: 'SSS-ACC', level: 'Secondary', creditUnits: 3, subjectCategory: 'Commercial' },
  { id: 'ss-com-2', name: 'Commerce', code: 'SSS-COM', level: 'Secondary', creditUnits: 2, subjectCategory: 'Commercial' },
]

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
    
    // Fallback if DB is empty
    res.json(DEFAULT_SUBJECTS)
  } catch (error) {
    console.error('[SUBJECTS] Fetch error:', error)
    // Even on error, return defaults to keep UI working
    res.json(DEFAULT_SUBJECTS)
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
