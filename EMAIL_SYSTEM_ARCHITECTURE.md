# Email Notifications System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐         ┌──────────────────────┐          │
│  │  Student Management  │         │  Result Entry        │          │
│  │  - Add Student       │         │  - Enter Results     │          │
│  │  - Edit Student      │         │  - Bulk Upload       │          │
│  └──────────────────────┘         └──────────────────────┘          │
│           │                                 │                        │
│           │ POST /api/students              │ POST /api/results     │
│           │                                 │                        │
│  ┌──────────────────────┐         ┌──────────────────────┐          │
│  │  Attendance Page     │         │  Notifications Page  │          │
│  │  - Mark Attendance   │         │  - View All Notifs   │          │
│  │  - Bulk Upload       │         │  - Filter by Status  │          │
│  └──────────────────────┘         │  - Resend Failed     │          │
│           │                        │  - Delete Records    │          │
│           │ POST /api/attendance/bulk  └──────────────────────┘     │
│           │                                 ▲                        │
│           │                                 │                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         NotificationBell Component (Header)                │    │
│  │  - Shows unread count                                      │    │
│  │  - Dropdown with recent notifications                      │    │
│  │  - Auto-refresh every 30 seconds                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                 ▲                                    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
                    GET /api/notifications
                                  │
┌─────────────────────────────────┼────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                       │
├─────────────────────────────────┼────────────────────────────────────┤
│                                  │                                    │
│  ┌──────────────────────────────▼──────────────────────────────┐   │
│  │              API Routes (with Email Triggers)               │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  POST /api/students                                          │   │
│  │  └─► sendStudentRegistrationEmail()                         │   │
│  │      └─► Sends: Welcome + Registration Number              │   │
│  │                                                              │   │
│  │  POST /api/results                                           │   │
│  │  ├─► sendResultPublishedEmail()                             │   │
│  │  │   └─► Sends: Results Ready Notification                 │   │
│  │  └─► sendLowGradesEmail() [if score < 60%]                 │   │
│  │      └─► Sends: Low Grades Alert                           │   │
│  │                                                              │   │
│  │  POST /api/results/bulk                                      │   │
│  │  ├─► sendResultPublishedEmail() [for each student]          │   │
│  │  └─► sendLowGradesEmail() [for low grades]                  │   │
│  │                                                              │   │
│  │  POST /api/attendance/bulk                                   │   │
│  │  └─► sendAttendanceWarningEmail() [if attendance < 75%]     │   │
│  │      └─► Sends: Attendance Warning                          │   │
│  │                                                              │   │
│  │  GET /api/notifications                                      │   │
│  │  └─► Returns: Filtered notification list                    │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Email Utility Functions (email.ts)                │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  sendEmail(options)                                          │   │
│  │  ├─► Sends via SMTP (Gmail/Mailtrap)                        │   │
│  │  └─► Logs to MongoDB Notification collection               │   │
│  │                                                              │   │
│  │  sendStudentRegistrationEmail()                              │   │
│  │  sendResultPublishedEmail()                                  │   │
│  │  sendLowGradesEmail()                                        │   │
│  │  sendAttendanceWarningEmail()                                │   │
│  │  sendFeeReminderEmail()                                      │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              SMTP Server (Gmail/Mailtrap)                   │   │
│  │  - Sends email to parent                                    │   │
│  │  - Returns message ID on success                            │   │
│  │  - Returns error on failure                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           MongoDB (Notification Collection)                 │   │
│  │  - Stores all notification records                          │   │
│  │  - Status: sent, failed, pending                            │   │
│  │  - Includes error messages for failed emails                │   │
│  │  - Tracks metadata (subject, amount, etc)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  Parent's Email  │
                        │  (Gmail, etc)    │
                        └──────────────────┘
```

## Email Trigger Flow

### 1. Student Registration Flow
```
Admin adds student
        │
        ▼
POST /api/students
        │
        ▼
Student saved to DB
        │
        ▼
sendStudentRegistrationEmail()
        │
        ├─► Create HTML email with registration number
        │
        ├─► Send via SMTP
        │
        ├─► Log to MongoDB (status: sent/failed)
        │
        ▼
Parent receives email
```

### 2. Result Published Flow
```
Teacher enters result
        │
        ▼
POST /api/results
        │
        ▼
Result saved to DB
        │
        ├─► sendResultPublishedEmail()
        │   └─► Parent notified: Results ready
        │
        └─► Check if score < 60%
            └─► sendLowGradesEmail()
                └─► Parent notified: Low grades alert
```

### 3. Attendance Warning Flow
```
Teacher marks attendance
        │
        ▼
POST /api/attendance/bulk
        │
        ▼
Attendance saved to DB
        │
        ▼
For each absent student:
        │
        ├─► Calculate attendance %
        │
        └─► If < 75%
            └─► sendAttendanceWarningEmail()
                └─► Parent notified: Attendance warning
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Header                                           │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  NotificationBell                           │  │  │
│  │  │  - Fetches recent notifications             │  │  │
│  │  │  - Shows dropdown                           │  │  │
│  │  │  - Links to /notifications                  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Routes                                           │  │
│  │  ├─ /dashboard                                    │  │
│  │  ├─ /students                                     │  │
│  │  ├─ /results                                      │  │
│  │  ├─ /attendance                                   │  │
│  │  └─ /notifications ◄─── NEW                       │  │
│  │     └─► NotificationsPage                         │  │
│  │         └─► NotificationDashboard                 │  │
│  │             ├─ Stats Cards                        │  │
│  │             ├─ Filter Tabs                        │  │
│  │             ├─ Notification List                  │  │
│  │             └─ Pagination                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Data Flow: Notification Creation

```
Event Triggered (e.g., student added)
        │
        ▼
Route Handler (e.g., POST /api/students)
        │
        ├─► Save data to DB
        │
        └─► Call email function
            │
            ├─► Create email content
            │
            ├─► Send via SMTP
            │
            └─► Log to MongoDB
                │
                ├─ recipientEmail
                ├─ type
                ├─ subject
                ├─ body
                ├─ status (sent/failed)
                ├─ studentId
                ├─ sentAt
                ├─ errorMessage (if failed)
                └─ metadata
```

## Notification Status Lifecycle

```
┌─────────────┐
│   PENDING   │  (Initial state)
└──────┬──────┘
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
   ┌────────┐                   ┌────────┐
   │  SENT  │                   │ FAILED │
   └────────┘                   └────┬───┘
       │                             │
       │                    ┌────────▼────────┐
       │                    │  User clicks    │
       │                    │  "Resend"       │
       │                    └────────┬────────┘
       │                             │
       │                    ┌────────▼────────┐
       │                    │  Retry sending  │
       │                    └────────┬────────┘
       │                             │
       │                    ┌────────▼────────┐
       │                    │  SENT or FAILED │
       │                    └─────────────────┘
       │
       └─────────────────────────────┐
                                     │
                            ┌────────▼────────┐
                            │  User deletes   │
                            │  record         │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  DELETED        │
                            └─────────────────┘
```

## Key Integration Points

1. **Backend Routes** - Email triggers added to:
   - `POST /api/students` → Student registration email
   - `POST /api/results` → Result published + low grades emails
   - `POST /api/attendance/bulk` → Attendance warning emails

2. **Frontend Components** - New components:
   - `NotificationBell` → Header notification indicator
   - `NotificationDashboard` → Full management interface
   - `NotificationsPage` → Dedicated page

3. **API Service** - Already exists:
   - `notificationAPI.ts` → Handles all notification API calls

4. **Database** - MongoDB collection:
   - `notifications` → Stores all notification records

## Error Handling

```
Email Send Attempt
        │
        ├─► Success
        │   └─► Log as "sent"
        │       └─► Return to user
        │
        └─► Failure
            ├─► Catch error
            │
            ├─► Log as "failed"
            │
            ├─► Store error message
            │
            └─► Show in dashboard
                └─► User can resend
```

## Performance Considerations

- **Non-blocking**: Email sends don't block request
- **Async**: Uses `.catch()` for error handling
- **Efficient**: Bulk operations process multiple records
- **Cached**: Notification bell refreshes every 30 seconds
- **Paginated**: Dashboard shows 20 items per page
- **Indexed**: MongoDB queries optimized with filters

## Security Flow

```
User Action
    │
    ▼
Authentication Check (JWT)
    │
    ├─► Valid
    │   └─► Process request
    │       └─► Send email
    │           └─► Log to DB
    │
    └─► Invalid
        └─► Return 401 Unauthorized
```

This architecture ensures:
- ✅ Reliable email delivery
- ✅ Complete audit trail
- ✅ Error recovery capability
- ✅ User-friendly monitoring
- ✅ Secure operations
