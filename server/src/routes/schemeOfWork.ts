import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { SchemeOfWork } from '../models/SchemeOfWork.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/schemes'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only .pdf, .doc, .docx and .txt files are allowed'))
    }
  }
})

// Get all schemes of work for a teacher
router.get('/teacher/:teacherId', authenticate, async (req: AuthRequest, res) => {
  try {
    const schemes = await SchemeOfWork.find({ 
      teacherId: req.params.teacherId 
    }).sort({ academicYear: -1, term: -1 })
    res.json(schemes)
  } catch (error) {
    console.error('Error fetching schemes of work:', error)
    res.status(500).json({ error: 'Failed to fetch schemes of work' })
  }
})

// Get scheme of work by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const scheme = await SchemeOfWork.findById(req.params.id)
    if (!scheme) return res.status(404).json({ error: 'Scheme of work not found' })
    res.json(scheme)
  } catch (error) {
    console.error('Error fetching scheme of work:', error)
    res.status(500).json({ error: 'Failed to fetch scheme of work' })
  }
})

// Create new scheme of work (Teachers and Admin)
router.post('/', authenticate, authorize(['Teacher', 'Admin']), async (req: AuthRequest, res) => {
  try {
    const {
      teacherId,
      subjectId,
      classId,
      academicYear,
      term,
      curriculumId,
      topics,
      notes,
    } = req.body

    if (!teacherId || !subjectId || !classId || !academicYear || !term || !curriculumId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if user is teacher or admin
    const userEmail = req.user?.email
    if (req.user?.role === 'Teacher' && teacherId !== userEmail) {
      return res.status(403).json({ error: 'Teachers can only create schemes for themselves' })
    }

    const newScheme = new SchemeOfWork({
      teacherId,
      subjectId,
      classId,
      academicYear,
      term,
      curriculumId,
      topics: topics || [],
      uploadedBy: userEmail,
      notes,
      status: 'DRAFT',
    })

    await newScheme.save()
    res.status(201).json(newScheme)
  } catch (error) {
    console.error('Error creating scheme of work:', error)
    res.status(400).json({ error: 'Failed to create scheme of work' })
  }
})

// Update scheme of work
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const scheme = await SchemeOfWork.findById(req.params.id)
    if (!scheme) return res.status(404).json({ error: 'Scheme of work not found' })

    // Check authorization
    if (req.user?.role === 'Teacher' && scheme.teacherId !== req.user?.email) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { topics, notes, status } = req.body

    if (topics) scheme.topics = topics
    if (notes) scheme.notes = notes
    if (status && req.user?.role === 'Admin') scheme.status = status

    scheme.lastUpdated = new Date()
    await scheme.save()

    res.json(scheme)
  } catch (error) {
    console.error('Error updating scheme of work:', error)
    res.status(400).json({ error: 'Failed to update scheme of work' })
  }
})

// Submit scheme of work for approval
router.put('/:id/submit', authenticate, authorize(['Teacher', 'Admin']), async (req: AuthRequest, res) => {
  try {
    const scheme = await SchemeOfWork.findById(req.params.id)
    if (!scheme) return res.status(404).json({ error: 'Scheme of work not found' })

    if (req.user?.role === 'Teacher' && scheme.teacherId !== req.user?.email) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    scheme.status = 'SUBMITTED'
    scheme.lastUpdated = new Date()
    await scheme.save()

    res.json({ message: 'Scheme of work submitted for approval', scheme })
  } catch (error) {
    console.error('Error submitting scheme:', error)
    res.status(400).json({ error: 'Failed to submit scheme of work' })
  }
})

// Approve scheme of work (Admin only)
router.put('/:id/approve', authenticate, authorize(['Admin']), async (req: AuthRequest, res) => {
  try {
    const scheme = await SchemeOfWork.findByIdAndUpdate(
      req.params.id,
      {
        status: 'APPROVED',
        approvedBy: req.user?.email,
        approvalDate: new Date(),
        lastUpdated: new Date(),
      },
      { new: true }
    )

    if (!scheme) return res.status(404).json({ error: 'Scheme of work not found' })
    res.json({ message: 'Scheme of work approved', scheme })
  } catch (error) {
    console.error('Error approving scheme:', error)
    res.status(400).json({ error: 'Failed to approve scheme of work' })
  }
})

// Update topic status
router.put('/:id/topic/:weekNumber', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body
    const scheme = await SchemeOfWork.findById(req.params.id)

    if (!scheme) return res.status(404).json({ error: 'Scheme of work not found' })

    if (req.user?.role === 'Teacher' && scheme.teacherId !== req.user?.email) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const topic = scheme.topics.find(t => t.weekNumber === parseInt(req.params.weekNumber))
    if (!topic) return res.status(404).json({ error: 'Topic not found' })

    topic.status = status
    scheme.lastUpdated = new Date()
    await scheme.save()

    res.json(scheme)
  } catch (error) {
    console.error('Error updating topic status:', error)
    res.status(400).json({ error: 'Failed to update topic status' })
  }
})

// Delete scheme of work
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const scheme = await SchemeOfWork.findById(req.params.id)
    if (!scheme) return res.status(404).json({ error: 'Scheme of work not found' })

    if (req.user?.role === 'Teacher' && scheme.teacherId !== req.user?.email) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (scheme.status !== 'DRAFT' && req.user?.role !== 'Admin') {
      return res.status(400).json({ error: 'Only draft schemes can be deleted' })
    }

    await SchemeOfWork.findByIdAndDelete(req.params.id)
    res.json({ message: 'Scheme of work deleted' })
  } catch (error) {
    console.error('Error deleting scheme:', error)
    res.status(500).json({ error: 'Failed to delete scheme of work' })
  }
})

// Get schemes by subject and class
router.get('/subject/:subjectId/class/:classId', authenticate, async (req, res) => {
  try {
    const schemes = await SchemeOfWork.find({
      subjectId: req.params.subjectId,
      classId: req.params.classId,
      status: 'ACTIVE',
    })
    res.json(schemes)
  } catch (error) {
    console.error('Error fetching schemes:', error)
    res.status(500).json({ error: 'Failed to fetch schemes' })
  }
})

// Upload Scheme of Work file (Admin only)
router.post('/upload', authenticate, authorize(['Admin']), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const {
      teacherId,
      subjectId,
      classId,
      academicYear,
      term,
      curriculumId,
      notes,
    } = req.body

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!teacherId || !subjectId || !classId || !academicYear || !term || !curriculumId) {
      // Cleanup uploaded file if missing required fields
      if (req.file) fs.unlinkSync(req.file.path)
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const newScheme = new SchemeOfWork({
      teacherId,
      subjectId,
      classId,
      academicYear,
      term,
      curriculumId,
      topics: [], // File-based schemes might not have structured topics
      uploadedBy: req.user?.email,
      notes,
      status: 'APPROVED', // Admin uploads are auto-approved
      fileUrl: `/uploads/schemes/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    })

    await newScheme.save()
    res.status(201).json(newScheme)
  } catch (error) {
    console.error('Error uploading scheme file:', error)
    if (req.file) fs.unlinkSync(req.file.path)
    res.status(400).json({ error: 'Failed to upload scheme of work file' })
  }
})

export default router
