class BranchCutoff {
  final String branch;
  final double cutoffGeneral;
  final double? cutoffObc;
  final double? cutoffSc;
  final double? cutoffTfws;
  final String? eligibilityStatus;

  BranchCutoff({
    required this.branch,
    required this.cutoffGeneral,
    this.cutoffObc,
    this.cutoffSc,
    this.cutoffTfws,
    this.eligibilityStatus,
  });

  factory BranchCutoff.fromJson(Map<String, dynamic> json) {
    return BranchCutoff(
      branch: json['branch']?.toString() ?? 'General Program',
      cutoffGeneral: (json['cutoff_general'] as num?)?.toDouble() ??
          (json['cutoff_marks'] as num?)?.toDouble() ??
          85.0,
      cutoffObc: (json['cutoff_obc'] as num?)?.toDouble(),
      cutoffSc: (json['cutoff_sc'] as num?)?.toDouble(),
      cutoffTfws: (json['cutoff_tfws'] as num?)?.toDouble(),
      eligibilityStatus: json['eligibility_status']?.toString(),
    );
  }
}

class College {
  final String collegeName;
  final String? collegeCode;
  final String location;
  final String stream;
  final String collegeType;
  final double cutoffMarks;
  final double studentMarks;
  final String scoreUnit;
  final String examType;
  final double rating;
  final String placementAvg;
  final String highestPackage;
  final double annualFees;
  final String? imageUrl;
  final String? branchSummary;
  final String eligibilityStatus; // "eligible", "borderline", "not_eligible"
  final Map<String, dynamic>? fiveYearTrend;
  final List<BranchCutoff> branches;
  final List<String> highlights;

  College({
    required this.collegeName,
    this.collegeCode,
    required this.location,
    required this.stream,
    required this.collegeType,
    required this.cutoffMarks,
    required this.studentMarks,
    required this.scoreUnit,
    required this.examType,
    required this.rating,
    required this.placementAvg,
    required this.highestPackage,
    required this.annualFees,
    this.imageUrl,
    this.branchSummary,
    required this.eligibilityStatus,
    this.fiveYearTrend,
    this.branches = const [],
    this.highlights = const [],
  });

  bool get isGovernment =>
      RegExp(r'govt|government|national|state|aided|unitary', caseSensitive: false)
          .hasMatch(collegeType) ||
      RegExp(r'coep|vjti|vnit|iit|nit|iiit|gce|gcoe|afmc|kem|gmc|aiims',
              caseSensitive: false)
          .hasMatch(collegeName);

  bool get isAutonomous =>
      RegExp(r'autonomous', caseSensitive: false).hasMatch(collegeType) ||
      RegExp(r'autonomous', caseSensitive: false).hasMatch(collegeName);

  factory College.fromJson(Map<String, dynamic> json, {double defaultMarks = 97.4}) {
    final elig = json['eligibility'] as Map<String, dynamic>?;
    final status = elig?['status']?.toString() ??
        json['eligibility_status']?.toString() ??
        'eligible';

    List<BranchCutoff> branchList = [];
    if (json['branch_cutoffs'] is List) {
      branchList = (json['branch_cutoffs'] as List)
          .map((b) => BranchCutoff.fromJson(b as Map<String, dynamic>))
          .toList();
    } else if (json['branches'] is List) {
      branchList = (json['branches'] as List).map((b) {
        if (b is Map<String, dynamic>) return BranchCutoff.fromJson(b);
        return BranchCutoff(
          branch: b.toString(),
          cutoffGeneral: (json['cutoff_marks'] as num?)?.toDouble() ?? 85.0,
        );
      }).toList();
    }

    List<String> highList = [];
    if (json['highlights'] is List) {
      highList = (json['highlights'] as List).map((h) => h.toString()).toList();
    } else {
      highList = [
        'NBA & NAAC Accredited A++',
        '100% Placement Support',
        'Modern R&D Labs & Incubators',
      ];
    }

    return College(
      collegeName: json['college_name']?.toString() ??
          json['name']?.toString() ??
          'Engineering College',
      collegeCode: json['college_code']?.toString() ?? json['code']?.toString(),
      location: json['location']?.toString() ?? 'Maharashtra, India',
      stream: json['stream']?.toString() ?? 'Engineering',
      collegeType: json['college_type']?.toString() ?? json['type']?.toString() ?? 'Autonomous',
      cutoffMarks: (json['cutoff_marks'] as num?)?.toDouble() ?? 88.0,
      studentMarks: (json['student_marks'] as num?)?.toDouble() ?? defaultMarks,
      scoreUnit: json['score_unit']?.toString() ?? 'percentile',
      examType: json['exam_type']?.toString() ?? 'MHT-CET',
      rating: (json['rating'] as num?)?.toDouble() ?? 4.6,
      placementAvg: json['placement_avg']?.toString() ??
          (json['placements'] is Map ? json['placements']['average_package']?.toString() : null) ??
          '₹8.5 - 12.0 LPA',
      highestPackage: json['placement_highest']?.toString() ??
          (json['placements'] is Map ? json['placements']['highest_package']?.toString() : null) ??
          '₹44.0 LPA',
      annualFees: (json['annual_fees'] as num?)?.toDouble() ??
          (json['fees'] as num?)?.toDouble() ??
          140000.0,
      imageUrl: json['image_url']?.toString() ??
          'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
      branchSummary: json['branch_summary']?.toString() ??
          json['branch']?.toString() ??
          'Computer Science, IT, AI & Data Science',
      eligibilityStatus: status,
      fiveYearTrend: json['five_year_trend'] as Map<String, dynamic>?,
      branches: branchList,
      highlights: highList,
    );
  }
}
