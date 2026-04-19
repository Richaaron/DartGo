import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { Student } from '../models/Student'
import { SubjectResult } from '../models/SubjectResult'
import { Subject } from '../models/Subject'

const router = express.Router()

interface AuthenticatedRequest extends Request {
  user?: any
}

// Get AI-powered insights for all students (Admin)
router.get('/student-insights', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Teacher') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const students = await Student.find({ status: 'Active' })
    const results = await SubjectResult.find()
    const subjects = await Subject.find()

    const insights = students.map(student => {
      const studentResults = results.filter(r => r.studentId.toString() === student._id.toString())
      
      if (studentResults.length === 0) return null

      const avgScore = studentResults.reduce((sum, r) => sum + r.percentage, 0) / studentResults.length
      
      // Find weak subjects (below 50% or significantly below student's own average)
      const weakSubjects = studentResults
        .filter(r => r.percentage < 50 || r.percentage < (avgScore - 15))
        .map(r => {
          const subject = subjects.find(s => s._id.toString() === r.subjectId.toString())
          return {
            subjectName: subject?.name || 'Unknown',
            score: r.percentage,
            reason: r.percentage < 50 ? 'Failing grade' : 'Significant drop from average'
          }
        })

      // Trend analysis (simple version: comparing terms if available)
      const terms = [...new Set(studentResults.map(r => r.term))].sort()
      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      let trendMessage = 'Performance is consistent.'

      if (terms.length >= 2) {
        const lastTerm = terms[terms.length - 1]
        const prevTerm = terms[terms.length - 2]
        
        const lastAvg = studentResults.filter(r => r.term === lastTerm).reduce((sum, r) => sum + r.percentage, 0) / 
                       studentResults.filter(r => r.term === lastTerm).length
        const prevAvg = studentResults.filter(r => r.term === prevTerm).reduce((sum, r) => sum + r.percentage, 0) / 
                       studentResults.filter(r => r.term === prevTerm).length

        if (lastAvg > prevAvg + 5) {
          trend = 'improving'
          trendMessage = `Showing improvement! Average rose from ${prevAvg.toFixed(1)}% to ${lastAvg.toFixed(1)}%.`
        } else if (lastAvg < prevAvg - 5) {
          trend = 'declining'
          trendMessage = `Alert: Performance has dropped from ${prevAvg.toFixed(1)}% to ${lastAvg.toFixed(1)}%.`
        }
      }

      // Generate AI Recommendation
      let recommendation = 'Maintain current study habits.'
      if (trend === 'declining') {
        recommendation = 'Schedule a parent-teacher conference to discuss recent performance drops.'
      } else if (weakSubjects.length > 0) {
        recommendation = `Focus on ${weakSubjects.map(s => s.subjectName).join(', ')} with additional tutoring.`
      } else if (avgScore > 80) {
        recommendation = 'Excellent work. Consider enrollment in advanced enrichment programs.'
      }

      return {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        registrationNumber: student.registrationNumber,
        class: student.class,
        averageScore: avgScore,
        trend,
        trendMessage,
        weakSubjects,
        recommendation,
        isAtRisk: trend === 'declining' || avgScore < 45 || weakSubjects.length >= 3
      }
    }).filter(i => i !== null)

    res.json(insights)
  } catch (error) {
    res.status(500).json({ message: 'Error generating insights', error })
  }
})

export default router
