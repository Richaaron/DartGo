import { Router } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapScheme = (s: any) => ({
  id: s.id,
  subjectId: s.subject_id,
  class: s.class,
  term: s.term,
  academicYear: s.academic_year,
  weeks: s.weeks || [],
  status: s.status,
  uploadedBy: s.uploaded_by,
  fileUrl: s.file_url,
  notes: s.notes,
  createdAt: s.created_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (s: any) => ({
  subject_id: s.subjectId,
  class: s.class,
  term: s.term,
  academic_year: s.academicYear,
  weeks: s.weeks,
  status: s.status,
  file_url: s.fileUrl,
  notes: s.notes
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { subjectId, class: className, term, academicYear } = req.query
    let query = supabase.from('schemes_of_work').select('*')
    
    if (subjectId) query = query.eq('subject_id', subjectId)
    if (className) query = query.eq('class', className)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)

    const { data, error } = await query
    if (error) throw error
    res.json(data?.map(mapScheme) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schemes of work' })
  }
})

router.get('/:subjectId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schemes_of_work')
      .select('*')
      .eq('subject_id', req.params.subjectId)
    
    if (error) throw error
    res.json(data?.map(mapScheme) || [])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schemes of work' })
  }
})

router.post('/upload', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    // In a serverless environment, file upload needs to be handled differently (e.g. S3 or Supabase Storage)
    // For now, we'll just log and return a placeholder if no storage is configured.
    return res.status(501).json({ error: 'File uploads are currently being migrated to Supabase Storage.' })
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' })
  }
})

router.post('/', authenticate, authorize(['Admin', 'Teacher']), async (req: AuthRequest, res) => {
  try {
    const uploadedBy = req.user?.id
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('schemes_of_work')
      .insert([{ ...dbData, uploaded_by: uploadedBy }])
      .select()
      .single()
    
    if (error) throw error
    res.status(201).json(mapScheme(data))
  } catch (error) {
    console.error('[SCHEME] Create error:', error)
    res.status(400).json({ error: 'Failed to create scheme of work' })
  }
})

router.put('/:id', authenticate, authorize(['Admin', 'Teacher']), async (req, res) => {
  try {
    const dbData = mapToDB(req.body)
    const { data, error } = await supabase
      .from('schemes_of_work')
      .update(dbData)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Scheme of work not found' })
    res.json(mapScheme(data))
  } catch (error) {
    console.error('[SCHEME] Update error:', error)
    res.status(400).json({ error: 'Failed to update scheme of work' })
  }
})

router.delete('/:id', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('schemes_of_work')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Scheme of work deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scheme of work' })
  }
})

export default router
