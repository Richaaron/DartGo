import express, { Request, Response } from 'express'
import { authorize } from '../middleware/auth'

const router = express.Router()

// Mock endpoint for student-subjects until fully implemented
router.get('/', authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  res.json([])
})

router.get('/:studentId', authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  res.json([])
})

export default router
