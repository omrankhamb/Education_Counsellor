import 'package:flutter/material.dart';

class ScholarshipsPage extends StatefulWidget {
  final Map<String, dynamic> studentProfile;
  final VoidCallback? onBackToHome;

  const ScholarshipsPage({
    super.key,
    required this.studentProfile,
    this.onBackToHome,
  });

  @override
  State<ScholarshipsPage> createState() => _ScholarshipsPageState();
}

class _ScholarshipsPageState extends State<ScholarshipsPage> {
  String _searchQuery = '';
  String _selectedCategoryFilter = 'All'; // 'All', 'Government', 'Engineering', 'Girls', 'Minority', 'Corporate'

  // Calculator State
  String _calcCategory = 'EBC';
  double _calcIncome = 4.5; // Lakhs per annum
  String _calcGender = 'All';
  static const double _collegeFees = 120000;

  final Set<String> _expandedDocs = {};

  final List<Map<String, dynamic>> _allScholarships = [
    {
      'id': 'ebc_mahadbt',
      'scheme_name': 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)',
      'provider': 'Directorate of Technical Education (DTE), Maharashtra',
      'provider_type': 'State Government (MahaDBT)',
      'award_amount': '50% Tuition & Exam Fee Waiver',
      'category_tag': 'Government',
      'stream': 'Engineering / Technology / Medical',
      'income_limit': 'Family income ≤ ₹8.00 Lakh/year',
      'eligibility': 'Candidate admitted through CAP round in AICTE/DTE approved institutes with Maharashtra domicile.',
      'documents': [
        'Maharashtra Domicile Certificate',
        'Official Tahsildar Income Certificate (≤ ₹8 LPA)',
        'CAP Allotment Letter & Fee Receipt',
        'HSC (12th) & SSC (10th) Marksheets',
        'Bank Passbook (Aadhaar linked)',
      ],
      'portal_url': 'https://mahadbt.maharashtra.gov.in',
    },
    {
      'id': 'panjabrao_deshmukh',
      'scheme_name': 'Dr. Panjabrao Deshmukh Vastigruh Nirvah Bhatta Yojna (Hostel Allowance)',
      'provider': 'Higher & Technical Education Dept, Govt of Maharashtra',
      'provider_type': 'State Government (MahaDBT)',
      'award_amount': '₹30,000 / year (Hostel Allowance)',
      'category_tag': 'Government',
      'stream': 'All Professional Courses',
      'income_limit': 'Children of Alpabhudharak / registered marginal farmers or income ≤ ₹8 LPA',
      'eligibility': 'Children of marginal farmers or registered construction workers staying in approved hostels/rent.',
      'documents': [
        'Alpabhudharak Farmer Certificate / Land Record 7/12',
        'Hostel Stay Certificate or Rent Agreement',
        'Family Income Certificate (≤ ₹8 LPA)',
        'Maharashtra Domicile Certificate',
      ],
      'portal_url': 'https://mahadbt.maharashtra.gov.in',
    },
    {
      'id': 'tfws_cap',
      'scheme_name': 'Tuition Fee Waiver Scheme (TFWS)',
      'provider': 'AICTE & State CET Cell Maharashtra',
      'provider_type': 'Central / State CAP Quota',
      'award_amount': '100% Tuition Fee Waiver (4 Years)',
      'category_tag': 'Engineering',
      'stream': 'Engineering & Technology',
      'income_limit': 'Annual family income strictly < ₹8.00 Lakh/year',
      'eligibility': '5% supernumerary seats in all accredited government & private colleges. Selected based on CET merit.',
      'documents': [
        'Competent Authority Income Certificate (< ₹8 LPA)',
        'MHT-CET Score Card',
        'CAP Option Form with TFWS code chosen',
        'Domicile & Nationality Certificate',
      ],
      'portal_url': 'https://cetcell.mahacet.org',
    },
    {
      'id': 'sc_st_postmatric',
      'scheme_name': 'Government of India Post-Matric Scholarship for SC / ST Students',
      'provider': 'Social Justice & Special Assistance Department, Maharashtra',
      'provider_type': 'State & Central Government',
      'award_amount': '100% Tuition Fee + Maintenance Allowance',
      'category_tag': 'Government',
      'stream': 'Engineering / Medical / Professional',
      'income_limit': 'Income ≤ ₹2.50 Lakh/year (SC/ST)',
      'eligibility': 'SC/ST category student with verified caste and validity certificates admitted through CAP rounds.',
      'documents': [
        'Caste Certificate & Caste Validity Certificate',
        'Tahsildar Income Certificate (≤ ₹2.5 LPA)',
        'CAP Allotment Letter',
        'Aadhaar seeded bank account passbook',
      ],
      'portal_url': 'https://mahadbt.maharashtra.gov.in',
    },
    {
      'id': 'obc_vjnt_postmatric',
      'scheme_name': 'Post-Matric Scholarship for VJNT / OBC / SBC Students',
      'provider': 'VJNT, OBC & SBC Welfare Department, Maharashtra',
      'provider_type': 'State Government (MahaDBT)',
      'award_amount': '50% to 100% Tuition Fee Waiver',
      'category_tag': 'Government',
      'stream': 'All Accredited Professional Streams',
      'income_limit': 'Income ≤ ₹1.50 Lakh/yr for 100% waiver, ≤ ₹8 LPA for 50%',
      'eligibility': 'VJNT, OBC, and SBC category students admitted through CAP rounds in recognized colleges.',
      'documents': [
        'Caste Certificate & Caste Validity Certificate',
        'Non-Creamy Layer (NCL) Certificate valid for current year',
        'Income Certificate issued by Tahsildar',
        'CAP Allotment Letter',
      ],
      'portal_url': 'https://mahadbt.maharashtra.gov.in',
    },
    {
      'id': 'aicte_pragati',
      'scheme_name': 'AICTE Pragati Scholarship for Girl Students',
      'provider': 'All India Council for Technical Education (AICTE)',
      'provider_type': 'Central Government / AICTE',
      'award_amount': '₹50,000 / year (Every Year of Degree)',
      'category_tag': 'Girls',
      'stream': 'B.Tech / B.E. / Engineering',
      'income_limit': 'Family annual income ≤ ₹8.00 Lakh/year',
      'eligibility': 'Up to 2 girls per family admitted to 1st year of technical degree in AICTE approved college.',
      'documents': [
        '10th and 12th Marksheets',
        'AICTE College Admission Proof & Tuitions Paid Receipt',
        'Income Certificate by authorized revenue authority',
        'Family declaration affidavit (Max 2 girl children)',
      ],
      'portal_url': 'https://scholarships.gov.in',
    },
    {
      'id': 'reliance_foundation',
      'scheme_name': 'Reliance Foundation Undergraduate Scholarship',
      'provider': 'Reliance Foundation & Jio Philanthropy',
      'provider_type': 'Corporate / CSR',
      'award_amount': 'Up to ₹2,00,000 Total Grant',
      'category_tag': 'Corporate',
      'stream': 'Any Undergraduate Degree Course',
      'income_limit': 'Preference given to family income < ₹2.50 Lakh/year',
      'eligibility': 'First year UG students scoring ≥ 60% in 12th exams who clear the aptitude test.',
      'documents': [
        '12th Marksheet & School Leaving Certificate',
        'College Admission Proof / College ID Card',
        'Household Income Certificate / ITR / Ration Card',
      ],
      'portal_url': 'https://www.scholarships.reliancefoundation.org',
    },
    {
      'id': 'hdfc_badhte_kadam',
      'scheme_name': 'HDFC Bank Parivartan’s ECSS Programme (Badhte Kadam)',
      'provider': 'HDFC Bank Parivartan & Buddy4Study',
      'provider_type': 'Corporate / CSR',
      'award_amount': '₹75,000 / year (Direct Bank Transfer)',
      'category_tag': 'Corporate',
      'stream': 'Engineering / Professional Degrees',
      'income_limit': 'Annual family income ≤ ₹2.50 Lakh/year',
      'eligibility': 'Meritorious students facing economic hardship who passed 12th with ≥ 55% marks.',
      'documents': [
        'Passport size photograph & Aadhaar Card',
        'Previous year mark sheet',
        'Proof of family income (Salary slips / BPL ration card)',
        'College Fee receipt for current academic year',
      ],
      'portal_url': 'https://www.buddy4study.com',
    },
    {
      'id': 'kotak_kanya',
      'scheme_name': 'Kotak Kanya Scholarship for Meritorious Girls',
      'provider': 'Kotak Education Foundation',
      'provider_type': 'Corporate / Foundation',
      'award_amount': '₹1,50,000 / year (Renewable for 4 Years)',
      'category_tag': 'Girls',
      'stream': 'Engineering, MBBS, Architecture, Law',
      'income_limit': 'Annual family income ≤ ₹6.00 Lakh/year',
      'eligibility': 'Meritorious girl students with ≥ 85% in 12th board exams admitted to premier institutes.',
      'documents': [
        '10th and 12th Board Marksheets (≥85%)',
        'College Allotment Letter & Fee Receipt',
        'Income Tax Return (ITR) or Tahsildar Income Certificate',
        'Aadhaar Card and Student Bank Account details',
      ],
      'portal_url': 'https://kotak.buddy4study.com',
    },
    {
      'id': 'minority_mcm',
      'scheme_name': 'Merit-cum-Means Scholarship for Professional Courses (Minority)',
      'provider': 'Ministry of Minority Affairs, Govt of India',
      'provider_type': 'Central Government (NSP)',
      'award_amount': '₹20,000 / year + Full Course Fee Reimbursement',
      'category_tag': 'Minority',
      'stream': 'Technical and Professional Degrees',
      'income_limit': 'Annual family income ≤ ₹2.50 Lakh/year',
      'eligibility': 'Students from Muslim, Christian, Sikh, Buddhist, Jain, Parsi communities with ≥ 50% in 12th.',
      'documents': [
        'Minority Community Self-Declaration Certificate',
        'Income Certificate by Competent State Authority',
        'Fee receipt & Bonafide certificate from college',
      ],
      'portal_url': 'https://scholarships.gov.in',
    },
  ];

  Map<String, dynamic> _calculateSavings() {
    double waiverPct = 0;
    String scheme = 'General Category (Full Fee)';
    String details = 'No government tuition fee waiver detected for this bracket.';

    if (_calcCategory == 'SC' || _calcCategory == 'ST') {
      waiverPct = 1.0;
      scheme = '100% Fee Waiver (Govt of India Post-Matric SC/ST)';
      details = 'Under the Post-Matric SC/ST scheme, 100% of the tuition & examination fees are borne by the state and central government.';
    } else if (_calcCategory == 'TFWS') {
      waiverPct = 1.0;
      scheme = '100% Tuition Fee Waiver Scheme (TFWS Seat)';
      details = 'Allotted under 5% TFWS quota in CAP rounds. Only development & library fees are payable.';
    } else if (_calcCategory == 'EBC') {
      if (_calcIncome <= 8.0) {
        waiverPct = 0.50;
        scheme = '50% Tuition Fee Waiver (RCSM EBC Scheme)';
        details = 'Under Rajarshi Chhatrapati Shahu Maharaj scheme, students with family income ≤ ₹8 LPA receive a 50% direct discount on tuition fees.';
      }
    } else if (_calcCategory == 'OBC' || _calcCategory == 'SEBC') {
      if (_calcIncome <= 8.0) {
        waiverPct = 0.50;
        scheme = '50% Tuition Fee Waiver (MahaDBT OBC/SEBC Scheme)';
        details = 'Students with valid NCL (Non-Creamy Layer) and income ≤ ₹8 LPA receive a 50% fee concession in CAP admissions.';
      }
    } else if (_calcCategory == 'VJNT' || _calcCategory == 'SBC') {
      if (_calcIncome <= 1.5) {
        waiverPct = 1.0;
        scheme = '100% Tuition Fee Waiver (VJNT/SBC Post-Matric Scheme)';
        details = 'VJNT/SBC students with annual family income under ₹1.5 LPA qualify for 100% tuition concession.';
      } else if (_calcIncome <= 8.0) {
        waiverPct = 0.50;
        scheme = '50% Tuition Fee Waiver (VJNT/SBC Scheme)';
        details = '50% tuition waiver applicable with family income between ₹1.5 LPA and ₹8 LPA.';
      }
    }

    if (_calcGender == 'Female' && _calcIncome <= 8.0 && waiverPct < 1.0) {
      details += ' Additional Girl Student benefit: eligible for AICTE Pragati (₹50,000/yr) & Maharashtra Girls 100% Higher Education Free Tuitions policy!';
    }

    final double savings = _collegeFees * waiverPct;
    final double netFee = _collegeFees - savings;

    return {
      'waiverPct': (waiverPct * 100).toInt(),
      'savings': savings,
      'netFee': netFee,
      'scheme': scheme,
      'details': details,
    };
  }

  void _toggleDocs(String id) {
    setState(() {
      if (_expandedDocs.contains(id)) {
        _expandedDocs.remove(id);
      } else {
        _expandedDocs.add(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final calcResult = _calculateSavings();
    final filteredList = _allScholarships.where((s) {
      final matchesSearch = s['scheme_name'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s['provider'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s['stream'].toLowerCase().contains(_searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (_selectedCategoryFilter != 'All') {
        if (s['category_tag'] != _selectedCategoryFilter) return false;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(62),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
            ),
            boxShadow: [
              BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
            ],
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  if (widget.onBackToHome != null)
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: widget.onBackToHome,
                    ),
                  const Icon(Icons.monetization_on, color: Color(0xFFFFB300), size: 28),
                  const SizedBox(width: 8),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Scholarships & MahaDBT Portal',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '24+ Verified Government & Corporate Financial Schemes',
                        style: TextStyle(fontSize: 11, color: Colors.white70),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1200),
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            children: [
              // 1. STAT CARDS STRIP
              LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth > 700;
                  return Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _buildStatCard('24+ Schemes', 'Verified MahaDBT & Buddy4Study', Icons.school, const Color(0xFF1A237E), isWide),
                      _buildStatCard('₹50K - 100%', 'Annual Tuition Waivers', Icons.savings, const Color(0xFF10B981), isWide),
                      _buildStatCard('100% Official', 'Direct Govt Portal Links', Icons.verified, const Color(0xFFF59E0B), isWide),
                    ],
                  );
                },
              ),

              const SizedBox(height: 16),

              // 2. INTERACTIVE MAHADBT & TUITION FEE WAIVER CALCULATOR
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(10),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.calculate, color: Color(0xFF1A237E), size: 24),
                        SizedBox(width: 8),
                        Text(
                          'MahaDBT & Fee Concession Calculator',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1A237E),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Select your category and annual household income to calculate your estimated government tuition fee concession.',
                      style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 16),

                    // Inputs Row: Category | Income
                    Wrap(
                      spacing: 16,
                      runSpacing: 12,
                      children: [
                        // Category Selector
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Reservation / Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              children: ['EBC', 'OBC', 'SC', 'ST', 'VJNT', 'SEBC', 'TFWS', 'Open'].map((cat) {
                                final isSel = _calcCategory == cat;
                                return ChoiceChip(
                                  label: Text(cat, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : const Color(0xFF1E293B))),
                                  selected: isSel,
                                  selectedColor: const Color(0xFF1A237E),
                                  backgroundColor: const Color(0xFFF1F5F9),
                                  onSelected: (_) => setState(() => _calcCategory = cat),
                                );
                              }).toList(),
                            ),
                          ],
                        ),

                        // Annual Income Slider
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 360),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Family Annual Income: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  Text(
                                    '₹${_calcIncome.toStringAsFixed(1)} Lakh/yr',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                                  ),
                                ],
                              ),
                              Slider(
                                value: _calcIncome,
                                min: 0.5,
                                max: 12.0,
                                divisions: 23,
                                activeColor: const Color(0xFF1A237E),
                                onChanged: (val) => setState(() => _calcIncome = val),
                              ),
                              Row(
                                children: [
                                  const Text('Gender: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 8),
                                  Wrap(
                                    spacing: 6,
                                    children: ['All', 'Female', 'Male'].map((g) {
                                      final isSel = _calcGender == g;
                                      return ChoiceChip(
                                        label: Text(g, style: TextStyle(fontSize: 10.5, color: isSel ? Colors.white : const Color(0xFF1E293B))),
                                        selected: isSel,
                                        selectedColor: const Color(0xFF1A237E),
                                        backgroundColor: const Color(0xFFF1F5F9),
                                        onSelected: (_) => setState(() => _calcGender = g),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Result Display Box
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: calcResult['waiverPct'] > 0 ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: calcResult['waiverPct'] > 0 ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  calcResult['scheme'],
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: calcResult['waiverPct'] > 0 ? const Color(0xFF166534) : const Color(0xFF92400E),
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: calcResult['waiverPct'] > 0 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  '${calcResult['waiverPct']}% Waiver',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            calcResult['details'],
                            style: const TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.4),
                          ),
                          const Divider(height: 18),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Estimated Tuition Savings: ₹${calcResult['savings'].toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}/yr',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF15803D), fontSize: 13),
                              ),
                              Text(
                                'Net Payable: ₹${calcResult['netFee'].toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B), fontSize: 13),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // 3. SEARCH & DOMAIN FILTERS
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    TextField(
                      onChanged: (val) => setState(() => _searchQuery = val),
                      decoration: InputDecoration(
                        hintText: 'Search scholarships by name, provider, or scheme...',
                        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search, color: Color(0xFF1A237E)),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['All', 'Government', 'Engineering', 'Girls', 'Minority', 'Corporate'].map((tag) {
                          final isSel = _selectedCategoryFilter == tag;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ChoiceChip(
                              label: Text(tag, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isSel ? Colors.white : const Color(0xFF1A237E))),
                              selected: isSel,
                              selectedColor: const Color(0xFF1A237E),
                              backgroundColor: Colors.white,
                              side: BorderSide(color: isSel ? const Color(0xFF1A237E) : const Color(0xFFCBD5E1)),
                              onSelected: (_) => setState(() => _selectedCategoryFilter = tag),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 4. SCHOLARSHIP SCHEMES LIST
              ...filteredList.map((sch) {
                final String id = sch['id'];
                final bool isExpanded = _expandedDocs.contains(id);
                final List<String> docs = List<String>.from(sch['documents'] ?? []);

                return Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(8),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: const BoxDecoration(
                        border: Border(
                          left: BorderSide(color: Color(0xFF10B981), width: 4.5),
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Row 1: Source badge + Award amount badge
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEEF2FF),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        sch['provider_type'],
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF1A237E),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        sch['category_tag'],
                                        style: const TextStyle(fontSize: 10.5, color: Color(0xFF475569)),
                                      ),
                                    ),
                                  ],
                                ),

                                // Award Value Pill (Gold web style)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFF8E1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFFDE68A)),
                                  ),
                                  child: Text(
                                    sch['award_amount'],
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFFB45309),
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 10),

                            // Title
                            Text(
                              sch['scheme_name'],
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'By ${sch['provider']}',
                              style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                            ),

                            const SizedBox(height: 8),

                            // Eligibility description
                            Text(
                              sch['eligibility'],
                              style: const TextStyle(fontSize: 12.5, color: Color(0xFF334155), height: 1.4),
                            ),
                            const SizedBox(height: 6),

                            // Income criteria chip
                            Row(
                              children: [
                                const Icon(Icons.info_outline, size: 13, color: Color(0xFFF59E0B)),
                                const SizedBox(width: 4),
                                Text(
                                  sch['income_limit'],
                                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFFB45309)),
                                ),
                              ],
                            ),

                            const SizedBox(height: 10),

                            // Documents Accordion
                            if (docs.isNotEmpty)
                              InkWell(
                                onTap: () => _toggleDocs(id),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 6),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.description_outlined, size: 14, color: Color(0xFF1A237E)),
                                      const SizedBox(width: 4),
                                      Text(
                                        isExpanded ? 'Hide Documents' : 'Required Documents (${docs.length})',
                                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                                      ),
                                      Icon(isExpanded ? Icons.expand_less : Icons.expand_more, size: 16, color: const Color(0xFF1A237E)),
                                    ],
                                  ),
                                ),
                              ),

                            if (isExpanded)
                              Container(
                                margin: const EdgeInsets.only(top: 6, bottom: 8),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: docs
                                      .map((d) => Padding(
                                            padding: const EdgeInsets.symmetric(vertical: 2),
                                            child: Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Text('• ', style: TextStyle(color: Color(0xFF1A237E), fontWeight: FontWeight.bold)),
                                                Expanded(
                                                  child: Text(d, style: const TextStyle(fontSize: 11.5, color: Color(0xFF475569))),
                                                ),
                                              ],
                                            ),
                                          ))
                                      .toList(),
                                ),
                              ),

                            const SizedBox(height: 6),

                            // Apply Button
                            Align(
                              alignment: Alignment.centerRight,
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Opening portal: ${sch['portal_url']}')),
                                  );
                                },
                                icon: const Icon(Icons.open_in_new, size: 13),
                                label: const Text('Apply on Official Portal', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF1A237E),
                                  side: const BorderSide(color: Color(0xFF1A237E)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String subtitle, IconData icon, Color color, bool isWide) {
    return Container(
      width: isWide ? 220 : double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: color,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
