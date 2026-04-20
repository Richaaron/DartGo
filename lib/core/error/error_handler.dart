import 'package:flutter/foundation.dart';
import 'dart:io';

// Custom exception classes
class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;
  final StackTrace? stackTrace;

  const AppException({
    required this.message,
    this.code,
    this.originalError,
    this.stackTrace,
  });

  @override
  String toString() {
    return 'AppException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}

class NetworkException extends AppException {
  final int? statusCode;
  final String? response;

  const NetworkException({
    required String message,
    this.statusCode,
    this.response,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

class ValidationException extends AppException {
  final Map<String, List<String>> fieldErrors;

  const ValidationException({
    required String message,
    required this.fieldErrors,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

class AuthenticationException extends AppException {
  const AuthenticationException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

class AuthorizationException extends AppException {
  const AuthorizationException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

class DataException extends AppException {
  const DataException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

class CacheException extends AppException {
  const CacheException({
    required String message,
    String? code,
    dynamic originalError,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalError: originalError,
          stackTrace: stackTrace,
        );
}

// Error handler class
class ErrorHandler {
  static void handleError(
    dynamic error, {
    StackTrace? stackTrace,
    String? context,
    bool reportToCrashlytics = true,
  }) {
    // Log the error
    _logError(error, stackTrace, context);

    // Report to crash reporting service in production
    if (reportToCrashlytics && !kDebugMode) {
      _reportToCrashlytics(error, stackTrace, context);
    }

    // Show user-friendly message
    _showUserFriendlyMessage(error);
  }

  static void _logError(dynamic error, StackTrace? stackTrace, String? context) {
    final contextStr = context != null ? '[$context] ' : '';
    
    if (error is AppException) {
      debugPrint('${contextStr}App Error: ${error.message}');
      if (error.code != null) {
        debugPrint('${contextStr}Error Code: ${error.code}');
      }
      if (error.originalError != null) {
        debugPrint('${contextStr}Original Error: ${error.originalError}');
      }
    } else {
      debugPrint('${contextStr}Unexpected Error: $error');
    }

    if (stackTrace != null) {
      debugPrint('${contextStr}Stack Trace:\n$stackTrace');
    }
  }

  static void _reportToCrashlytics(dynamic error, StackTrace? stackTrace, String? context) {
    // In a real app, you would integrate with Firebase Crashlytics or similar
    // FirebaseCrashlytics.instance.recordError(error, stackTrace);
    debugPrint('Error reported to crash reporting service');
  }

  static void _showUserFriendlyMessage(dynamic error) {
    String userMessage = 'An unexpected error occurred. Please try again.';

    if (error is NetworkException) {
      userMessage = _getNetworkErrorMessage(error);
    } else if (error is ValidationException) {
      userMessage = 'Please check your input and try again.';
    } else if (error is AuthenticationException) {
      userMessage = 'Please log in to continue.';
    } else if (error is AuthorizationException) {
      userMessage = 'You don\'t have permission to perform this action.';
    } else if (error is DataException) {
      userMessage = 'Data operation failed. Please try again.';
    } else if (error is CacheException) {
      userMessage = 'Cache operation failed. Please try again.';
    }

    debugPrint('User Message: $userMessage');
  }

  static String _getNetworkErrorMessage(NetworkException error) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        if (error.statusCode == null) {
          return 'Network connection failed. Please check your internet connection.';
        }
        return 'Network error occurred. Please try again.';
    }
  }

  static AppException convertToAppException(dynamic error, [StackTrace? stackTrace]) {
    if (error is AppException) {
      return error;
    }

    if (error is SocketException) {
      return NetworkException(
        message: 'Network connection failed',
        originalError: error,
        stackTrace: stackTrace,
      );
    }

    if (error is HttpException) {
      return NetworkException(
        message: 'HTTP error: ${error.message}',
        originalError: error,
        stackTrace: stackTrace,
      );
    }

    if (error is FormatException) {
      return DataException(
        message: 'Data format error',
        originalError: error,
        stackTrace: stackTrace,
      );
    }

    return AppException(
      message: error.toString(),
      originalError: error,
      stackTrace: stackTrace,
    );
  }
}

// Error logging service
class ErrorLogger {
  static final List<AppError> _errorLog = [];
  
  static void logError(AppError error) {
    _errorLog.add(error);
    
    // Keep only last 100 errors
    if (_errorLog.length > 100) {
      _errorLog.removeAt(0);
    }
    
    debugPrint('Error logged: ${error.message}');
  }

  static List<AppError> getErrorLog() {
    return List.unmodifiable(_errorLog);
  }

  static void clearErrorLog() {
    _errorLog.clear();
  }

  static List<AppError> getErrorsByType(Type type) {
    return _errorLog.where((error) => error.runtimeType == type).toList();
  }

  static Map<String, int> getErrorStats() {
    final stats = <String, int>{};
    
    for (final error in _errorLog) {
      final type = error.runtimeType.toString();
      stats[type] = (stats[type] ?? 0) + 1;
    }
    
    return stats;
  }
}

class AppError {
  final String message;
  final String? code;
  final DateTime timestamp;
  final String? context;
  final Map<String, dynamic>? metadata;

  AppError({
    required this.message,
    this.code,
    required this.timestamp,
    this.context,
    this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'code': code,
      'timestamp': timestamp.toIso8601String(),
      'context': context,
      'metadata': metadata,
    };
  }

  factory AppError.fromJson(Map<String, dynamic> json) {
    return AppError(
      message: json['message'],
      code: json['code'],
      timestamp: DateTime.parse(json['timestamp']),
      context: json['context'],
      metadata: json['metadata'],
    );
  }
}

// Error boundary widget
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(BuildContext, dynamic, VoidCallback)? onError;
  final bool logErrors;

  const ErrorBoundary({
    super.key,
    required this.child,
    this.onError,
    this.logErrors = true,
  });

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  dynamic _error;

  @override
  void initState() {
    super.initState();
    FlutterError.onError = (FlutterErrorDetails details) {
      if (widget.logErrors) {
        ErrorHandler.handleError(
          details.exception,
          stackTrace: details.stack,
          context: 'FlutterError',
        );
      }
    };
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      if (widget.onError != null) {
        return widget.onError!(context, _error, () {
          setState(() {
            _error = null;
          });
        });
      }

      return ErrorWidget(_error);
    }

    return ErrorWidget.builder(
      (FlutterErrorDetails errorDetails) {
        if (widget.logErrors) {
          ErrorHandler.handleError(
            errorDetails.exception,
            stackTrace: errorDetails.stack,
            context: 'ErrorBoundary',
          );
        }
        setState(() {
          _error = errorDetails.exception;
        });
        return ErrorWidget(errorDetails.exception);
      },
      child: widget.child,
    );
  }
}
