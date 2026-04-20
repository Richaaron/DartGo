import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../error/error_handler.dart';

enum AnalyticsEvent {
  app_opened,
  app_closed,
  user_login,
  user_logout,
  page_view,
  button_click,
  form_submit,
  data_fetch,
  data_save,
  data_delete,
  error_occurred,
  performance_metric,
}

class AnalyticsEvent {
  final String name;
  final Map<String, dynamic>? parameters;
  final DateTime timestamp;
  final String? userId;
  final String? sessionId;

  AnalyticsEvent({
    required this.name,
    this.parameters,
    required this.timestamp,
    this.userId,
    this.sessionId,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'parameters': parameters,
      'timestamp': timestamp.toIso8601String(),
      'userId': userId,
      'sessionId': sessionId,
    };
  }

  factory AnalyticsEvent.fromJson(Map<String, dynamic> json) {
    return AnalyticsEvent(
      name: json['name'],
      parameters: json['parameters'],
      timestamp: DateTime.parse(json['timestamp']),
      userId: json['userId'],
      sessionId: json['sessionId'],
    );
  }
}

class PerformanceMetric {
  final String name;
  final double value;
  final String? unit;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  PerformanceMetric({
    required this.name,
    required this.value,
    this.unit,
    required this.timestamp,
    this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'value': value,
      'unit': unit,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
    };
  }
}

class AnalyticsConfig {
  final bool enableAnalytics;
  final bool enablePerformanceMonitoring;
  final bool enableErrorTracking;
  final Duration flushInterval;
  final int maxBatchSize;
  final bool debugMode;

  const AnalyticsConfig({
    this.enableAnalytics = true,
    this.enablePerformanceMonitoring = true,
    this.enableErrorTracking = true,
    this.flushInterval = const Duration(minutes: 1),
    this.maxBatchSize = 50,
    this.debugMode = kDebugMode,
  });
}

class AnalyticsManager {
  static AnalyticsManager? _instance;
  static AnalyticsManager get instance => _instance ??= AnalyticsManager._();

  AnalyticsManager._();

  final AnalyticsConfig _config = const AnalyticsConfig();
  final List<AnalyticsEvent> _eventBuffer = [];
  final List<PerformanceMetric> _performanceBuffer = [];
  Timer? _flushTimer;
  String? _sessionId;
  String? _userId;
  DateTime? _appStartTime;
  SharedPreferences? _prefs;
  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _prefs = await SharedPreferences.getInstance();
      _sessionId = _generateSessionId();
      _appStartTime = DateTime.now();
      _isInitialized = true;

      // Start periodic flush
      _startFlushTimer();

      // Track app opened
      await trackEvent('app_opened', parameters: {
        'timestamp': DateTime.now().toIso8601String(),
        'platform': kDebugMode ? 'debug' : 'release',
      });

      // Track performance metrics
      if (_config.enablePerformanceMonitoring) {
        _startPerformanceMonitoring();
      }

      debugPrint('Analytics manager initialized');
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to initialize analytics manager',
          originalError: e,
        ),
      );
    }
  }

  Future<void> trackEvent(
    String eventName, {
    Map<String, dynamic>? parameters,
    String? userId,
  }) async {
    if (!_config.enableAnalytics || !_isInitialized) return;

    try {
      final event = AnalyticsEvent(
        name: eventName,
        parameters: parameters,
        timestamp: DateTime.now(),
        userId: userId ?? _userId,
        sessionId: _sessionId,
      );

      _eventBuffer.add(event);

      // Log in debug mode
      if (_config.debugMode) {
        debugPrint('Analytics Event: ${event.name} - ${event.parameters}');
      }

      // Flush if buffer is full
      if (_eventBuffer.length >= _config.maxBatchSize) {
        await _flushEvents();
      }
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to track event: $eventName',
          originalError: e,
        ),
      );
    }
  }

  Future<void> trackPerformance(
    String metricName,
    double value, {
    String? unit,
    Map<String, dynamic>? metadata,
  }) async {
    if (!_config.enablePerformanceMonitoring || !_isInitialized) return;

    try {
      final metric = PerformanceMetric(
        name: metricName,
        value: value,
        unit: unit,
        timestamp: DateTime.now(),
        metadata: metadata,
      );

      _performanceBuffer.add(metric);

      // Log in debug mode
      if (_config.debugMode) {
        debugPrint('Performance Metric: ${metric.name} = ${metric.value}${metric.unit ?? ''}');
      }

      // Flush if buffer is full
      if (_performanceBuffer.length >= _config.maxBatchSize) {
        await _flushPerformanceMetrics();
      }
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to track performance metric: $metricName',
          originalError: e,
        ),
      );
    }
  }

  Future<void> trackPageView(
    String pageName, {
    Map<String, dynamic>? parameters,
  }) async {
    await trackEvent(
      'page_view',
      parameters: {
        'page': pageName,
        ...?parameters,
      },
    );
  }

  Future<void> trackUserAction(
    String action,
    String target, {
    Map<String, dynamic>? parameters,
  }) async {
    await trackEvent(
      'user_action',
      parameters: {
        'action': action,
        'target': target,
        ...?parameters,
      },
    );
  }

  Future<void> trackError(
    String error, {
    String? stackTrace,
    Map<String, dynamic>? context,
  }) async {
    if (!_config.enableErrorTracking || !_isInitialized) return;

    await trackEvent(
      'error_occurred',
      parameters: {
        'error': error,
        'stackTrace': stackTrace,
        'context': context,
      },
    );
  }

  Future<void> setUserId(String userId) async {
    _userId = userId;
    
    if (_prefs != null) {
      await _prefs!.setString('analytics_user_id', userId);
    }

    await trackEvent('user_id_set', parameters: {'userId': userId});
  }

  Future<void> setUserProperties(Map<String, dynamic> properties) async {
    await trackEvent('user_properties_set', parameters: properties);
  }

  Future<void> flush() async {
    await Future.wait([
      _flushEvents(),
      _flushPerformanceMetrics(),
    ]);
  }

  // Performance monitoring
  void _startPerformanceMonitoring() {
    // Monitor frame rate
    WidgetsBinding.instance.addTimingsCallback((timings) {
      for (final timing in timings) {
        if (timing.totalSpan.inMilliseconds > 16) { // > 60fps threshold
          trackPerformance(
            'frame_time',
            timing.totalSpan.inMilliseconds.toDouble(),
            unit: 'ms',
            metadata: {'timestamp': timing.timestamp.toIso8601String()},
          );
        }
      }
    });

    // Monitor memory usage
    Timer.periodic(const Duration(seconds: 30), (timer) {
      if (!_isInitialized) {
        timer.cancel();
        return;
      }

      _trackMemoryUsage();
    });
  }

  void _trackMemoryUsage() {
    // Get memory usage (simplified - in real app you'd use more sophisticated methods)
    final info = ProcessInfo.currentRss;
    trackPerformance(
      'memory_usage',
      info.toDouble(),
      unit: 'bytes',
    );
  }

  // Private helper methods
  void _startFlushTimer() {
    _flushTimer = Timer.periodic(_config.flushInterval, (timer) {
      flush();
    });
  }

  Future<void> _flushEvents() async {
    if (_eventBuffer.isEmpty) return;

    try {
      final events = List<AnalyticsEvent>.from(_eventBuffer);
      _eventBuffer.clear();

      // In a real app, you'd send this to your analytics service
      await _sendEventsToServer(events);

      if (_config.debugMode) {
        debugPrint('Flushed ${events.length} analytics events');
      }
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to flush analytics events',
          originalError: e,
        ),
      );
    }
  }

  Future<void> _flushPerformanceMetrics() async {
    if (_performanceBuffer.isEmpty) return;

    try {
      final metrics = List<PerformanceMetric>.from(_performanceBuffer);
      _performanceBuffer.clear();

      // In a real app, you'd send this to your monitoring service
      await _sendMetricsToServer(metrics);

      if (_config.debugMode) {
        debugPrint('Flushed ${metrics.length} performance metrics');
      }
    } catch (e) {
      ErrorHandler.handleError(
        AppException(
          message: 'Failed to flush performance metrics',
          originalError: e,
        ),
      );
    }
  }

  Future<void> _sendEventsToServer(List<AnalyticsEvent> events) async {
    // Implementation for sending events to analytics server
    // This would integrate with services like Google Analytics, Mixpanel, etc.
    for (final event in events) {
      debugPrint('Sending event: ${event.name}');
    }
  }

  Future<void> _sendMetricsToServer(List<PerformanceMetric> metrics) async {
    // Implementation for sending metrics to monitoring service
    // This would integrate with services like New Relic, DataDog, etc.
    for (final metric in metrics) {
      debugPrint('Sending metric: ${metric.name} = ${metric.value}');
    }
  }

  String _generateSessionId() {
    return DateTime.now().millisecondsSinceEpoch.toString() +
        '_' +
        (DateTime.now().microsecond).toString();
  }

  // Analytics insights
  Map<String, dynamic> getAnalyticsSummary() {
    return {
      'sessionId': _sessionId,
      'userId': _userId,
      'appStartTime': _appStartTime?.toIso8601String(),
      'eventsInBuffer': _eventBuffer.length,
      'metricsInBuffer': _performanceBuffer.length,
      'isInitialized': _isInitialized,
    };
  }

  List<AnalyticsEvent> getRecentEvents({int limit = 100}) {
    return _eventBuffer.take(limit).toList();
  }

  List<PerformanceMetric> getRecentMetrics({int limit = 100}) {
    return _performanceBuffer.take(limit).toList();
  }

  void dispose() {
    _flushTimer?.cancel();
    _eventBuffer.clear();
    _performanceBuffer.clear();
    _isInitialized = false;
  }
}

// Performance monitoring utilities
class PerformanceMonitor {
  static final Map<String, DateTime> _startTimes = {};

  static void startTimer(String operation) {
    _startTimes[operation] = DateTime.now();
  }

  static Future<T> measureOperation<T>(
    String operation,
    Future<T> Function() operationFunction,
  ) async {
    final startTime = DateTime.now();
    try {
      final result = await operationFunction();
      final endTime = DateTime.now();
      final duration = endTime.difference(startTime);

      AnalyticsManager.instance.trackPerformance(
        operation,
        duration.inMilliseconds.toDouble(),
        unit: 'ms',
      );

      return result;
    } catch (e) {
      final endTime = DateTime.now();
      final duration = endTime.difference(startTime);

      AnalyticsManager.instance.trackPerformance(
        '${operation}_failed',
        duration.inMilliseconds.toDouble(),
        unit: 'ms',
      );

      rethrow;
    }
  }

  static void endTimer(String operation) {
    final startTime = _startTimes[operation];
    if (startTime != null) {
      final endTime = DateTime.now();
      final duration = endTime.difference(startTime);

      AnalyticsManager.instance.trackPerformance(
        operation,
        duration.inMilliseconds.toDouble(),
        unit: 'ms',
      );

      _startTimes.remove(operation);
    }
  }
}

// Widget performance tracker
class WidgetPerformanceTracker extends StatefulWidget {
  final Widget child;
  final String widgetName;

  const WidgetPerformanceTracker({
    super.key,
    required this.child,
    required this.widgetName,
  });

  @override
  State<WidgetPerformanceTracker> createState() => _WidgetPerformanceTrackerState();
}

class _WidgetPerformanceTrackerState extends State<WidgetPerformanceTracker> {
  DateTime? _buildStartTime;

  @override
  Widget build(BuildContext context) {
    _buildStartTime = DateTime.now();
    
    return widget.child;
  }

  @override
  void didUpdateWidget(WidgetPerformanceTracker oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (_buildStartTime != null) {
      final buildTime = DateTime.now().difference(_buildStartTime!);
      AnalyticsManager.instance.trackPerformance(
        'widget_build_time',
        buildTime.inMicroseconds.toDouble(),
        unit: 'µs',
        metadata: {'widget': widget.widgetName},
      );
    }
  }
}
