import express, { Request, Response } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Get AI-powered insights for all students (Admin/Teacher)
router.get('/student-insights', authenticate, authorize(['Admin', 'Teacher']), async (req: Request, res: Response) => {
  try {
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'ACTIVE')

    const { data: results, error: resultError } = await supabase
      .from('subject_results')
      .select('*')

    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('*')

    if (studentError || resultError || subjectError) {
      throw (studentError || resultError || subjectError)
    }

    const insights = students?.map(student => {
      const studentResults = results?.filter(r => r.student_id === student.student_id) || []
      
      if (studentResults.length === 0) return null

      const avgScore = studentResults.reduce((sum, r) => sum + Number(r.total_score || 0), 0) / studentResults.length
      
      // Find weak subjects (below 50 or significantly below student's own average)
      const weakSubjects = studentResults
        .filter(r => Number(r.total_score || 0) < 50 || Number(r.total_score || 0) < (avgScore - 15))
        .map(r => {
          const subject = subjects?.find(s => s.id === r.subject_id || s.code === r.subject_id)
          return {
            subjectName: subject?.name || 'Unknown',
            score: Number(r.total_score || 0),
            reason: Number(r.total_score || 0) < 50 ? 'Failing grade' : 'Significant drop from average'
          }
        })

      // Trend analysis (simple version: comparing terms if available)
      const terms = [...new Set(studentResults.map(r => r.term))].sort()
      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      let trendMessage = 'Performance is consistent.'

      if (terms.length >= 2) {
        const lastTerm = terms[terms.length - 1]
        const prevTerm = terms[terms.length - 2]
        
        const lastTermResults = studentResults.filter(r => r.term === lastTerm)
        const prevTermResults = studentResults.filter(r => r.term === prevTerm)

        const lastAvg = lastTermResults.reduce((sum, r) => sum + Number(r.total_score || 0), 0) / lastTermResults.length
        const prevAvg = prevTermResults.reduce((sum, r) => sum + Number(r.total_score || 0), 0) / prevTermResults.length

        if (lastAvg > prevAvg + 5) {
          trend = 'improving'
          trendMessage = `Showing improvement! Average rose from ${prevAvg.toFixed(1)} to ${lastAvg.toFixed(1)}.`
        } else if (lastAvg < prevAvg - 5) {
          trend = 'declining'
          trendMessage = `Alert: Performance has dropped from ${prevAvg.toFixed(1)} to ${lastAvg.toFixed(1)}.`
        }
      }

      // Generate Recommendation
      let recommendation = 'Maintain current study habits.'
      if (trend === 'declining') {
        recommendation = 'Schedule a parent-teacher conference to discuss recent performance drops.'
      } else if (weakSubjects.length > 0) {
        recommendation = `Focus on ${weakSubjects.map(s => s.subjectName).join(', ')} with additional tutoring.`
      } else if (avgScore > 80) {
        recommendation = 'Excellent work. Consider enrollment in advanced enrichment programs.'
      }

      return {
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        registrationNumber: student.student_id,
        class: student.class_id,
        averageScore: avgScore,
        trend,
        trendMessage,
        weakSubjects,
        recommendation,
        isAtRisk: trend === 'declining' || avgScore < 45 || weakSubjects.length >= 3
      }
    }).filter(i => i !== null) || []

    res.json(insights)
  } catch (error) {
    res.status(500).json({ message: 'Error generating insights', error })
  }
})

export default router
