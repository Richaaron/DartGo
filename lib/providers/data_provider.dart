import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/models.dart';

class DataProvider extends ChangeNotifier {
  List<Student> _students = [];
  List<Teacher> _teachers = [];
  List<Subject> _subjects = [];
  List<SubjectResult> _results = [];
  bool _isLoading = false;

  List<Student> get students => _students;
  List<Teacher> get teachers => _teachers;
  List<Subject> get subjects => _subjects;
  List<SubjectResult> get results => _results;
  bool get isLoading => _isLoading;

  DataProvider() {
    _initializeData();
  }

  Future<void> _initializeData() async {
    _isLoading = true;
    notifyListeners();

    try {
      await Future.wait([
        _loadStudents(),
        _loadSubjects(),
        _loadResults(),
      ]);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadStudents() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final studentsJson = prefs.getString('students');
      
      if (studentsJson != null) {
        final List<dynamic> studentsList = json.decode(studentsJson);
        _students = studentsList.map((json) => Student.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Failed to load students: $e');
    }
  }

  Future<void> _loadSubjects() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final subjectsJson = prefs.getString('subjects');
      
      if (subjectsJson != null) {
        final List<dynamic> subjectsList = json.decode(subjectsJson);
        _subjects = subjectsList.map((json) => Subject.fromJson(json)).toList();
      } else {
        // Initialize with default subjects
        _subjects = defaultSubjects;
        await _saveSubjects();
      }
    } catch (e) {
      debugPrint('Failed to load subjects: $e');
      _subjects = defaultSubjects;
    }
  }

  Future<void> _loadResults() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final resultsJson = prefs.getString('results');
      
      if (resultsJson != null) {
        final List<dynamic> resultsList = json.decode(resultsJson);
        _results = resultsList.map((json) => SubjectResult.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Failed to load results: $e');
    }
  }

  Future<void> _saveStudents() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final studentsJson = json.encode(_students.map((s) => s.toJson()).toList());
      await prefs.setString('students', studentsJson);
    } catch (e) {
      debugPrint('Failed to save students: $e');
    }
  }

  Future<void> _saveSubjects() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final subjectsJson = json.encode(_subjects.map((s) => s.toJson()).toList());
      await prefs.setString('subjects', subjectsJson);
    } catch (e) {
      debugPrint('Failed to save subjects: $e');
    }
  }

  Future<void> _saveResults() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final resultsJson = json.encode(_results.map((r) => r.toJson()).toList());
      await prefs.setString('results', resultsJson);
    } catch (e) {
      debugPrint('Failed to save results: $e');
    }
  }

  // Student management
  Future<void> addStudent(Student student) async {
    _students.add(student);
    await _saveStudents();
    notifyListeners();
  }

  Future<void> updateStudent(Student student) async {
    final index = _students.indexWhere((s) => s.id == student.id);
    if (index != -1) {
      _students[index] = student;
      await _saveStudents();
      notifyListeners();
    }
  }

  Future<void> deleteStudent(String studentId) async {
    _students.removeWhere((s) => s.id == studentId);
    await _saveStudents();
    notifyListeners();
  }

  // Result management
  Future<void> addResult(SubjectResult result) async {
    _results.add(result);
    await _saveResults();
    notifyListeners();
  }

  Future<void> updateResult(SubjectResult result) async {
    final index = _results.indexWhere((r) => r.id == result.id);
    if (index != -1) {
      _results[index] = result;
      await _saveResults();
      notifyListeners();
    }
  }

  Future<void> deleteResult(String resultId) async {
    _results.removeWhere((r) => r.id == resultId);
    await _saveResults();
    notifyListeners();
  }

  // Utility methods
  List<Student> getStudentsByLevel(SchoolLevel level) {
    return _students.where((s) => s.level == level).toList();
  }

  List<Subject> getSubjectsByLevel(SchoolLevel level) {
    return _subjects.where((s) => s.level == level).toList();
  }

  List<SubjectResult> getResultsByStudent(String studentId) {
    return _results.where((r) => r.studentId == studentId).toList();
  }

  List<SubjectResult> getResultsBySubject(String subjectId) {
    return _results.where((r) => r.subjectId == subjectId).toList();
  }

  Student? getStudentById(String studentId) {
    try {
      return _students.firstWhere((s) => s.id == studentId);
    } catch (e) {
      return null;
    }
  }

  Subject? getSubjectById(String subjectId) {
    try {
      return _subjects.firstWhere((s) => s.id == subjectId);
    } catch (e) {
      return null;
    }
  }

  // Search and filter methods
  List<Student> searchStudents(String query) {
    if (query.isEmpty) return _students;
    
    final lowerQuery = query.toLowerCase();
    return _students.where((student) =>
      student.firstName.toLowerCase().contains(lowerQuery) ||
      student.lastName.toLowerCase().contains(lowerQuery) ||
      student.email.toLowerCase().contains(lowerQuery) ||
      student.registrationNumber.toLowerCase().contains(lowerQuery)
    ).toList();
  }

  List<SubjectResult> searchResults(String query) {
    if (query.isEmpty) return _results;
    
    final lowerQuery = query.toLowerCase();
    return _results.where((result) {
      final student = getStudentById(result.studentId);
      final subject = getSubjectById(result.subjectId);
      
      return (student?.fullName.toLowerCase().contains(lowerQuery) ?? false) ||
             (subject?.name.toLowerCase().contains(lowerQuery) ?? false);
    }).toList();
  }
}
