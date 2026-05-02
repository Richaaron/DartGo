# Implementation Examples & Code Snippets

## 1. Using Role Permissions

### Check User Permissions
```typescript
import { getUserPermissions, canUserEditStudent, canUserManageSubjects } from '../utils/rolePermissions'

// Get all permissions for a user
const permissions = getUserPermissions(user)

if (permissions.canEditStudent) {
  // Show edit button
}

// Check specific permission
if (canUserEditStudent(user, 'SSS1A')) {
  // Allow editing students in SSS1A
}

// Check subject management access
if (canUserManageSubjects(user)) {
  // Show subject management UI
}
```

### Role-Based UI
```typescript
<button
  onClick={() => handleOpenAdvancedEditor(student)}
  disabled={!permissions.canEditStudent && !permissions.canManageSubjects}
  title="Edit student & manage subjects"
>
  <Edit2 size={16} />
</button>
```

## 2. Using StudentEditor

### Basic Usage
```typescript
import StudentEditor from '../components/StudentEditor'

const [showEditor, setShowEditor] = useState(false)
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

// Open editor
const handleEdit = (student: Student) => {
  setSelectedStudent(student)
  setShowEditor(true)
}

// In JSX
{showEditor && selectedStudent && (
  <StudentEditor
    student={selectedStudent}
    subjects={subjects}
    studentSubjects={studentSubjects}
    onUpdateStudent={async (student) => {
      await updateStudent(student.id, student)
      setShowEditor(false)
    }}
    onUpdateSubjects={async (subjects) => {
      // Handle subject updates
      await applySubjectChanges(
        calculateSubjectChanges(studentSubjects, subjects)
      )
      setShowEditor(false)
    }}
    onCancel={() => setShowEditor(false)}
  />
)}
```

## 3. Using SubjectManagement

### Standalone Usage
```typescript
import SubjectManagement from '../components/SubjectManagement'

<SubjectManagement
  student={student}
  availableSubjects={allSubjects}
  currentSubjects={studentCurrentSubjects}
  onUpdate={async (subjects) => {
    // Save to API
    for (const subject of subjects) {
      await createStudentSubject(subject)
    }
  }}
  onCancel={() => setShowSubjects(false)}
/>
```

## 4. Batch Subject Operations

### Calculate Changes
```typescript
import { calculateSubjectChanges, applySubjectChanges } from '../utils/subjectManagement'

const currentSubjects = await fetchStudentSubjects(studentId)
const newSubjects = [...] // User selected subjects

const changes = calculateSubjectChanges(currentSubjects, newSubjects)

console.log('To Add:', changes.toAdd)
console.log('To Remove:', changes.toRemove)
console.log('To Update:', changes.toUpdate)
```

### Apply Changes
```typescript
await applySubjectChanges(changes, (message) => {
  console.log(message) // "Removing 2 subject(s)..."
})
```

### Bulk Assign
```typescript
import { bulkAssignSubjects } from '../utils/subjectManagement'

const studentIds = ['student1', 'student2', 'student3']
const subjectIds = ['math', 'english', 'science']

const result = await bulkAssignSubjects(
  studentIds,
  subjectIds,
  '2024',
  'First',
  'admin@school.com'
)

console.log(`Success: ${result.success}, Failed: ${result.failed}`)
if (result.errors.length > 0) {
  console.error(result.errors)
}
```

## 5. Complete Workflow Example

### Admin: Edit Student & Manage Subjects
```typescript
// 1. Admin clicks edit button
const handleEditStudent = async (student: Student) => {
  setEditingStudent(student)
  
  // Load current subjects
  const subjects = await fetchStudentSubjects(student.id)
  setStudentSubjects(subjects)
  
  setShowAdvancedEditor(true)
}

// 2. Admin updates student info
const handleAdvancedUpdateStudent = async (updatedStudent: Student) => {
  await updateStudent(updatedStudent.id, updatedStudent)
  toast.success('Student updated')
}

// 3. Admin updates subjects
const handleAdvancedUpdateSubjects = async (newSubjects: StudentSubject[]) => {
  const changes = calculateSubjectChanges(studentSubjects, newSubjects)
  await applySubjectChanges(changes)
  toast.success('Subjects updated')
}

// 4. Close editor
setShowAdvancedEditor(false)
```

### Form Teacher: Edit Class Student
```typescript
// 1. Form teacher sees only their assigned class
const isFormTeacher = user.role === 'Teacher' && user.teacherType === 'Form Teacher'
const assignedClass = isFormTeacher ? user.assignedClasses[0] : null

// 2. Filter students in their class
const classStudents = students.filter(s => s.class === assignedClass)

// 3. Can edit and manage subjects
const permissions = getUserPermissions(user)
if (permissions.canEditStudent && permissions.canAssignSubjectsToStudent) {
  // Both buttons available
  showEditButton = true
  showSubjectButton = true
}

// 4. Open advanced editor for class student
handleOpenAdvancedEditor(classStudent)
```

### Subject Teacher: Assign Subjects
```typescript
// 1. Subject teacher loads secondary students
const secondaryStudents = students.filter(s => s.level === 'Secondary')

// 2. Can only manage subjects
const permissions = getUserPermissions(user)
if (permissions.canManageSubjects) {
  // Only show subject management
  showEditButton = false
  showSubjectButton = true
}

// 3. Open quick subject manager
const handleQuickSubjectAssign = async (student: Student) => {
  const subjects = await fetchStudentSubjects(student.id)
  setSelectedStudent(student)
  setStudentSubjects(subjects)
  setShowQuickSubjects(true)
}
```

## 6. Permission Checking Examples

### Check Before Rendering
```typescript
import { getUserPermissions } from '../utils/rolePermissions'

export function StudentActions({ student, user }) {
  const permissions = getUserPermissions(user)

  return (
    <div>
      {permissions.canEditStudent && (
        <button onClick={() => editStudent(student)}>Edit</button>
      )}
      
      {permissions.canManageSubjects && (
        <button onClick={() => manageSubjects(student)}>Subjects</button>
      )}
      
      {permissions.canDeleteStudent && (
        <button onClick={() => deleteStudent(student)}>Delete</button>
      )}
    </div>
  )
}
```

### Use Permissions in Conditionals
```typescript
const permissions = getUserPermissions(user)

if (!permissions.canEditStudent) {
  return <div>You don't have permission to edit students</div>
}

if (permissions.canViewAllStudents) {
  // Show all students
} else {
  // Show only assigned classes
  const viewableClasses = getEditableClasses(user)
}
```

## 7. Error Handling

### Catch & Display Errors
```typescript
try {
  await onUpdateStudent(updatedStudent)
  setShowAdvancedEditor(false)
} catch (err) {
  const errorMsg = err instanceof Error 
    ? err.message 
    : 'Failed to update student'
  setError(errorMsg)
  // Error displays in the modal
}
```

### Handle Batch Errors
```typescript
const result = await bulkAssignSubjects(...)

if (result.errors.length > 0) {
  const errorList = result.errors.join('\n')
  toast.error(`Failed: ${result.failed}\n${errorList}`)
}

toast.success(`Success: ${result.success} assignments`)
```

## 8. Integration with Existing Code

### In StudentManagement.tsx
```typescript
import { getUserPermissions } from '../utils/rolePermissions'
import StudentEditor from '../components/StudentEditor'

export default function StudentManagement() {
  const permissions = getUserPermissions(user)

  // Use permissions for rendering
  <button
    disabled={!permissions.canAddStudents}
    onClick={() => setShowForm(true)}
  >
    Add Student
  </button>

  // Show advanced editor
  {showAdvancedEditor && (
    <StudentEditor {...props} />
  )}
}
```

## 9. Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import StudentEditor from '../components/StudentEditor'

describe('StudentEditor', () => {
  it('should allow admin to edit student', () => {
    const admin = { role: 'Admin' }
    const permissions = getUserPermissions(admin)
    
    expect(permissions.canEditStudent).toBe(true)
    expect(permissions.canManageSubjects).toBe(true)
  })

  it('should allow form teacher to edit assigned class', () => {
    const teacher = {
      role: 'Teacher',
      teacherType: 'Form Teacher',
      assignedClasses: ['SSS1A']
    }
    
    expect(canUserEditStudent(teacher, 'SSS1A')).toBe(true)
    expect(canUserEditStudent(teacher, 'SSS1B')).toBe(false)
  })

  it('should prevent subject teacher from editing student info', () => {
    const teacher = {
      role: 'Teacher',
      teacherType: 'Subject Teacher'
    }
    const permissions = getUserPermissions(teacher)
    
    expect(permissions.canEditStudent).toBe(false)
    expect(permissions.canManageSubjects).toBe(true)
  })
})
```

---

## Quick Reference: File Locations

```
src/
├── utils/
│   ├── rolePermissions.ts          ← Permission system
│   └── subjectManagement.ts        ← Batch operations
├── components/
│   ├── StudentEditor.tsx           ← Combined editor
│   ├── SubjectManagement.tsx       ← Subject editor
│   └── StudentForm.tsx             ← (existing)
└── pages/
    └── StudentManagement.tsx       ← Updated
```

## Helpful Resources

- Permission System: See `rolePermissions.ts` for all available permissions
- Component Props: Check component files for full PropTypes documentation
- API Integration: See `services/api.ts` for available endpoints
- Type Definitions: See `types/index.ts` for interface definitions
