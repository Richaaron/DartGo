# Email Notifications System

## Overview
The Folusho Result Management System now includes a comprehensive email notification system that automatically sends emails to parents and staff for various school events.

## Setup

### 1. Configure SMTP Settings
Edit your `.env` file in the server directory:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com              # Your SMTP server host
SMTP_PORT=587                          # SMTP port (usually 587 for TLS)
SMTP_USER=your-email@gmail.com        # Your email address
SMTP_PASS=your-app-password           # Gmail App Password (not regular password)
SMTP_FROM=noreply@folusho.com         # From address
FRONTEND_URL=http://localhost:5173    # Frontend URL for links in emails
```

### 2. Using Gmail
For Gmail:
1. Enable 2-Factor Authentication
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Use the App Password in `SMTP_PASS`

### 3. Alternative: Mailtrap (for development)
Use [Mailtrap](https://mailtrap.io/) for testing without sending real emails:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
```

## Notification Types

### 1. **Student Registration** (`student_registration`)
**When:** Student record is created
**Recipient:** Parent email
**Content:** Welcome email with registration number

**Triggered in:** `POST /api/students`

### 2. **Result Published** (`result_published`)
**When:** Student exam results are entered
**Recipient:** Parent email
**Content:** Notification that results are ready to view

**Triggered in:** `POST /api/results`

### 3. **Attendance Warning** (`attendance_warning`)
**When:** Student attendance drops below threshold
**Recipient:** Parent email
**Content:** Alert about low attendance with percentage

**Example usage:**
```typescript
import { sendAttendanceWarningEmail } from '../utils/email'

await sendAttendanceWarningEmail(
  parentEmail,
  'John Doe',
  65, // attendance percentage
  studentId
)
```

### 4. **Low Grades Alert** (`low_grades`)
**When:** Student receives low grades
**Recipient:** Parent email
**Content:** List of subjects with low grades and recommendations

**Example usage:**
```typescript
import { sendLowGradesEmail } from '../utils/email'

await sendLowGradesEmail(
  parentEmail,
  'John Doe',
  ['Mathematics', 'Physics'],
  studentId
)
```

### 5. **Fee Reminder** (`fee_reminder`)
**When:** Payment deadline approaches
**Recipient:** Parent email
**Content:** Amount due and due date

**Example usage:**
```typescript
import { sendFeeReminderEmail } from '../utils/email'

await sendFeeReminderEmail(
  parentEmail,
  'John Doe',
  50000, // amount
  '2026-04-30', // due date
  studentId
)
```

## API Endpoints

### View Notifications (Admin)
```bash
GET /api/notifications
# Query parameters:
# - status: 'sent' | 'failed' | 'pending'
# - type: notification type
# - limit: 50 (default)
# - page: 1 (default)
```

### View Notifications by Student
```bash
GET /api/notifications/student/:studentId
# Returns last 20 notifications for a student
```

### Get Notification Statistics
```bash
GET /api/notifications/stats/summary
# Returns total sent/failed/pending and breakdown by type
```

### Resend Failed Notification
```bash
POST /api/notifications/:id/resend
# Marks notification for retry
```

### Delete Notification Record
```bash
DELETE /api/notifications/:id
# Removes notification from history
```

## Database Model

Each notification is logged in MongoDB with:
- `recipientEmail` - Parent/recipient email
- `recipientName` - Name of recipient
- `type` - Type of notification
- `subject` - Email subject
- `body` - Email HTML content
- `status` - 'sent', 'failed', or 'pending'
- `studentId` - Associated student (optional)
- `sentAt` - Timestamp when sent
- `errorMessage` - Error details if failed
- `metadata` - Additional data (subject list, amount, etc.)
- `createdAt` - Record creation time

## Integration Guide

### Adding Notifications to Routes

1. **Import the email function:**
```typescript
import { sendAttendanceWarningEmail } from '../utils/email'
```

2. **Call when event occurs:**
```typescript
router.post('/attendance', async (req, res) => {
  // ... create attendance record ...
  
  if (attendance.percentage < 75) {
    sendAttendanceWarningEmail(
      student.email,
      student.firstName,
      attendance.percentage,
      student._id.toString()
    ).catch(err => console.error('Failed to send attendance email', err))
  }
})
```

### Creating Custom Notifications

To add a new notification type:

1. **Add to Notification model:**
```typescript
// In models/Notification.ts - add to enum
type: 'your_new_type' | ...
```

2. **Create email function:**
```typescript
// In utils/email.ts
export const sendYourNotificationEmail = async (
  email: string,
  name: string,
  customData: string,
  studentId?: string
) => {
  const subject = 'Your Subject'
  const html = `<h1>Email Content</h1>`
  return sendEmail({
    to: email,
    subject,
    html,
    type: 'your_new_type',
    studentId,
    metadata: { customData }
  })
}
```

3. **Use in route:**
```typescript
await sendYourNotificationEmail(email, name, data, studentId)
```

## Best Practices

1. **Always include try-catch** - Email sending failures shouldn't crash the app
```typescript
sendEmail(...).catch(err => console.error('Email failed:', err))
```

2. **Use .catch()** - Non-blocking email sends
```typescript
sendResultPublishedEmail(email, name, term, year, studentId)
  .catch(err => console.error('Failed to send result email', err))
```

3. **Include studentId** - For tracking and audit purposes
```typescript
sendStudentRegistrationEmail(email, name, regNum, student._id.toString())
```

4. **Test with Mailtrap** - Use Mailtrap for development to avoid sending real emails

5. **Monitor Failed Notifications** - Check the notifications dashboard regularly
```bash
GET /api/notifications?status=failed
```

## Troubleshooting

### Emails not sending
1. Check `.env` configuration
2. Verify SMTP credentials
3. Check MongoDB connection for notification logging
4. Review server logs for errors

### Check sent emails
```bash
# Via API
GET http://localhost:3001/api/notifications?status=sent&limit=10

# Check MongoDB directly
db.notifications.find({ status: 'sent' }).sort({ createdAt: -1 }).limit(10)
```

### Resend failed emails
1. Get notification ID from failed records
2. Call POST `/api/notifications/:id/resend`
3. Re-run your email service

## Security Notes

- Store SMTP credentials in `.env` (never commit)
- Use environment-specific email accounts
- Consider rate limiting on notification endpoints
- Validate email addresses before sending
- Log all notification attempts for audit trails

---

For more information, see the main README.md
