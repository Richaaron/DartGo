import { DEFAULT_GRADE_SCALE, StudentResult, SubjectResult } from '../types'

const getGradeScale = (score: number) => {
  return DEFAULT_GRADE_SCALE.find(
    (scale) => score >= scale.minScore && score <= scale.maxScore
  )
}

/**
 * Get position suffix (1st, 2nd, 3rd, 4th, etc.)
 */
export const getPositionSuffix = (position: number): string => {
  if (position === 1) return '1st'
  if (position === 2) return '2nd'
  if (position === 3) return '3rd'
  return `${position}th`
}

/**
 * Calculate positions for results within a class/term
 * Results are ranked by percentage (highest first)
 */
export const calculatePositions = (results: SubjectResult[], studentId?: string): SubjectResult[] => {
  if (results.length === 0) return results

  // Sort by percentage (descending)
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage)

  // Assign positions accounting for ties
  let position = 1
  let previousPercentage = sorted[0].percentage
  const withPositions = sorted.map((result, index) => {
    if (index > 0 && result.percentage < previousPercentage) {
      position = index + 1
    }
    previousPercentage = result.percentage

    return {
      ...result,
      position,
      positionText: getPositionSuffix(position),
    }
  })

  // If filtering for specific student, return that student's result with position
  if (studentId) {
    return withPositions.filter(r => r.studentId === studentId)
  }

  return withPositions
}

/**
 * Get class/term positions for a specific student
 */
export const getStudentClassPosition = (
  allResults: SubjectResult[],
  studentId: string,
  term: string,
  academicYear: string,
  classLevel?: string
): { position: number; positionText: string; totalStudents: number } => {
  // Filter results for same term and year
  const termResults = allResults.filter(r => r.term === term && r.academicYear === academicYear)

  if (termResults.length === 0) {
    return { position: 0, positionText: 'N/A', totalStudents: 0 }
  }

  // Get unique students by average score
  const studentAverages = new Map<string, number>()
  termResults.forEach(result => {
    const current = studentAverages.get(result.studentId) || 0
    const avg = (current + result.percentage) / (result.studentId === Array.from(studentAverages.keys()).find(k => k === result.studentId) ? 2 : 1)
    studentAverages.set(result.studentId, avg)
  })

  // Sort students by average
  const sortedStudents = Array.from(studentAverages.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])

  const position = sortedStudents.indexOf(studentId) + 1
  return {
    position,
    positionText: position > 0 ? getPositionSuffix(position) : 'N/A',
    totalStudents: sortedStudents.length,
  }
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

export const formatDate = (date: string | undefined | null): string => {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'N/A'
  }
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
  const randomCode = Math.random().toString(36).slice(2, 7).toUpperCase() // 5 random alphanumeric chars
  const name = lastName 
    ? `${firstName.toLowerCase()}_${lastName.toLowerCase()}`
    : firstName.toLowerCase().replace(/\s/g, '')
  const username = `${name}${randomCode.slice(0, 2)}` // Shorter username
  const password = `Fs${randomCode}` // Fs + 5 chars = 7 chars total (shorter)
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

