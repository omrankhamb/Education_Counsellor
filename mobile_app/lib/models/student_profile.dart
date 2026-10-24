class StudentProfile {
  final String name;
  final String examType;
  final double marks;
  final String scoreUnit;
  final String category;
  final String stream;
  final String homeDistrict;
  final String preferredState;
  final double annualIncome;

  StudentProfile({
    this.name = 'Soham Patil',
    this.examType = 'MHT-CET',
    this.marks = 97.4,
    this.scoreUnit = 'percentile',
    this.category = 'OBC',
    this.stream = 'Engineering',
    this.homeDistrict = 'Pune',
    this.preferredState = 'Maharashtra',
    this.annualIncome = 350000,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    return StudentProfile(
      name: json['name']?.toString() ?? 'Soham Patil',
      examType: json['exam_type']?.toString() ?? 'MHT-CET',
      marks: (json['marks'] as num?)?.toDouble() ?? 97.4,
      scoreUnit: json['score_unit']?.toString() ?? 'percentile',
      category: json['category']?.toString() ?? 'OBC',
      stream: json['stream']?.toString() ?? 'Engineering',
      homeDistrict: json['home_district']?.toString() ?? 'Pune',
      preferredState: json['preferred_state']?.toString() ?? 'Maharashtra',
      annualIncome: (json['annual_income'] as num?)?.toDouble() ?? 350000,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'exam_type': examType,
      'marks': marks,
      'score_unit': scoreUnit,
      'category': category,
      'stream': stream,
      'home_district': homeDistrict,
      'preferred_state': preferredState,
      'annual_income': annualIncome,
    };
  }

  StudentProfile copyWith({
    String? name,
    String? examType,
    double? marks,
    String? scoreUnit,
    String? category,
    String? stream,
    String? homeDistrict,
    String? preferredState,
    double? annualIncome,
  }) {
    return StudentProfile(
      name: name ?? this.name,
      examType: examType ?? this.examType,
      marks: marks ?? this.marks,
      scoreUnit: scoreUnit ?? this.scoreUnit,
      category: category ?? this.category,
      stream: stream ?? this.stream,
      homeDistrict: homeDistrict ?? this.homeDistrict,
      preferredState: preferredState ?? this.preferredState,
      annualIncome: annualIncome ?? this.annualIncome,
    );
  }
}
