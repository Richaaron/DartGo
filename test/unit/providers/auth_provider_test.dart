import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../lib/providers/auth_provider.dart';
import '../../../lib/models/models.dart';

import 'auth_provider_test.mocks.dart';

@GenerateMocks([SharedPreferences])
void main() {
  group('AuthProvider Tests', () {
    late AuthProvider authProvider;
    late MockSharedPreferences mockPrefs;

    setUp(() {
      authProvider = AuthProvider();
      mockPrefs = MockSharedPreferences();
    });

    group('Login Tests', () {
      test('should login successfully with valid admin credentials', () async {
        // Arrange
        const email = 'admin@folusho.com';
        const password = 'AdminPassword123!@#';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isTrue);
        expect(authProvider.isAuthenticated, isTrue);
        expect(authProvider.user, isNotNull);
        expect(authProvider.user!.role, UserRole.admin);
        expect(authProvider.user!.email, email);
      });

      test('should login successfully with valid teacher credentials', () async {
        // Arrange
        const email = 'teacher1@folusho.com';
        const password = 'TeacherPassword123!@#';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isTrue);
        expect(authProvider.isAuthenticated, isTrue);
        expect(authProvider.user, isNotNull);
        expect(authProvider.user!.role, UserRole.teacher);
        expect(authProvider.user!.email, email);
      });

      test('should login successfully with valid Dart teacher credentials', () async {
        // Arrange
        const email = 'dart-teacher@folusho.com';
        const password = 'DartTeacher123!@#';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isTrue);
        expect(authProvider.isAuthenticated, isTrue);
        expect(authProvider.user, isNotNull);
        expect(authProvider.user!.role, UserRole.teacher);
        expect(authProvider.user!.email, email);
        
        final teacher = authProvider.user as Teacher;
        expect(teacher.subject, 'Dart Programming');
        expect(teacher.assignedClasses, contains('SSS2A'));
      });

      test('should fail login with invalid email', () async {
        // Arrange
        const email = 'invalid@example.com';
        const password = 'AdminPassword123!@#';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isFalse);
        expect(authProvider.isAuthenticated, isFalse);
        expect(authProvider.user, isNull);
      });

      test('should fail login with invalid password', () async {
        // Arrange
        const email = 'admin@folusho.com';
        const password = 'wrongpassword';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isFalse);
        expect(authProvider.isAuthenticated, isFalse);
        expect(authProvider.user, isNull);
      });

      test('should fail login with empty credentials', () async {
        // Arrange
        const email = '';
        const password = '';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isFalse);
        expect(authProvider.isAuthenticated, isFalse);
        expect(authProvider.user, isNull);
      });

      test('should be case insensitive for email', () async {
        // Arrange
        const email = 'ADMIN@FOLUSHO.COM';
        const password = 'AdminPassword123!@#';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isTrue);
        expect(authProvider.isAuthenticated, isTrue);
        expect(authProvider.user, isNotNull);
      });

      test('should accept username instead of email for teachers', () async {
        // Arrange
        const email = 'teacher1';
        const password = 'TeacherPassword123!@#';

        // Act
        final result = await authProvider.login(email, password);

        // Assert
        expect(result, isTrue);
        expect(authProvider.isAuthenticated, isTrue);
        expect(authProvider.user, isNotNull);
        expect(authProvider.user!.role, UserRole.teacher);
      });
    });

    group('Logout Tests', () {
      test('should logout successfully', () async {
        // Arrange
        await authProvider.login('admin@folusho.com', 'AdminPassword123!@#');
        expect(authProvider.isAuthenticated, isTrue);

        // Act
        await authProvider.logout();

        // Assert
        expect(authProvider.isAuthenticated, isFalse);
        expect(authProvider.user, isNull);
        expect(authProvider.token, isNull);
      });

      test('should handle logout when not logged in', () async {
        // Arrange
        expect(authProvider.isAuthenticated, isFalse);

        // Act
        await authProvider.logout();

        // Assert
        expect(authProvider.isAuthenticated, isFalse);
        expect(authProvider.user, isNull);
      });
    });

    group('Session Management Tests', () {
      test('should maintain session after successful login', () async {
        // Arrange & Act
        await authProvider.login('admin@folusho.com', 'AdminPassword123!@#');

        // Assert
        expect(authProvider.session.isAuthenticated, isTrue);
        expect(authProvider.session.user, isNotNull);
        expect(authProvider.session.token, isNotNull);
        expect(authProvider.session.lastLogin, isNotNull);
      });

      test('should clear session after logout', () async {
        // Arrange
        await authProvider.login('admin@folusho.com', 'AdminPassword123!@#');
        expect(authProvider.session.isAuthenticated, isTrue);

        // Act
        await authProvider.logout();

        // Assert
        expect(authProvider.session.isAuthenticated, isFalse);
        expect(authProvider.session.user, isNull);
        expect(authProvider.session.token, isNull);
      });
    });

    group('User Role Tests', () {
      test('should create correct Admin user', () async {
        // Act
        await authProvider.login('admin@folusho.com', 'AdminPassword123!@#');

        // Assert
        final user = authProvider.user!;
        expect(user, isA<Admin>());
        expect(user.role, UserRole.admin);
        expect(user.id, 'dev-admin');
        expect(user.name, 'Admin User');
      });

      test('should create correct Teacher user', () async {
        // Act
        await authProvider.login('teacher1@folusho.com', 'TeacherPassword123!@#');

        // Assert
        final user = authProvider.user!;
        expect(user, isA<Teacher>());
        expect(user.role, UserRole.teacher);
        expect(user.id, 'dev-teacher-1');
        expect(user.name, 'Mr. Adeyemi');
        
        final teacher = user as Teacher;
        expect(teacher.teacherId, 'T001');
        expect(teacher.username, 'teacher1');
        expect(teacher.subject, 'Mathematics');
        expect(teacher.level, SchoolLevel.secondary);
        expect(teacher.assignedClasses, ['SSS1A', 'SSS1B', 'SSS2A']);
      });

      test('should create correct Dart Teacher user', () async {
        // Act
        await authProvider.login('dart-teacher@folusho.com', 'DartTeacher123!@#');

        // Assert
        final user = authProvider.user!;
        expect(user, isA<Teacher>());
        expect(user.role, UserRole.teacher);
        expect(user.id, 'dev-teacher-dart');
        expect(user.name, 'Ms. Johnson');
        
        final teacher = user as Teacher;
        expect(teacher.teacherId, 'T002');
        expect(teacher.username, 'dartteacher');
        expect(teacher.subject, 'Dart Programming');
        expect(teacher.level, SchoolLevel.secondary);
        expect(teacher.assignedClasses, ['SSS2A', 'SSS2B', 'SSS3A']);
      });
    });

    group('State Management Tests', () {
      test('should notify listeners on login', () async {
        // Arrange
        var notified = false;
        authProvider.addListener(() {
          notified = true;
        });

        // Act
        await authProvider.login('admin@folusho.com', 'AdminPassword123!@#');

        // Assert
        expect(notified, isTrue);
      });

      test('should notify listeners on logout', () async {
        // Arrange
        await authProvider.login('admin@folusho.com', 'AdminPassword123!@#');
        var notified = false;
        authProvider.addListener(() {
          notified = true;
        });

        // Act
        await authProvider.logout();

        // Assert
        expect(notified, isTrue);
      });

      test('should not notify listeners on failed login', () async {
        // Arrange
        var notified = false;
        authProvider.addListener(() {
          notified = true;
        });

        // Act
        await authProvider.login('invalid@example.com', 'wrongpassword');

        // Assert
        expect(notified, isFalse);
      });
    });

    group('Hydration Tests', () {
      test('should be hydrated after initialization', () async {
        // Wait for initialization
        await Future.delayed(const Duration(milliseconds: 100));

        // Assert
        expect(authProvider.isHydrated, isTrue);
      });
    });

    group('Edge Cases', () {
      test('should handle null email gracefully', () async {
        // Act
        final result = await authProvider.login('', 'AdminPassword123!@#');

        // Assert
        expect(result, isFalse);
        expect(authProvider.isAuthenticated, isFalse);
      });

      test('should handle null password gracefully', () async {
        // Act
        final result = await authProvider.login('admin@folusho.com', '');

        // Assert
        expect(result, isFalse);
        expect(authProvider.isAuthenticated, isFalse);
      });

      test('should handle whitespace in credentials', () async {
        // Act
        final result = await authProvider.login('  admin@folusho.com  ', '  AdminPassword123!@#  ');

        // Assert
        expect(result, isTrue);
        expect(authProvider.isAuthenticated, isTrue);
      });
    });
  });
}
