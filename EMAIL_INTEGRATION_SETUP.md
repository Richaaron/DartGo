# Email Notifications Integration Guide

## Overview
This guide walks you through integrating the email notification system into your Folusho Reporting Sheet application.

## What's Been Added

### Backend Changes
1. **Enhanced Routes** with email triggers:
   - `server/src/routes/students.ts` - Sends registration email on student creation
   - `server/src/routes/results.ts` - Sends result published and low grades emails
   - `server/src/routes/attendance.ts` - Sends attendance warning emails

2. **Email Triggers**:
   - **Student Registration**: Triggered when a new student is created
   - **Result Published**: Triggered when exam results are entered
   - **Low Grades Alert**: Triggered when a student scores below 60%
   - **Attendance Warning**: Triggered when attendance drops below 75%

### Frontend Components
1. **NotificationBell.tsx** - Header notification bell with dropdown
2. **NotificationDashboard.tsx** - Full notification management dashboard
3. **Notifications.tsx** - Dedicated notifications page

## Setup Instructions

### Step 1: Configure Environment Variables

Edit `server/.env` and add:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@folusho.com
FRONTEND_URL=http://localhost:5173
```

**For Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Use the App Password in `SMTP_PASS` (not your regular password)

**For Development (Mailtrap):**
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
```

### Step 2: Add Frontend Routes

Update `src/App.tsx` to include the notifications page:

```typescript
import NotificationsPage from './pages/Notifications'

// In your router configuration:
<Route path="/notifications" element={<NotificationsPage />} />
```

### Step 3: Add Notification Bell to Header

Update your header/navbar component to include the notification bell:

```typescript
import NotificationBell from './components/NotificationBell'

// In your header JSX:
<div className="flex items-center gap-4">
  <NotificationBell />
  {/* Other header items */}
</div>
```

### Step 4: Restart Services

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

## How It Works

### Email Triggers

#### 1. Student Registration
- **When**: New student is created
- **Recipient**: Parent email
- **Content**: Welcome email with registration number

```typescript
// Automatically triggered in POST /api/students
sendStudentRegistrationEmail(
  student.email,
  `${student.firstName} ${student.lastName}`,
  student.registrationNumber,
  student._id.toString()
)
```

#### 2. Result Published
- **When**: Exam results are entered
- **Recipient**: Parent email
- **Content**: Notification that results are ready

```typescript
// Automatically triggered in POST /api/results
sendResultPublishedEmail(
  student.email,
  `${student.firstName} ${student.lastName}`,
  result.term,
  result.academicYear,
  result.studentId.toString()
)
```

#### 3. Low Grades Alert
- **When**: Student scores below 60%
- **Recipient**: Parent email
- **Content**: List of subjects with low grades

```typescript
// Automatically triggered when percentage < 60
sendLowGradesEmail(
  student.email,
  `${student.firstName} ${student.lastName}`,
  [subjectName],
  result.studentId.toString()
)
```

#### 4. Attendance Warning
- **When**: Attendance drops below 75%
- **Recipient**: Parent email
- **Content**: Alert about low attendance

```typescript
// Automatically triggered in POST /api/attendance/bulk
sendAttendanceWarningEmail(
  student.email,
  `${student.firstName} ${student.lastName}`,
  attendancePercentage,
  student._id.toString()
)
```

## Frontend Components

### NotificationBell
- Shows in header
- Displays unread failed notifications count
- Dropdown with recent 5 notifications
- Auto-refreshes every 30 seconds
- Link to full notifications page

### NotificationDashboard
- Full notification management
- Filter by status (all, sent, failed, pending)
- Pagination support
- Resend failed notifications
- Delete notification records
- Statistics cards showing totals

### Notifications Page
- Dedicated page for notification management
- Displays dashboard
- Shows notification type descriptions
- Accessible via `/notifications` route

## API Endpoints

All endpoints are already configured in the backend:

```bash
# Get all notifications (with filters)
GET /api/notifications?status=sent&type=result_published&limit=50&page=1

# Get notifications for a student
GET /api/notifications/student/:studentId

# Get notification statistics
GET /api/notifications/stats/summary

# Resend a failed notification
POST /api/notifications/:id/resend

# Delete a notification record
DELETE /api/notifications/:id
```

## Testing

### Test Student Registration Email
1. Go to Student Management
2. Add a new student with an email
3. Check the notifications dashboard - should show "sent" status

### Test Result Email
1. Go to Result Entry
2. Enter a result for a student
3. Check notifications dashboard

### Test Low Grades Email
1. Enter a result with score < 60%
2. Check notifications dashboard - should show low grades alert

### Test Attendance Warning
1. Go to Attendance
2. Mark multiple absences for a student
3. When attendance drops below 75%, warning email is sent

## Troubleshooting

### Emails not sending
1. Check `.env` configuration in `/server`
2. Verify SMTP credentials are correct
3. Check server logs for error messages
4. Ensure MongoDB is connected (for logging)

### Check sent emails
```bash
# Via API
GET http://localhost:3001/api/notifications?status=sent&limit=10

# Check MongoDB
db.notifications.find({ status: 'sent' }).sort({ createdAt: -1 }).limit(10)
```

### Resend failed emails
1. Go to Notifications page
2. Filter by "failed"
3. Click the resend button (↻ icon)
4. Email will be retried

### Gmail App Password Issues
- Make sure 2FA is enabled
- Generate a new app password
- Use the 16-character password (without spaces)
- Update `.env` and restart server

## Best Practices

1. **Always use try-catch** - Email failures shouldn't crash the app
2. **Non-blocking sends** - Use `.catch()` to handle errors gracefully
3. **Include studentId** - For tracking and audit purposes
4. **Test with Mailtrap** - Use Mailtrap for development
5. **Monitor failed notifications** - Check dashboard regularly
6. **Rate limiting** - Consider adding rate limits to prevent spam

## Security Notes

- Store SMTP credentials in `.env` (never commit)
- Use environment-specific email accounts
- Validate email addresses before sending
- Log all notification attempts for audit trails
- Consider rate limiting on notification endpoints

## Next Steps

1. Configure SMTP settings in `.env`
2. Add routes to your app
3. Add notification bell to header
4. Test with a student registration
5. Monitor notifications dashboard

For more information, see `EMAIL_NOTIFICATIONS.md`
