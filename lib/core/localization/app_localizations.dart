import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static const List<Locale> supportedLocales = [
    Locale('en', 'US'), // English
    Locale('es', 'ES'), // Spanish
    Locale('fr', 'FR'), // French
    Locale('yo', 'NG'), // Yoruba (Nigeria)
  ];

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  // General
  String get appName => _localizedValues[locale.languageCode]!['appName']!;
  String get welcome => _localizedValues[locale.languageCode]!['welcome']!;
  String get login => _localizedValues[locale.languageCode]!['login']!;
  String get logout => _localizedValues[locale.languageCode]!['logout']!;
  String get dashboard => _localizedValues[locale.languageCode]!['dashboard']!;
  String get settings => _localizedValues[locale.languageCode]!['settings']!;
  String get profile => _localizedValues[locale.languageCode]!['profile']!;
  String get help => _localizedValues[locale.languageCode]!['help']!;
  String get about => _localizedValues[locale.languageCode]!['about']!;

  // Authentication
  String get email => _localizedValues[locale.languageCode]!['email']!;
  String get password => _localizedValues[locale.languageCode]!['password']!;
  String get confirmPassword => _localizedValues[locale.languageCode]!['confirmPassword']!;
  String get forgotPassword => _localizedValues[locale.languageCode]!['forgotPassword']!;
  String get loginSuccess => _localizedValues[locale.languageCode]!['loginSuccess']!;
  String get loginFailed => _localizedValues[locale.languageCode]!['loginFailed']!;
  String get invalidCredentials => _localizedValues[locale.languageCode]!['invalidCredentials']!;

  // Navigation
  String get students => _localizedValues[locale.languageCode]!['students']!;
  String get teachers => _localizedValues[locale.languageCode]!['teachers']!;
  String get results => _localizedValues[locale.languageCode]!['results']!;
  String get reports => _localizedValues[locale.languageCode]!['reports']!;
  String get attendance => _localizedValues[locale.languageCode]!['attendance']!;
  String get curriculum => _localizedValues[locale.languageCode]!['curriculum']!;

  // Student Management
  String get addStudent => _localizedValues[locale.languageCode]!['addStudent']!;
  String get editStudent => _localizedValues[locale.languageCode]!['editStudent']!;
  String get deleteStudent => _localizedValues[locale.languageCode]!['deleteStudent']!;
  String get studentDetails => _localizedValues[locale.languageCode]!['studentDetails']!;
  String get firstName => _localizedValues[locale.languageCode]!['firstName']!;
  String get lastName => _localizedValues[locale.languageCode]!['lastName']!;
  String get dateOfBirth => _localizedValues[locale.languageCode]!['dateOfBirth']!;
  String get gender => _localizedValues[locale.languageCode]!['gender']!;
  String get registrationNumber => _localizedValues[locale.languageCode]!['registrationNumber']!;
  String get level => _localizedValues[locale.languageCode]!['level']!;
  String get className => _localizedValues[locale.languageCode]!['className']!;
  String get parentName => _localizedValues[locale.languageCode]!['parentName']!;
  String get parentPhone => _localizedValues[locale.languageCode]!['parentPhone']!;
  String get enrollmentDate => _localizedValues[locale.languageCode]!['enrollmentDate']!;
  String get status => _localizedValues[locale.languageCode]!['status']!;

  // Teacher Management
  String get addTeacher => _localizedValues[locale.languageCode]!['addTeacher']!;
  String get editTeacher => _localizedValues[locale.languageCode]!['editTeacher']!;
  String get deleteTeacher => _localizedValues[locale.languageCode]!['deleteTeacher']!;
  String get teacherDetails => _localizedValues[locale.languageCode]!['teacherDetails']!;
  String get subject => _localizedValues[locale.languageCode]!['subject']!;
  String get assignedClasses => _localizedValues[locale.languageCode]!['assignedClasses']!;
  String get teacherId => _localizedValues[locale.languageCode]!['teacherId']!;
  String get username => _localizedValues[locale.languageCode]!['username']!;

  // Result Management
  String get addResult => _localizedValues[locale.languageCode]!['addResult']!;
  String get editResult => _localizedValues[locale.languageCode]!['editResult']!;
  String get deleteResult => _localizedValues[locale.languageCode]!['deleteResult']!;
  String get assessmentType => _localizedValues[locale.languageCode]!['assessmentType']!;
  String get score => _localizedValues[locale.languageCode]!['score']!;
  String get totalScore => _localizedValues[locale.languageCode]!['totalScore']!;
  String get percentage => _localizedValues[locale.languageCode]!['percentage']!;
  String get grade => _localizedValues[locale.languageCode]!['grade']!;
  String get gradePoint => _localizedValues[locale.languageCode]!['gradePoint']!;
  String get remarks => _localizedValues[locale.languageCode]!['remarks']!;
  String get term => _localizedValues[locale.languageCode]!['term']!;
  String get academicYear => _localizedValues[locale.languageCode]!['academicYear']!;

  // Assessment Types
  String get test => _localizedValues[locale.languageCode]!['test']!;
  String get exam => _localizedValues[locale.languageCode]!['exam']!;
  String get assignment => _localizedValues[locale.languageCode]!['assignment']!;
  String get project => _localizedValues[locale.languageCode]!['project']!;

  // School Levels
  String get preNursery => _localizedValues[locale.languageCode]!['preNursery']!;
  String get nursery => _localizedValues[locale.languageCode]!['nursery']!;
  String get primary => _localizedValues[locale.languageCode]!['primary']!;
  String get secondary => _localizedValues[locale.languageCode]!['secondary']!;

  // User Roles
  String get admin => _localizedValues[locale.languageCode]!['admin']!;
  String get teacher => _localizedValues[locale.languageCode]!['teacher']!;
  String get student => _localizedValues[locale.languageCode]!['student']!;
  String get parent => _localizedValues[locale.languageCode]!['parent']!;

  // Status Values
  String get active => _localizedValues[locale.languageCode]!['active']!;
  String get inactive => _localizedValues[locale.languageCode]!['inactive']!;
  String get suspended => _localizedValues[locale.languageCode]!['suspended']!;

  // Gender Values
  String get male => _localizedValues[locale.languageCode]!['male']!;
  String get female => _localizedValues[locale.languageCode]!['female']!;

  // Actions
  String get save => _localizedValues[locale.languageCode]!['save']!;
  String get cancel => _localizedValues[locale.languageCode]!['cancel']!;
  String get delete => _localizedValues[locale.languageCode]!['delete']!;
  String get edit => _localizedValues[locale.languageCode]!['edit']!;
  String get add => _localizedValues[locale.languageCode]!['add']!;
  String get search => _localizedValues[locale.languageCode]!['search']!;
  String get filter => _localizedValues[locale.languageCode]!['filter']!;
  String get export => _localizedValues[locale.languageCode]!['export']!;
  String get import => _localizedValues[locale.languageCode]!['import']!;
  String get view => _localizedValues[locale.languageCode]!['view']!;
  String get print => _localizedValues[locale.languageCode]!['print']!;

  // Messages
  String get loading => _localizedValues[locale.languageCode]!['loading']!;
  String get success => _localizedValues[locale.languageCode]!['success']!;
  String get error => _localizedValues[locale.languageCode]!['error']!;
  String get warning => _localizedValues[locale.languageCode]!['warning']!;
  String get info => _localizedValues[locale.languageCode]!['info']!;
  String get noDataAvailable => _localizedValues[locale.languageCode]!['noDataAvailable']!;
  String get operationSuccessful => _localizedValues[locale.languageCode]!['operationSuccessful']!;
  String get operationFailed => _localizedValues[locale.languageCode]!['operationFailed']!;
  String get confirmDelete => _localizedValues[locale.languageCode]!['confirmDelete']!;
  String get areYouSure => _localizedValues[locale.languageCode]!['areYouSure']!;

  // Validation Messages
  String get requiredField => _localizedValues[locale.languageCode]!['requiredField']!;
  String get invalidEmail => _localizedValues[locale.languageCode]!['invalidEmail']!;
  String get invalidPhone => _localizedValues[locale.languageCode]!['invalidPhone']!;
  String get passwordTooShort => _localizedValues[locale.languageCode]!['passwordTooShort']!;
  String get passwordsDoNotMatch => _localizedValues[locale.languageCode]!['passwordsDoNotMatch']!;
  String get invalidDate => _localizedValues[locale.languageCode]!['invalidDate']!;
  String get invalidNumber => _localizedValues[locale.languageCode]!['invalidNumber']!;

  // Performance Ratings
  String get excellent => _localizedValues[locale.languageCode]!['excellent']!;
  String get good => _localizedValues[locale.languageCode]!['good']!;
  String get average => _localizedValues[locale.languageCode]!['average']!;
  String get poor => _localizedValues[locale.languageCode]!['poor']!;
  String get veryPoor => _localizedValues[locale.languageCode]!['veryPoor']!;

  // Terms
  String get firstTerm => _localizedValues[locale.languageCode]!['firstTerm']!;
  String get secondTerm => _localizedValues[locale.languageCode]!['secondTerm']!;
  String get thirdTerm => _localizedValues[locale.languageCode]!['thirdTerm']!;

  // Dark Mode
  String get darkMode => _localizedValues[locale.languageCode]!['darkMode']!;
  String get lightMode => _localizedValues[locale.languageCode]!['lightMode']!;

  // Subjects (including Dart Programming)
  String get mathematics => _localizedValues[locale.languageCode]!['mathematics']!;
  String get englishLanguage => _localizedValues[locale.languageCode]!['englishLanguage']!;
  String get dartProgramming => _localizedValues[locale.languageCode]!['dartProgramming']!;
  String get computerStudies => _localizedValues[locale.languageCode]!['computerStudies']!;
  String get physics => _localizedValues[locale.languageCode]!['physics']!;
  String get chemistry => _localizedValues[locale.languageCode]!['chemistry']!;
  String get biology => _localizedValues[locale.languageCode]!['biology']!;

  // Localization values
  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      // General
      'appName': 'Folusho Victory Schools',
      'welcome': 'Welcome',
      'login': 'Login',
      'logout': 'Logout',
      'dashboard': 'Dashboard',
      'settings': 'Settings',
      'profile': 'Profile',
      'help': 'Help',
      'about': 'About',

      // Authentication
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password',
      'forgotPassword': 'Forgot Password?',
      'loginSuccess': 'Login successful!',
      'loginFailed': 'Login failed',
      'invalidCredentials': 'Invalid email or password',

      // Navigation
      'students': 'Students',
      'teachers': 'Teachers',
      'results': 'Results',
      'reports': 'Reports',
      'attendance': 'Attendance',
      'curriculum': 'Curriculum',

      // Student Management
      'addStudent': 'Add Student',
      'editStudent': 'Edit Student',
      'deleteStudent': 'Delete Student',
      'studentDetails': 'Student Details',
      'firstName': 'First Name',
      'lastName': 'Last Name',
      'dateOfBirth': 'Date of Birth',
      'gender': 'Gender',
      'registrationNumber': 'Registration Number',
      'level': 'Level',
      'className': 'Class',
      'parentName': 'Parent Name',
      'parentPhone': 'Parent Phone',
      'enrollmentDate': 'Enrollment Date',
      'status': 'Status',

      // Teacher Management
      'addTeacher': 'Add Teacher',
      'editTeacher': 'Edit Teacher',
      'deleteTeacher': 'Delete Teacher',
      'teacherDetails': 'Teacher Details',
      'subject': 'Subject',
      'assignedClasses': 'Assigned Classes',
      'teacherId': 'Teacher ID',
      'username': 'Username',

      // Result Management
      'addResult': 'Add Result',
      'editResult': 'Edit Result',
      'deleteResult': 'Delete Result',
      'assessmentType': 'Assessment Type',
      'score': 'Score',
      'totalScore': 'Total Score',
      'percentage': 'Percentage',
      'grade': 'Grade',
      'gradePoint': 'Grade Point',
      'remarks': 'Remarks',
      'term': 'Term',
      'academicYear': 'Academic Year',

      // Assessment Types
      'test': 'Test',
      'exam': 'Exam',
      'assignment': 'Assignment',
      'project': 'Project',

      // School Levels
      'preNursery': 'Pre-Nursery',
      'nursery': 'Nursery',
      'primary': 'Primary',
      'secondary': 'Secondary',

      // User Roles
      'admin': 'Admin',
      'teacher': 'Teacher',
      'student': 'Student',
      'parent': 'Parent',

      // Status Values
      'active': 'Active',
      'inactive': 'Inactive',
      'suspended': 'Suspended',

      // Gender Values
      'male': 'Male',
      'female': 'Female',

      // Actions
      'save': 'Save',
      'cancel': 'Cancel',
      'delete': 'Delete',
      'edit': 'Edit',
      'add': 'Add',
      'search': 'Search',
      'filter': 'Filter',
      'export': 'Export',
      'import': 'Import',
      'view': 'View',
      'print': 'Print',

      // Messages
      'loading': 'Loading...',
      'success': 'Success',
      'error': 'Error',
      'warning': 'Warning',
      'info': 'Info',
      'noDataAvailable': 'No data available',
      'operationSuccessful': 'Operation successful',
      'operationFailed': 'Operation failed',
      'confirmDelete': 'Confirm Delete',
      'areYouSure': 'Are you sure?',

      // Validation Messages
      'requiredField': 'This field is required',
      'invalidEmail': 'Invalid email address',
      'invalidPhone': 'Invalid phone number',
      'passwordTooShort': 'Password must be at least 8 characters',
      'passwordsDoNotMatch': 'Passwords do not match',
      'invalidDate': 'Invalid date format',
      'invalidNumber': 'Invalid number format',

      // Performance Ratings
      'excellent': 'Excellent',
      'good': 'Good',
      'average': 'Average',
      'poor': 'Poor',
      'veryPoor': 'Very Poor',

      // Terms
      'firstTerm': 'First Term',
      'secondTerm': 'Second Term',
      'thirdTerm': 'Third Term',

      // Dark Mode
      'darkMode': 'Dark Mode',
      'lightMode': 'Light Mode',

      // Subjects
      'mathematics': 'Mathematics',
      'englishLanguage': 'English Language',
      'dartProgramming': 'Dart Programming',
      'computerStudies': 'Computer Studies',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'biology': 'Biology',
    },
    'es': {
      'appName': 'Escuelas Victoria Folusho',
      'welcome': 'Bienvenido',
      'login': 'Iniciar Sesión',
      'logout': 'Cerrar Sesión',
      'dashboard': 'Panel de Control',
      'settings': 'Configuración',
      'profile': 'Perfil',
      'help': 'Ayuda',
      'about': 'Acerca de',
      'email': 'Correo Electrónico',
      'password': 'Contraseña',
      'confirmPassword': 'Confirmar Contraseña',
      'forgotPassword': '¿Olvidaste tu contraseña?',
      'loginSuccess': '¡Inicio de sesión exitoso!',
      'loginFailed': 'Inicio de sesión fallido',
      'invalidCredentials': 'Correo o contraseña inválidos',
      'students': 'Estudiantes',
      'teachers': 'Profesores',
      'results': 'Resultados',
      'reports': 'Informes',
      'attendance': 'Asistencia',
      'curriculum': 'Currículo',
      'addStudent': 'Agregar Estudiante',
      'editStudent': 'Editar Estudiante',
      'deleteStudent': 'Eliminar Estudiante',
      'studentDetails': 'Detalles del Estudiante',
      'firstName': 'Nombre',
      'lastName': 'Apellido',
      'dateOfBirth': 'Fecha de Nacimiento',
      'gender': 'Género',
      'registrationNumber': 'Número de Registro',
      'level': 'Nivel',
      'className': 'Clase',
      'parentName': 'Nombre del Padre',
      'parentPhone': 'Teléfono del Padre',
      'enrollmentDate': 'Fecha de Inscripción',
      'status': 'Estado',
      'addTeacher': 'Agregar Profesor',
      'editTeacher': 'Editar Profesor',
      'deleteTeacher': 'Eliminar Profesor',
      'teacherDetails': 'Detalles del Profesor',
      'subject': 'Materia',
      'assignedClasses': 'Clases Asignadas',
      'teacherId': 'ID del Profesor',
      'username': 'Nombre de Usuario',
      'addResult': 'Agregar Resultado',
      'editResult': 'Editar Resultado',
      'deleteResult': 'Eliminar Resultado',
      'assessmentType': 'Tipo de Evaluación',
      'score': 'Puntuación',
      'totalScore': 'Puntuación Total',
      'percentage': 'Porcentaje',
      'grade': 'Calificación',
      'gradePoint': 'Punto de Calificación',
      'remarks': 'Observaciones',
      'term': 'Trimestre',
      'academicYear': 'Año Académico',
      'test': 'Prueba',
      'exam': 'Examen',
      'assignment': 'Tarea',
      'project': 'Proyecto',
      'preNursery': 'Pre-Jardín',
      'nursery': 'Jardín',
      'primary': 'Primaria',
      'secondary': 'Secundaria',
      'admin': 'Administrador',
      'teacher': 'Profesor',
      'student': 'Estudiante',
      'parent': 'Padre',
      'active': 'Activo',
      'inactive': 'Inactivo',
      'suspended': 'Suspendido',
      'male': 'Masculino',
      'female': 'Femenino',
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'delete': 'Eliminar',
      'edit': 'Editar',
      'add': 'Agregar',
      'search': 'Buscar',
      'filter': 'Filtrar',
      'export': 'Exportar',
      'import': 'Importar',
      'view': 'Ver',
      'print': 'Imprimir',
      'loading': 'Cargando...',
      'success': 'Éxito',
      'error': 'Error',
      'warning': 'Advertencia',
      'info': 'Información',
      'noDataAvailable': 'No hay datos disponibles',
      'operationSuccessful': 'Operación exitosa',
      'operationFailed': 'Operación fallida',
      'confirmDelete': 'Confirmar Eliminación',
      'areYouSure': '¿Estás seguro?',
      'requiredField': 'Este campo es requerido',
      'invalidEmail': 'Dirección de correo inválida',
      'invalidPhone': 'Número de teléfono inválido',
      'passwordTooShort': 'La contraseña debe tener al menos 8 caracteres',
      'passwordsDoNotMatch': 'Las contraseñas no coinciden',
      'invalidDate': 'Formato de fecha inválido',
      'invalidNumber': 'Formato de número inválido',
      'excellent': 'Excelente',
      'good': 'Bueno',
      'average': 'Promedio',
      'poor': 'Pobre',
      'veryPoor': 'Muy Pobre',
      'firstTerm': 'Primer Trimestre',
      'secondTerm': 'Segundo Trimestre',
      'thirdTerm': 'Tercer Trimestre',
      'darkMode': 'Modo Oscuro',
      'lightMode': 'Modo Claro',
      'mathematics': 'Matemáticas',
      'englishLanguage': 'Idioma Inglés',
      'dartProgramming': 'Programación Dart',
      'computerStudies': 'Estudios de Computación',
      'physics': 'Física',
      'chemistry': 'Química',
      'biology': 'Biología',
    },
    'fr': {
      'appName': 'Écoles Victoire Folusho',
      'welcome': 'Bienvenue',
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'dashboard': 'Tableau de Bord',
      'settings': 'Paramètres',
      'profile': 'Profil',
      'help': 'Aide',
      'about': 'À Propos',
      'email': 'Email',
      'password': 'Mot de Passe',
      'confirmPassword': 'Confirmer le Mot de Passe',
      'forgotPassword': 'Mot de Passe Oublié?',
      'loginSuccess': 'Connexion réussie!',
      'loginFailed': 'Connexion échouée',
      'invalidCredentials': 'Email ou mot de passe invalide',
      'students': 'Étudiants',
      'teachers': 'Enseignants',
      'results': 'Résultats',
      'reports': 'Rapports',
      'attendance': 'Présence',
      'curriculum': 'Programme',
      'addStudent': 'Ajouter Étudiant',
      'editStudent': 'Modifier Étudiant',
      'deleteStudent': 'Supprimer Étudiant',
      'studentDetails': 'Détails de l\'Étudiant',
      'firstName': 'Prénom',
      'lastName': 'Nom',
      'dateOfBirth': 'Date de Naissance',
      'gender': 'Genre',
      'registrationNumber': 'Numéro d\'Inscription',
      'level': 'Niveau',
      'className': 'Classe',
      'parentName': 'Nom du Parent',
      'parentPhone': 'Téléphone du Parent',
      'enrollmentDate': 'Date d\'Inscription',
      'status': 'Statut',
      'addTeacher': 'Ajouter Enseignant',
      'editTeacher': 'Modifier Enseignant',
      'deleteTeacher': 'Supprimer Enseignant',
      'teacherDetails': 'Détails de l\'Enseignant',
      'subject': 'Matière',
      'assignedClasses': 'Classes Assignées',
      'teacherId': 'ID Enseignant',
      'username': 'Nom d\'Utilisateur',
      'addResult': 'Ajouter Résultat',
      'editResult': 'Modifier Résultat',
      'deleteResult': 'Supprimer Résultat',
      'assessmentType': 'Type d\'Évaluation',
      'score': 'Score',
      'totalScore': 'Score Total',
      'percentage': 'Pourcentage',
      'grade': 'Note',
      'gradePoint': 'Point de Note',
      'remarks': 'Remarques',
      'term': 'Trimestre',
      'academicYear': 'Année Académique',
      'test': 'Test',
      'exam': 'Examen',
      'assignment': 'Devoir',
      'project': 'Projet',
      'preNursery': 'Pré-Maternelle',
      'nursery': 'Maternelle',
      'primary': 'Primaire',
      'secondary': 'Secondaire',
      'admin': 'Administrateur',
      'teacher': 'Enseignant',
      'student': 'Étudiant',
      'parent': 'Parent',
      'active': 'Actif',
      'inactive': 'Inactif',
      'suspended': 'Suspendu',
      'male': 'Masculin',
      'female': 'Féminin',
      'save': 'Sauvegarder',
      'cancel': 'Annuler',
      'delete': 'Supprimer',
      'edit': 'Modifier',
      'add': 'Ajouter',
      'search': 'Rechercher',
      'filter': 'Filtrer',
      'export': 'Exporter',
      'import': 'Importer',
      'view': 'Voir',
      'print': 'Imprimer',
      'loading': 'Chargement...',
      'success': 'Succès',
      'error': 'Erreur',
      'warning': 'Avertissement',
      'info': 'Information',
      'noDataAvailable': 'Aucune donnée disponible',
      'operationSuccessful': 'Opération réussie',
      'operationFailed': 'Opération échouée',
      'confirmDelete': 'Confirmer la Suppression',
      'areYouSure': 'Êtes-vous sûr?',
      'requiredField': 'Ce champ est requis',
      'invalidEmail': 'Adresse email invalide',
      'invalidPhone': 'Numéro de téléphone invalide',
      'passwordTooShort': 'Le mot de passe doit contenir au moins 8 caractères',
      'passwordsDoNotMatch': 'Les mots de passe ne correspondent pas',
      'invalidDate': 'Format de date invalide',
      'invalidNumber': 'Format de nombre invalide',
      'excellent': 'Excellent',
      'good': 'Bon',
      'average': 'Moyen',
      'poor': 'Faible',
      'veryPoor': 'Très Faible',
      'firstTerm': 'Premier Trimestre',
      'secondTerm': 'Deuxième Trimestre',
      'thirdTerm': 'Troisième Trimestre',
      'darkMode': 'Mode Sombre',
      'lightMode': 'Mode Clair',
      'mathematics': 'Mathématiques',
      'englishLanguage': 'Langue Anglaise',
      'dartProgramming': 'Programmation Dart',
      'computerStudies': 'Études Informatiques',
      'physics': 'Physique',
      'chemistry': 'Chimie',
      'biology': 'Biologie',
    },
    'yo': {
      'appName': 'Ile-iwe Victory Folusho',
      'welcome': 'Kaabo',
      'login': 'Wole',
      'logout': 'Jade',
      'dashboard': 'Bodè Akoj',
      'settings': 'Àwùjè',
      'profile': 'Àkój',
      'help': 'Iràn',
      'about': 'Nípa',
      'email': 'Imeeli',
      'password': 'Oril',
      'confirmPassword': 'Fi Oril M',
      'forgotPassword': 'Se Gbagbe Oril?',
      'loginSuccess': 'Wole r!',
      'loginFailed': 'Wle k',
      'invalidCredentials': 'Imeeli tabi oril',
      'students': 'Ak',
      'teachers': 'Ol',
      'results': 'Ab',
      'reports': 'R',
      'attendance': 'W',
      'curriculum': 'K',
      'addStudent': 'Fi Ak',
      'editStudent': 'Y Ak',
      'deleteStudent': 'Pa Ak',
      'studentDetails': 'N Ak',
      'firstName': 'Ork',
      'lastName': 'Ork',
      'dateOfBirth': 'Oj',
      'gender': 'Ob',
      'registrationNumber': 'N',
      'level': 'Ol',
      'className': 'Kl',
      'parentName': 'Ork B',
      'parentPhone': 'N B',
      'enrollmentDate': 'Oj W',
      'status': 'Ip',
      'addTeacher': 'Fi Ol',
      'editTeacher': 'Y Ol',
      'deleteTeacher': 'Pa Ol',
      'teacherDetails': 'N Ol',
      'subject': 'K',
      'assignedClasses': 'Kl',
      'teacherId': 'ID Ol',
      'username': 'Ork',
      'addResult': 'Fi Ab',
      'editResult': 'Y Ab',
      'deleteResult': 'Pa Ab',
      'assessmentType': 'T K',
      'score': 'Sk',
      'totalScore': 'Sk T',
      'percentage': 'P',
      'grade': 'G',
      'gradePoint': 'P G',
      'remarks': 'N',
      'term': 'K',
      'academicYear': 'Od',
      'test': 'T',
      'exam': 'E',
      'assignment': 'A',
      'project': 'P',
      'preNursery': 'Pr',
      'nursery': 'N',
      'primary': 'P',
      'secondary': 'S',
      'admin': 'A',
      'teacher': 'O',
      'student': 'A',
      'parent': 'B',
      'active': 'A',
      'inactive': 'I',
      'suspended': 'S',
      'male': 'K',
      'female': 'Ob',
      'save': 'F',
      'cancel': 'F',
      'delete': 'P',
      'edit': 'Y',
      'add': 'F',
      'search': 'W',
      'filter': 'F',
      'export': 'E',
      'import': 'I',
      'view': 'W',
      'print': 'P',
      'loading': 'Nk...',
      'success': 'S',
      'error': 'E',
      'warning': 'W',
      'info': 'I',
      'noDataAvailable': 'K',
      'operationSuccessful': 'O r',
      'operationFailed': 'O k',
      'confirmDelete': 'F P',
      'areYouSure': 'S?',
      'requiredField': 'K n',
      'invalidEmail': 'Imeeli k',
      'invalidPhone': 'N k',
      'passwordTooShort': 'Oril k',
      'passwordsDoNotMatch': 'Oril k',
      'invalidDate': 'Oj k',
      'invalidNumber': 'N k',
      'excellent': 'E',
      'good': 'G',
      'average': 'A',
      'poor': 'P',
      'veryPoor': 'V P',
      'firstTerm': 'K K',
      'secondTerm': 'K K',
      'thirdTerm': 'K K',
      'darkMode': 'M D',
      'lightMode': 'M L',
      'mathematics': 'M',
      'englishLanguage': 'E',
      'dartProgramming': 'D P',
      'computerStudies': 'C S',
      'physics': 'P',
      'chemistry': 'C',
      'biology': 'B',
    },
  };
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return AppLocalizations.supportedLocales
        .any((supportedLocale) => supportedLocale.languageCode == locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(LocalizationsDelegate<AppLocalizations> old) => false;
}

// Extension for easy access
extension AppLocalizationsX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
