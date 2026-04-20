# Folusho Victory Schools - Dart/Flutter Web Version

A comprehensive, professional school result management system built with **Dart programming language** and **Flutter Web**. This is the complete Dart conversion of the original React/TypeScript application, enhanced with enterprise-level features and modern architecture patterns.

## Features

### Core Functionality
- **Multi-role Authentication**: Admin, Teacher, Student, and Parent access
- **Student Management**: Complete CRUD operations with advanced filtering
- **Teacher Management**: Subject assignment and class management
- **Result Entry**: Comprehensive assessment tracking (Tests, Exams, Assignments, Projects)
- **Advanced Reporting**: Student performance, class analytics, subject analysis
- **Dart Programming Subject**: Full integration as an elective subject (3 credit units)

### Enterprise Features
- **Advanced Routing**: Nested routes with role-based access control
- **Internationalization**: Support for English, Spanish, French, and Yoruba
- **Comprehensive Error Handling**: Custom exception classes and logging
- **Caching & Offline Support**: Intelligent caching with offline data management
- **Analytics & Monitoring**: Performance tracking and user behavior analytics
- **Reusable Component Library**: Custom widgets with extensive customization
- **Form Validation**: Advanced validation with multiple rule types
- **Testing Suite**: Unit and widget tests with high coverage

## Technology Stack

### Frontend Framework
- **Flutter Web 3.10+**: Cross-platform web application framework
- **Dart 3.0+**: Modern, type-safe programming language
- **Material Design 3**: Modern UI design system

### State Management
- **Provider Pattern**: Reactive state management
- **Riverpod**: Advanced dependency injection

### Routing & Navigation
- **Go Router**: Declarative routing with nested routes
- **Route Guards**: Role-based access control

### Data Management
- **Shared Preferences**: Local storage
- **Hive**: High-performance NoSQL database
- **JSON Serialization**: Automatic code generation

### Internationalization
- **Flutter Localizations**: Built-in i18n support
- **Custom Localization**: 4 languages supported

### Testing
- **Flutter Test**: Unit and widget testing
- **Mockito**: Mock objects for testing
- **Golden Tests**: Visual regression testing

## Architecture

### Project Structure
```
lib/
  core/                    # Core application infrastructure
    analytics/           # Performance and user analytics
    cache/               # Caching and offline support
    error/               # Error handling and logging
    localization/        # Internationalization
    router/              # Advanced routing system
  models/                 # Data models and type definitions
  providers/              # State management providers
  screens/               # Application screens/pages
  services/              # API and business logic services
  utils/                 # Utility functions and helpers
  widgets/               # Reusable UI components
    components/          # Custom component library
    app_layout.dart      # Main application layout
```

### Key Architectural Patterns
- **Clean Architecture**: Separation of concerns with layered architecture
- **Repository Pattern**: Data access abstraction
- **Provider Pattern**: Reactive state management
- **Dependency Injection**: Loose coupling and testability
- **Error Boundaries**: Graceful error handling

## Installation & Setup

### Prerequisites
- **Flutter SDK**: 3.10.0 or higher
- **Dart SDK**: 3.0.0 or higher
- **Node.js**: For development tools (optional)

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd folusho-result-system-dart
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Generate code**:
   ```bash
   flutter packages pub run build_runner build
   ```

4. **Run the application**:
   ```bash
   flutter run -d chrome
   ```

5. **Run tests**:
   ```bash
   flutter test
   ```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
API_URL=http://localhost:3001/api
ENABLE_ANALYTICS=true
ENABLE_CACHE=true
DEFAULT_LANGUAGE=en
```

### Cache Configuration
```dart
CacheConfig(
  defaultTtl: Duration(hours: 1),
  maxCacheSize: 1000,
  enableCompression: true,
  enableEncryption: false,
)
```

### Analytics Configuration
```dart
AnalyticsConfig(
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  flushInterval: Duration(minutes: 1),
  maxBatchSize: 50,
  debugMode: kDebugMode,
)
```

## Usage Guide

### Authentication
The system supports multiple user roles with different access levels:

#### Admin Account
- **Email**: `admin@folusho.com`
- **Password**: `AdminPassword123!@#`
- **Access**: Full system administration

#### Teacher Accounts
- **Mathematics Teacher**: `teacher1@folusho.com` / `TeacherPassword123!@#`
- **Dart Programming Teacher**: `dart-teacher@folusho.com` / `DartTeacher123!@#`

#### Navigation
- **Role-based routing**: Automatic redirection based on user role
- **Nested routes**: Deep linking support for all screens
- **Route guards**: Protection of sensitive routes

### Student Management
1. Navigate to **Students** section
2. Use **Add Student** to create new student records
3. Apply filters for searching and sorting
4. Export data to CSV format

### Result Entry
1. Navigate to **Results** section
2. Select student and subject
3. Enter assessment scores (Test, Exam, Assignment, Project)
4. Automatic grade calculation based on percentage

### Reporting
1. Navigate to **Reports** section
2. Choose report type:
   - **Student Performance**: Individual analytics
   - **Class Performance**: Class-wide statistics
   - **Subject Analysis**: Subject performance metrics
3. Apply filters for detailed insights

## Dart Programming Integration

### Subject Configuration
```dart
Subject(
  id: 'sec-27',
  name: 'Dart Programming',
  code: 'DRT',
  level: SchoolLevel.secondary,
  creditUnits: 3,
  subjectCategory: SubjectCategory.elective,
)
```

### Teacher Assignment
```dart
Teacher(
  id: 'dev-teacher-dart',
  name: 'Ms. Johnson',
  subject: 'Dart Programming',
  assignedClasses: ['SSS2A', 'SSS2B', 'SSS3A'],
)
```

### Result Tracking
- Automatic grade calculation for Dart assignments
- Performance analytics for programming assessments
- Integration with existing reporting system

## Advanced Features

### Error Handling
```dart
try {
  // Your code here
} catch (e, stackTrace) {
  ErrorHandler.handleError(
    AppException(
      message: 'Operation failed',
      originalError: e,
      stackTrace: stackTrace,
    ),
  );
}
```

### Caching
```dart
// Cache data with TTL
await CacheManager.instance.set(
  'students',
  studentsData,
  ttl: Duration(minutes: 30),
);

// Retrieve cached data
final cached = await CacheManager.instance.get<List<Student>>('students');
```

### Analytics
```dart
// Track user actions
await AnalyticsManager.instance.trackUserAction(
  'button_click',
  'add_student',
);

// Track performance
await AnalyticsManager.instance.trackPerformance(
  'api_call_duration',
  duration.inMilliseconds.toDouble(),
  unit: 'ms',
);
```

### Internationalization
```dart
// Get localized text
Text(AppLocalizations.of(context).welcome)

// Change language
await context.setLocale(Locale('es', 'ES'));
```

## Testing

### Unit Tests
```bash
flutter test test/unit/
```

### Widget Tests
```bash
flutter test test/widget/
```

### Integration Tests
```bash
flutter test test/integration/
```

### Coverage Report
```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

## Performance Optimization

### Memory Management
- Automatic cache eviction based on LRU algorithm
- Memory leak detection and prevention
- Efficient widget disposal

### Rendering Optimization
- Widget performance tracking
- Frame rate monitoring
- Lazy loading for large datasets

### Network Optimization
- Request batching and deduplication
- Offline-first architecture
- Intelligent cache invalidation

## Security

### Authentication
- Secure token storage
- Session management
- Role-based access control

### Data Protection
- Input validation and sanitization
- XSS prevention
- CSRF protection

### Privacy
- No data collection without consent
- Secure local storage
- Privacy policy compliance

## Deployment

### Web Deployment
```bash
# Build for production
flutter build web

# Deploy to hosting service
firebase deploy
```

### Environment Configuration
- **Development**: Local development server
- **Staging**: Pre-production testing
- **Production**: Live deployment

## Contributing

### Code Style
- Follow Dart style guidelines
- Use dartfmt for code formatting
- Implement comprehensive tests

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clean build
flutter clean
flutter pub get
flutter packages pub run build_runner build --delete-conflicting-outputs
```

#### Test Failures
```bash
# Update test dependencies
flutter pub upgrade
flutter test
```

#### Performance Issues
- Check analytics dashboard for bottlenecks
- Monitor cache hit rates
- Profile memory usage

## Support

### Documentation
- **API Reference**: Generated documentation for all public APIs
- **Component Library**: Complete widget documentation
- **Architecture Guide**: Detailed system architecture documentation

### Community
- **Issues**: Report bugs and feature requests
- **Discussions**: Community support and discussions
- **Wiki**: Additional documentation and guides

## License

This software is developed for Folusho Victory Schools.

## Version History

### v2.0.0 - Dart/Flutter Web Version
- Complete conversion from React/TypeScript to Dart
- Added enterprise-level features
- Enhanced performance and security
- Comprehensive testing suite

### v1.0.0 - Original React Version
- Initial React/TypeScript implementation
- Basic school management functionality

---

**Technology**: Dart 3.0+ / Flutter Web 3.10+  
**Architecture**: Clean Architecture with Provider Pattern  
**Testing**: Comprehensive unit and widget tests  
**Performance**: Optimized for web deployment  
**Security**: Enterprise-grade security measures
