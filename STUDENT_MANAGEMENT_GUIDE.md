# Student & Subject Management System - Enhanced Features

## Overview

This document explains the new enhanced methods for teachers and admins to manage students and their subjects. The system provides role-based access control with comprehensive editing capabilities.

## New Components & Features

### 1. **StudentEditor Component** (`src/components/StudentEditor.tsx`)
A comprehensive modal that combines student information editing and subject management in one interface.

**Features:**
- Tab-based interface for easy navigation
- Edit student information (personal details, enrollment status)
- Manage student subjects (add/remove)
- Real-time error handling
- Accessible UI design

**Usage:**
```tsx
<StudentEditor
  student={student}
  subjects={subjects}
  studentSubjects={studentSubjects}
  onUpdateStudent={handleUpdate}
  onUpdateSubjects={handleSubjectsUpdate}
  onCancel={() => setShowEditor(false)}
/>
```

### 2. **SubjectManagement Component** (`src/components/SubjectManagement.tsx`)
Dedicated component for managing a student's subject enrollment.

**Features:**
- Search and filter subjects by name or code
- Grouped by category (Science, Art, Commercial) for Secondary students
- Academic year and term selection
- Add notes to subject assignments
- Visual feedback for selected subjects

**Key Methods:**
- `toggleSubject(subjectId)` - Add/remove a subject
- `handleSubmit()` - Save all subject changes

### 3. **Role-Based Permissions** (`src/utils/rolePermissions.ts`)

#### Permission System
The system defines permissions based on user roles:

**Admin Permissions:**
- ✅ Edit all students
- ✅ Delete students
- ✅ Add new students
- ✅ Manage subjects
- ✅ Edit subject assignments
- ✅ Assign subjects to any student
- ✅ View all students

**Form Teacher Permissions:**
- ✅ Edit students in assigned classes only
- ✅ Delete students in assigned classes only
- ✅ Add students to assigned classes
- ✅ Assign subjects to students
- ✅ View only students in assigned classes

**Subject Teacher Permissions:**
- ✅ Manage subjects (secondary students only)
- ✅ Edit subject assignments
- ✅ View only secondary students
- ✅ Cannot edit student personal information

**Form + Subject Teacher Permissions:**
- ✅ All Form Teacher permissions
- ✅ All Subject Teacher permissions

#### Permission Helper Functions
```typescript
// Check user permissions
const permissions = getUserPermissions(user)

// Can edit a specific student
canUserEditStudent(user, studentClass)

// Can manage subjects
canUserManageSubjects(user)

// Get editable classes
getEditableClasses(user)
```

### 4. **Subject Management Utilities** (`src/utils/subjectManagement.ts`)

Batch operation utilities for handling multiple subject changes:

```typescript
// Calculate what needs to change
const changes = calculateSubjectChanges(currentSubjects, newSubjects)

// Apply all changes
await applySubjectChanges(changes, onProgress)

// Bulk assign to multiple students
await bulkAssignSubjects(studentIds, subjectIds, year, term, assignedBy)

// Check prerequisites
hasPrerequisiteSubjects(studentSubjects, subject)
```

## Updated StudentManagement Page

### New Features

#### 1. Enhanced Edit Actions
The table now provides better action buttons:
- **Edit Icon** (Primary): Opens advanced editor for full student + subject management
- **Book Icon** (Quick): Quick subject assignment modal
- **Trash Icon**: Delete student (with permissions check)

#### 2. Advanced Editor Modal
- Tabs: "Student Information" and "Manage Subjects"
- Switch between editing personal info and managing subjects
- All changes saved separately but in same interface

#### 3. Role-Based UI
- Buttons disabled based on user permissions
- Teachers see only their assigned classes
- Subject-only teachers see only secondary students

#### 4. Improved Permission Handling
- Uses centralized permission system
- Consistent across all operations
- Clear user feedback

## User Workflows

### For Admins

**Edit a Student (Full)**
1. Click Edit icon (blue pencil)
2. Choose "Student Information" tab
3. Edit details (name, class, parent info, etc.)
4. Click "Save"

**Manage Student Subjects**
1. Click Edit icon (blue pencil)
2. Choose "Manage Subjects" tab
3. Search for subjects by name or code
4. Select/deselect subjects
5. Set academic year and term
6. Add optional notes
7. Click "Save Subjects (X)"

**Bulk Assign Subjects**
1. Click "Bulk Assign Subjects" button
2. Select class
3. Select one or more subjects
4. Confirm
5. All students in class get these subjects

**Delete a Student**
1. Click Trash icon (red)
2. Confirm deletion
3. Student removed from system

### For Form Teachers

**Manage Class Students**
1. Navigate to Student Management
2. Your assigned class is selected by default
3. Can only see students in your class

**Edit Student in Your Class**
1. Click Edit icon for student
2. Can edit student personal information
3. Can also manage their subjects

**Add New Student to Your Class**
1. Click "Add Student"
2. Your class is pre-selected
3. Fill student details
4. Can assign subjects at creation time

**Cannot**
- Add students to other classes
- Delete students (admins only)
- Edit students in other classes

### For Subject Teachers

**View Assigned Students**
1. Can see secondary students
2. Cannot edit student personal info
3. Can manage subjects for students

**Manage Subjects Only**
1. Click Book icon (quick subject assignment)
2. Or click Edit icon, go to "Manage Subjects" tab
3. Add/remove subjects as needed

**Cannot**
- Edit student personal information
- Delete students
- Add new students

### For Form + Subject Teachers

**Full Capabilities**
- All Form Teacher permissions
- All Subject Teacher permissions
- Edit students AND manage subjects

## Database Changes

### StudentSubject Table
The system uses the existing `StudentSubject` interface with these fields:
- `id` - Unique identifier
- `studentId` - Associated student
- `subjectId` - Associated subject
- `enrollmentDate` - When assigned
- `status` - 'Active', 'Dropped', 'Completed'
- `academicYear` - Academic year
- `term` - Term (First, Second, Third)
- `assignedBy` - Who assigned it
- `notes` - Optional notes

## Technical Implementation

### Component Hierarchy
```
StudentManagement
├── StudentEditor
│   ├── StudentForm (info editing)
│   └── SubjectManagement (subject editing)
├── StudentForm (quick edit)
├── StudentSubjectForm (quick subject assign)
└── Table (student list with actions)
```

### State Management
- Uses React hooks (useState, useEffect)
- Centralized permission checking
- Error handling with user feedback
- Loading states during API calls

### API Calls
The system uses existing API endpoints:
- `updateStudent(id, data)` - Update student info
- `createStudentSubject(data)` - Add subject
- `deleteStudentSubject(id)` - Remove subject
- `updateStudentSubject(id, data)` - Update subject

## Permission Examples

```typescript
// Check if can edit this student
if (canUserEditStudent(user, "SSS1A")) {
  // Show edit button
}

// Check if can manage subjects
if (canUserManageSubjects(user)) {
  // Show subject management
}

// Get allowed classes
const classes = getEditableClasses(user)
```

## Error Handling

The system provides:
- ✅ Validation of required fields
- ✅ Duplicate subject prevention
- ✅ Permission checking
- ✅ User-friendly error messages
- ✅ Retry capability

## Accessibility Features

- Semantic HTML with proper labels
- Keyboard navigation support
- ARIA labels for screen readers
- Color-coded status indicators
- Clear error messages
- Disabled state indicators

## Future Enhancements

Possible improvements:
- Drag-and-drop subject management
- Bulk import student subjects from CSV
- Subject prerequisites validation
- Automatic subject suggestion based on class/level
- Subject history and audit trail
- Subject assignment templates
- Advanced filtering and search

## Migration Notes

If migrating from older system:
1. All existing students remain unchanged
2. StudentSubject entries continue to work
3. Permissions are applied retroactively
4. No data migration needed

## Testing Checklist

- [ ] Admin can edit any student
- [ ] Admin can delete any student
- [ ] Admin can assign/manage subjects
- [ ] Form teacher can edit only their class students
- [ ] Form teacher cannot edit other classes
- [ ] Subject teacher can only manage subjects
- [ ] Subject teacher cannot edit student info
- [ ] Bulk assign works correctly
- [ ] Permission checks are enforced
- [ ] Error messages display properly
- [ ] Subject search/filter works
- [ ] Category grouping works (SSS students)
