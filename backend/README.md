# Folusho Victory Schools - Backend API

Node.js/Express/TypeScript backend API for the Folusho Victory Schools Result Management System.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database Management**: PostgreSQL with Sequelize ORM
- **Real-time Features**: Socket.io for live updates
- **File Upload**: Support for documents and images
- **PDF Generation**: Report card generation
- **Data Export**: Excel and CSV export functionality
- **Validation**: Comprehensive input validation
- **Error Handling**: Centralized error management
- **Security**: Rate limiting, CORS, helmet protection
- **Logging**: Structured logging with Winston
- **API Documentation**: Swagger/OpenAPI documentation

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Validation**: Express Validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

## Installation

### Prerequisites
- Node.js 18.0 or higher
- PostgreSQL 12.0 or higher
- npm or yarn

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd folusho-school-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**:
   ```bash
   # Create database
   createdb folusho_school_dev
   
   # Run migrations
   npm run db:migrate
   
   # Seed data (optional)
   npm run db:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=folusho_school_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create new subject
- `GET /api/subjects/:id` - Get subject by ID
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Results
- `GET /api/results` - Get all results
- `POST /api/results` - Create new result
- `GET /api/results/:id` - Get result by ID
- `PUT /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result

### Reports
- `GET /api/reports/student/:studentId` - Student performance report
- `GET /api/reports/class/:className` - Class performance report
- `GET /api/reports/subject/:subjectId` - Subject performance report
- `GET /api/reports/export` - Export reports

## User Roles

### Admin
- Full system access
- User management
- System configuration
- All CRUD operations

### Teacher
- Student management (assigned classes)
- Result entry and management
- Report generation
- Subject management

### Student
- View own results
- View personal information
- Download reports

### Parent
- View children's results
- View attendance
- Download reports

## Real-time Features

The backend supports real-time updates using Socket.io:

- **Grade Updates**: Live grade updates to parents and students
- **Attendance**: Real-time attendance tracking
- **Notifications**: System notifications
- **Chat**: Teacher-parent communication

### Socket Events

```javascript
// Join room
socket.emit('join-room', 'class-SSS1A');

// Grade updates
socket.emit('grade-updated', {
  studentId: 'student-123',
  className: 'SSS1A',
  grade: 'A',
  subject: 'Mathematics'
});

// Listen for updates
socket.on('grade-change', (data) => {
  console.log('Grade updated:', data);
});
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `role` (Enum: Admin, Teacher, Student, Parent)
- `status` (Enum: Active, Inactive, Suspended)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Students Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `registrationNumber` (String, Unique)
- `firstName` (String)
- `lastName` (String)
- `dateOfBirth` (Date)
- `gender` (Enum: Male, Female)
- `level` (Enum: Pre-Nursery, Nursery, Primary, Secondary)
- `className` (String)
- `parentName` (String)
- `parentPhone` (String)
- `parentEmail` (String)
- `enrollmentDate` (Date)
- `status` (Enum: Active, Inactive, Suspended)

### Subjects Table
- `id` (UUID, Primary Key)
- `name` (String)
- `code` (String, Unique)
- `level` (Enum: Pre-Nursery, Nursery, Primary, Secondary)
- `creditUnits` (Integer)
- `subjectCategory` (Enum: CORE, ELECTIVE, VOCATIONAL)
- `description` (Text)
- `curriculumType` (Enum: NIGERIAN, IGCSE, OTHER)
- `isActive` (Boolean)

### Results Table
- `id` (UUID, Primary Key)
- `studentId` (UUID, Foreign Key)
- `subjectId` (UUID, Foreign Key)
- `assessmentType` (Enum: Test, Exam, Assignment, Project)
- `score` (Decimal)
- `totalScore` (Decimal)
- `term` (String)
- `academicYear` (String)
- `recordedBy` (UUID, Foreign Key)
- `percentage` (Decimal)
- `grade` (String)
- `gradePoint` (Decimal)
- `remarks` (String)

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
  unit/
    controllers/
    services/
    middleware/
  integration/
    auth/
    students/
    results/
  fixtures/
    users.json
    students.json
```

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## API Documentation

Once the server is running, visit `http://localhost:3001/api-docs` to view the interactive API documentation.

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive input validation
- **SQL Injection Prevention**: Sequelize ORM protection
- **XSS Protection**: Input sanitization

## Performance Optimizations

- **Database Indexing**: Optimized database queries
- **Caching**: Redis for frequently accessed data
- **Compression**: Gzip compression for responses
- **Connection Pooling**: Database connection management
- **Lazy Loading**: Efficient data loading

## Monitoring & Logging

- **Structured Logging**: Winston for application logs
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Request timing and monitoring
- **Health Checks**: Application health endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This software is developed for Folusho Victory Schools.

## Support

For support or issues, please contact the development team.
