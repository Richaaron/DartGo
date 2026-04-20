import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class AuthProvider extends ChangeNotifier {
  AuthSession _session = const AuthSession(isAuthenticated: false);
  bool _isHydrated = false;

  AuthSession get session => _session;
  User? get user => _session.user;
  bool get isAuthenticated => _session.isAuthenticated;
  String? get token => _session.token;
  bool get isHydrated => _isHydrated;

  // Development fallback users
  static const List<Map<String, dynamic>> _developmentUsers = [
    {
      'loginIds': ['admin@folusho.com'],
      'password': 'AdminPassword123!@#',
      'user': {
        'id': 'dev-admin',
        'email': 'admin@folusho.com',
        'name': 'Admin User',
        'role': 'Admin',
      },
    },
    {
      'loginIds': ['teacher1@folusho.com', 'teacher1'],
      'password': 'TeacherPassword123!@#',
      'user': {
        'id': 'dev-teacher-1',
        'email': 'teacher1@folusho.com',
        'name': 'Mr. Adeyemi',
        'role': 'Teacher',
        'teacherId': 'T001',
        'username': 'teacher1',
        'subject': 'Mathematics',
        'level': 'Secondary',
        'assignedClasses': ['SSS1A', 'SSS1B', 'SSS2A'],
      },
    },
    {
      'loginIds': ['dart-teacher@folusho.com', 'dartteacher'],
      'password': 'DartTeacher123!@#',
      'user': {
        'id': 'dev-teacher-dart',
        'email': 'dart-teacher@folusho.com',
        'name': 'Ms. Johnson',
        'role': 'Teacher',
        'teacherId': 'T002',
        'username': 'dartteacher',
        'subject': 'Dart Programming',
        'level': 'Secondary',
        'assignedClasses': ['SSS2A', 'SSS2B', 'SSS3A'],
      },
    },
  ];

  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final sessionJson = prefs.getString('authSession');
      
      if (sessionJson != null) {
        // In a real app, you'd parse JSON here
        _session = const AuthSession(isAuthenticated: false);
      }
    } catch (e) {
      debugPrint('Failed to load auth session: $e');
      _session = const AuthSession(isAuthenticated: false);
    }
    
    _isHydrated = true;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    final normalizedEmail = email.trim().toLowerCase();

    // Try API login first (in a real app)
    try {
      // final response = await http.post(Uri.parse('$apiUrl/auth/login'), ...);
      // if (response.ok) return true;
    } catch (e) {
      debugPrint('API login failed, checking development credentials: $e');
    }

    // Check development fallback users
    final fallbackUser = _developmentUsers.firstWhere(
      (user) =>
          user['password'] == password &&
          (user['loginIds'] as List<String>).contains(normalizedEmail),
      orElse: () => {},
    );

    if (fallbackUser.isEmpty) {
      return false;
    }

    // Create user object based on role
    final userData = fallbackUser['user'] as Map<String, dynamic>;
    User user;

    switch (userData['role']) {
      case 'Admin':
        user = Admin(
          id: userData['id'],
          email: userData['email'],
          name: userData['name'],
          role: UserRole.admin,
        );
        break;
      case 'Teacher':
        user = Teacher(
          id: userData['id'],
          email: userData['email'],
          name: userData['name'],
          role: UserRole.teacher,
          teacherId: userData['teacherId'],
          username: userData['username'],
          subject: userData['subject'],
          level: _parseSchoolLevel(userData['level']),
          assignedClasses: List<String>.from(userData['assignedClasses']),
        );
        break;
      default:
        user = User(
          id: userData['id'],
          email: userData['email'],
          name: userData['name'],
          role: _parseUserRole(userData['role']),
        );
    }

    final newSession = AuthSession(
      user: user,
      token: 'dev-local-token',
      isAuthenticated: true,
      lastLogin: DateTime.now().toIso8601String(),
    );

    await _saveSession(newSession);
    _session = newSession;
    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    _session = const AuthSession(isAuthenticated: false);
    await _clearSession();
    notifyListeners();
  }

  Future<void> _saveSession(AuthSession session) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // In a real app, you'd save JSON here
      await prefs.setString('authSession', 'session_data');
    } catch (e) {
      debugPrint('Failed to save auth session: $e');
    }
  }

  Future<void> _clearSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('authSession');
    } catch (e) {
      debugPrint('Failed to clear auth session: $e');
    }
  }

  UserRole _parseUserRole(String role) {
    switch (role) {
      case 'Admin':
        return UserRole.admin;
      case 'Teacher':
        return UserRole.teacher;
      case 'Student':
        return UserRole.student;
      case 'Parent':
        return UserRole.parent;
      default:
        return UserRole.student;
    }
  }

  SchoolLevel _parseSchoolLevel(String level) {
    switch (level) {
      case 'Pre-Nursery':
        return SchoolLevel.preNursery;
      case 'Nursery':
        return SchoolLevel.nursery;
      case 'Primary':
        return SchoolLevel.primary;
      case 'Secondary':
        return SchoolLevel.secondary;
      default:
        return SchoolLevel.primary;
    }
  }
}
