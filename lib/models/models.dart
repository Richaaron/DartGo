import 'package:json_annotation/json_annotation.dart';

part 'models.g.dart';

enum SchoolLevel {
  @JsonValue('Pre-Nursery')
  preNursery,
  @JsonValue('Nursery')
  nursery,
  @JsonValue('Primary')
  primary,
  @JsonValue('Secondary')
  secondary;
}

enum UserRole {
  @JsonValue('Admin')
  admin,
  @JsonValue('Teacher')
  teacher,
  @JsonValue('Student')
  student,
  @JsonValue('Parent')
  parent;
}

enum AssessmentType {
  @JsonValue('Test')
  test,
  @JsonValue('Exam')
  exam,
  @JsonValue('Assignment')
  assignment,
  @JsonValue('Project')
  project;
}

enum UserStatus {
  @JsonValue('Active')
  active,
  @JsonValue('Inactive')
  inactive,
  @JsonValue('Suspended')
  suspended;
}

enum SubjectCategory {
  @JsonValue('CORE')
  core,
  @JsonValue('ELECTIVE')
  elective,
  @JsonValue('VOCATIONAL')
  vocational;
}

enum CurriculumType {
  @JsonValue('NIGERIAN')
  nigerian,
  @JsonValue('IGCSE')
  igcse,
  @JsonValue('OTHER')
  other;
}

enum PerformanceRating {
  @JsonValue('Excellent')
  excellent,
  @JsonValue('Good')
  good,
  @JsonValue('Average')
  average,
  @JsonValue('Poor')
  poor,
  @JsonValue('Very Poor')
  veryPoor;
}

enum Trend {
  @JsonValue('Improving')
  improving,
  @JsonValue('Stable')
  stable,
  @JsonValue('Declining')
  declining;
}

@JsonSerializable()
class GradeScale {
  final double minScore;
  final double maxScore;
  final String grade;
  final double gradePoint;
  final String description;

  const GradeScale({
    required this.minScore,
    required this.maxScore,
    required this.grade,
    required this.gradePoint,
    required this.description,
  });

  factory GradeScale.fromJson(Map<String, dynamic> json) =>
      _$GradeScaleFromJson(json);

  Map<String, dynamic> toJson() => _$GradeScaleToJson(this);
}

@JsonSerializable()
class Subject {
  final String id;
  final String name;
  final String code;
  final SchoolLevel level;
  final int creditUnits;
  final SubjectCategory? subjectCategory;
  final String? description;
  final CurriculumType? curriculumType;
  final List<String>? prerequisiteSubjects;

  const Subject({
    required this.id,
    required this.name,
    required this.code,
    required this.level,
    required this.creditUnits,
    this.subjectCategory,
    this.description,
    this.curriculumType,
    this.prerequisiteSubjects,
  });

  factory Subject.fromJson(Map<String, dynamic> json) =>
      _$SubjectFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectToJson(this);
}

@JsonSerializable()
class Student {
  final String id;
  final String firstName;
  final String lastName;
  final String registrationNumber;
  final String dateOfBirth;
  final String gender;
  final SchoolLevel level;
  final String className;
  final String parentName;
  final String parentPhone;
  final String email;
  final String enrollmentDate;
  final UserStatus status;
  final String? image;
  final String? parentUsername;
  final String? parentPassword;

  const Student({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.registrationNumber,
    required this.dateOfBirth,
    required this.gender,
    required this.level,
    required this.className,
    required this.parentName,
    required this.parentPhone,
    required this.email,
    required this.enrollmentDate,
    required this.status,
    this.image,
    this.parentUsername,
    this.parentPassword,
  });

  factory Student.fromJson(Map<String, dynamic> json) =>
      _$StudentFromJson(json);

  Map<String, dynamic> toJson() => _$StudentToJson(this);

  String get fullName => '$firstName $lastName';
}

@JsonSerializable()
class Result {
  final String id;
  final String studentId;
  final String subjectId;
  final AssessmentType assessmentType;
  final double score;
  final double totalScore;
  final String dateRecorded;
  final String term;
  final String academicYear;
  final String recordedBy;
  final String? notes;

  const Result({
    required this.id,
    required this.studentId,
    required this.subjectId,
    required this.assessmentType,
    required this.score,
    required this.totalScore,
    required this.dateRecorded,
    required this.term,
    required this.academicYear,
    required this.recordedBy,
    this.notes,
  });

  factory Result.fromJson(Map<String, dynamic> json) =>
      _$ResultFromJson(json);

  Map<String, dynamic> toJson() => _$ResultToJson(this);

  double get percentage => (score / totalScore) * 100;
}

@JsonSerializable()
class SubjectResult {
  final String id;
  final String studentId;
  final String subjectId;
  final String term;
  final String academicYear;
  final double firstCA;
  final double secondCA;
  final double exam;
  final double totalScore;
  final double percentage;
  final String grade;
  final double gradePoint;
  final String remarks;
  final String dateRecorded;
  final String recordedBy;

  const SubjectResult({
    required this.id,
    required this.studentId,
    required this.subjectId,
    required this.term,
    required this.academicYear,
    required this.firstCA,
    required this.secondCA,
    required this.exam,
    required this.totalScore,
    required this.percentage,
    required this.grade,
    required this.gradePoint,
    required this.remarks,
    required this.dateRecorded,
    required this.recordedBy,
  });

  factory SubjectResult.fromJson(Map<String, dynamic> json) =>
      _$SubjectResultFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectResultToJson(this);
}

@JsonSerializable()
class StudentResult extends Result {
  final String studentName;
  final String subjectName;
  final String grade;
  final double gradePoint;
  final double percentage;

  const StudentResult({
    required super.id,
    required super.studentId,
    required super.subjectId,
    required super.assessmentType,
    required super.score,
    required super.totalScore,
    required super.dateRecorded,
    required super.term,
    required super.academicYear,
    required super.recordedBy,
    required this.studentName,
    required this.subjectName,
    required this.grade,
    required this.gradePoint,
    required this.percentage,
    super.notes,
  });

  factory StudentResult.fromJson(Map<String, dynamic> json) =>
      _$StudentResultFromJson(json);

  Map<String, dynamic> toJson() => _$StudentResultToJson(this);
}

@JsonSerializable()
class ClassResult {
  final String className;
  final SchoolLevel level;
  final int totalStudents;
  final double averageScore;
  final double highestScore;
  final double lowestScore;
  final double passPercentage;
  final double failPercentage;

  const ClassResult({
    required this.className,
    required this.level,
    required this.totalStudents,
    required this.averageScore,
    required this.highestScore,
    required this.lowestScore,
    required this.passPercentage,
    required this.failPercentage,
  });

  factory ClassResult.fromJson(Map<String, dynamic> json) =>
      _$ClassResultFromJson(json);

  Map<String, dynamic> toJson() => _$ClassResultToJson(this);
}

@JsonSerializable()
class StudentPerformance {
  final String studentId;
  final String studentName;
  final double averageScore;
  final int totalSubjects;
  final int passedSubjects;
  final int failedSubjects;
  final double gpa;
  final PerformanceRating performanceRating;
  final Trend trend;

  const StudentPerformance({
    required this.studentId,
    required this.studentName,
    required this.averageScore,
    required this.totalSubjects,
    required this.passedSubjects,
    required this.failedSubjects,
    required this.gpa,
    required this.performanceRating,
    required this.trend,
  });

  factory StudentPerformance.fromJson(Map<String, dynamic> json) =>
      _$StudentPerformanceFromJson(json);

  Map<String, dynamic> toJson() => _$StudentPerformanceToJson(this);
}

@JsonSerializable()
class User {
  final String id;
  final String? mongoId;
  final String email;
  final String name;
  final UserRole role;

  const User({
    required this.id,
    this.mongoId,
    required this.email,
    required this.name,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) =>
      _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class Teacher extends User {
  final String teacherId;
  final String username;
  final String? password;
  final String subject;
  final SchoolLevel level;
  final List<String> assignedClasses;
  final String? image;

  const Teacher({
    required super.id,
    super.mongoId,
    required super.email,
    required super.name,
    required super.role,
    required this.teacherId,
    required this.username,
    this.password,
    required this.subject,
    required this.level,
    required this.assignedClasses,
    this.image,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) =>
      _$TeacherFromJson(json);

  Map<String, dynamic> toJson() => _$TeacherToJson(this);
}

@JsonSerializable()
class Admin extends User {
  const Admin({
    required super.id,
    super.mongoId,
    required super.email,
    required super.name,
    required super.role,
  });

  factory Admin.fromJson(Map<String, dynamic> json) =>
      _$AdminFromJson(json);

  Map<String, dynamic> toJson() => _$AdminToJson(this);
}

@JsonSerializable()
class Parent extends User {
  final String studentId;
  final String childName;

  const Parent({
    required super.id,
    super.mongoId,
    required super.email,
    required super.name,
    required super.role,
    required this.studentId,
    required this.childName,
  });

  factory Parent.fromJson(Map<String, dynamic> json) =>
      _$ParentFromJson(json);

  Map<String, dynamic> toJson() => _$ParentToJson(this);
}

@JsonSerializable()
class AuthSession {
  final User? user;
  final String? token;
  final bool isAuthenticated;
  final String? lastLogin;

  const AuthSession({
    this.user,
    this.token,
    required this.isAuthenticated,
    this.lastLogin,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) =>
      _$AuthSessionFromJson(json);

  Map<String, dynamic> toJson() => _$AuthSessionToJson(this);
}

// Default data
const List<GradeScale> defaultGradeScale = [
  GradeScale(
    minScore: 90,
    maxScore: 100,
    grade: 'A',
    gradePoint: 4.0,
    description: 'Excellent',
  ),
  GradeScale(
    minScore: 80,
    maxScore: 89,
    grade: 'B',
    gradePoint: 3.0,
    description: 'Good',
  ),
  GradeScale(
    minScore: 70,
    maxScore: 79,
    grade: 'C',
    gradePoint: 2.0,
    description: 'Average',
  ),
  GradeScale(
    minScore: 60,
    maxScore: 69,
    grade: 'D',
    gradePoint: 1.0,
    description: 'Below Average',
  ),
  GradeScale(
    minScore: 0,
    maxScore: 59,
    grade: 'F',
    gradePoint: 0.0,
    description: 'Fail',
  ),
];

const List<Subject> defaultSubjects = [
  // Pre-Nursery Subjects
  Subject(
    id: 'pre-nur-1',
    name: 'Reading',
    code: 'RDG',
    level: SchoolLevel.preNursery,
    creditUnits: 0,
  ),
  Subject(
    id: 'pre-nur-2',
    name: 'Writing',
    code: 'WRT',
    level: SchoolLevel.preNursery,
    creditUnits: 0,
  ),
  Subject(
    id: 'pre-nur-3',
    name: 'Numbers',
    code: 'NUM',
    level: SchoolLevel.preNursery,
    creditUnits: 0,
  ),
  Subject(
    id: 'pre-nur-4',
    name: 'Drawing',
    code: 'DRW',
    level: SchoolLevel.preNursery,
    creditUnits: 0,
  ),
  Subject(
    id: 'pre-nur-5',
    name: 'Animal Stories',
    code: 'AST',
    level: SchoolLevel.preNursery,
    creditUnits: 0,
  ),
  Subject(
    id: 'pre-nur-6',
    name: 'Rhymes',
    code: 'RHM',
    level: SchoolLevel.preNursery,
    creditUnits: 0,
  ),
  
  // Nursery Subjects
  Subject(
    id: 'nur-1',
    name: 'Mathematics',
    code: 'MTH',
    level: SchoolLevel.nursery,
    creditUnits: 2,
  ),
  Subject(
    id: 'nur-2',
    name: 'English Language',
    code: 'ENG',
    level: SchoolLevel.nursery,
    creditUnits: 2,
  ),
  Subject(
    id: 'nur-3',
    name: 'Basic Science',
    code: 'BSC',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  Subject(
    id: 'nur-4',
    name: 'Health Education',
    code: 'HLT',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  Subject(
    id: 'nur-5',
    name: 'Religious Knowledge',
    code: 'RK',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  Subject(
    id: 'nur-6',
    name: 'Social Studies',
    code: 'SOS',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  Subject(
    id: 'nur-7',
    name: 'Creative Arts',
    code: 'CAR',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  Subject(
    id: 'nur-8',
    name: 'Agricultural Science',
    code: 'AGS',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  Subject(
    id: 'nur-9',
    name: 'Phonics',
    code: 'PHN',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  Subject(
    id: 'nur-10',
    name: 'Handwriting',
    code: 'HWT',
    level: SchoolLevel.nursery,
    creditUnits: 1,
  ),
  
  // Primary Subjects
  Subject(
    id: 'pri-1',
    name: 'Mathematics',
    code: 'MTH',
    level: SchoolLevel.primary,
    creditUnits: 3,
  ),
  Subject(
    id: 'pri-2',
    name: 'English Language',
    code: 'ENG',
    level: SchoolLevel.primary,
    creditUnits: 3,
  ),
  Subject(
    id: 'pri-3',
    name: 'Basic Science',
    code: 'BSC',
    level: SchoolLevel.primary,
    creditUnits: 2,
  ),
  Subject(
    id: 'pri-4',
    name: 'Basic Technology',
    code: 'BTE',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-5',
    name: 'Religious Knowledge',
    code: 'RK',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-6',
    name: 'Social Studies',
    code: 'SOS',
    level: SchoolLevel.primary,
    creditUnits: 2,
  ),
  Subject(
    id: 'pri-7',
    name: 'Creative Arts',
    code: 'CAR',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-8',
    name: 'Agricultural Science',
    code: 'AGS',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-9',
    name: 'Home Economics',
    code: 'HEC',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-10',
    name: 'Physical Education',
    code: 'PHE',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-11',
    name: 'Computer Studies',
    code: 'CST',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-12',
    name: 'French Language',
    code: 'FRE',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-13',
    name: 'Yoruba Language',
    code: 'YOR',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-14',
    name: 'Islamic Religious Knowledge',
    code: 'IRK',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-15',
    name: 'Civic Education',
    code: 'CVE',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  Subject(
    id: 'pri-16',
    name: 'Security Education',
    code: 'SEC',
    level: SchoolLevel.primary,
    creditUnits: 1,
  ),
  
  // Secondary Subjects (JSS and SSS)
  Subject(
    id: 'sec-1',
    name: 'Mathematics',
    code: 'MTH',
    level: SchoolLevel.secondary,
    creditUnits: 3,
  ),
  Subject(
    id: 'sec-2',
    name: 'English Language',
    code: 'ENG',
    level: SchoolLevel.secondary,
    creditUnits: 3,
  ),
  Subject(
    id: 'sec-3',
    name: 'Physics',
    code: 'PHY',
    level: SchoolLevel.secondary,
    creditUnits: 3,
  ),
  Subject(
    id: 'sec-4',
    name: 'Chemistry',
    code: 'CHM',
    level: SchoolLevel.secondary,
    creditUnits: 3,
  ),
  Subject(
    id: 'sec-5',
    name: 'Biology',
    code: 'BIO',
    level: SchoolLevel.secondary,
    creditUnits: 3,
  ),
  Subject(
    id: 'sec-6',
    name: 'Geography',
    code: 'GEO',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-7',
    name: 'Economics',
    code: 'ECO',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-8',
    name: 'Commerce',
    code: 'COM',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-9',
    name: 'Accounting',
    code: 'ACC',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-10',
    name: 'Government',
    code: 'GOV',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-11',
    name: 'Literature-in-English',
    code: 'LIT',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-12',
    name: 'Christian Religious Knowledge',
    code: 'CRK',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-13',
    name: 'Islamic Religious Knowledge',
    code: 'IRK',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-14',
    name: 'Yoruba Language',
    code: 'YOR',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-15',
    name: 'French Language',
    code: 'FRE',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-16',
    name: 'Computer Studies',
    code: 'CST',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-17',
    name: 'Technical Drawing',
    code: 'TD',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-18',
    name: 'Food and Nutrition',
    code: 'FAN',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-19',
    name: 'Home Management',
    code: 'HMG',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-20',
    name: 'Fine Arts',
    code: 'FAA',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-21',
    name: 'Music',
    code: 'MUS',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-22',
    name: 'Physical Education',
    code: 'PHE',
    level: SchoolLevel.secondary,
    creditUnits: 1,
  ),
  Subject(
    id: 'sec-23',
    name: 'Civic Education',
    code: 'CVE',
    level: SchoolLevel.secondary,
    creditUnits: 1,
  ),
  Subject(
    id: 'sec-24',
    name: 'Security Education',
    code: 'SEC',
    level: SchoolLevel.secondary,
    creditUnits: 1,
  ),
  Subject(
    id: 'sec-25',
    name: 'Agricultural Science',
    code: 'AGS',
    level: SchoolLevel.secondary,
    creditUnits: 2,
  ),
  Subject(
    id: 'sec-26',
    name: 'Further Mathematics',
    code: 'FMA',
    level: SchoolLevel.secondary,
    creditUnits: 3,
  ),
  Subject(
    id: 'sec-27',
    name: 'Dart Programming',
    code: 'DRT',
    level: SchoolLevel.secondary,
    creditUnits: 3,
    subjectCategory: SubjectCategory.elective,
  ),
];
