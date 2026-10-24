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
  final String? nirfRank;
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
    this.nirfRank,
    this.branches = const [],
    this.highlights = const [],
  });

  String get tier {
    if (eligibilityStatus == 'eligible') return 'Safe';
    if (eligibilityStatus == 'borderline') return 'Target';
    return 'Dream';
  }

  bool get isGovernment =>
      RegExp(r'govt|government|national|state|aided|unitary', caseSensitive: false)
          .hasMatch(collegeType) ||
      RegExp(r'coep|vjti|vnit|iit|nit|iiit|gce|gcoe|afmc|kem|gmc|aiims',
              caseSensitive: false)
          .hasMatch(collegeName);

  bool get isAutonomous =>
      RegExp(r'autonomous', caseSensitive: false).hasMatch(collegeType) ||
      RegExp(r'autonomous', caseSensitive: false).hasMatch(collegeName);

  /// Exactly matches the React Web formatAnnualFees(annual_fees)
  String get formattedFees {
    if (annualFees <= 0) return '₹1.2 Lakh/yr';
    if (annualFees < 100000) {
      return '₹${annualFees.toInt()}/yr';
    }
    final inLakh = annualFees / 100000.0;
    if (inLakh % 1 == 0) {
      return '₹${inLakh.toInt()} Lakh/yr';
    }
    final str = inLakh.toStringAsFixed(2).replaceAll(RegExp(r'\.?0+$'), '');
    return '₹$str Lakh/yr';
  }

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

    List<String> hl = [];
    if (json['facilities'] is List) {
      hl = List<String>.from(json['facilities']);
    } else if (json['highlights'] is List) {
      hl = List<String>.from(json['highlights']);
    }

    final loc = json['location'];
    String locStr = 'Maharashtra';
    if (loc is Map) {
      locStr = "${loc['city'] ?? ''}, ${loc['state'] ?? ''}".trim();
      if (locStr == ',') locStr = 'Maharashtra';
    } else if (loc != null) {
      locStr = loc.toString();
    }

    final double fees = (json['annual_fees_inr'] as num?)?.toDouble() ??
        (json['annual_fees'] as num?)?.toDouble() ??
        110000.0;

    return College(
      collegeName: json['college_name']?.toString() ?? 'Premier Institute',
      collegeCode: json['college_code']?.toString(),
      location: locStr,
      stream: json['stream']?.toString() ?? 'Engineering',
      collegeType: json['college_type']?.toString() ?? 'Autonomous / Govt Aided',
      cutoffMarks: (json['cutoff_marks'] as num?)?.toDouble() ?? 88.0,
      studentMarks: (json['student_marks'] as num?)?.toDouble() ?? defaultMarks,
      scoreUnit: json['score_unit']?.toString() ?? 'percentile',
      examType: json['exam_type']?.toString() ?? 'MHT-CET',
      rating: (json['rating'] as num?)?.toDouble() ?? 4.5,
      placementAvg: json['placement_avg']?.toString() ??
          json['placement_package']?.toString() ??
          '₹8.5 LPA',
      highestPackage: json['highest_package']?.toString() ??
          json['placement_high']?.toString() ??
          '₹32.0 LPA',
      annualFees: fees,
      imageUrl: json['image_url']?.toString(),
      branchSummary: json['branch_name']?.toString() ?? json['branch']?.toString(),
      eligibilityStatus: status,
      fiveYearTrend: json['five_year_trend'] as Map<String, dynamic>?,
      nirfRank: json['nirf_rank']?.toString() ?? json['nirf']?.toString() ?? 'Tier-1',
      branches: branchList,
      highlights: hl,
    );
  }
}
