import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 1. MHT-CET MAHARASHTRA PREMIER ENGINEERING INSTITUTIONS
final List<Map<String, dynamic>> kCetCollegesCatalog = [
  {
    'code': '6006',
    'name': 'COEP Technological University',
    'short': 'COEP Pune',
    'city': 'Pune',
    'type': 'State Unitary Public University',
    'branches': [
      {'branch': 'Computer Engineering', 'c24': 99.82, 'c25': 99.85, 'c26': 99.88},
      {'branch': 'Artificial Intelligence & Robotics', 'c24': 99.45, 'c25': 99.52, 'c26': 99.60},
      {'branch': 'Information Technology', 'c24': 99.65, 'c25': 99.70, 'c26': 99.75},
      {'branch': 'Electronics & Telecommunication', 'c24': 98.60, 'c25': 98.75, 'c26': 98.90},
      {'branch': 'Electrical Engineering', 'c24': 96.50, 'c25': 96.65, 'c26': 96.80},
      {'branch': 'Mechanical Engineering', 'c24': 95.80, 'c25': 95.95, 'c26': 96.15},
      {'branch': 'Civil Engineering', 'c24': 88.50, 'c25': 88.75, 'c26': 89.10},
      {'branch': 'Instrumentation & Control', 'c24': 94.20, 'c25': 94.40, 'c26': 94.65},
    ]
  },
  {
    'code': '3012',
    'name': 'Veermata Jijabai Technological Institute (VJTI)',
    'short': 'VJTI Mumbai',
    'city': 'Mumbai',
    'type': 'State Autonomous Institute',
    'branches': [
      {'branch': 'Computer Engineering', 'c24': 99.78, 'c25': 99.82, 'c26': 99.85},
      {'branch': 'Information Technology', 'c24': 99.51, 'c25': 99.58, 'c26': 99.65},
      {'branch': 'Electronics & Telecommunication', 'c24': 98.40, 'c25': 98.55, 'c26': 98.70},
      {'branch': 'Electrical Engineering', 'c24': 96.20, 'c25': 96.40, 'c26': 96.60},
      {'branch': 'Mechanical Engineering', 'c24': 95.10, 'c25': 95.30, 'c26': 95.50},
      {'branch': 'Civil Engineering', 'c24': 87.80, 'c25': 88.10, 'c26': 88.45},
    ]
  },
  {
    'code': '6271',
    'name': 'Pune Institute of Computer Technology (PICT)',
    'short': 'PICT Pune',
    'city': 'Pune',
    'type': 'Private Autonomous (SPPU)',
    'branches': [
      {'branch': 'Computer Engineering', 'c24': 99.55, 'c25': 99.60, 'c26': 99.65},
      {'branch': 'Information Technology', 'c24': 99.30, 'c25': 99.38, 'c26': 99.45},
      {'branch': 'Artificial Intelligence & Data Science', 'c24': 99.15, 'c25': 99.25, 'c26': 99.35},
      {'branch': 'Electronics & Telecommunication', 'c24': 97.80, 'c25': 97.95, 'c26': 98.15},
    ]
  },
  {
    'code': '3215',
    'name': 'Sardar Patel Institute of Technology (SPIT)',
    'short': 'SPIT Mumbai',
    'city': 'Mumbai',
    'type': 'Private Autonomous',
    'branches': [
      {'branch': 'Computer Engineering', 'c24': 99.50, 'c25': 99.55, 'c26': 99.60},
      {'branch': 'Computer Science & Engineering (Data Science)', 'c24': 99.20, 'c25': 99.28, 'c26': 99.36},
      {'branch': 'Artificial Intelligence & Machine Learning', 'c24': 99.05, 'c25': 99.15, 'c26': 99.25},
      {'branch': 'Electronics & Telecommunication', 'c24': 97.40, 'c25': 97.60, 'c26': 97.80},
    ]
  },
  {
    'code': '6007',
    'name': 'Walchand College of Engineering (WCE)',
    'short': 'WCE Sangli',
    'city': 'Sangli',
    'type': 'Government Aided Autonomous',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.10, 'c25': 99.18, 'c26': 99.25},
      {'branch': 'Information Technology', 'c24': 98.70, 'c25': 98.80, 'c26': 98.90},
      {'branch': 'Electronics Engineering', 'c24': 96.50, 'c25': 96.70, 'c26': 96.90},
      {'branch': 'Mechanical Engineering', 'c24': 92.50, 'c25': 92.70, 'c26': 92.95},
      {'branch': 'Civil Engineering', 'c24': 86.40, 'c25': 86.65, 'c26': 86.90},
    ]
  },
  {
    'code': '6175',
    'name': 'Pimpri Chinchwad College of Engineering (PCCOE)',
    'short': 'PCCOE Pune',
    'city': 'Pune',
    'type': 'Private Autonomous',
    'branches': [
      {'branch': 'Computer Engineering', 'c24': 98.85, 'c25': 98.95, 'c26': 99.05},
      {'branch': 'Information Technology', 'c24': 98.40, 'c25': 98.50, 'c26': 98.62},
      {'branch': 'Artificial Intelligence & Machine Learning', 'c24': 98.15, 'c25': 98.30, 'c26': 98.45},
      {'branch': 'Electronics & Telecommunication', 'c24': 96.10, 'c25': 96.28, 'c26': 96.45},
      {'branch': 'Mechanical Engineering', 'c24': 89.20, 'c25': 89.40, 'c26': 89.65},
    ]
  },
  {
    'code': '6273',
    'name': 'Vishwakarma Institute of Technology (VIT)',
    'short': 'VIT Pune',
    'city': 'Pune',
    'type': 'Private Autonomous',
    'branches': [
      {'branch': 'Computer Engineering', 'c24': 98.90, 'c25': 99.00, 'c26': 99.10},
      {'branch': 'Artificial Intelligence & Data Science', 'c24': 98.35, 'c25': 98.48, 'c26': 98.60},
      {'branch': 'Information Technology', 'c24': 98.50, 'c25': 98.60, 'c26': 98.72},
      {'branch': 'Electronics & Telecommunication', 'c24': 96.20, 'c25': 96.40, 'c26': 96.60},
      {'branch': 'Mechanical Engineering', 'c24': 90.10, 'c25': 90.30, 'c26': 90.55},
    ]
  },
  {
    'code': '3199',
    'name': 'D. J. Sanghvi College of Engineering',
    'short': 'DJ Sanghvi Mumbai',
    'city': 'Mumbai',
    'type': 'Private Autonomous (Minority)',
    'branches': [
      {'branch': 'Computer Engineering', 'c24': 99.10, 'c25': 99.18, 'c26': 99.25},
      {'branch': 'Information Technology', 'c24': 98.75, 'c25': 98.85, 'c26': 98.95},
      {'branch': 'Artificial Intelligence & Machine Learning', 'c24': 98.40, 'c25': 98.55, 'c26': 98.70},
      {'branch': 'Electronics & Telecommunication', 'c24': 95.80, 'c25': 96.00, 'c26': 96.20},
    ]
  }
];

/// 2. JEE ADVANCED (JoSAA IITs) CATALOG
final List<Map<String, dynamic>> kJeeAdvCollegesCatalog = [
  {
    'code': 'IITB',
    'name': 'Indian Institute of Technology, Bombay',
    'short': 'IIT Bombay',
    'city': 'Mumbai',
    'type': 'Institute of National Importance',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.98, 'c25': 99.98, 'c26': 99.99},
      {'branch': 'Electrical Engineering', 'c24': 99.78, 'c25': 99.80, 'c26': 99.82},
      {'branch': 'Mechanical Engineering', 'c24': 99.40, 'c25': 99.45, 'c26': 99.50},
      {'branch': 'Aerospace Engineering', 'c24': 99.10, 'c25': 99.18, 'c26': 99.25},
      {'branch': 'Civil Engineering', 'c24': 98.40, 'c25': 98.50, 'c26': 98.60},
      {'branch': 'Chemical Engineering', 'c24': 98.85, 'c25': 98.92, 'c26': 99.00},
    ]
  },
  {
    'code': 'IITD',
    'name': 'Indian Institute of Technology, Delhi',
    'short': 'IIT Delhi',
    'city': 'New Delhi',
    'type': 'Institute of National Importance',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.95, 'c25': 99.96, 'c26': 99.97},
      {'branch': 'Mathematics & Computing', 'c24': 99.85, 'c25': 99.88, 'c26': 99.90},
      {'branch': 'Electrical Engineering', 'c24': 99.70, 'c25': 99.74, 'c26': 99.78},
      {'branch': 'Mechanical Engineering', 'c24': 99.30, 'c25': 99.35, 'c26': 99.40},
      {'branch': 'Civil Engineering', 'c24': 98.20, 'c25': 98.30, 'c26': 98.40},
    ]
  },
  {
    'code': 'IITM',
    'name': 'Indian Institute of Technology, Madras',
    'short': 'IIT Madras',
    'city': 'Chennai',
    'type': 'Institute of National Importance',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.92, 'c25': 99.94, 'c26': 99.95},
      {'branch': 'Electrical Engineering', 'c24': 99.65, 'c25': 99.70, 'c26': 99.75},
      {'branch': 'Aerospace Engineering', 'c24': 98.95, 'c25': 99.05, 'c26': 99.15},
      {'branch': 'Mechanical Engineering', 'c24': 99.20, 'c25': 99.28, 'c26': 99.35},
    ]
  },
  {
    'code': 'IITK',
    'name': 'Indian Institute of Technology, Kanpur',
    'short': 'IIT Kanpur',
    'city': 'Kanpur',
    'type': 'Institute of National Importance',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.88, 'c25': 99.90, 'c26': 99.92},
      {'branch': 'Electrical Engineering', 'c24': 99.55, 'c25': 99.60, 'c26': 99.65},
      {'branch': 'Mechanical Engineering', 'c24': 99.10, 'c25': 99.18, 'c26': 99.25},
      {'branch': 'Aerospace Engineering', 'c24': 98.80, 'c25': 98.90, 'c26': 99.00},
    ]
  },
  {
    'code': 'IITKGP',
    'name': 'Indian Institute of Technology, Kharagpur',
    'short': 'IIT Kharagpur',
    'city': 'Kharagpur',
    'type': 'Institute of National Importance',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.85, 'c25': 99.88, 'c26': 99.90},
      {'branch': 'Electronics & Communication', 'c24': 99.60, 'c25': 99.65, 'c26': 99.70},
      {'branch': 'Mechanical Engineering', 'c24': 98.85, 'c25': 98.95, 'c26': 99.05},
      {'branch': 'Civil Engineering', 'c24': 97.20, 'c25': 97.35, 'c26': 97.50},
    ]
  },
  {
    'code': 'IITR',
    'name': 'Indian Institute of Technology, Roorkee',
    'short': 'IIT Roorkee',
    'city': 'Roorkee',
    'type': 'Institute of National Importance',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.80, 'c25': 99.83, 'c26': 99.86},
      {'branch': 'Data Science & Artificial Intelligence', 'c24': 99.70, 'c25': 99.75, 'c26': 99.80},
      {'branch': 'Electrical Engineering', 'c24': 99.40, 'c25': 99.48, 'c26': 99.55},
    ]
  }
];

/// 3. JEE MAIN (JoSAA & CSAB NITs & IIITs) CATALOG
final List<Map<String, dynamic>> kJeeMainCollegesCatalog = [
  {
    'code': 'NITT',
    'name': 'National Institute of Technology, Tiruchirappalli',
    'short': 'NIT Trichy',
    'city': 'Tiruchirappalli',
    'type': 'National Institute (NIT)',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.75, 'c25': 99.78, 'c26': 99.82},
      {'branch': 'Electronics & Communication', 'c24': 99.25, 'c25': 99.30, 'c26': 99.38},
      {'branch': 'Electrical & Electronics', 'c24': 98.80, 'c25': 98.90, 'c26': 99.00},
      {'branch': 'Mechanical Engineering', 'c24': 98.30, 'c25': 98.40, 'c26': 98.50},
      {'branch': 'Civil Engineering', 'c24': 96.80, 'c25': 96.95, 'c26': 97.10},
    ]
  },
  {
    'code': 'NITK',
    'name': 'National Institute of Technology Karnataka, Surathkal',
    'short': 'NIT Surathkal',
    'city': 'Surathkal',
    'type': 'National Institute (NIT)',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.65, 'c25': 99.70, 'c26': 99.74},
      {'branch': 'Information Technology', 'c24': 99.45, 'c25': 99.50, 'c26': 99.55},
      {'branch': 'Artificial Intelligence', 'c24': 99.40, 'c25': 99.48, 'c26': 99.52},
      {'branch': 'Electronics & Communication', 'c24': 99.10, 'c25': 99.18, 'c26': 99.25},
      {'branch': 'Mechanical Engineering', 'c24': 98.10, 'c25': 98.20, 'c26': 98.30},
    ]
  },
  {
    'code': 'VNIT',
    'name': 'Visvesvaraya National Institute of Technology',
    'short': 'VNIT Nagpur',
    'city': 'Nagpur',
    'type': 'National Institute (NIT Maharashtra)',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.15, 'c25': 99.22, 'c26': 99.30},
      {'branch': 'Electronics & Communication', 'c24': 98.50, 'c25': 98.60, 'c26': 98.70},
      {'branch': 'Electrical & Electronics', 'c24': 97.80, 'c25': 97.92, 'c26': 98.05},
      {'branch': 'Mechanical Engineering', 'c24': 97.20, 'c25': 97.35, 'c26': 97.50},
      {'branch': 'Civil Engineering', 'c24': 95.10, 'c25': 95.25, 'c26': 95.40},
    ]
  },
  {
    'code': 'IIITA',
    'name': 'Indian Institute of Information Technology, Allahabad',
    'short': 'IIIT Allahabad',
    'city': 'Prayagraj',
    'type': 'IIIT Central Institute',
    'branches': [
      {'branch': 'Information Technology', 'c24': 99.40, 'c25': 99.45, 'c26': 99.50},
      {'branch': 'IT (Business Informatics)', 'c24': 99.10, 'c25': 99.18, 'c26': 99.25},
      {'branch': 'Electronics & Communication', 'c24': 98.60, 'c25': 98.70, 'c26': 98.80},
    ]
  },
  {
    'code': 'NITW',
    'name': 'National Institute of Technology, Warangal',
    'short': 'NIT Warangal',
    'city': 'Warangal',
    'type': 'National Institute (NIT)',
    'branches': [
      {'branch': 'Computer Science & Engineering', 'c24': 99.50, 'c25': 99.55, 'c26': 99.60},
      {'branch': 'Data Science & AI', 'c24': 99.30, 'c25': 99.38, 'c26': 99.45},
      {'branch': 'Electronics & Communication', 'c24': 98.90, 'c25': 99.00, 'c26': 99.10},
      {'branch': 'Mechanical Engineering', 'c24': 97.90, 'c25': 98.05, 'c26': 98.20},
    ]
  }
];

/// 4. NEET UG (MCC & DMER MEDICAL) CATALOG
final List<Map<String, dynamic>> kNeetCollegesCatalog = [
  {
    'code': 'AIIMS-DELHI',
    'name': 'All India Institute of Medical Sciences',
    'short': 'AIIMS New Delhi',
    'city': 'New Delhi',
    'type': 'Apex Central Medical Institute',
    'branches': [
      {'branch': 'MBBS', 'c24': 99.98, 'c25': 99.99, 'c26': 99.99},
      {'branch': 'B.Sc. Nursing (Hons)', 'c24': 97.80, 'c25': 97.95, 'c26': 98.10},
    ]
  },
  {
    'code': 'KEM-MUMBAI',
    'name': 'Seth G. S. Medical College & KEM Hospital',
    'short': 'KEM Mumbai',
    'city': 'Mumbai',
    'type': 'Municipal Autonomous Medical College',
    'branches': [
      {'branch': 'MBBS', 'c24': 99.88, 'c25': 99.90, 'c26': 99.92},
      {'branch': 'B.Sc. Nursing', 'c24': 95.80, 'c25': 96.00, 'c26': 96.20},
    ]
  },
  {
    'code': 'GMC-MUMBAI',
    'name': 'Grant Government Medical College (JJ Hospital)',
    'short': 'GMC Mumbai (JJ)',
    'city': 'Mumbai',
    'type': 'Government Medical College (1845)',
    'branches': [
      {'branch': 'MBBS', 'c24': 99.78, 'c25': 99.82, 'c26': 99.85},
      {'branch': 'BDS (Dental Surgery)', 'c24': 98.40, 'c25': 98.55, 'c26': 98.70},
    ]
  },
  {
    'code': 'AFMC-PUNE',
    'name': 'Armed Forces Medical College',
    'short': 'AFMC Pune',
    'city': 'Pune',
    'type': 'Ministry of Defence Medical College',
    'branches': [
      {'branch': 'MBBS', 'c24': 99.65, 'c25': 99.70, 'c26': 99.75},
    ]
  },
  {
    'code': 'BJMC-PUNE',
    'name': 'B. J. Government Medical College & Sassoon Hospital',
    'short': 'BJMC Pune',
    'city': 'Pune',
    'type': 'State Government Medical College',
    'branches': [
      {'branch': 'MBBS', 'c24': 99.68, 'c25': 99.72, 'c26': 99.76},
      {'branch': 'BDS (Dental Surgery)', 'c24': 98.10, 'c25': 98.25, 'c26': 98.40},
    ]
  },
  {
    'code': 'AIIMS-NAGPUR',
    'name': 'All India Institute of Medical Sciences, Nagpur',
    'short': 'AIIMS Nagpur',
    'city': 'Nagpur',
    'type': 'Central Autonomous Medical Institute',
    'branches': [
      {'branch': 'MBBS', 'c24': 99.72, 'c25': 99.76, 'c26': 99.80},
    ]
  },
  {
    'code': 'GMC-NAGPUR',
    'name': 'Government Medical College, Nagpur',
    'short': 'GMC Nagpur',
    'city': 'Nagpur',
    'type': 'State Government Medical College',
    'branches': [
      {'branch': 'MBBS', 'c24': 99.45, 'c25': 99.52, 'c26': 99.58},
      {'branch': 'BDS (Dental Surgery)', 'c24': 97.60, 'c25': 97.75, 'c26': 97.90},
      {'branch': 'BAMS (Ayurveda)', 'c24': 94.80, 'c25': 95.05, 'c26': 95.30},
    ]
  }
];

class CapSimulatorScreen extends StatefulWidget {
  final Map<String, dynamic> studentProfile;
  final Set<String> shortlistedColleges;

  const CapSimulatorScreen({
    super.key,
    required this.studentProfile,
    required this.shortlistedColleges,
  });

  @override
  State<CapSimulatorScreen> createState() => _CapSimulatorScreenState();
}

class _CapSimulatorScreenState extends State<CapSimulatorScreen> {
  int _activeTab = 0; // 0: Option Form Table, 1: Round Allotment, 2: Official Dates & Rules

  // Selected Entrance Exam & Counseling Process
  String _selectedExam = 'MHT-CET';
  bool _showAllExams = false;

  // Interactive Simulator Controls
  late double _studentScore;
  String _selectedCategory = 'OPEN';
  String _selectedRound = 'CAP Round 1';

  // Table choices list: List of { 'code': string, 'branch': string }
  late List<Map<String, String>> _tableChoices;

  // Search State
  final TextEditingController _searchCtrl = TextEditingController();
  String _searchQuery = '';
  bool _round1Floated = false;

  @override
  void initState() {
    super.initState();
    _initExamAndProfile();
  }

  void _initExamAndProfile() {
    final examRaw = (widget.studentProfile['exam_type'] as String?) ??
        (widget.studentProfile['exam'] as String?) ??
        '';
    final streamRaw = (widget.studentProfile['stream'] as String?) ?? '';
    final el = examRaw.toLowerCase();
    final sl = streamRaw.toLowerCase();

    if (el.contains('adv') || el.contains('iit')) {
      _selectedExam = 'JEE Advanced';
    } else if (el.contains('main') || el.contains('nit') || el.contains('csab')) {
      _selectedExam = 'JEE Main';
    } else if (el.contains('neet') || el.contains('med') || el.contains('mbbs') || sl.contains('med')) {
      _selectedExam = 'NEET';
    } else if (el.contains('jee')) {
      _selectedExam = 'JEE Main';
    } else {
      _selectedExam = 'MHT-CET';
    }

    final profileMarks = (widget.studentProfile['score'] as num?)?.toDouble() ??
        (widget.studentProfile['marks'] as num?)?.toDouble() ??
        _getDefaultScoreForExam(_selectedExam);
    _studentScore = profileMarks;

    _setupForExam(_selectedExam, isInitial: true);
  }

  double _getDefaultScoreForExam(String exam) {
    switch (exam) {
      case 'JEE Advanced':
        return 99.2;
      case 'JEE Main':
        return 98.6;
      case 'NEET':
        return 99.2;
      default:
        return 97.4;
    }
  }

  List<String> _getRoundsForExam(String exam) {
    switch (exam) {
      case 'JEE Advanced':
        return ['JoSAA Round 1', 'JoSAA Round 2', 'JoSAA Round 3', 'JoSAA Round 4', 'JoSAA Round 5', 'JoSAA Round 6'];
      case 'JEE Main':
        return ['JoSAA Round 1', 'JoSAA Round 2', 'JoSAA Round 3', 'JoSAA Round 4', 'CSAB Special Round 1', 'CSAB Special Round 2'];
      case 'NEET':
        return ['MCC Round 1 (AIQ)', 'MCC Round 2 (Upgradation)', 'MCC Round 3 (Mop-Up)', 'Stray Vacancy Round'];
      default:
        return ['CAP Round 1', 'CAP Round 2', 'CAP Round 3', 'CAP Round 4 / Spot'];
    }
  }

  List<String> _getCategoriesForExam(String exam) {
    switch (exam) {
      case 'JEE Advanced':
        return ['OPEN / CRL', 'OBC-NCL', 'GEN-EWS', 'SC', 'ST'];
      case 'JEE Main':
        return ['OPEN', 'OBC-NCL', 'EWS', 'SC', 'ST', 'Home State (HS)', 'Other State (OS)'];
      case 'NEET':
        return ['UR / OPEN', 'OBC', 'EWS', 'SC', 'ST', 'Defense / PwD'];
      default:
        return ['OPEN', 'OBC', 'EWS', 'TFWS', 'SC', 'ST', 'VJNT'];
    }
  }

  List<Map<String, dynamic>> _getCatalogForExam(String exam) {
    switch (exam) {
      case 'JEE Advanced':
        return kJeeAdvCollegesCatalog;
      case 'JEE Main':
        return kJeeMainCollegesCatalog;
      case 'NEET':
        return kNeetCollegesCatalog;
      default:
        return kCetCollegesCatalog;
    }
  }

  List<Map<String, String>> _getDefaultChoicesForExam(String exam) {
    switch (exam) {
      case 'JEE Advanced':
        return [
          {'code': 'IITB', 'branch': 'Computer Science & Engineering'},
          {'code': 'IITD', 'branch': 'Computer Science & Engineering'},
          {'code': 'IITM', 'branch': 'Computer Science & Engineering'},
          {'code': 'IITB', 'branch': 'Electrical Engineering'},
          {'code': 'IITK', 'branch': 'Computer Science & Engineering'},
          {'code': 'IITKGP', 'branch': 'Computer Science & Engineering'},
        ];
      case 'JEE Main':
        return [
          {'code': 'NITT', 'branch': 'Computer Science & Engineering'},
          {'code': 'NITK', 'branch': 'Computer Science & Engineering'},
          {'code': 'IIITA', 'branch': 'Information Technology'},
          {'code': 'NITW', 'branch': 'Computer Science & Engineering'},
          {'code': 'VNIT', 'branch': 'Computer Science & Engineering'},
          {'code': 'VNIT', 'branch': 'Electronics & Communication'},
        ];
      case 'NEET':
        return [
          {'code': 'AIIMS-DELHI', 'branch': 'MBBS'},
          {'code': 'KEM-MUMBAI', 'branch': 'MBBS'},
          {'code': 'GMC-MUMBAI', 'branch': 'MBBS'},
          {'code': 'AFMC-PUNE', 'branch': 'MBBS'},
          {'code': 'BJMC-PUNE', 'branch': 'MBBS'},
          {'code': 'AIIMS-NAGPUR', 'branch': 'MBBS'},
        ];
      default:
        return [
          {'code': '6006', 'branch': 'Computer Engineering'},
          {'code': '3012', 'branch': 'Computer Engineering'},
          {'code': '6271', 'branch': 'Computer Engineering'},
          {'code': '6006', 'branch': 'Artificial Intelligence & Robotics'},
          {'code': '3215', 'branch': 'Computer Engineering'},
          {'code': '6271', 'branch': 'Information Technology'},
          {'code': '6175', 'branch': 'Computer Engineering'},
          {'code': '6273', 'branch': 'Computer Engineering'},
        ];
    }
  }

  void _setupForExam(String exam, {bool isInitial = false}) {
    final rounds = _getRoundsForExam(exam);
    final categories = _getCategoriesForExam(exam);

    _selectedRound = rounds.first;
    _selectedCategory = categories.first;

    if (!isInitial) {
      _studentScore = _getDefaultScoreForExam(exam);
    }
    _tableChoices = _getDefaultChoicesForExam(exam);
    _searchCtrl.clear();
    _searchQuery = '';
  }

  void _onExamChanged(String newExam) {
    if (newExam == _selectedExam) return;
    setState(() {
      _selectedExam = newExam;
      _setupForExam(newExam);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  double _getCategoryOffset(String cat) {
    switch (cat.toUpperCase()) {
      case 'OBC':
      case 'OBC-NCL':
        return -0.75;
      case 'EWS':
      case 'GEN-EWS':
        return -0.40;
      case 'TFWS':
        return 0.35;
      case 'SC':
        return -4.20;
      case 'ST':
        return -8.50;
      case 'VJNT':
      case 'NT':
        return -2.10;
      case 'HOME STATE (HS)':
        return 0.40;
      case 'OTHER STATE (OS)':
        return -0.40;
      case 'DEFENSE / PWD':
        return -3.50;
      default:
        return 0.0;
    }
  }

  double _getRoundOffset(String round) {
    if (round.contains('Round 2') || round.contains('Betterment')) return -0.45;
    if (round.contains('Round 3') || round.contains('Mop-Up')) return -1.20;
    if (round.contains('Round 4') || round.contains('Spot') || round.contains('Stray')) return -2.10;
    if (round.contains('Round 5')) return -1.15;
    if (round.contains('Round 6')) return -1.50;
    if (round.contains('CSAB Special Round 1')) return -2.20;
    if (round.contains('CSAB Special Round 2')) return -3.10;
    return 0.0;
  }

  /// Math calculation for a choice row
  Map<String, dynamic> _calculateRow(String collegeCode, String selectedBranch) {
    final catalog = _getCatalogForExam(_selectedExam);
    final college = catalog.firstWhere(
      (c) => c['code'] == collegeCode,
      orElse: () => catalog.first,
    );

    final List<Map<String, dynamic>> branchList = (college['branches'] as List).cast<Map<String, dynamic>>();
    final branchObj = branchList.firstWhere(
      (b) => (b['branch'] as String).toLowerCase() == selectedBranch.toLowerCase(),
      orElse: () => <String, dynamic>{},
    );

    final availableBranchNames = branchList.map((b) => b['branch'] as String).toList();

    // IF BRANCH NOT PROVIDED BY THIS COLLEGE
    if (branchObj.isEmpty) {
      return {
        'code': college['code'],
        'name': college['name'],
        'short': college['short'],
        'city': college['city'],
        'branch': selectedBranch,
        'is_offered': false,
        'available_branches': availableBranchNames,
        'c24': null,
        'c25': null,
        'c26': null,
        'c27': null,
        'trend': 'N/A',
        'prob': 0,
        'tier': 'Not Offered',
        'margin': null,
      };
    }

    final catOffset = _getCategoryOffset(_selectedCategory);
    final roundOffset = _getRoundOffset(_selectedRound);

    final raw24 = (branchObj['c24'] as double) + catOffset + roundOffset;
    final raw25 = (branchObj['c25'] as double) + catOffset + roundOffset;
    final raw26 = (branchObj['c26'] as double) + catOffset + roundOffset;

    final c24 = double.parse(raw24.clamp(35.0, 99.98).toStringAsFixed(2));
    final c25 = double.parse(raw25.clamp(35.0, 99.98).toStringAsFixed(2));
    final c26 = double.parse(raw26.clamp(35.0, 99.98).toStringAsFixed(2));

    // Momentum slope for 2027
    final slope = ((c26 - c25) + (c25 - c24)) / 2.0;
    final c27 = double.parse((c26 + slope).clamp(35.0, 99.98).toStringAsFixed(2));

    String trendLabel;
    if (slope > 0.04) {
      trendLabel = '📈 +${slope.toStringAsFixed(2)}% (Rising)';
    } else if (slope < -0.04) {
      trendLabel = '📉 ${slope.toStringAsFixed(2)}% (Easing)';
    } else {
      trendLabel = '⚖️ Stable';
    }

    // Admission Probability based on student marks
    final margin = double.parse((_studentScore - c26).toStringAsFixed(2));
    int prob;
    String tier;

    if (margin >= 2.0) {
      prob = 98;
      tier = 'Safe';
    } else if (margin >= 0.8) {
      prob = (90 + (margin - 0.8) * 5).clamp(80, 96).toInt();
      tier = 'Safe';
    } else if (margin >= 0.0) {
      prob = (80 + margin * 12).clamp(70, 88).toInt();
      tier = 'Safe';
    } else if (margin >= -0.6) {
      prob = (75 + margin * 15).clamp(55, 75).toInt();
      tier = 'Target';
    } else if (margin >= -1.5) {
      prob = (58 + (margin + 0.6) * 14).clamp(35, 58).toInt();
      tier = 'Target';
    } else if (margin >= -3.0) {
      prob = (35 + (margin + 1.5) * 10).clamp(15, 35).toInt();
      tier = 'Dream';
    } else {
      prob = (15 + (margin + 3.0) * 3).clamp(5, 15).toInt();
      tier = 'Dream';
    }

    return {
      'code': college['code'],
      'name': college['name'],
      'short': college['short'],
      'city': college['city'],
      'branch': selectedBranch,
      'is_offered': true,
      'available_branches': availableBranchNames,
      'c24': c24,
      'c25': c25,
      'c26': c26,
      'c27': c27,
      'trend': trendLabel,
      'prob': prob,
      'tier': tier,
      'margin': margin,
    };
  }

  // Row Manipulation Handlers
  void _addCollegeChoice(Map<String, dynamic> college) {
    final List branches = college['branches'] as List;
    final firstBranch = branches.isNotEmpty ? (branches.first['branch'] as String) : 'Computer Science & Engineering';
    setState(() {
      _tableChoices.add({
        'code': college['code'] as String,
        'branch': firstBranch,
      });
      _searchCtrl.clear();
      _searchQuery = '';
    });
  }

  void _removeRow(int index) {
    setState(() {
      _tableChoices.removeAt(index);
    });
  }

  void _moveUp(int index) {
    if (index == 0) return;
    setState(() {
      final item = _tableChoices.removeAt(index);
      _tableChoices.insert(index - 1, item);
    });
  }

  void _moveDown(int index) {
    if (index == _tableChoices.length - 1) return;
    setState(() {
      final item = _tableChoices.removeAt(index);
      _tableChoices.insert(index + 1, item);
    });
  }

  void _changeRowBranch(int index, String newBranch) {
    setState(() {
      _tableChoices[index]['branch'] = newBranch;
    });
  }

  void _copyOptionFormToClipboard() {
    final buffer = StringBuffer();
    buffer.writeln('=== $_selectedExam PREFERENCE FORM (Simulated) ===');
    buffer.writeln('Candidate Score: ${_studentScore.toStringAsFixed(2)}%ile | Quota: $_selectedCategory | Round: $_selectedRound');
    buffer.writeln('--------------------------------------------------------------');
    for (int i = 0; i < _tableChoices.length; i++) {
      final r = _calculateRow(_tableChoices[i]['code']!, _tableChoices[i]['branch']!);
      if (r['is_offered'] == true) {
        buffer.writeln('#${i + 1} | ${r['short']} (${r['code']}) | ${r['branch']} | 2026: ${r['c26']}%ile | Proj 2027: ${r['c27']}%ile | Prob: ${r['prob']}% (${r['tier']})');
      } else {
        buffer.writeln('#${i + 1} | ${r['short']} (${r['code']}) | ${r['branch']} | [NOT OFFERED BY INSTITUTE]');
      }
    }
    buffer.writeln('--------------------------------------------------------------');

    Clipboard.setData(ClipboardData(text: buffer.toString()));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✅ Preference Form & Cutoff Codes copied to clipboard!'),
        backgroundColor: Color(0xFF10B981),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final calculatedRows = _tableChoices.map((c) => _calculateRow(c['code']!, c['branch']!)).toList();

    final safeCount = calculatedRows.where((r) => r['is_offered'] == true && r['tier'] == 'Safe').length;
    final targetCount = calculatedRows.where((r) => r['is_offered'] == true && r['tier'] == 'Target').length;
    final dreamCount = calculatedRows.where((r) => r['is_offered'] == true && r['tier'] == 'Dream').length;
    final notOfferedCount = calculatedRows.where((r) => r['is_offered'] == false).length;

    final bool isHealthy = safeCount >= 2 && targetCount >= 1;

    final isMedical = (widget.studentProfile['stream'] as String? ?? '').toLowerCase().contains('med') ||
        (widget.studentProfile['exam_type'] as String? ?? '').toLowerCase().contains('neet');
    final examType = (widget.studentProfile['exam_type'] as String? ?? '').toLowerCase();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Icon(Icons.table_chart, color: Color(0xFFFFB300), size: 24),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '$_selectedExam Allotment Simulator',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Score: ${_studentScore.toStringAsFixed(2)}%ile • Quota: $_selectedCategory • $_selectedRound',
                          style: const TextStyle(fontSize: 10.5, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy, color: Colors.white, size: 20),
                    tooltip: 'Copy Form',
                    onPressed: _copyOptionFormToClipboard,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: Column(
            children: [
              // Candidate Profile Banner
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: isMedical ? const Color(0xFF10B981) : const Color(0xFF1A237E),
                      child: Icon(
                        isMedical ? Icons.medical_services : Icons.school,
                        size: 16,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${widget.studentProfile['name'] ?? 'Candidate'} • ${isMedical ? 'Medical' : 'Engineering'} Profile',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          Text(
                            'Exam: ${widget.studentProfile['exam_type'] ?? _selectedExam} • Counseling options tailored for your profile',
                            style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () => setState(() => _showAllExams = !_showAllExams),
                      icon: Icon(_showAllExams ? Icons.filter_alt : Icons.language, size: 14),
                      label: Text(
                        _showAllExams ? 'Filter by Profile' : 'All Exams',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
                    ),
                  ],
                ),
              ),

              // EXAM PROCESS SWITCHER TABS (DEPENDS UPON SELECTED PROFILE)
              Container(
                color: const Color(0xFFF8FAFC),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      if (!_showAllExams && isMedical) ...[
                        _buildExamPill('NEET', '🩺 NEET UG (MCC AIQ)'),
                        const SizedBox(width: 6),
                        _buildExamPill('NEET', '🏥 State DMER (85% Quota)'),
                        const SizedBox(width: 6),
                        _buildExamPill('NEET', '🦷 Dental & AYUSH'),
                      ] else if (!_showAllExams && !isMedical) ...[
                        if (examType.contains('cet')) ...[
                          _buildExamPill('MHT-CET', '🚩 MHT-CET (State CAP) ⭐ Profile'),
                          const SizedBox(width: 6),
                          _buildExamPill('JEE Main', '🏢 JEE Main (NITs)'),
                          const SizedBox(width: 6),
                          _buildExamPill('JEE Advanced', '🏛️ JEE Adv (IITs)'),
                        ] else if (examType.contains('main')) ...[
                          _buildExamPill('JEE Main', '🏢 JEE Main (NITs) ⭐ Profile'),
                          const SizedBox(width: 6),
                          _buildExamPill('JEE Advanced', '🏛️ JEE Adv (IITs)'),
                          const SizedBox(width: 6),
                          _buildExamPill('MHT-CET', '🚩 MHT-CET (CAP)'),
                        ] else ...[
                          _buildExamPill('JEE Advanced', '🏛️ JEE Adv (IITs) ⭐ Profile'),
                          const SizedBox(width: 6),
                          _buildExamPill('JEE Main', '🏢 JEE Main (NITs)'),
                          const SizedBox(width: 6),
                          _buildExamPill('MHT-CET', '🚩 MHT-CET (CAP)'),
                        ],
                      ] else ...[
                        _buildExamPill('MHT-CET', '🚩 MHT-CET (CAP)'),
                        const SizedBox(width: 6),
                        _buildExamPill('JEE Main', '🏢 JEE Main (NITs)'),
                        const SizedBox(width: 6),
                        _buildExamPill('JEE Advanced', '🏛️ JEE Adv (IITs)'),
                        const SizedBox(width: 6),
                        _buildExamPill('NEET', '🩺 NEET UG (Medical)'),
                      ],
                    ],
                  ),
                ),
              ),

              // Navigation Tabs (Option Table / Round Allotment / Rules)
              Container(
                color: const Color(0xFFF1F5F9),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                child: Row(
                  children: [
                    _buildTabButton(0, '📋 Preference Table (Cutoffs)'),
                    const SizedBox(width: 8),
                    _buildTabButton(1, '🎯 Provisional Allotment'),
                    const SizedBox(width: 8),
                    _buildTabButton(2, '📅 Dates & Rules'),
                  ],
                ),
              ),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(14),
                  children: [
                    if (_activeTab == 0) ...[
                      // Global Filter & Simulator Bar
                      _buildGlobalControlsCard(),
                      const SizedBox(height: 12),

                      // Portfolio Strategy Alert Card
                      _buildStrategyCard(isHealthy, safeCount, targetCount, dreamCount, notOfferedCount),
                      const SizedBox(height: 14),

                      // Quick Template Buttons
                      _buildPresetTemplateButtons(),
                      const SizedBox(height: 14),

                      // The Interactive Table
                      _buildCapTableView(calculatedRows),
                    ],

                    if (_activeTab == 1) _buildTabRoundAllotment(),
                    if (_activeTab == 2) _buildTabOfficialRules(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExamPill(String examId, String label) {
    final isSelected = _selectedExam == examId;
    return InkWell(
      onTap: () => _onExamChanged(examId),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1A237E) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? const Color(0xFF1A237E) : const Color(0xFFCBD5E1),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF334155),
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String label) {
    final isSelected = _activeTab == index;
    return InkWell(
      onTap: () => setState(() => _activeTab = index),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1E293B) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  // GLOBAL CONTROLS CARD: Category, Round, Candidate Score, Search & Add
  Widget _buildGlobalControlsCard() {
    final catalog = _getCatalogForExam(_selectedExam);
    final searchMatches = _searchQuery.isEmpty
        ? <Map<String, dynamic>>[]
        : catalog.where((c) {
            final q = _searchQuery.toLowerCase();
            final name = (c['name'] as String).toLowerCase();
            final code = (c['code'] as String).toLowerCase();
            final city = (c['city'] as String).toLowerCase();
            return name.contains(q) || code.contains(q) || city.contains(q);
          }).toList();

    final categories = _getCategoriesForExam(_selectedExam);
    final rounds = _getRoundsForExam(_selectedExam);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(color: Color(0x06000000), blurRadius: 8, offset: Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Candidate Score Adjuster
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_selectedExam SCORE',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_studentScore.toStringAsFixed(2)} %ile',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                  ),
                ],
              ),
              Row(
                children: [
                  OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _studentScore = double.parse((_studentScore - 0.5).clamp(10.0, 99.99).toStringAsFixed(2));
                      });
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('-0.5', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _studentScore = double.parse((_studentScore + 0.5).clamp(10.0, 99.99).toStringAsFixed(2));
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A237E),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('+0.5', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),

          const Divider(height: 18),

          // Row 2: Category & Round Dropdowns
          Row(
            children: [
              // Category
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('RESERVATION QUOTA', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      key: ValueKey('cat-$_selectedExam-$_selectedCategory'),
                      initialValue: categories.contains(_selectedCategory) ? _selectedCategory : categories.first,
                      isDense: true,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                      items: categories.map((cat) {
                        return DropdownMenuItem(value: cat, child: Text(cat));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedCategory = val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),

              // Round
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('COUNSELING ROUND', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      key: ValueKey('rnd-$_selectedExam-$_selectedRound'),
                      initialValue: rounds.contains(_selectedRound) ? _selectedRound : rounds.first,
                      isDense: true,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                      items: rounds.map((rnd) {
                        return DropdownMenuItem(value: rnd, child: Text(rnd));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedRound = val);
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Search bar to add college
          TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Search $_selectedExam colleges & add to preference list...',
              hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
              prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 16),
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _searchQuery = '');
                      },
                    )
                  : null,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
            ),
            style: const TextStyle(fontSize: 12.5),
            onChanged: (val) => setState(() => _searchQuery = val.trim()),
          ),

          // Search results dropdown list
          if (searchMatches.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(top: 8),
              constraints: const BoxConstraints(maxHeight: 180),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFCBD5E1)),
                boxShadow: const [BoxShadow(color: Color(0x10000000), blurRadius: 6)],
              ),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: searchMatches.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, idx) {
                  final col = searchMatches[idx];
                  return ListTile(
                    dense: true,
                    title: Text(
                      col['name'] as String,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      'Code: ${col['code']} • ${col['city']} • ${(col['branches'] as List).length} Programs',
                      style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                    ),
                    trailing: ElevatedButton.icon(
                      onPressed: () => _addCollegeChoice(col),
                      icon: const Icon(Icons.add, size: 14),
                      label: const Text('Add', style: TextStyle(fontSize: 11)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A237E),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  // PORTFOLIO STRATEGY ALERT CARD
  Widget _buildStrategyCard(bool isHealthy, int safe, int target, int dream, int notOffered) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isHealthy ? const Color(0xFFF0FDF4) : const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isHealthy ? const Color(0xFFBBF7D0) : const Color(0xFFFECDD3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isHealthy ? Icons.verified : Icons.warning_amber,
                color: isHealthy ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isHealthy ? 'Strategy Health: Well-Balanced Portfolio' : 'Strategy Alert: Need Safe Backup Options',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12.5,
                    color: isHealthy ? const Color(0xFF166534) : const Color(0xFF991B1B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              _buildCounterPill('🟢 Safe: $safe', const Color(0xFFDCFCE7), const Color(0xFF15803D)),
              const SizedBox(width: 6),
              _buildCounterPill('🟡 Target: $target', const Color(0xFFFEF3C7), const Color(0xFFB45309)),
              const SizedBox(width: 6),
              _buildCounterPill('🔴 Dream: $dream', const Color(0xFFFEE2E2), const Color(0xFFB91C1C)),
              if (notOffered > 0) ...[
                const SizedBox(width: 6),
                _buildCounterPill('⚠️ Not Offered: $notOffered', const Color(0xFFF3F4F6), const Color(0xFF6B7280)),
              ],
            ],
          ),
          const SizedBox(height: 6),
          Text(
            isHealthy
                ? 'Your preference list contains healthy safe backup institutions along with high-aspiration choices.'
                : 'Include at least 2 safe colleges with cutoffs 1-2% lower than your score to avoid zero allotment in Round 1.',
            style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
          ),
        ],
      ),
    );
  }

  Widget _buildCounterPill(String label, Color bg, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColor),
      ),
    );
  }

  // PRESET BUTTONS FOR ACTIVE EXAM
  Widget _buildPresetTemplateButtons() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          const Text('⚡ Templates: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
          if (_selectedExam == 'JEE Advanced') ...[
            _buildQuickPresetPill('Top 5 IITs CS', () {
              setState(() {
                _tableChoices = [
                  {'code': 'IITB', 'branch': 'Computer Science & Engineering'},
                  {'code': 'IITD', 'branch': 'Computer Science & Engineering'},
                  {'code': 'IITM', 'branch': 'Computer Science & Engineering'},
                  {'code': 'IITK', 'branch': 'Computer Science & Engineering'},
                  {'code': 'IITKGP', 'branch': 'Computer Science & Engineering'},
                ];
              });
            }),
            const SizedBox(width: 6),
            _buildQuickPresetPill('IIT Circuital', () {
              setState(() {
                _tableChoices = [
                  {'code': 'IITB', 'branch': 'Electrical Engineering'},
                  {'code': 'IITD', 'branch': 'Electrical Engineering'},
                  {'code': 'IITM', 'branch': 'Electrical Engineering'},
                  {'code': 'IITB', 'branch': 'Mechanical Engineering'},
                ];
              });
            }),
          ] else if (_selectedExam == 'JEE Main') ...[
            _buildQuickPresetPill('Top NITs CS', () {
              setState(() {
                _tableChoices = [
                  {'code': 'NITT', 'branch': 'Computer Science & Engineering'},
                  {'code': 'NITK', 'branch': 'Computer Science & Engineering'},
                  {'code': 'NITW', 'branch': 'Computer Science & Engineering'},
                  {'code': 'IIITA', 'branch': 'Information Technology'},
                  {'code': 'VNIT', 'branch': 'Computer Science & Engineering'},
                ];
              });
            }),
            const SizedBox(width: 6),
            _buildQuickPresetPill('VNIT Maharashtra', () {
              setState(() {
                _tableChoices = [
                  {'code': 'VNIT', 'branch': 'Computer Science & Engineering'},
                  {'code': 'VNIT', 'branch': 'Electronics & Communication'},
                  {'code': 'VNIT', 'branch': 'Electrical & Electronics'},
                  {'code': 'VNIT', 'branch': 'Mechanical Engineering'},
                ];
              });
            }),
          ] else if (_selectedExam == 'NEET') ...[
            _buildQuickPresetPill('Premier AIQ MBBS', () {
              setState(() {
                _tableChoices = [
                  {'code': 'AIIMS-DELHI', 'branch': 'MBBS'},
                  {'code': 'KEM-MUMBAI', 'branch': 'MBBS'},
                  {'code': 'GMC-MUMBAI', 'branch': 'MBBS'},
                  {'code': 'AFMC-PUNE', 'branch': 'MBBS'},
                  {'code': 'BJMC-PUNE', 'branch': 'MBBS'},
                ];
              });
            }),
            const SizedBox(width: 6),
            _buildQuickPresetPill('Dental & Ayush', () {
              setState(() {
                _tableChoices = [
                  {'code': 'GMC-MUMBAI', 'branch': 'BDS (Dental Surgery)'},
                  {'code': 'BJMC-PUNE', 'branch': 'BDS (Dental Surgery)'},
                  {'code': 'GMC-NAGPUR', 'branch': 'BAMS (Ayurveda)'},
                ];
              });
            }),
          ] else ...[
            _buildQuickPresetPill('Pune Premier', () {
              setState(() {
                _tableChoices = [
                  {'code': '6006', 'branch': 'Computer Engineering'},
                  {'code': '6006', 'branch': 'Artificial Intelligence & Robotics'},
                  {'code': '6271', 'branch': 'Computer Engineering'},
                  {'code': '6271', 'branch': 'Information Technology'},
                  {'code': '6175', 'branch': 'Computer Engineering'},
                  {'code': '6273', 'branch': 'Computer Engineering'},
                ];
              });
            }),
            const SizedBox(width: 6),
            _buildQuickPresetPill('Mumbai Premier', () {
              setState(() {
                _tableChoices = [
                  {'code': '3012', 'branch': 'Computer Engineering'},
                  {'code': '3012', 'branch': 'Information Technology'},
                  {'code': '3215', 'branch': 'Computer Engineering'},
                  {'code': '3199', 'branch': 'Computer Engineering'},
                ];
              });
            }),
          ],
          const SizedBox(width: 6),
          _buildQuickPresetPill('Clear Table', () {
            setState(() => _tableChoices.clear());
          }, isDanger: true),
        ],
      ),
    );
  }

  Widget _buildQuickPresetPill(String label, VoidCallback onTap, {bool isDanger = false}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isDanger ? const Color(0xFFFEE2E2) : const Color(0xFFEEF2FF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDanger ? const Color(0xFFFCA5A5) : const Color(0xFFC7D2FE)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.bold,
            color: isDanger ? const Color(0xFFB91C1C) : const Color(0xFF3730A3),
          ),
        ),
      ),
    );
  }

  // TABLE VIEW: Responsive mobile card rows
  Widget _buildCapTableView(List<Map<String, dynamic>> calculatedRows) {
    if (calculatedRows.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            const Icon(Icons.school_outlined, size: 48, color: Color(0xFF94A3B8)),
            const SizedBox(height: 10),
            Text('No colleges added to your $_selectedExam list yet.', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 4),
            const Text('Search colleges above or click quick templates.', style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
          ],
        ),
      );
    }

    return Column(
      children: [
        ...calculatedRows.asMap().entries.map((entry) {
          final idx = entry.key;
          final r = entry.value;
          final isOffered = r['is_offered'] == true;
          final availableBranches = (r['available_branches'] as List).cast<String>();

          Color probColor = const Color(0xFF10B981);
          if (!isOffered) {
            probColor = const Color(0xFF94A3B8);
          } else if (r['tier'] == 'Target') {
            probColor = const Color(0xFFF59E0B);
          } else if (r['tier'] == 'Dream') {
            probColor = const Color(0xFFEF4444);
          }

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: isOffered ? Colors.white : const Color(0xFFFFF1F2),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isOffered ? const Color(0xFFE2E8F0) : const Color(0xFFFECDD3),
                width: isOffered ? 1 : 1.5,
              ),
              boxShadow: const [
                BoxShadow(color: Color(0x04000000), blurRadius: 4, offset: Offset(0, 1))
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Row Header: Pref # + College Name + Reorder buttons
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: idx == 0 ? const Color(0xFFFFB300) : const Color(0xFF1A237E),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${idx + 1}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: idx == 0 ? Colors.black : Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              r['name'] as String,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEEF2FF),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: const Color(0xFFC7D2FE)),
                                  ),
                                  child: Text(
                                    'Code: ${r['code']}',
                                    style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF3730A3)),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '📍 ${r['city']}',
                                  style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Actions: Up, Down, Delete
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.arrow_upward, size: 16),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: idx == 0 ? null : () => _moveUp(idx),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            icon: const Icon(Icons.arrow_downward, size: 16),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: idx == _tableChoices.length - 1 ? null : () => _moveDown(idx),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 16, color: Color(0xFFEF4444)),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () => _removeRow(idx),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Branch Dropdown Selector
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isOffered ? const Color(0xFFF8FAFC) : const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isOffered ? const Color(0xFFCBD5E1) : const Color(0xFFEF4444),
                      ),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: availableBranches.contains(r['branch']) ? r['branch'] as String : null,
                        isExpanded: true,
                        isDense: true,
                        hint: Text(
                          '⚠️ ${r['branch']} (Not Offered)',
                          style: const TextStyle(fontSize: 11.5, color: Color(0xFFDC2626), fontWeight: FontWeight.bold),
                        ),
                        items: availableBranches.map((b) {
                          return DropdownMenuItem<String>(
                            value: b,
                            child: Text(b, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                          );
                        }).toList(),
                        onChanged: (newVal) {
                          if (newVal != null) _changeRowBranch(idx, newVal);
                        },
                      ),
                    ),
                  ),

                  if (!isOffered) ...[
                    const SizedBox(height: 4),
                    const Text(
                      '⚠️ This institute does not offer this branch under centralized admissions.',
                      style: TextStyle(fontSize: 10, color: Color(0xFFDC2626), fontWeight: FontWeight.w600),
                    ),
                  ],

                  const SizedBox(height: 10),

                  // Cutoffs Grid
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildMetricColumn('2024 Cutoff', isOffered ? '${r['c24']}%' : '—'),
                        _buildMetricColumn('2025 Cutoff', isOffered ? '${r['c25']}%' : '—'),
                        _buildMetricColumn('2026 Cutoff', isOffered ? '${r['c26']}%' : '—', isHighlight: true),
                        _buildMetricColumn(
                          '2027 Proj.',
                          isOffered ? '${r['c27']}%' : '—',
                          subtitle: isOffered ? r['trend'] as String : null,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Admission Probability Bar
                  if (isOffered) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: probColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${r['prob']}% Allotment Chance (${r['tier']})',
                                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: probColor),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          'Score Margin: ${(r['margin'] as double) >= 0 ? '+${r['margin']}' : r['margin']}%',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: (r['prob'] as int) / 100.0,
                        backgroundColor: const Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation<Color>(probColor),
                        minHeight: 6,
                      ),
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.block, size: 14, color: Color(0xFF64748B)),
                          SizedBox(width: 6),
                          Text('Admission Probability: Not Applicable (Branch Not Offered)', style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildMetricColumn(String label, String value, {bool isHighlight = false, String? subtitle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.bold,
            color: isHighlight ? const Color(0xFF1A237E) : const Color(0xFF1E293B),
          ),
        ),
        if (subtitle != null)
          Text(subtitle, style: const TextStyle(fontSize: 8.5, color: Color(0xFF64748B))),
      ],
    );
  }

  // TAB 1: Round-by-Round Mock Allotment
  Widget _buildTabRoundAllotment() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Simulated $_selectedExam Centralized Allotment',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 12),

        // Round 1 Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF10B981)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('ROUND 1 PROVISIONAL ALLOTMENT', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(6)),
                    child: const Text('Provisionally Allotted', style: TextStyle(fontSize: 11, color: Color(0xFF15803D), fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                _selectedExam == 'JEE Advanced'
                    ? 'IIT Bombay — Electrical Engineering'
                    : _selectedExam == 'JEE Main'
                        ? 'NIT Trichy — Computer Science & Engineering'
                        : _selectedExam == 'NEET'
                            ? 'AIIMS New Delhi — MBBS'
                            : 'COEP Technological University — Computer Engineering',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 4),
              Text(
                'Your Score: ${_studentScore.toStringAsFixed(2)}%ile • Quota: $_selectedCategory • Round: $_selectedRound',
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const Divider(height: 20),
              const Text('Counseling Decision Options:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Seat Frozen! Admission accepted at provisionally allotted choice.')),
                        );
                      },
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFF1A237E))),
                      child: const Text('Freeze Seat', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1A237E))),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() => _round1Floated = true);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Float/Upgradation selected! Retaining current choice while trying for higher preferences in next round.'),
                            backgroundColor: Color(0xFF10B981),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white),
                      child: const Text('Float (Upgradation) →', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Round 2 Card
        if (_round1Floated)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF2563EB)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('ROUND 2 UPGRADATION RESULT', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                    Text('Upgraded! 🎉', style: TextStyle(fontSize: 11, color: Color(0xFF1E40AF), fontWeight: FontWeight.bold)),
                  ],
                ),
                SizedBox(height: 10),
                Text(
                  'Highest Preference Choice Confirmed',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                SizedBox(height: 4),
                Text('Cutoffs eased in Round 2. You received an upgraded allotment in your higher preference choice!', style: TextStyle(fontSize: 12, color: Color(0xFF1E293B))),
              ],
            ),
          ),
      ],
    );
  }

  // TAB 2: Official Rules & Timelines
  Widget _buildTabOfficialRules() {
    final milestones = [
      {'title': '$_selectedExam Option Form Filling & Registration', 'date': 'June – July 2026', 'status': 'Mandatory'},
      {'title': 'Round 1 Seat Allotment Display', 'date': 'July 2026', 'status': 'Upcoming'},
      {'title': 'Seat Acceptance, Fee Payment & Document Verification', 'date': 'July – Aug 2026', 'status': 'Scheduled'},
      {'title': 'Round 2 Upgradation & Choice Filling', 'date': 'August 2026', 'status': 'Upcoming'},
      {'title': 'Subsequent Rounds / Spot / Stray Vacancy Allotment', 'date': 'August – Sept 2026', 'status': 'Scheduled'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$_selectedExam Admission Schedule & Centralized Rules',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 12),
        ...milestones.map((m) {
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today, color: Color(0xFF1A237E), size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m['title']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                      Text(m['date']!, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    m['status']!,
                    style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
