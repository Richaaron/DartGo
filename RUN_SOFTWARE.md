# How to Run the School Management System

## Prerequisites

### 1. Install Node.js (Backend)
- Download and install Node.js 18+ from [https://nodejs.org](https://nodejs.org)
- Verify installation: `node --version` and `npm --version`

### 2. Install Flutter (Frontend)
- Download and install Flutter from [https://flutter.dev](https://flutter.dev)
- Add Flutter to your PATH
- Verify installation: `flutter --version`

### 3. Install PostgreSQL (Database)
- Download and install PostgreSQL from [https://postgresql.org](https://postgresql.org)
- Create a database for the application

## Setup Instructions

### Step 1: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Edit `.env` with your database settings:
   ```env
   PORT=3001
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=folusho_school_dev
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create database**:
   ```bash
   # Using psql
   createdb folusho_school_dev
   ```

5. **Start backend server**:
   ```bash
   npm run dev
   ```

### Step 2: Frontend Setup

1. **Navigate to root directory**:
   ```bash
   cd ..  # Go back to project root
   ```

2. **Install Flutter dependencies**:
   ```bash
   flutter pub get
   ```

3. **Start Flutter web server**:
   ```bash
   flutter run -d chrome
   ```

### Step 3: Access the Application

1. **Backend API**: http://localhost:3001
2. **Frontend Web App**: http://localhost:3000 (or the URL shown by Flutter)
3. **API Documentation**: http://localhost:3001/api-docs

## Demo Accounts

### Admin Account
- **Email**: `admin@folusho.com`
- **Password**: `AdminPassword123!@#`

### Teacher Accounts
- **Mathematics Teacher**: `teacher1@folusho.com` / `TeacherPassword123!@#`
- **Dart Programming Teacher**: `dart-teacher@folusho.com` / `DartTeacher123!@#`

### Student Account
- **Email**: `student1@folusho.com`
- **Password**: `StudentPassword123!@#`

## Troubleshooting

### Backend Issues

#### Database Connection Error
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

#### TypeScript Compilation Errors
- Run `npm run build` to check for errors
- Install missing dependencies: `npm install`

#### Port Already in Use
- Kill process on port 3001: `netstat -ano | findstr :3001`
- Change port in `.env` file

### Frontend Issues

#### Flutter Command Not Found
- Add Flutter to PATH
- Restart terminal/command prompt
- Verify installation: `flutter doctor`

#### Web Server Won't Start
- Run `flutter doctor` to check for issues
- Install Chrome: `flutter doctor --enable-web`
- Clear Flutter cache: `flutter clean`

### Common Issues

#### Dependencies Installation Failed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and run `npm install`
- Use administrator privileges if needed

#### Real-time Features Not Working
- Check backend server is running
- Verify Socket.io is properly configured
- Check browser console for WebSocket errors

## Development Workflow

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend (in separate terminal)
```bash
flutter run -d chrome
```

### 3. Make Changes
- Backend changes auto-reload with nodemon
- Frontend changes auto-reload with Flutter hot reload

### 4. Testing
- Backend tests: `npm test`
- Frontend tests: `flutter test`

## Production Deployment

### Backend
```bash
npm run build
npm start
```

### Frontend
```bash
flutter build web
# Deploy build/web folder to web server
```

## Features Available

### Core Features
- **Authentication**: Login with demo accounts
- **Student Management**: Add, edit, delete students
- **Teacher Management**: Manage teachers and subjects
- **Result Entry**: Enter grades and assessments
- **Reports**: Generate performance reports

### Advanced Features
- **Dart Programming Subject**: Fully integrated
- **Real-time Updates**: Live grade notifications
- **Internationalization**: 4 languages supported
- **Analytics**: Performance monitoring
- **Caching**: Offline support

### User Roles
- **Admin**: Full system access
- **Teacher**: Manage students and grades
- **Student**: View own results
- **Parent**: View children's performance

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Results
- `GET /api/results` - List results
- `POST /api/results` - Create result
- `PUT /api/results/:id` - Update result

### Reports
- `GET /api/reports/student/:id` - Student report
- `GET /api/reports/class/:name` - Class report

## Database Schema

### Tables
- **users** - Authentication and user management
- **students** - Student records
- **subjects** - Subject information (including Dart Programming)
- **results** - Grade and assessment records

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the GitHub repository: https://github.com/Richaaron/DartGo
3. Check the API documentation at http://localhost:3001/api-docs

## Next Steps

1. Install prerequisites (Node.js, Flutter, PostgreSQL)
2. Follow the setup instructions
3. Start both backend and frontend servers
4. Access the application in your browser
5. Test with demo accounts

Enjoy your complete school management system!
