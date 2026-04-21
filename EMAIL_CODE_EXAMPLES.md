# Email Notifications - Code Examples

## Frontend Examples

### 1. Display Notification Bell in Header

```typescript
// components/Header.tsx
import React from 'react'
import { Bell } from 'lucide-react'
import NotificationBell from './NotificationBell'

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Folusho Reporting Sheet</h1>
        
        <div className="flex items-center gap-4">
          <NotificationBell />
          {/* Other header items */}
        </div>
      </div>
    </header>
  )
}
```

### 2. Add Notifications Route

```typescript
// App.tsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StudentManagement from './pages/StudentManagement'
import ResultEntry from './pages/ResultEntry'
import NotificationsPage from './pages/Notifications'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/results" element={<ResultEntry />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 3. Add Navigation Link

```typescript
// components/Sidebar.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, Users, FileText, BarChart3 } from 'lucide-react'

export const Sidebar: React.FC = () => {
  return (
    <nav className="w-64 bg-gray-900 text-white p-4 space-y-2">
      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
        <BarChart3 className="w-5 h-5" />
        Dashboard
      </Link>
      
      <Link to="/students" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
        <Users className="w-5 h-5" />
        Students
      </Link>
      
      <Link to="/results" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
        <FileText className="w-5 h-5" />
        Results
      </Link>
      
      <Link to="/notifications" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800">
        <Bell className="w-5 h-5" />
        Notifications
      </Link>
    </nav>
  )
}
```

### 4. Fetch and Display Notifications

```typescript
// pages/NotificationsPage.tsx
import React, { useState, useEffect } from 'react'
import notificationAPI from '../services/notificationAPI'

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await notificationAPI.getAll()
        setNotifications(data.notifications)
      } catch (error) {
        console.error('Failed to load notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {notifications.map(notif => (
        <div key={notif._id} className="p-4 border rounded">
          <h3 className="font-semibold">{notif.subject}</h3>
          <p className="text-sm text-gray-600">{notif.recipientEmail}</p>
          <span className={`text-xs px-2 py-1 rounded ${
            notif.status === 'sent' ? 'bg-green-100 text-green-800' :
            notif.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {notif.status}
          </span>
        </div>
      ))}
    </div>
  )
}
```

### 5. Resend Failed Notification

```typescript
// In NotificationDashboard.tsx
const handleResend = async (notificationId: string) => {
  try {
    await notificationAPI.resend(notificationId)
    // Reload notifications
    loadNotifications()
    // Show success message
    alert('Notification resent successfully')
  } catch (error) {
    console.error('Failed to resend:', error)
    alert('Failed to resend notification')
  }
}

// In JSX:
<button
  onClick={() => handleResend(notif._id)}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  Resend
</button>
```

## Backend Examples

### 1. Send Email on Student Registration

```typescript
// server/src/routes/students.ts
import { Router } from 'express'
import { Student } from '../models/Student.js'
import { sendStudentRegistrationEmail } from '../utils/email.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body)
    await student.save()
    
    // Send registration email
    if (student.email) {
      sendStudentRegistrationEmail(
        student.email,
        `${student.firstName} ${student.lastName}`,
        student.registrationNumber,
        student._id.toString()
      ).catch(err => console.error('Email failed:', err))
    }
    
    res.status(201).json(student)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create student' })
  }
})

export default router
```

### 2. Send Email on Result Entry

```typescript
// server/src/routes/results.ts
import { Router } from 'express'
import { SubjectResult } from '../models/SubjectResult.js'
import { Student } from '../models/Student.js'
import { sendResultPublishedEmail, sendLowGradesEmail } from '../utils/email.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const result = new SubjectResult(req.body)
    await result.save()
    
    // Get student details
    const student = await Student.findById(result.studentId)
    
    if (student && student.email) {
      // Send result published email
      sendResultPublishedEmail(
        student.email,
        `${student.firstName} ${student.lastName}`,
        result.term,
        result.academicYear,
        result.studentId.toString()
      ).catch(err => console.error('Email failed:', err))
      
      // Send low grades email if score < 60%
      if (result.percentage < 60) {
        sendLowGradesEmail(
          student.email,
          `${student.firstName} ${student.lastName}`,
          ['Mathematics'], // Subject name
          result.studentId.toString()
        ).catch(err => console.error('Email failed:', err))
      }
    }
    
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create result' })
  }
})

export default router
```

### 3. Send Email on Attendance Warning

```typescript
// server/src/routes/attendance.ts
import { Router } from 'express'
import { Attendance } from '../models/Attendance.js'
import { Student } from '../models/Student.js'
import { sendAttendanceWarningEmail } from '../utils/email.js'

const router = Router()

router.post('/bulk', async (req, res) => {
  try {
    const { date, records } = req.body
    
    // Save attendance records
    const ops = records.map((record: any) => ({
      updateOne: {
        filter: { studentId: record.studentId, date },
        update: { ...record, date },
        upsert: true
      }
    }))
    
    await Attendance.bulkWrite(ops)
    
    // Check for low attendance and send warnings
    for (const record of records) {
      if (record.status === 'Absent') {
        const student = await Student.findById(record.studentId)
        if (student) {
          const attendanceRecords = await Attendance.find({ studentId: record.studentId })
          const presentCount = attendanceRecords.filter(r => r.status === 'Present').length
          const attendancePercentage = (presentCount / attendanceRecords.length) * 100
          
          if (attendancePercentage < 75 && student.email) {
            sendAttendanceWarningEmail(
              student.email,
              `${student.firstName} ${student.lastName}`,
              attendancePercentage,
              student._id.toString()
            ).catch(err => console.error('Email failed:', err))
          }
        }
      }
    }
    
    res.json({ message: 'Attendance updated successfully' })
  } catch (error) {
    res.status(400).json({ error: 'Failed to save attendance' })
  }
})

export default router
```

### 4. Create Custom Email Function

```typescript
// server/src/utils/email.ts
import { sendEmail } from './email.js'

export const sendCustomEmail = async (
  email: string,
  name: string,
  customData: string,
  studentId?: string
) => {
  const subject = 'Custom Notification'
  const html = `
    <h1>Hello ${name}</h1>
    <p>${customData}</p>
    <p>Best regards,<br/>Folusho Victory Schools</p>
  `
  
  return sendEmail({
    to: email,
    subject,
    text: customData,
    html,
    type: 'custom_type', // Add to Notification type enum
    studentId,
    metadata: { customData }
  })
}
```

### 5. Bulk Send Emails

```typescript
// server/src/routes/results.ts
router.post('/bulk', async (req, res) => {
  try {
    const { term, academicYear, results } = req.body
    const emailNotifications: Array<{ email: string; name: string; subjects: string[] }> = []
    
    // Process results
    for (const item of results) {
      const student = await Student.findOne({ registrationNumber: item.registrationNumber })
      if (!student) continue
      
      // Save result...
      
      // Track low grades for email
      if (item.percentage < 60 && student.email) {
        const subject = await Subject.findById(item.subjectId)
        const existingNotif = emailNotifications.find(n => n.email === student.email)
        
        if (existingNotif) {
          existingNotif.subjects.push(subject?.name || 'Unknown')
        } else {
          emailNotifications.push({
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
            subjects: [subject?.name || 'Unknown']
          })
        }
      }
    }
    
    // Send all emails
    for (const notif of emailNotifications) {
      sendLowGradesEmail(notif.email, notif.name, notif.subjects)
        .catch(err => console.error('Email failed:', err))
    }
    
    res.json({ message: 'Results processed' })
  } catch (error) {
    res.status(400).json({ error: 'Failed to process results' })
  }
})
```

## API Usage Examples

### 1. Get All Notifications

```bash
curl -X GET "http://localhost:3001/api/notifications?status=sent&limit=50&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get Notifications for a Student

```bash
curl -X GET "http://localhost:3001/api/notifications/student/STUDENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Statistics

```bash
curl -X GET "http://localhost:3001/api/notifications/stats/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Resend Failed Notification

```bash
curl -X POST "http://localhost:3001/api/notifications/NOTIFICATION_ID/resend" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Delete Notification

```bash
curl -X DELETE "http://localhost:3001/api/notifications/NOTIFICATION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Examples

### 1. Test Student Registration Email

```typescript
// In your test file
import { sendStudentRegistrationEmail } from '../utils/email'

test('should send student registration email', async () => {
  const result = await sendStudentRegistrationEmail(
    'parent@example.com',
    'John Doe',
    'REG123456',
    'student-id-123'
  )
  
  expect(result.messageId).toBeDefined()
})
```

### 2. Test Low Grades Email

```typescript
test('should send low grades email', async () => {
  const result = await sendLowGradesEmail(
    'parent@example.com',
    'John Doe',
    ['Mathematics', 'Physics'],
    'student-id-123'
  )
  
  expect(result.messageId).toBeDefined()
})
```

### 3. Test Attendance Warning Email

```typescript
test('should send attendance warning email', async () => {
  const result = await sendAttendanceWarningEmail(
    'parent@example.com',
    'John Doe',
    65, // 65% attendance
    'student-id-123'
  )
  
  expect(result.messageId).toBeDefined()
})
```

## Error Handling Examples

### 1. Handle Email Failures Gracefully

```typescript
// Good: Non-blocking email send
sendStudentRegistrationEmail(email, name, regNum, studentId)
  .catch(err => {
    console.error('Failed to send registration email:', err)
    // Don't crash the app, just log the error
  })

// Bad: Blocking email send (will crash if email fails)
await sendStudentRegistrationEmail(email, name, regNum, studentId)
```

### 2. Retry Failed Emails

```typescript
// Get failed notifications
const failed = await notificationAPI.getFailed(20)

// Resend each one
for (const notif of failed.notifications) {
  try {
    await notificationAPI.resend(notif._id)
    console.log(`Resent notification ${notif._id}`)
  } catch (error) {
    console.error(`Failed to resend ${notif._id}:`, error)
  }
}
```

### 3. Monitor Email Status

```typescript
// Check email statistics
const stats = await notificationAPI.getStats()

console.log(`Sent: ${stats.summary.totalSent}`)
console.log(`Failed: ${stats.summary.totalFailed}`)
console.log(`Pending: ${stats.summary.totalPending}`)

// Alert if too many failures
if (stats.summary.totalFailed > 10) {
  console.warn('High number of failed emails!')
}
```

## Environment Configuration Examples

### Gmail Setup

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=noreply@folusho.com
FRONTEND_URL=http://localhost:5173
```

### Mailtrap Setup (Development)

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
SMTP_FROM=noreply@folusho.com
FRONTEND_URL=http://localhost:5173
```

### Production Setup

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=production-email@folusho.com
SMTP_PASS=production-app-password
SMTP_FROM=noreply@folusho.com
FRONTEND_URL=https://folusho.com
NODE_ENV=production
```

These examples cover the most common use cases for the email notification system. Adapt them to your specific needs!
