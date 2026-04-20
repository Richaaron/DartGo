import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../models/models.dart';

class AppLayout extends StatelessWidget {
  final Widget child;
  const AppLayout({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          const Sidebar(),
          Expanded(
            child: Column(
              children: [
                const TopBar(),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class Sidebar extends StatelessWidget {
  const Sidebar({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;
    final isDarkMode = context.select((ThemeProvider p) => p.isDarkMode);

    return Container(
      width: 250,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          right: BorderSide(
            color: Theme.of(context).dividerColor,
          ),
        ),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.school,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Folusho Schools',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Result System',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // User Info
          if (user != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        child: Text(
                          user.name[0].toUpperCase(),
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.onPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              style: Theme.of(context).textTheme.titleSmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              user.role.name.toUpperCase(),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (user is Teacher) ...[
                    const SizedBox(height: 8),
                    Text(
                      '${user.subject} Teacher',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Divider(),
          ],
          
          // Navigation
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: _buildNavigationItems(context, user),
            ),
          ),
          
          // Bottom actions
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                ListTile(
                  leading: Icon(
                    isDarkMode ? Icons.light_mode : Icons.dark_mode,
                  ),
                  title: Text(isDarkMode ? 'Light Mode' : 'Dark Mode'),
                  onTap: () {
                    context.read<ThemeProvider>().toggleTheme();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.logout),
                  title: const Text('Logout'),
                  onTap: () {
                    context.read<AuthProvider>().logout();
                    context.go('/login');
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildNavigationItems(BuildContext context, User? user) {
    final items = <Widget>[];
    
    // Dashboard
    items.add(
      _NavigationItem(
        icon: Icons.dashboard,
        title: 'Dashboard',
        onTap: () => context.go('/dashboard'),
      ),
    );

    if (user?.role == UserRole.admin) {
      // Admin navigation
      items.addAll([
        _NavigationItem(
          icon: Icons.people,
          title: 'Students',
          onTap: () => context.go('/students'),
        ),
        _NavigationItem(
          icon: Icons.school,
          title: 'Teachers',
          onTap: () => context.go('/teachers'),
        ),
        _NavigationItem(
          icon: Icons.assignment,
          title: 'Results',
          onTap: () => context.go('/results'),
        ),
        _NavigationItem(
          icon: Icons.analytics,
          title: 'Reports',
          onTap: () => context.go('/reports'),
        ),
        _NavigationItem(
          icon: Icons.settings,
          title: 'Settings',
          onTap: () => context.go('/settings'),
        ),
      ]);
    } else if (user?.role == UserRole.teacher) {
      // Teacher navigation
      items.addAll([
        _NavigationItem(
          icon: Icons.assignment,
          title: 'Results',
          onTap: () => context.go('/results'),
        ),
        _NavigationItem(
          icon: 'analytics',
          title: 'Reports',
          onTap: () => context.go('/reports'),
        ),
      ]);
    } else if (user?.role == UserRole.parent) {
      // Parent navigation
      items.add(
        _NavigationItem(
          icon: Icons.analytics,
          title: 'Reports',
          onTap: () => context.go('/reports'),
        ),
      );
    }

    return items;
  }
}

class _NavigationItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _NavigationItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).location;
    final isActive = location == '/' || location.contains(title.toLowerCase());

    return ListTile(
      leading: Icon(
        icon,
        color: isActive ? Theme.of(context).colorScheme.primary : null,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isActive ? Theme.of(context).colorScheme.primary : null,
          fontWeight: isActive ? FontWeight.bold : null,
        ),
      ),
      onTap: onTap,
      selected: isActive,
    );
  }
}

class TopBar extends StatelessWidget {
  const TopBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.menu,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              'Folusho Victory Schools',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Icon(
            Icons.notifications_outlined,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ],
      ),
    );
  }
}
