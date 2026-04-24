import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Download, BookOpen } from 'lucide-react'
import { Student, SchoolLevel } from '../types'
import StudentForm from '../components/StudentForm'
import StudentSubjectForm from '../components/StudentSubjectForm'
import Table from '../components/Table'
import { exportToCSV, formatDate, generateRegistrationNumber, generateParentCredentials } from '../utils/calculations'
import { fetchStudents, createStudent, updateStudent, deleteStudent, fetchSubjects, fetchStudentSubjects, createStudentSubject, deleteStudentSubject } from '../services/api'
import { useAuthContext } from '../context/AuthContext'

export default function StudentManagement() {
  const { user } = useAuthContext()
  const isTeacher = user?.role === 'Teacher'
  const teacherType = isTeacher ? (user as any)?.teacherType : undefined
  const isSubjectOnlyTeacher = isTeacher && teacherType === 'Subject Teacher'
  const isFormCapableTeacher =
    isTeacher &&
    (!teacherType || teacherType === 'Form Teacher' || teacherType === 'Form + Subject Teacher')
  const assignedClasses = (user as any)?.assignedClasses || []
  
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | 'All'>('All')
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [selectedStudentForSubjects, setSelectedStudentForSubjects] = useState<Student | null>(null)
  const [studentSubjects, setStudentSubjects] = useState<any[]>([])
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [bulkAssignClass, setBulkAssignClass] = useState('')
  const [bulkAssignSubjects, setBulkAssignSubjects] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    Promise.all([fetchStudents(), fetchSubjects()])
      .then(([studentData, subjectData]) => {
        if (isMounted) {
          if (isSubjectOnlyTeacher) {
            setStudents(studentData.filter((s: Student) => s.level === 'Secondary'))
          } else if (isTeacher) {
            // Form-capable teachers: only students in assigned classes
            setStudents(studentData.filter((s: Student) => assignedClasses.includes(s.class)))
          } else {
            setStudents(studentData)
          }
          setSubjects(subjectData)
        }
      })
      .catch((error) => {
        console.error('Failed to load students or subjects', error)
      })

    return () => {
      isMounted = false
    }
  }, [isTeacher, isSubjectOnlyTeacher, assignedClasses])

  useEffect(() => {
    if (isTeacher && assignedClasses.length > 0 && selectedClass === 'All') {
      setSelectedClass(assignedClasses[0])
    }
  }, [isTeacher, assignedClasses, selectedClass])

  async function loadStudents() {
    try {
      const data = await fetchStudents()
      if (isSubjectOnlyTeacher) {
        setStudents(data.filter((s: Student) => s.level === 'Secondary'))
      } else if (isTeacher) {
        setStudents(data.filter((s: Student) => assignedClasses.includes(s.class)))
      } else {
        setStudents(data)
      }
    } catch (error) {
      console.error('Failed to load students', error)
    }
  }

  const handleOpenSubjectAssignment = async (student: Student) => {
    setSelectedStudentForSubjects(student)
    try {
      const subjects = await fetchStudentSubjects(student.id)
      setStudentSubjects(subjects)
    } catch (error) {
      console.error('Failed to load student subjects', error)
      setStudentSubjects([])
    }
    setShowSubjectForm(true)
  }

  const handleAssignSubjects = async (assignments: any[]) => {
    try {
      // Delete old assignments and create new ones
      for (const oldSubject of studentSubjects) {
        try {
          await deleteStudentSubject(oldSubject.id)
        } catch (error) {
          console.error('Failed to delete old subject assignment', error)
        }
      }

      // Create new assignments
      for (const assignment of assignments) {
        try {
          await createStudentSubject(assignment)
        } catch (error) {
          console.error('Failed to create subject assignment', error)
        }
      }

      setShowSubjectForm(false)
      setSelectedStudentForSubjects(null)
      setStudentSubjects([])
      window.alert('Subjects assigned successfully!')
    } catch (error) {
      window.alert('Failed to assign subjects')
      console.error('Error assigning subjects:', error)
    }
  }

  const handleBulkAssign = async () => {
    if (!bulkAssignClass || bulkAssignSubjects.length === 0) {
      window.alert('Please select a class and at least one subject')
      return
    }

    const studentsInClass = students.filter(s => s.class === bulkAssignClass)
    if (studentsInClass.length === 0) {
      window.alert('No students found in the selected class')
      return
    }

    if (!window.confirm(`Are you sure you want to assign these subjects to all ${studentsInClass.length} students in ${bulkAssignClass}?`)) {
      return
    }

    try {
      const academicYear = new Date().getFullYear().toString()
      const term = 'First'
      
      for (const student of studentsInClass) {
        for (const subjectId of bulkAssignSubjects) {
          try {
            await createStudentSubject({
              studentId: student.id,
              subjectId,
              enrollmentDate: new Date().toISOString().split('T')[0],
              status: 'Active',
              academicYear,
              term,
              assignedBy: user?.name || 'Admin'
            })
          } catch (error) {
            console.error(`Failed to assign subject ${subjectId} to student ${student.id}:`, error)
          }
        }
      }

      window.alert('Subjects assigned to class successfully!')
      setShowBulkAssign(false)
      setBulkAssignClass('')
      setBulkAssignSubjects([])
    } catch (error) {
      console.error('Bulk assignment failed:', error)
      window.alert('Failed to complete bulk assignment')
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber.includes(searchTerm) ||
      (student.parentEmail || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLevel = selectedLevel === 'All' || student.level === selectedLevel
    const matchesClass = !isFormCapableTeacher || selectedClass === 'All' || student.class === selectedClass

    return matchesSearch && matchesLevel && matchesClass
  })

  const handleAddStudent = async (newStudent: Omit<Student, 'id'>, selectedSubjects?: string[]) => {
    try {
      const studentData = {
        ...newStudent,
        registrationNumber: generateRegistrationNumber(newStudent.level),
      }
      const createdStudent = await createStudent(studentData)
      
      // Assign subjects if any were selected
      if (selectedSubjects && selectedSubjects.length > 0) {
        const academicYear = new Date().getFullYear().toString()
        const term = 'First' // Default to first term
        
        for (const subjectId of selectedSubjects) {
          try {
            await createStudentSubject({
              studentId: createdStudent.id,
              subjectId,
              enrollmentDate: new Date().toISOString().split('T')[0],
              status: 'Active',
              academicYear,
              term,
              assignedBy: user?.name || 'Admin'
            })
          } catch (error) {
            console.error(`Failed to assign subject ${subjectId} to new student:`, error)
          }
        }
      }
      
      await loadStudents()
      setShowForm(false)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to add student'
      const details = error.response?.data?.details ? `\nDetails: ${error.response.data.details}` : ''
      const hint = error.response?.data?.hint ? `\nHint: ${error.response.data.hint}` : ''
      window.alert(`Error: ${errorMsg}${details}${hint}`)
    }
  }

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      await updateStudent(updatedStudent.id, updatedStudent)
      await loadStudents()
      setEditingStudent(null)
      setShowForm(false)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update student'
      const details = error.response?.data?.details ? `\nDetails: ${error.response.data.details}` : ''
      window.alert(`Error: ${errorMsg}${details}`)
    }
  }

  const handleSubmitStudent = (student: Student | Omit<Student, 'id'>, selectedSubjects?: string[]) => {
    if ('id' in student) {
      handleUpdateStudent(student as Student)
    } else {
      handleAddStudent(student as Omit<Student, 'id'>, selectedSubjects)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(id)
        await loadStudents()
      } catch {
        window.alert('Failed to delete student')
      }
    }
  }

  const handleExport = () => {
    const dataToExport = filteredStudents.map((student) => ({
      'Registration No': student.registrationNumber,
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Date of Birth': formatDate(student.dateOfBirth),
      Gender: student.gender,
      Level: student.level,
      Class: student.class,
      'Parent Name': student.parentName,
      'Parent Phone': student.parentPhone,
      'Parent Email': student.parentEmail || 'N/A',
      'Enrollment Date': formatDate(student.enrollmentDate),
      Status: student.status,
    }))
    exportToCSV(dataToExport, 'students_report')
  }

  const columns = [
    { key: 'registrationNumber', label: 'Reg. No.' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'level', label: 'Level' },
    { key: 'class', label: 'Class' },
    { key: 'parentUsername', label: 'Parent Username' },
    { key: 'parentPassword', label: 'Parent Password' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {isTeacher
              ? isFormCapableTeacher
                ? 'Manage students in your assigned class'
                : 'View students in your assigned classes'
              : 'Manage all students in the school'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkAssign(true)}
            className="btn-accent flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base"
          >
            <BookOpen size={20} />
            <span className="hidden sm:inline">Bulk Assign Subjects</span>
            <span className="sm:hidden">Bulk Assign</span>
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => {
              setEditingStudent(null)
              setShowForm(true)
            }}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isTeacher && !isFormCapableTeacher}
            title={isTeacher && !isFormCapableTeacher ? 'Only form teachers can add students' : 'Add student'}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, parent email or reg. no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              id="level-filter"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as SchoolLevel | 'All')}
              className="input-field"
            >
              <option value="All">All Levels</option>
              <option value="Pre-Nursery">Pre-Nursery</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>
          {isTeacher && isFormCapableTeacher && (
            <div>
              <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Class
              </label>
              <select
                id="class-filter"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field"
              >
                {isFormCapableTeacher && <option value="All">All Assigned Classes</option>}
                {assignedClasses.map((className: string) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <StudentForm
              onSubmit={handleSubmitStudent}
              initialData={editingStudent || undefined}
              onCancel={() => setShowForm(false)}
              isEditing={!!editingStudent}
              allowedClasses={isTeacher && isFormCapableTeacher ? assignedClasses : undefined}
              defaultClass={isTeacher && isFormCapableTeacher && selectedClass !== 'All' ? selectedClass : ''}
              lockClass={isTeacher && isFormCapableTeacher && selectedClass !== 'All' && !editingStudent}
              availableSubjects={subjects}
            />
          </div>
        </div>
      )}

      {/* Subject Assignment Modal */}
      {showSubjectForm && selectedStudentForSubjects && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <StudentSubjectForm
              student={selectedStudentForSubjects}
              subjects={subjects}
              currentSubjects={studentSubjects}
              onSubmit={handleAssignSubjects}
              onCancel={() => {
                setShowSubjectForm(false)
                setSelectedStudentForSubjects(null)
                setStudentSubjects([])
              }}
            />
          </div>
        </div>
      )}

      {/* Bulk Subject Assignment Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border-4 border-dashed border-school-blue">
            <div className="p-6 bg-gradient-to-r from-school-blue to-school-green text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Bulk Subject Assignment</h2>
                <p className="text-xs font-medium opacity-90">Assign subjects to all students in a class</p>
              </div>
              <button onClick={() => setShowBulkAssign(false)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-black text-school-blue mb-2 uppercase tracking-widest">1. Select Class</label>
                <select
                  value={bulkAssignClass}
                  onChange={(e) => setBulkAssignClass(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a class...</option>
                  {[...new Set(students.map(s => s.class))].sort().map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {bulkAssignClass && (
                <div>
                  <label className="block text-sm font-black text-school-blue mb-2 uppercase tracking-widest">2. Select Subjects</label>
                  <p className="text-xs text-gray-500 mb-4 font-medium">
                    Select the subjects to be assigned to all students in {bulkAssignClass}.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subjects
                      .filter(s => {
                        const classLevel = students.find(student => student.class === bulkAssignClass)?.level
                        return s.level === classLevel
                      })
                      .map(subject => (
                        <label
                          key={subject.id}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                            bulkAssignSubjects.includes(subject.id)
                              ? 'bg-school-blue/10 border-school-blue shadow-md'
                              : 'bg-white border-slate-200 hover:border-school-blue/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={bulkAssignSubjects.includes(subject.id)}
                            onChange={() => {
                              setBulkAssignSubjects(prev =>
                                prev.includes(subject.id)
                                  ? prev.filter(id => id !== subject.id)
                                  : [...prev, subject.id]
                              )
                            }}
                            className="w-5 h-5 text-school-blue rounded-lg focus:ring-school-blue border-slate-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">{subject.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subject.code}</p>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t-4 border-dashed border-slate-200 flex gap-3">
              <button
                onClick={() => setShowBulkAssign(false)}
                className="flex-1 py-3 px-6 bg-white border-2 border-slate-200 text-slate-600 rounded-full font-black hover:bg-slate-100 transition-all uppercase tracking-widest text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkAssignClass || bulkAssignSubjects.length === 0}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-school-blue to-school-green text-white rounded-full font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Assign to Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-lg">
        <Table
          columns={columns}
          data={filteredStudents.map((student) => ({
            ...student,
            actions: (
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenSubjectAssignment(student)}
                  className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  title="Assign subjects"
                >
                  <BookOpen size={18} />
                </button>
                <button
                  onClick={() => {
                    setEditingStudent(student)
                    setShowForm(true)
                  }}
                  className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Edit"
                  disabled={isTeacher && !isFormCapableTeacher}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteStudent(student.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Delete"
                  disabled={isTeacher && !isFormCapableTeacher}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          }))}
        />
        {filteredStudents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No students found</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card-lg text-center">
          <p className="text-gray-600 text-sm">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">{filteredStudents.length}</p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 text-sm">Active Students</p>
          <p className="text-3xl font-bold text-green-600">
            {filteredStudents.filter((s) => s.status === 'Active').length}
          </p>
        </div>
        <div className="card-lg text-center">
          <p className="text-gray-600 text-sm">Inactive Students</p>
          <p className="text-3xl font-bold text-red-600">
            {filteredStudents.filter((s) => s.status !== 'Active').length}
          </p>
        </div>
      </div>
    </div>
  )
}
