import { DEFAULT_GRADE_SCALE, StudentResult } from '../types'

const getGradeScale = (score: number) => {
  return DEFAULT_GRADE_SCALE.find(
    (scale) => score >= scale.minScore && score <= scale.maxScore
  )
}

export const calculateGrade = (score: number): string => {
  return getGradeScale(score)?.grade || 'N/A'
}

export const calculateGradePoint = (score: number): number => {
  return getGradeScale(score)?.gradePoint || 0
}

export const calculatePercentage = (score: number, totalScore: number): number => {
  return (score / totalScore) * 100
}

export const calculateClassAverage = (results: StudentResult[]): number => {
  if (results.length === 0) return 0
  const sum = results.reduce((acc, result) => acc + result.score, 0)
  return Math.round((sum / results.length) * 100) / 100
}

export const calculateGPA = (results: StudentResult[]): number => {
  if (results.length === 0) return 0
  const totalGradePoints = results.reduce(
    (acc, result) => acc + calculateGradePoint(result.percentage),
    0
  )
  return Math.round((totalGradePoints / results.length) * 100) / 100
}

export const getPerformanceRating = (gpa: number): string => {
  if (gpa >= 3.5) return 'Excellent'
  if (gpa >= 3.0) return 'Good'
  if (gpa >= 2.0) return 'Average'
  if (gpa >= 1.0) return 'Poor'
  return 'Very Poor'
}

export const getPerformanceTrend = (previousGPA: number, currentGPA: number): string => {
  if (currentGPA > previousGPA + 0.1) return 'Improving'
  if (currentGPA < previousGPA - 0.1) return 'Declining'
  return 'Stable'
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const calculateStudentAge = (dateOfBirth: string): number => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }
  return age
}

export const generateRegistrationNumber = (level: string): string => {
  const randomDigits = Math.floor(10000 + Math.random() * 90000) // 5 random digits
  return `FVS${randomDigits}`
}

export const generateParentCredentials = (firstName: string, lastName?: string) => {
  const timestamp = Date.now().toString().slice(-4)
  const name = lastName 
    ? `${firstName.toLowerCase()}_${lastName.toLowerCase()}`
    : firstName.toLowerCase().replace(/\s/g, '')
  const username = `${name}${timestamp}`
  const password = `FS${timestamp}${Math.random().toString(36).slice(-2).toUpperCase()}`
  return {
    username,
    password,
  }
}

export const exportToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value
      }).join(',')
    ),
  ].join('\n')

  const blob = new window.Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export const exportToText = (content: string, filename: string) => {
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
  element.setAttribute('download', `${filename}.txt`)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

// Advanced Grading and Computation Functions
export const calculateWeightedGPA = (
  subjectResults: { score: number; creditUnits: number }[]
): number => {
  if (subjectResults.length === 0) return 0

  const totalWeightedPoints = subjectResults.reduce((sum, result) => {
    const percentage = result.score
    const gradePoint = calculateGradePoint(percentage)
    return sum + gradePoint * result.creditUnits
  }, 0)

  const totalCredits = subjectResults.reduce((sum, result) => sum + result.creditUnits, 0)

  if (totalCredits === 0) return 0
  return Math.round((totalWeightedPoints / totalCredits) * 100) / 100
}

export const getGradeDescription = (grade: string): string => {
  const gradeInfo = DEFAULT_GRADE_SCALE.find((scale) => scale.grade === grade)
  return gradeInfo?.description || 'Not Available'
}

export const calculateClassStatistics = (scores: number[]) => {
  if (scores.length === 0) {
    return {
      average: 0,
      median: 0,
      highestScore: 0,
      lowestScore: 0,
      standardDeviation: 0,
      passRate: 0,
    }
  }

  const sorted = [...scores].sort((a, b) => a - b)
  const average = scores.reduce((a, b) => a + b, 0) / scores.length
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]

  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length
  const standardDeviation = Math.sqrt(variance)

  const passCount = scores.filter((score) => score >= 60).length
  const passRate = (passCount / scores.length) * 100

  return {
    average: Math.round(average * 100) / 100,
    median: Math.round(median * 100) / 100,
    highestScore: sorted[sorted.length - 1],
    lowestScore: sorted[0],
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
  }
}

export const getScoreBracket = (score: number): string => {
  if (score >= 90) return 'Top 10%'
  if (score >= 80) return 'Top 25%'
  if (score >= 70) return 'Above Average'
  if (score >= 60) return 'Average'
  return 'Below Average'
}

export const calculateGradeDistribution = (scores: number[]) => {
  const distribution = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  }

  scores.forEach((score) => {
    const grade = calculateGrade(score)
    if (grade in distribution) {
      distribution[grade as keyof typeof distribution]++
    }
  })

  return distribution
}

export const isPassingGrade = (grade: string): boolean => {
  return grade !== 'F'
}

export const isMeritGrade = (grade: string): boolean => {
  return ['A', 'B'].includes(grade)
}

