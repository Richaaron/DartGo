import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Download, User as UserIcon } from 'lucide-react'
import { Teacher, SchoolLevel } from '../types'
import TeacherForm from '../components/TeacherForm'
import Table from '../components/Table'
import { exportToCSV } from '../utils/calculations'
import { fetchTeachers, createTeacher, updateTeacher, deleteTeacher } from '../services/api'

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | 'All'>('All')
  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchTeachers()
      .then((data) => {
        if (isMounted) setTeachers(data)
      })
      .catch((error) => {
        console.error('Failed to load teachers', error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function loadTeachers() {
    try {
      const data = await fetchTeachers()
      setTeachers(data)
    } catch (error) {
      console.error('Failed to load teachers', error)
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLevel = selectedLevel === 'All' || teacher.level === selectedLevel

    return matchesSearch && matchesLevel
  })

  const handleAddTeacher = async (newTeacher: Omit<Teacher, 'id'>) => {
    try {
      const firstName = newTeacher.name.split(' ')[0].toLowerCase()
      const uniqueNum = Math.floor(1000 + Math.random() * 9000)
      
      const teacherData = {
        ...newTeacher,
        teacherId: `T${uniqueNum}`,
        username: `${firstName}@folusho.com`,
        password: `fvs@${uniqueNum}`,
      }
      
      await createTeacher(teacherData)
      await loadTeachers()
      setShowForm(false)
    } catch {
      window.alert('Failed to add teacher')
    }
  }

  const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
    try {
      await updateTeacher(updatedTeacher.id, updatedTeacher)
      await loadTeachers()
      setEditingTeacher(null)
      setShowForm(false)
    } catch {
      window.alert('Failed to update teacher')
    }
  }

  const handleSubmitTeacher = (teacher: Teacher | Omit<Teacher, 'id'>) => {
    if ('id' in teacher) {
      handleUpdateTeacher(teacher as Teacher)
    } else {
      handleAddTeacher(teacher as Omit<Teacher, 'id'>)
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher? This will also remove their access to the system.')) {
      try {
        await deleteTeacher(id)
        await loadTeachers()
      } catch {
        window.alert('Failed to delete teacher')
      }
    }
  }

  const handleExport = () => {
    const dataToExport = filteredTeachers.map((teacher) => ({
      'Teacher ID': teacher.teacherId,
      Name: teacher.name,
      Username: teacher.username,
      Email: teacher.email,
      Subject: teacher.subject,
      Level: teacher.level,
      Classes: teacher.assignedClasses.join(', '),
    }))
    exportToCSV(dataToExport, 'teachers_report')
  }

  const columns = [
    { key: 'profile', label: 'Photo' },
    { key: 'name', label: 'Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'level', label: 'Level' },
    { key: 'classes', label: 'Classes' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600 mt-2">Manage school faculty and class assignments</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => {
              setEditingTeacher(null)
              setShowForm(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, username, email or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
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
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <TeacherForm
              onSubmit={handleSubmitTeacher}
              initialData={editingTeacher || undefined}
              onCancel={() => setShowForm(false)}
              isEditing={!!editingTeacher}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-lg">
        <Table
          columns={columns}
          data={filteredTeachers.map((teacher) => ({
            ...teacher,
            profile: (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                {teacher.image ? (
                  <img src={teacher.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
            ),
            classes: (
              <div className="flex flex-wrap gap-1">
                {(teacher.assignedClasses || []).map((c) => (
                  <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {c}
                  </span>
                ))}
              </div>
            ),
            actions: (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingTeacher(teacher)
                    setShowForm(true)
                  }}
                  className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          }))}
        />
        {filteredTeachers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No teachers found</p>
          </div>
        )}
      </div>
    </div>
  )
}
