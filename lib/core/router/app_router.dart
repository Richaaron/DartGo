import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../screens/login_screen.dart';
import '../../screens/dashboard_screen.dart';
import '../../screens/student_management_screen.dart';
import '../../screens/teacher_management_screen.dart';
import '../../screens/result_entry_screen.dart';
import '../../screens/reports_screen.dart';
import '../../screens/teacher_dashboard_screen.dart';
import '../../screens/parent_dashboard_screen.dart';
import '../../screens/settings_screen.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/error_screen.dart';
import '../../widgets/not_found_screen.dart';

class AppRouter {
  static const String login = '/login';
  static const String dashboard = '/dashboard';
  static const String students = '/students';
  static const String teachers = '/teachers';
  static const String results = '/results';
  static const String reports = '/reports';
  static const String teacherDashboard = '/teacher-dashboard';
  static const String parentDashboard = '/parent-dashboard';
  static const String settings = '/settings';
  static const String profile = '/profile';
  static const String help = '/help';
  static const String about = '/about';

  static final GoRouter router = GoRouter(
    initialLocation: login,
    errorBuilder: (context, state) => ErrorScreen(error: state.error),
    redirectLimit: 5,
    extraCodec: const Codec<dynamic, dynamic>(),
    debugLogDiagnostics: true,
    routes: [
      // Public routes
      GoRoute(
        path: login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Protected routes with shell
      ShellRoute(
        builder: (context, state, child) => AppLayout(child: child),
        routes: [
          // Dashboard
          GoRoute(
            path: dashboard,
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
            routes: [
              GoRoute(
                path: '/analytics',
                name: 'dashboard-analytics',
                builder: (context, state) => const DashboardAnalyticsView(),
              ),
              GoRoute(
                path: '/overview',
                name: 'dashboard-overview',
                builder: (context, state) => const DashboardOverviewView(),
              ),
            ],
          ),

          // Student Management
          GoRoute(
            path: students,
            name: 'students',
            builder: (context, state) => const StudentManagementScreen(),
            routes: [
              GoRoute(
                path: '/add',
                name: 'add-student',
                builder: (context, state) => const AddStudentScreen(),
              ),
              GoRoute(
                path: '/:studentId',
                name: 'student-details',
                builder: (context, state) {
                  final studentId = state.pathParameters['studentId']!;
                  return StudentDetailsScreen(studentId: studentId);
                },
                routes: [
                  GoRoute(
                    path: '/edit',
                    name: 'edit-student',
                    builder: (context, state) {
                      final studentId = state.pathParameters['studentId']!;
                      return EditStudentScreen(studentId: studentId);
                    },
                  ),
                  GoRoute(
                    path: '/results',
                    name: 'student-results',
                    builder: (context, state) {
                      final studentId = state.pathParameters['studentId']!;
                      return StudentResultsScreen(studentId: studentId);
                    },
                  ),
                ],
              ),
            ],
          ),

          // Teacher Management
          GoRoute(
            path: teachers,
            name: 'teachers',
            builder: (context, state) => const TeacherManagementScreen(),
            routes: [
              GoRoute(
                path: '/add',
                name: 'add-teacher',
                builder: (context, state) => const AddTeacherScreen(),
              ),
              GoRoute(
                path: '/:teacherId',
                name: 'teacher-details',
                builder: (context, state) {
                  final teacherId = state.pathParameters['teacherId']!;
                  return TeacherDetailsScreen(teacherId: teacherId);
                },
              ),
            ],
          ),

          // Result Entry
          GoRoute(
            path: results,
            name: 'results',
            builder: (context, state) => const ResultEntryScreen(),
            routes: [
              GoRoute(
                path: '/add',
                name: 'add-result',
                builder: (context, state) => const AddResultScreen(),
              ),
              GoRoute(
                path: '/bulk',
                name: 'bulk-results',
                builder: (context, state) => const BulkResultEntryScreen(),
              ),
              GoRoute(
                path: '/:resultId/edit',
                name: 'edit-result',
                builder: (context, state) {
                  final resultId = state.pathParameters['resultId']!;
                  return EditResultScreen(resultId: resultId);
                },
              ),
            ],
          ),

          // Reports
          GoRoute(
            path: reports,
            name: 'reports',
            builder: (context, state) => const ReportsScreen(),
            routes: [
              GoRoute(
                path: '/student/:studentId',
                name: 'student-report',
                builder: (context, state) {
                  final studentId = state.pathParameters['studentId']!;
                  return StudentReportScreen(studentId: studentId);
                },
              ),
              GoRoute(
                path: '/class/:className',
                name: 'class-report',
                builder: (context, state) {
                  final className = state.pathParameters['className']!;
                  return ClassReportScreen(className: className);
                },
              ),
              GoRoute(
                path: '/subject/:subjectId',
                name: 'subject-report',
                builder: (context, state) {
                  final subjectId = state.pathParameters['subjectId']!;
                  return SubjectReportScreen(subjectId: subjectId);
                },
              ),
            ],
          ),

          // Teacher Dashboard
          GoRoute(
            path: teacherDashboard,
            name: 'teacher-dashboard',
            builder: (context, state) => const TeacherDashboardScreen(),
          ),

          // Parent Dashboard
          GoRoute(
            path: parentDashboard,
            name: 'parent-dashboard',
            builder: (context, state) => const ParentDashboardScreen(),
          ),

          // Settings
          GoRoute(
            path: settings,
            name: 'settings',
            builder: (context, state) => const SettingsScreen(),
            routes: [
              GoRoute(
                path: '/profile',
                name: 'profile-settings',
                builder: (context, state) => const ProfileSettingsScreen(),
              ),
              GoRoute(
                path: '/system',
                name: 'system-settings',
                builder: (context, state) => const SystemSettingsScreen(),
              ),
            ],
          ),

          // Additional routes
          GoRoute(
            path: profile,
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: help,
            name: 'help',
            builder: (context, state) => const HelpScreen(),
          ),
          GoRoute(
            path: about,
            name: 'about',
            builder: (context, state) => const AboutScreen(),
          ),
        ],
      ),
    ],

    // Redirect logic with role-based access
    redirect: (context, state) {
      final authProvider = context.read<AuthProvider>();
      final isAuthenticated = authProvider.isAuthenticated;
      final user = authProvider.user;
      final location = state.location;

      // If not authenticated and not on login page, redirect to login
      if (!isAuthenticated && location.path != login) {
        return login;
      }

      // If authenticated and on login page, redirect based on role
      if (isAuthenticated && location.path == login) {
        return _getDefaultRouteForRole(user?.role);
      }

      // Role-based access control
      if (isAuthenticated && user != null) {
        return _validateRouteAccess(location.path, user.role);
      }

      return null;
    },

    // Refresh listeners
    refreshListenable: null, // Can be used for auth state changes
  );

  static String _getDefaultRouteForRole(UserRole? role) {
    switch (role) {
      case UserRole.admin:
        return dashboard;
      case UserRole.teacher:
        return teacherDashboard;
      case UserRole.parent:
        return parentDashboard;
      default:
        return dashboard;
    }
  }

  static String? _validateRouteAccess(String path, UserRole role) {
    // Define role-based access patterns
    final adminOnlyRoutes = [
      students,
      teachers,
      settings,
    ];

    final teacherOnlyRoutes = [
      teacherDashboard,
      results,
    ];

    final parentOnlyRoutes = [
      parentDashboard,
      reports,
    ];

    // Check if route requires specific role
    if (adminOnlyRoutes.any((route) => path.startsWith(route)) && role != UserRole.admin) {
      return _getDefaultRouteForRole(role);
    }

    if (teacherOnlyRoutes.any((route) => path.startsWith(route)) && 
        role != UserRole.teacher && role != UserRole.admin) {
      return _getDefaultRouteForRole(role);
    }

    if (parentOnlyRoutes.any((route) => path.startsWith(route)) && 
        role != UserRole.parent && role != UserRole.admin) {
      return _getDefaultRouteForRole(role);
    }

    return null;
  }

  // Navigation helpers
  static void navigateToLogin(BuildContext context) {
    context.go(login);
  }

  static void navigateToDashboard(BuildContext context) {
    final authProvider = context.read<AuthProvider>();
    final role = authProvider.user?.role;
    context.go(_getDefaultRouteForRole(role));
  }

  static void navigateToStudentDetails(BuildContext context, String studentId) {
    context.go('$students/$studentId');
  }

  static void navigateToTeacherDetails(BuildContext context, String teacherId) {
    context.go('$teachers/$teacherId');
  }

  static void navigateToResultEntry(BuildContext context) {
    context.go(results);
  }

  static void navigateToReports(BuildContext context) {
    context.go(reports);
  }

  static void navigateToSettings(BuildContext context) {
    context.go(settings);
  }

  static void navigateToProfile(BuildContext context) {
    context.go(profile);
  }
}

// Placeholder screens for new routes
class DashboardAnalyticsView extends StatelessWidget {
  const DashboardAnalyticsView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Dashboard Analytics'));
  }
}

class DashboardOverviewView extends StatelessWidget {
  const DashboardOverviewView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Dashboard Overview'));
  }
}

class AddStudentScreen extends StatelessWidget {
  const AddStudentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Add Student'));
  }
}

class StudentDetailsScreen extends StatelessWidget {
  final String studentId;
  const StudentDetailsScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Student Details: $studentId'));
  }
}

class EditStudentScreen extends StatelessWidget {
  final String studentId;
  const EditStudentScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Edit Student: $studentId'));
  }
}

class StudentResultsScreen extends StatelessWidget {
  final String studentId;
  const StudentResultsScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Student Results: $studentId'));
  }
}

class AddTeacherScreen extends StatelessWidget {
  const AddTeacherScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Add Teacher'));
  }
}

class TeacherDetailsScreen extends StatelessWidget {
  final String teacherId;
  const TeacherDetailsScreen({super.key, required this.teacherId});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Teacher Details: $teacherId'));
  }
}

class AddResultScreen extends StatelessWidget {
  const AddResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Add Result'));
  }
}

class BulkResultEntryScreen extends StatelessWidget {
  const BulkResultEntryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Bulk Result Entry'));
  }
}

class EditResultScreen extends StatelessWidget {
  final String resultId;
  const EditResultScreen({super.key, required this.resultId});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Edit Result: $resultId'));
  }
}

class StudentReportScreen extends StatelessWidget {
  final String studentId;
  const StudentReportScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Student Report: $studentId'));
  }
}

class ClassReportScreen extends StatelessWidget {
  final String className;
  const ClassReportScreen({super.key, required this.className});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Class Report: $className'));
  }
}

class SubjectReportScreen extends StatelessWidget {
  final String subjectId;
  const SubjectReportScreen({super.key, required this.subjectId});

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Subject Report: $subjectId'));
  }
}

class ProfileSettingsScreen extends StatelessWidget {
  const ProfileSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Profile Settings'));
  }
}

class SystemSettingsScreen extends StatelessWidget {
  const SystemSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('System Settings'));
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Profile'));
  }
}

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Help'));
  }
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('About'));
  }
}
