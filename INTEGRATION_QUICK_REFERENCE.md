# Quick Integration Reference

## 1. Add Notification Bell to Header

In your header/navbar component (likely in `App.tsx` or a Header component):

```typescript
import NotificationBell from './components/NotificationBell'

// In your header JSX:
<header className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
    <h1 className="text-2xl font-bold">Folusho Reporting Sheet</h1>
    
    <div className="flex items-center gap-4">
      <NotificationBell />
      {/* Other header items like user menu, etc */}
    </div>
  </div>
</header>
```

## 2. Add Notifications Route

In your `App.tsx` router configuration:

```typescript
import NotificationsPage from './pages/Notifications'

// In your Routes:
<Routes>
  {/* Existing routes */}
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/students" element={<StudentManagement />} />
  <Route path="/results" element={<ResultEntry />} />
  <Route path="/reports" element={<Reports />} />
  
  {/* Add this new route */}
  <Route path="/notifications" element={<NotificationsPage />} />
</Routes>
```

## 3. Add Navigation Link

Add a link to the notifications page in your sidebar/navigation:

```typescript
<nav className="space-y-2">
  <Link to="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-100">
    Dashboard
  </Link>
  <Link to="/students" className="block px-4 py-2 rounded hover:bg-gray-100">
    Students
  </Link>
  <Link to="/results" className="block px-4 py-2 rounded hover:bg-gray-100">
    Results
  </Link>
  <Link to="/reports" className="block px-4 py-2 rounded hover:bg-gray-100">
    Reports
  </Link>
  
  {/* Add this new link */}
  <Link to="/notifications" className="block px-4 py-2 rounded hover:bg-gray-100 flex items-center gap-2">
    <Bell className="w-4 h-4" />
    Notifications
  </Link>
</nav>
```

## 4. Environment Configuration

Create/update `server/.env`:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/folusho

# Server
PORT=3001
NODE_ENV=development

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@folusho.com

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-here

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 5. Frontend Environment (if needed)

In `.env` or `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
```

## File Structure After Integration

```
src/
├── components/
│   ├── NotificationBell.tsx          ← NEW
│   ├── NotificationDashboard.tsx     ← NEW
│   ├── StudentForm.tsx
│   ├── ResultForm.tsx
│   └── ...
├── pages/
│   ├── Notifications.tsx             ← NEW
│   ├── Dashboard.tsx
│   ├── StudentManagement.tsx
│   ├── ResultEntry.tsx
│   └── ...
├── services/
│   ├── notificationAPI.ts            ← Already exists
│   ├── api.ts
│   └── ...
└── App.tsx                           ← Update with new route
```

## Testing the Integration

### 1. Start Backend
```bash
cd server
npm run dev
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Student Registration Email
- Navigate to Student Management
- Add a new student with email
- Check `/notifications` page - should show "sent" status

### 4. Test Result Email
- Navigate to Result Entry
- Enter a result for a student
- Check notifications page

### 5. Test Low Grades Email
- Enter a result with score < 60%
- Check notifications page for low grades alert

### 6. Test Attendance Warning
- Go to Attendance
- Mark multiple absences
- When attendance < 75%, warning email is sent

## Verification Checklist

- [ ] Backend `.env` configured with SMTP settings
- [ ] NotificationBell component added to header
- [ ] Notifications route added to App.tsx
- [ ] Navigation link added to sidebar
- [ ] Backend server running (`npm run dev` in `/server`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Can access `/notifications` page
- [ ] Notification bell shows in header
- [ ] Test email sent successfully

## Common Issues

### "Cannot find module 'notificationAPI'"
- Make sure `src/services/notificationAPI.ts` exists
- Check import path is correct

### "Notifications page not loading"
- Verify route is added to App.tsx
- Check browser console for errors
- Ensure backend is running

### "Emails not sending"
- Check `.env` SMTP configuration
- Verify Gmail app password (not regular password)
- Check server logs for error messages

### "Notification bell not showing"
- Verify NotificationBell component is imported
- Check it's added to header JSX
- Ensure Lucide React icons are installed

## Next Steps

1. Configure SMTP in `server/.env`
2. Add routes and components as shown above
3. Restart both backend and frontend
4. Test with student registration
5. Monitor notifications dashboard

For detailed information, see `EMAIL_INTEGRATION_SETUP.md`
