import React, { useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { DEFAULT_GRADE_SCALE } from '../types'
import {
  calculatePercentage,
  calculateGrade,
  calculateGradePoint,
  calculateGPA,
  getPerformanceRating,
  exportToCSV,
  formatDate,
} from '../utils/calculations'

const SUBJECTS = ['English', 'Mathematics', 'Basic Science', 'Social Studies', 'Computer Studies']
const LEVELS = ['Nursery', 'Primary', 'Secondary']
const TERMS = ['First Term', 'Second Term', 'Third Term']
const YEARS = ['2024/2025', '2025/2026', '2026/2027']
const STATUSES = ['Active', 'Inactive', 'Suspended']

interface SimpleStudent {
  id: string
  firstName: string
  lastName: string
  registrationNumber: string
  level: string
  className: string
  status: string
}

interface SimpleResult {
  id: string
  studentId: string
  studentName: string
  subject: string
  score: number
  totalScore: number
  percentage: number
  grade: string
  gradePoint: number
  term: string
  academicYear: string
  dateRecorded: string
}

const initialStudent: Omit<SimpleStudent, 'id'> = {
  firstName: '',
  lastName: '',
  registrationNumber: '',
  level: LEVELS[0],
  className: '',
  status: STATUSES[0],
}

const initialResult: Omit<SimpleResult, 'id' | 'studentName' | 'percentage' | 'grade' | 'gradePoint' | 'dateRecorded'> = {
  studentId: '',
  subject: SUBJECTS[0],
  score: 0,
  totalScore: 100,
  term: TERMS[0],
  academicYear: YEARS[0],
}

const getStudentName = (student: SimpleStudent) => `${student.firstName} ${student.lastName}`

const createId = () => `id-${Math.random().toString(36).slice(2, 10)}`

const navItems = [
  { key: 'dashboard', label: 'Dashboard', description: 'School overview' },
  { key: 'students', label: 'Students', description: 'Student register' },
  { key: 'results', label: 'Results', description: 'Performance ledger' },
  { key: 'reports', label: 'Reports', description: 'Class analytics' },
] as const

type PageKey = (typeof navItems)[number]['key']

function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [students, setStudents] = useLocalStorage<SimpleStudent[]>('simple_students', [])
  const [results, setResults] = useLocalStorage<SimpleResult[]>('simple_results', [])
  const [studentForm, setStudentForm] = useState(initialStudent)
  const [resultForm, setResultForm] = useState(initialResult)
  const [studentSearch, setStudentSearch] = useState('')
  const [resultSearch, setResultSearch] = useState('')
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showResultForm, setShowResultForm] = useState(false)

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    if (!query) return students
    return students.filter((student) =>
      [student.firstName, student.lastName, student.registrationNumber, student.className, student.level]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [studentSearch, students])

  const filteredResults = useMemo(() => {
    const query = resultSearch.trim().toLowerCase()
    if (!query) return results
    return results.filter((result) =>
      [result.studentName, result.subject, result.term, result.academicYear]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [resultSearch, results])

  const addStudent = () => {
    if (!studentForm.firstName.trim() || !studentForm.lastName.trim()) return
    const student: SimpleStudent = {
      id: createId(),
      ...studentForm,
    }
    setStudents([...students, student])
    setStudentForm(initialStudent)
    setShowStudentForm(false)
  }

  const addResult = () => {
    const student = students.find((item) => item.id === resultForm.studentId)
    if (!student) return
    const percentage = calculatePercentage(resultForm.score, resultForm.totalScore)
    const grade = calculateGrade(percentage)
    const gradePoint = calculateGradePoint(percentage)
    const result: SimpleResult = {
      id: createId(),
      studentId: student.id,
      studentName: getStudentName(student),
      subject: resultForm.subject,
      score: resultForm.score,
      totalScore: resultForm.totalScore,
      percentage,
      grade,
      gradePoint,
      term: resultForm.term,
      academicYear: resultForm.academicYear,
      dateRecorded: new Date().toISOString(),
    }
    setResults([...results, result])
    setResultForm(initialResult)
    setShowResultForm(false)
  }

  const deleteStudent = (id: string) => {
    setStudents(students.filter((student) => student.id !== id))
    setResults(results.filter((result) => result.studentId !== id))
  }

  const deleteResult = (id: string) => {
    setResults(results.filter((result) => result.id !== id))
  }

  const summary = useMemo(() => {
    const totalStudents = students.length
    const totalResults = results.length
    const averageScore = totalResults
      ? Math.round((results.reduce((sum, item) => sum + item.percentage, 0) / totalResults) * 100) / 100
      : 0
    const passCount = results.filter((item) => item.percentage >= 50).length
    const passRate = totalResults ? Math.round((passCount / totalResults) * 100) : 0
    return { totalStudents, totalResults, averageScore, passRate }
  }, [students, results])

  const topPerformers = useMemo(() => {
    return students
      .map((student) => {
        const items = results.filter((result) => result.studentId === student.id)
        if (!items.length) return null
        const average = items.reduce((acc, item) => acc + item.percentage, 0) / items.length
        return { student, average: Math.round(average * 100) / 100 }
      })
      .filter((item): item is { student: SimpleStudent; average: number } => Boolean(item))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)
  }, [students, results])

  const gradeDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    DEFAULT_GRADE_SCALE.forEach((scale) => {
      map[scale.grade] = 0
    })
    results.forEach((result) => {
      map[result.grade] = (map[result.grade] || 0) + 1
    })
    return map
  }, [results])

  const downloadStudents = () => {
    if (!students.length) return
    exportToCSV(
      students.map((student) => ({
        Name: getStudentName(student),
        Registration: student.registrationNumber,
        Level: student.level,
        Class: student.className,
        Status: student.status,
      })),
      'students.csv'
    )
  }

  const downloadResults = () => {
    if (!results.length) return
    exportToCSV(
      results.map((result) => ({
        Student: result.studentName,
        Subject: result.subject,
        Score: result.score,
        Total: result.totalScore,
        Percentage: result.percentage.toFixed(2),
        Grade: result.grade,
        Term: result.term,
        Year: result.academicYear,
      })),
      'results.csv'
    )
  }

  return (
    <div className="school-shell min-h-screen pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="school-panel p-6 lg:p-8 mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#d8c1a2] bg-[#f8e7cf] px-4 py-2 text-sm font-semibold text-[#6d5c34] shadow-sm shadow-[#6d5c34]/10">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6d5c34] text-lg font-bold text-white">F</span>
                <span>Folusho Victory Schools</span>
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-[#2f2b22]">School Result Notebook</h1>
              <p className="max-w-2xl text-sm leading-6 text-[#6d5c34]">A simplified, school-friendly reporting system for recording student performance, tracking results, and sharing clear class-level insights.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[42%]">
              <div className="rounded-[1.75rem] border border-[#e2d2b0] bg-[#fff7e3] p-4 text-sm text-[#5c4c33] shadow-sm">
                <p className="font-semibold">School status</p>
                <p className="mt-2 text-lg font-bold">Ready for results</p>
              </div>
              <div className="rounded-[1.75rem] border border-[#e2d2b0] bg-[#fff7e3] p-4 text-sm text-[#5c4c33] shadow-sm">
                <p className="font-semibold">Design goal</p>
                <p className="mt-2 text-lg font-bold">Clean & classroom friendly</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="school-panel p-6">
              <h2 className="school-heading text-xl">Workspace</h2>
              <p className="school-subtitle mt-2">Choose a section to manage students or record term results.</p>
              <div className="mt-6 space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPage(item.key)}
                    className={`school-pill w-full justify-between ${page === item.key ? 'school-pill-active' : ''}`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-slate-500">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="school-panel p-6">
              <h3 className="school-heading text-lg">Quick actions</h3>
              <div className="mt-4 grid gap-3">
                <button onClick={() => setShowStudentForm(true)} className="school-btn">New student</button>
                <button onClick={() => setShowResultForm(true)} className="school-btn-secondary">New result</button>
                <button onClick={downloadStudents} className="school-btn-secondary">Export student list</button>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            {page === 'dashboard' && (
              <section className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Students</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{summary.totalStudents}</p>
                  </div>
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Results</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{summary.totalResults}</p>
                  </div>
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Average</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{summary.averageScore.toFixed(2)}%</p>
                  </div>
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Pass rate</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{summary.passRate}%</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="school-panel p-6">
                    <h3 className="text-lg font-semibold text-[#2f2b22]">Top performers</h3>
                    <div className="mt-5 space-y-3">
                      {topPerformers.length ? (
                        topPerformers.map((item, index) => (
                          <div key={item.student.id} className="rounded-3xl border border-[#e3d5b2] bg-[#fff9f0] p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-semibold text-[#2f2b22]">{getStudentName(item.student)}</p>
                                <p className="text-sm text-[#6d5c34]">{item.student.level} • {item.student.className}</p>
                              </div>
                              <div className="rounded-full bg-[#6d5c34] px-3 py-1 text-sm font-semibold text-white">{item.average}%</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#7c7264]">Add student results to see the top learners.</p>
                      )}
                    </div>
                  </div>
                  <div className="school-panel p-6">
                    <h3 className="text-lg font-semibold text-[#2f2b22]">Grade summary</h3>
                    <div className="mt-5 grid gap-3">
                      {Object.entries(gradeDistribution).map(([grade, count]) => (
                        <div key={grade} className="flex items-center justify-between rounded-3xl border border-[#e3d5b2] bg-[#fff9f0] px-4 py-3">
                          <span className="text-sm font-semibold text-[#6d5c34]">Grade {grade}</span>
                          <span className="text-lg font-semibold text-[#2f2b22]">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {page === 'students' && (
              <section className="space-y-6">
                <div className="school-panel p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#2f2b22]">Student register</h2>
                      <p className="school-subtitle mt-2">View and manage the core student list.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button onClick={() => setShowStudentForm(true)} className="school-btn">Add student</button>
                      <button onClick={downloadStudents} className="school-btn-secondary">Export CSV</button>
                    </div>
                  </div>
                </div>

                <div className="school-panel p-6">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                    <div>
                      <label className="block text-sm font-semibold text-[#2f2b22]">Search students</label>
                      <input
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        placeholder="Search by name, reg no, class or level"
                        className="school-input mt-2"
                      />
                    </div>
                    <div className="rounded-3xl bg-[#fff4dc] px-4 py-3 text-sm text-[#6d5c34] shadow-sm">
                      {filteredStudents.length} students shown
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="school-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Reg. No</th>
                          <th>Level</th>
                          <th>Class</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="odd:bg-white even:bg-[#fff7e7]">
                            <td>{getStudentName(student)}</td>
                            <td>{student.registrationNumber}</td>
                            <td>{student.level}</td>
                            <td>{student.className}</td>
                            <td>{student.status}</td>
                            <td>
                              <button
                                onClick={() => deleteStudent(student.id)}
                                className="rounded-full bg-[#c34141] px-3 py-1 text-xs font-semibold text-white hover:bg-[#9f3131]"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!filteredStudents.length && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-[#7c7264]">
                              No students available yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {page === 'results' && (
              <section className="space-y-6">
                <div className="school-panel p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#2f2b22]">Result ledger</h2>
                      <p className="school-subtitle mt-2">Enter student scores and view the latest term records.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button onClick={() => setShowResultForm(true)} className="school-btn">Add result</button>
                      <button onClick={downloadResults} className="school-btn-secondary">Export CSV</button>
                    </div>
                  </div>
                </div>

                <div className="school-panel p-6">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                    <div>
                      <label className="block text-sm font-semibold text-[#2f2b22]">Search results</label>
                      <input
                        value={resultSearch}
                        onChange={(event) => setResultSearch(event.target.value)}
                        placeholder="Search by student, subject, term, or year"
                        className="school-input mt-2"
                      />
                    </div>
                    <div className="rounded-3xl bg-[#fff4dc] px-4 py-3 text-sm text-[#6d5c34] shadow-sm">
                      {filteredResults.length} entries
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="school-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Subject</th>
                          <th>Score</th>
                          <th>Grade</th>
                          <th>Term</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredResults.map((result) => (
                          <tr key={result.id} className="odd:bg-white even:bg-[#fff7e7]">
                            <td>{result.studentName}</td>
                            <td>{result.subject}</td>
                            <td>{result.score}/{result.totalScore}</td>
                            <td>{result.grade}</td>
                            <td>{result.term}</td>
                            <td>{formatDate(result.dateRecorded)}</td>
                            <td>
                              <button
                                onClick={() => deleteResult(result.id)}
                                className="rounded-full bg-[#c34141] px-3 py-1 text-xs font-semibold text-white hover:bg-[#9f3131]"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!filteredResults.length && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-[#7c7264]">
                              No results recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {page === 'reports' && (
              <section className="space-y-6">
                <div className="school-panel p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#2f2b22]">Reports</h2>
                      <p className="school-subtitle mt-2">Class and subject insights for your school.</p>
                    </div>
                    <div className="rounded-3xl bg-[#fff4dc] px-4 py-3 text-sm text-[#6d5c34] shadow-sm">
                      Updated in real time
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Students with results</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{new Set(results.map((result) => result.studentId)).size}</p>
                  </div>
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Average GPA</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{calculateGPA(results).toFixed(2)}</p>
                  </div>
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Rating</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{getPerformanceRating(calculateGPA(results))}</p>
                  </div>
                  <div className="school-panel p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#6d5c34]">Subjects</p>
                    <p className="mt-4 text-3xl font-semibold text-[#2f2b22]">{new Set(results.map((item) => item.subject)).size}</p>
                  </div>
                </div>

                <div className="school-panel p-6">
                  <h3 className="text-lg font-semibold text-[#2f2b22]">Grade distribution</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="rounded-3xl border border-[#e3d5b2] bg-[#fff9f0] px-4 py-4">
                        <p className="text-sm font-semibold text-[#6d5c34]">Grade {grade}</p>
                        <p className="mt-2 text-2xl font-semibold text-[#2f2b22]">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>

        {showStudentForm && (
          <div className="school-modal-backdrop">
            <div className="school-modal">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#2f2b22]">Add new student</h2>
                  <p className="mt-2 text-sm text-[#7c7264]">Enter the student details needed for the register.</p>
                </div>
                <button onClick={() => setShowStudentForm(false)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Close</button>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {['firstName', 'lastName', 'registrationNumber', 'className'].map((field) => (
                  <label key={field} className="space-y-2 text-sm text-[#2f2b22]">
                    <span className="font-semibold">{field === 'className' ? 'Class' : field === 'registrationNumber' ? 'Registration number' : field.charAt(0).toUpperCase() + field.slice(1)}</span>
                    <input
                      type="text"
                      value={(studentForm as any)[field]}
                      onChange={(event) => setStudentForm((prev) => ({ ...prev, [field]: event.target.value }))}
                      className="school-input"
                    />
                  </label>
                ))}
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Level</span>
                  <select
                    value={studentForm.level}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, level: event.target.value }))}
                    className="school-input"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Status</span>
                  <select
                    value={studentForm.status}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="school-input"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={addStudent} className="school-btn">Save student</button>
                <button onClick={() => setShowStudentForm(false)} className="school-btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showResultForm && (
          <div className="school-modal-backdrop">
            <div className="school-modal">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#2f2b22]">Record new result</h2>
                  <p className="mt-2 text-sm text-[#7c7264]">Add the score and let the system calculate the grade.</p>
                </div>
                <button onClick={() => setShowResultForm(false)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Close</button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Student</span>
                  <select
                    value={resultForm.studentId}
                    onChange={(event) => setResultForm((prev) => ({ ...prev, studentId: event.target.value }))}
                    className="school-input"
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{getStudentName(student)}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Subject</span>
                  <select
                    value={resultForm.subject}
                    onChange={(event) => setResultForm((prev) => ({ ...prev, subject: event.target.value }))}
                    className="school-input"
                  >
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Score</span>
                  <input
                    type="number"
                    min={0}
                    value={resultForm.score}
                    onChange={(event) => setResultForm((prev) => ({ ...prev, score: Number(event.target.value) }))}
                    className="school-input"
                  />
                </label>
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Total score</span>
                  <input
                    type="number"
                    min={1}
                    value={resultForm.totalScore}
                    onChange={(event) => setResultForm((prev) => ({ ...prev, totalScore: Number(event.target.value) }))}
                    className="school-input"
                  />
                </label>
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Term</span>
                  <select
                    value={resultForm.term}
                    onChange={(event) => setResultForm((prev) => ({ ...prev, term: event.target.value }))}
                    className="school-input"
                  >
                    {TERMS.map((term) => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#2f2b22]">
                  <span className="font-semibold">Academic year</span>
                  <select
                    value={resultForm.academicYear}
                    onChange={(event) => setResultForm((prev) => ({ ...prev, academicYear: event.target.value }))}
                    className="school-input"
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={addResult} className="school-btn">Save result</button>
                <button onClick={() => setShowResultForm(false)} className="school-btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
