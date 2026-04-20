import 'dart:convert';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../error/error_handler.dart';

class CacheEntry<T> {
  final T data;
  final DateTime timestamp;
  final Duration? ttl;

  CacheEntry({
    required this.data,
    required this.timestamp,
    this.ttl,
  });

  bool get isExpired {
    if (ttl == null) return false;
    return DateTime.now().isAfter(timestamp.add(ttl!));
  }

  Map<String, dynamic> toJson() {
    return {
      'data': data,
      'timestamp': timestamp.toIso8601String(),
      'ttl': ttl?.inSeconds,
    };
  }

  factory CacheEntry.fromJson(Map<String, dynamic> json, T Function(dynamic) fromJson) {
    return CacheEntry(
      data: fromJson(json['data']),
      timestamp: DateTime.parse(json['timestamp']),
      ttl: json['ttl'] != null ? Duration(seconds: json['ttl']) : null,
    );
  }
}

class CacheConfig {
  final Duration defaultTtl;
  final int maxCacheSize;
  final bool enableCompression;
  final bool enableEncryption;

  const CacheConfig({
    this.defaultTtl = const Duration(hours: 1),
    this.maxCacheSize = 1000,
    this.enableCompression = false,
    this.enableEncryption = false,
  });
}

class CacheManager {
  static CacheManager? _instance;
  static CacheManager get instance => _instance ??= CacheManager._();

  CacheManager._();

  final CacheConfig _config = const CacheConfig();
  final Map<String, CacheEntry> _memoryCache = {};
  SharedPreferences? _prefs;
  bool _isInitialized = false;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _prefs = await SharedPreferences.getInstance();
      _isInitialized = true;

      // Monitor connectivity changes
      _connectivitySubscription = Connectivity().onConnectivityChanged.listen((result) {
        if (result != ConnectivityResult.none) {
          _syncWithServer();
        }
      });

      // Clean expired cache entries
      _cleanExpiredEntries();
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to initialize cache manager',
          originalError: e,
        ),
      );
    }
  }

  // Memory cache operations
  Future<void> set<T>(
    String key,
    T data, {
    Duration? ttl,
    bool persistToDisk = true,
  }) async {
    try {
      final entry = CacheEntry(
        data: data,
        timestamp: DateTime.now(),
        ttl: ttl ?? _config.defaultTtl,
      );

      // Store in memory cache
      _memoryCache[key] = entry;

      // Persist to disk if enabled
      if (persistToDisk && _prefs != null) {
        await _persistToDisk<T>(key, entry);
      }

      // Check cache size limit
      if (_memoryCache.length > _config.maxCacheSize) {
        _evictOldestEntries();
      }
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to set cache entry: $key',
          originalError: e,
        ),
      );
    }
  }

  Future<T?> get<T>(
    String key, {
    T Function(dynamic)? fromJson,
    bool checkDisk = true,
  }) async {
    try {
      // Check memory cache first
      final memoryEntry = _memoryCache[key];
      if (memoryEntry != null && !memoryEntry.isExpired) {
        return memoryEntry.data as T?;
      }

      // Check disk cache if memory cache miss or expired
      if (checkDisk && _prefs != null) {
        final diskEntry = await _getFromDisk<T>(key, fromJson);
        if (diskEntry != null && !diskEntry.isExpired) {
          // Restore to memory cache
          _memoryCache[key] = diskEntry;
          return diskEntry.data as T?;
        }
      }

      return null;
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to get cache entry: $key',
          originalError: e,
        ),
      );
      return null;
    }
  }

  Future<void> remove(String key) async {
    try {
      _memoryCache.remove(key);
      if (_prefs != null) {
        await _prefs!.remove(key);
      }
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to remove cache entry: $key',
          originalError: e,
        ),
      );
    }
  }

  Future<void> clear() async {
    try {
      _memoryCache.clear();
      if (_prefs != null) {
        final keys = _prefs!.getKeys();
        for (final key in keys) {
          await _prefs!.remove(key);
        }
      }
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to clear cache',
          originalError: e,
        ),
      );
    }
  }

  Future<bool> exists(String key) async {
    try {
      // Check memory cache
      final memoryEntry = _memoryCache[key];
      if (memoryEntry != null && !memoryEntry.isExpired) {
        return true;
      }

      // Check disk cache
      if (_prefs != null) {
        final diskEntry = await _getFromDisk(key, (json) => json);
        return diskEntry != null && !diskEntry.isExpired;
      }

      return false;
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to check cache existence: $key',
          originalError: e,
        ),
      );
      return false;
    }
  }

  Future<void> refresh<T>(
    String key,
    Future<T> Function() fetcher, {
    Duration? ttl,
    bool forceRefresh = false,
  }) async {
    try {
      if (!forceRefresh) {
        final cached = await get<T>(key);
        if (cached != null) {
          return; // Return cached data if not force refreshing
        }
      }

      // Fetch fresh data
      final data = await fetcher();
      await set(key, data, ttl: ttl);
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to refresh cache entry: $key',
          originalError: e,
        ),
      );
    }
  }

  // Batch operations
  Future<Map<String, T?>> getAll<T>(
    List<String> keys, {
    T Function(dynamic)? fromJson,
  }) async {
    final results = <String, T?>{};
    
    for (final key in keys) {
      results[key] = await get<T>(key, fromJson: fromJson);
    }
    
    return results;
  }

  Future<void> setAll<T>(Map<String, T> entries, {Duration? ttl}) async {
    for (final entry in entries.entries) {
      await set(entry.key, entry.value, ttl: ttl);
    }
  }

  // Cache statistics
  Map<String, dynamic> getStats() {
    final expiredCount = _memoryCache.values.where((entry) => entry.isExpired).length;
    
    return {
      'memoryCacheSize': _memoryCache.length,
      'expiredEntries': expiredCount,
      'maxCacheSize': _config.maxCacheSize,
      'defaultTtl': _config.defaultTtl.inSeconds,
    };
  }

  // Private helper methods
  Future<void> _persistToDisk<T>(String key, CacheEntry entry) async {
    if (_prefs == null) return;

    try {
      final json = entry.toJson();
      final jsonString = jsonEncode(json);
      await _prefs!.setString(key, jsonString);
    } catch (e) {
      throw CacheException(
        message: 'Failed to persist to disk: $key',
        originalError: e,
      );
    }
  }

  Future<CacheEntry<T>?> _getFromDisk<T>(
    String key,
    T Function(dynamic) fromJson,
  ) async {
    if (_prefs == null) return null;

    try {
      final jsonString = _prefs!.getString(key);
      if (jsonString == null) return null;

      final json = jsonDecode(jsonString);
      return CacheEntry.fromJson(json, fromJson);
    } catch (e) {
      throw CacheException(
        message: 'Failed to get from disk: $key',
        originalError: e,
      );
    }
  }

  void _evictOldestEntries() {
    if (_memoryCache.length <= _config.maxCacheSize) return;

    final sortedEntries = _memoryCache.entries.toList()
      ..sort((a, b) => a.value.timestamp.compareTo(b.value.timestamp));

    final entriesToRemove = sortedEntries.length - _config.maxCacheSize;
    for (int i = 0; i < entriesToRemove; i++) {
      _memoryCache.remove(sortedEntries[i].key);
    }
  }

  void _cleanExpiredEntries() {
    final expiredKeys = <String>[];
    
    for (final entry in _memoryCache.entries) {
      if (entry.value.isExpired) {
        expiredKeys.add(entry.key);
      }
    }

    for (final key in expiredKeys) {
      _memoryCache.remove(key);
    }
  }

  Future<void> _syncWithServer() async {
    // This would be implemented to sync cached data with server
    // when connectivity is restored
    try {
      // Implementation for server sync
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to sync with server',
          originalError: e,
        ),
      );
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
    _memoryCache.clear();
  }
}

// Specialized cache managers for different data types
class StudentCacheManager {
  static const String studentsKey = 'students';
  static const String studentPrefix = 'student_';
  static const Duration defaultTtl = Duration(minutes: 30);

  static Future<void> cacheStudents(List<Map<String, dynamic>> students) async {
    await CacheManager.instance.set(
      studentsKey,
      students,
      ttl: defaultTtl,
    );
  }

  static Future<List<Map<String, dynamic>>?> getCachedStudents() async {
    return await CacheManager.instance.get<List<Map<String, dynamic>>>(
      studentsKey,
      fromJson: (json) => List<Map<String, dynamic>>.from(json),
    );
  }

  static Future<void> cacheStudent(String studentId, Map<String, dynamic> student) async {
    await CacheManager.instance.set(
      '$studentPrefix$studentId',
      student,
      ttl: defaultTtl,
    );
  }

  static Future<Map<String, dynamic>?> getCachedStudent(String studentId) async {
    return await CacheManager.instance.get<Map<String, dynamic>>(
      '$studentPrefix$studentId',
      fromJson: (json) => Map<String, dynamic>.from(json),
    );
  }
}

class ResultCacheManager {
  static const String resultsKey = 'results';
  static const String resultPrefix = 'result_';
  static const Duration defaultTtl = Duration(minutes: 15);

  static Future<void> cacheResults(List<Map<String, dynamic>> results) async {
    await CacheManager.instance.set(
      resultsKey,
      results,
      ttl: defaultTtl,
    );
  }

  static Future<List<Map<String, dynamic>>?> getCachedResults() async {
    return await CacheManager.instance.get<List<Map<String, dynamic>>>(
      resultsKey,
      fromJson: (json) => List<Map<String, dynamic>>.from(json),
    );
  }

  static Future<void> cacheResult(String resultId, Map<String, dynamic> result) async {
    await CacheManager.instance.set(
      '$resultPrefix$resultId',
      result,
      ttl: defaultTtl,
    );
  }

  static Future<Map<String, dynamic>?> getCachedResult(String resultId) async {
    return await CacheManager.instance.get<Map<String, dynamic>>(
      '$resultPrefix$resultId',
      fromJson: (json) => Map<String, dynamic>.from(json),
    );
  }
}

class SubjectCacheManager {
  static const String subjectsKey = 'subjects';
  static const String subjectPrefix = 'subject_';
  static const Duration defaultTtl = Duration(hours: 24);

  static Future<void> cacheSubjects(List<Map<String, dynamic>> subjects) async {
    await CacheManager.instance.set(
      subjectsKey,
      subjects,
      ttl: defaultTtl,
    );
  }

  static Future<List<Map<String, dynamic>>?> getCachedSubjects() async {
    return await CacheManager.instance.get<List<Map<String, dynamic>>>(
      subjectsKey,
      fromJson: (json) => List<Map<String, dynamic>>.from(json),
    );
  }

  static Future<void> cacheSubject(String subjectId, Map<String, dynamic> subject) async {
    await CacheManager.instance.set(
      '$subjectPrefix$subjectId',
      subject,
      ttl: defaultTtl,
    );
  }

  static Future<Map<String, dynamic>?> getCachedSubject(String subjectId) async {
    return await CacheManager.instance.get<Map<String, dynamic>>(
      '$subjectPrefix$subjectId',
      fromJson: (json) => Map<String, dynamic>.from(json),
    );
  }
}

// Offline support
class OfflineDataManager {
  static OfflineDataManager? _instance;
  static OfflineDataManager get instance => _instance ??= OfflineDataManager._();

  OfflineDataManager._();

  final Queue<Map<String, dynamic>> _pendingOperations = Queue();
  bool _isOnline = true;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;

  Future<void> initialize() async {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((result) {
      _isOnline = result != ConnectivityResult.none;
      if (_isOnline && _pendingOperations.isNotEmpty) {
        _processPendingOperations();
      }
    });
  }

  Future<void> addOperation(Map<String, dynamic> operation) async {
    _pendingOperations.add(operation);
    
    if (_isOnline) {
      await _processPendingOperations();
    }
  }

  Future<void> _processPendingOperations() async {
    while (_pendingOperations.isNotEmpty && _isOnline) {
      try {
        final operation = _pendingOperations.removeFirst();
        await _executeOperation(operation);
      } catch (e) {
        ErrorHandler.handleError(
          AppException(
            message: 'Failed to execute offline operation',
            originalError: e,
          ),
        );
        // Re-add operation to queue if failed
        _pendingOperations.addFirst(operation);
        break;
      }
    }
  }

  Future<void> _executeOperation(Map<String, dynamic> operation) async {
    // Implementation for executing operations when online
    // This would integrate with your API service
    switch (operation['type']) {
      case 'add_student':
        // Add student to server
        break;
      case 'update_student':
        // Update student on server
        break;
      case 'add_result':
        // Add result to server
        break;
      case 'update_result':
        // Update result on server
        break;
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }
}
