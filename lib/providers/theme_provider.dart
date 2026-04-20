import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isDarkMode = false;

  bool get isDarkMode => _isDarkMode;

  ThemeProvider() {
    _loadThemePreference();
  }

  Future<void> _loadThemePreference() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _isDarkMode = prefs.getBool('isDarkMode') ?? false;
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to load theme preference: $e');
    }
  }

  Future<void> toggleTheme() async {
    _isDarkMode = !_isDarkMode;
    await _saveThemePreference();
    notifyListeners();
  }

  Future<void> setTheme(bool isDark) async {
    _isDarkMode = isDark;
    await _saveThemePreference();
    notifyListeners();
  }

  Future<void> _saveThemePreference() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isDarkMode', _isDarkMode);
    } catch (e) {
      debugPrint('Failed to save theme preference: $e');
    }
  }
}
