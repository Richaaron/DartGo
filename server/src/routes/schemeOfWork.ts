import { Router } from 'express'
import Busboy from 'busboy'
import { supabase } from '../config/supabase'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to map DB to camelCase for frontend
const mapScheme = (s: any) => ({
  id: s.id,
  subjectId: s.subject_id,
  classId: s.class_id,
  term: s.term,
  academicYear: s.academic_year,
  curriculumId: s.curriculum_id,
  topics: s.topics || [],
  status: s.status,
  uploadedBy: s.uploaded_by,
  fileUrl: s.file_url,
  fileName: s.file_name,
  notes: s.notes,
  createdAt: s.created_at,
  updatedAt: s.updated_at
})

// Helper to map frontend camelCase to DB snake_case
const mapToDB = (s: any) => ({
  subject_id: s.subjectId,
  class_id: s.classId || s.class,
  term: s.term,
  academic_year: s.academicYear,
  curriculum_id: s.curriculumId,
  topics: s.topics,
  status: s.status,
  file_url: s.fileUrl,
  file_name: s.fileName,
  notes: s.notes
})

router.get('/', authenticate, async (req, res) => {
  try {
    const { subjectId, classId, term, academicYear } = req.query
    let query = supabase.from('schemes_of_work').select('*')
    
    if (subjectId) query = query.eq('subject_id', subjectId)
    if (classId) query = query.eq('class_id', classId)
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
    const busboy = Busboy({ headers: req.headers })
    const fields: any = {}
    let fileBuffer: Buffer | null = null
    let fileName = ''
    let contentType = ''

    busboy.on('field', (name, val) => {
      fields[name] = val
    })

    busboy.on('file', (name, file, info) => {
      const chunks: any[] = []
      fileName = info.filename
      contentType = info.mimeType
      file.on('data', (data) => chunks.push(data))
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks)
      })
    })

    busboy.on('finish', async () => {
      try {
        if (!fileBuffer) return res.status(400).json({ error: 'No file uploaded' })

        // 1. Upload to Supabase Storage
        const fileExt = fileName.split('.').pop()
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: storageError } = await supabase.storage
          .from('schemes')
          .upload(filePath, fileBuffer, { contentType })

        if (storageError) throw storageError

        // 2. Get Public URL
        const { data: urlData } = supabase.storage
          .from('schemes')
          .getPublicUrl(filePath)

        const fileUrl = urlData.publicUrl

        // 3. Save to Database
        const dbData = {
          subject_id: fields.subjectId,
          class_id: fields.classId,
          academic_year: fields.academicYear,
          term: parseInt(fields.term),
          curriculum_id: fields.curriculumId,
          notes: fields.notes,
          file_url: fileUrl,
          file_name: fileName,
          uploaded_by: req.user?.id,
          status: 'PENDING'
        }

        const { data, error: dbError } = await supabase
          .from('schemes_of_work')
          .insert([dbData])
          .select()
          .single()

        if (dbError) throw dbError
        res.status(201).json(mapScheme(data))
      } catch (err) {
        console.error('[UPLOAD] Processing error:', err)
        res.status(500).json({ error: 'Failed to process upload' })
      }
    })

    req.pipe(busboy)
  } catch (error) {
    console.error('[UPLOAD] Server error:', error)
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
