import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/flutter_web_plugins.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'models/models.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/data_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/student_management_screen.dart';
import 'screens/teacher_management_screen.dart';
import 'screens/result_entry_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/teacher_dashboard_screen.dart';
import 'screens/parent_dashboard_screen.dart';
import 'screens/settings_screen.dart';
import 'widgets/app_layout.dart';

void main() {
  // Ensure Flutter web plugins are initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Register Flutter web plugins
  FlutterWebPlugin.ensureInitialized();
  
  runApp(const FolushoApp());
}

class FolushoApp extends StatelessWidget {
  const FolushoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => DataProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp.router(
            title: 'Folusho Victory Schools',
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.blue,
                brightness: Brightness.light,
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.blue,
                brightness: Brightness.dark,
              ),
            ),
            themeMode: themeProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            routerConfig: _router,
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}

final GoRouter _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const AppLayout(
        child: DashboardScreen(),
      ),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const AppLayout(
        child: DashboardScreen(),
      ),
    ),
    GoRoute(
      path: '/students',
      builder: (context, state) => const AppLayout(
        child: StudentManagementScreen(),
      ),
    ),
    GoRoute(
      path: '/teachers',
      builder: (context, state) => const AppLayout(
        child: TeacherManagementScreen(),
      ),
    ),
    GoRoute(
      path: '/results',
      builder: (context, state) => const AppLayout(
        child: ResultEntryScreen(),
      ),
    ),
    GoRoute(
      path: '/reports',
      builder: (context, state) => const AppLayout(
        child: ReportsScreen(),
      ),
    ),
    GoRoute(
      path: '/teacher-dashboard',
      builder: (context, state) => const AppLayout(
        child: TeacherDashboardScreen(),
      ),
    ),
    GoRoute(
      path: '/parent-dashboard',
      builder: (context, state) => const AppLayout(
        child: ParentDashboardScreen(),
      ),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const AppLayout(
        child: SettingsScreen(),
      ),
    ),
  ],
  redirect: (context, state) {
    final authProvider = context.read<AuthProvider>();
    final isAuthenticated = authProvider.isAuthenticated;
    
    // If not authenticated and not on login page, redirect to login
    if (!isAuthenticated && state.location.path != '/login') {
      return '/login';
    }
    
    // If authenticated and on login page, redirect to dashboard
    if (isAuthenticated && state.location.path == '/login') {
      return '/dashboard';
    }
    
    return null;
  },
);
