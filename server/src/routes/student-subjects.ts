import express, { Request, Response } from 'express'
import { authorize } from '../middleware/auth'

const router = express.Router()

router.get('/', authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  res.json([])
})

router.get('/:studentId', authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  res.json([])
})

router.post('/', authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  res.status(201).json({ message: 'Subjects assigned successfully', data: req.body })
})

router.put('/:id', authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  res.json({ message: 'Subject assignment updated', data: req.body })
})

router.delete('/:id', authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  res.json({ message: 'Subject assignment deleted' })
})

export default router


