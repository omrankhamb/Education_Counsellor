import 'package:flutter/material.dart';
import '../models/student_profile.dart';
import '../theme/app_theme.dart';

class ScholarshipsScreen extends StatefulWidget {
  final StudentProfile studentProfile;

  const ScholarshipsScreen({
    super.key,
    required this.studentProfile,
  });

  @override
  State<ScholarshipsScreen> createState() => _ScholarshipsScreenState();
}

class _ScholarshipsScreenState extends State<ScholarshipsScreen> {
  final TextEditingController _feesController = TextEditingController(text: "135000");
  final TextEditingController _incomeController = TextEditingController(text: "350000");
  late String _selectedCategory;
  final Set<String> _expandedDocs = {};

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.studentProfile.category;
  }

  void _calculate() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final fees = double.tryParse(_feesController.text) ?? 135000;
    final income = double.tryParse(_incomeController.text) ?? 350000;

    // Concession Calculation
    double waiverPct = 0.50; // 50% for OBC under 8L EBC
    String schemeName = "RCSM Shikshan Shulkh Shishyavrutti Yojna (EBC)";

    if (_selectedCategory == 'SC' || _selectedCategory == 'ST') {
      waiverPct = 1.0;
      schemeName = "Government of India Post-Matric Scholarship (SC/ST 100% Waiver)";
    } else if (_selectedCategory == 'TFWS') {
      waiverPct = 1.0;
      schemeName = "AICTE Tuition Fee Waiver Scheme (TFWS 100% Free Tuition)";
    } else if (_selectedCategory == 'EWS') {
      waiverPct = 0.50;
      schemeName = "Dr. Panjabrao Deshmukh EBC Concession & Hostel Allowance";
    }

    final double tuitionWaiver = fees * 0.85 * waiverPct;
    final double netPayable = fees - tuitionWaiver;

    final schemes = [
      {
        'id': 'ebc',
        'title': 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti (EBC)',
        'source': 'MahaDBT',
        'award': '50% Tuition Fee Waiver',
        'income_limit': '₹8,00,000 / year',
        'authority': 'DTE Maharashtra',
        'is_eligible': income <= 800000,
        'criteria': ['Income ≤ ₹8 Lakhs', 'CAP Admitted', '12th Pass'],
        'documents': [
          'Tahsildar Income Certificate (FY 2025-26)',
          'CAP Provisional Allotment Letter',
          'Ration Card / Family Declaration',
          'Aadhaar-seeded Bank Passbook',
        ],
      },
      {
        'id': 'tfws',
        'title': 'AICTE Tuition Fee Waiver Scheme (TFWS)',
        'source': 'AICTE / MahaCET',
        'award': '100% Tuition Fee Waiver (4 Years)',
        'income_limit': '₹8,00,000 / year',
        'authority': 'MahaCET Cell',
        'is_eligible': income <= 800000,
        'criteria': ['Merit Top 5%', 'Income ≤ ₹8 Lakhs', 'All Categories'],
        'documents': [
          'MHT-CET Score Card',
          'Tahsildar Income Certificate',
          'Maharashtra Domicile Certificate',
        ],
      },
      {
        'id': 'sc_st_freeship',
        'title': 'Post-Matric Scholarship & Freeship for SC/ST Candidates',
        'source': 'Govt of Maharashtra',
        'award': '100% Tuition & Exam Fee Waiver',
        'income_limit': '₹2,50,000 (Scholarship) / No Limit (Freeship)',
        'authority': 'Social Justice Dept',
        'is_eligible': _selectedCategory == 'SC' || _selectedCategory == 'ST',
        'criteria': ['SC / ST Category', 'Caste Validity Verified'],
        'documents': [
          'Original Caste Certificate',
          'Caste Validity Certificate (CVC)',
          'Income Certificate / Form 16',
          'Allotment Letter',
        ],
      },
      {
        'id': 'panjabrao',
        'title': 'Dr. Panjabrao Deshmukh Hostel Maintenance Allowance',
        'source': 'MahaDBT',
        'award': '₹30,000 / year (Hostel Aid)',
        'income_limit': '₹8,00,000 / year',
        'authority': 'DTE Maharashtra',
        'is_eligible': income <= 800000,
        'criteria': ['Child of Marginal Farmer / Registered Worker', 'Hostel Resident'],
        'documents': [
          '7/12 Land Extract or Registered Labour Card',
          'Hostel Admission Receipt / Rent Agreement',
          'Tahsildar Income Certificate',
        ],
      },
      {
        'id': 'pragati',
        'title': 'AICTE Pragati Scholarship for Female Students',
        'source': 'AICTE National',
        'award': '₹50,000 / annum',
        'income_limit': '₹8,00,000 / year',
        'authority': 'National Scholarship Portal',
        'is_eligible': income <= 800000,
        'criteria': ['Female Candidates Only', 'First Year Technical Degree', 'Max 2 Girls per Family'],
        'documents': [
          'Family Income Certificate',
          'HSC / 12th Board Marksheet',
          'Bonafide Certificate from Institute',
        ],
      },
      {
        'id': 'central_sector',
        'title': 'Central Sector Scheme for College and University Students',
        'source': 'Govt of India (MHRD)',
        'award': '₹12,000 to ₹20,000 / year',
        'income_limit': '₹4,50,000 / year',
        'authority': 'Ministry of Education',
        'is_eligible': income <= 450000 && widget.studentProfile.marks >= 80,
        'criteria': ['Top 20th Percentile in 12th Board', 'Income ≤ ₹4.5 Lakhs'],
        'documents': [
          'Class 12th Board Marksheet',
          'Income Certificate',
          'Bank Account Linked to Aadhaar',
        ],
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('MahaDBT & Welfare Scholarships'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info Header Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: const Row(
                children: [
                  Icon(Icons.stars, color: Color(0xFFD97706), size: 24),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      "Directory of 24 Maharashtra State & Central Welfare Schemes including EBC, TFWS, SC/ST Freeship, and Hostels.",
                      style: TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 1. INTERACTIVE FEE CONCESSION CALCULATOR
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "MahaDBT Fee Waiver Calculator",
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                    const SizedBox(height: 14),

                    // Annual Tuition Fees
                    TextField(
                      controller: _feesController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: "Total Annual Fees (₹)",
                        prefixIcon: Icon(Icons.currency_rupee, size: 18),
                      ),
                      onChanged: (_) => _calculate(),
                    ),
                    const SizedBox(height: 12),

                    // Category Selector
                    DropdownButtonFormField<String>(
                      initialValue: _selectedCategory,
                      decoration: const InputDecoration(
                        labelText: "Social Category / Quota",
                        prefixIcon: Icon(Icons.category, size: 18),
                      ),
                      items: ['OPEN', 'OBC', 'EWS', 'TFWS', 'SC', 'ST', 'VJNT', 'SBC'].map((c) {
                        return DropdownMenuItem(value: c, child: Text(c));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() => _selectedCategory = val);
                          _calculate();
                        }
                      },
                    ),
                    const SizedBox(height: 12),

                    // Annual Family Income
                    TextField(
                      controller: _incomeController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: "Annual Family Income (₹)",
                        prefixIcon: Icon(Icons.account_balance_wallet, size: 18),
                        helperText: "Mandatory Tahsildar Certificate ceiling: ₹8.00 Lakhs",
                      ),
                      onChanged: (_) => _calculate(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // RESULTS CARD
            Card(
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.safeGreen, width: 2),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check_circle, color: AppTheme.safeGreen, size: 22),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            schemeName,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.safeGreen),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // Total College Fee
                    _feeRow("Total College Fee", "₹${fees.toInt().toString()}"),
                    const SizedBox(height: 8),

                    // Government Scholarship Concession
                    _feeRow(
                      "Govt Tuition Waiver (${(waiverPct * 100).toInt()}%)",
                      "- ₹${tuitionWaiver.toInt().toString()}",
                      valueColor: AppTheme.safeGreen,
                      isBold: true,
                    ),
                    const Divider(height: 20),

                    // Student Net Payable Amount
                    _feeRow(
                      "Student Net Payable",
                      "₹${netPayable.toInt().toString()}/yr",
                      valueColor: AppTheme.primary,
                      fontSize: 16,
                      isBold: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 2. ELIGIBLE SCHEMES DIRECTORY (Cards with Expandable Documents)
            const Text(
              "Verified Government & Trust Scholarships",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
            ),
            const SizedBox(height: 10),

            ...schemes.map((sch) {
              final id = sch['id'] as String;
              final bool isEligible = sch['is_eligible'] == true;
              final isDocsOpen = _expandedDocs.contains(id);
              final criteria = sch['criteria'] as List<String>;
              final docs = sch['documents'] as List<String>;

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: BorderSide(
                    color: isEligible ? AppTheme.safeGreen : AppTheme.borderLight,
                    width: isEligible ? 2 : 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Row: Source badge + Award
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withAlpha(20),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              sch['source'] as String,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isEligible ? AppTheme.safeGreenBg : const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              sch['award'] as String,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: isEligible ? AppTheme.safeGreen : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Title
                      Text(
                        sch['title'] as String,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5, color: AppTheme.primaryDark),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Authority: ${sch['authority']}",
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 8),

                      // Criteria Pills
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: criteria.map((c) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: Text("✓ $c", style: const TextStyle(fontSize: 10.5, color: Colors.black87)),
                          );
                        }).toList(),
                      ),
                      const Divider(height: 18),

                      // Expandable Documents Button
                      InkWell(
                        onTap: () {
                          setState(() {
                            if (_expandedDocs.contains(id)) {
                              _expandedDocs.remove(id);
                            } else {
                              _expandedDocs.add(id);
                            }
                          });
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.file_present, size: 14, color: AppTheme.primary),
                                const SizedBox(width: 4),
                                Text(
                                  "Required Documents (${docs.length})",
                                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                ),
                              ],
                            ),
                            Icon(isDocsOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 18, color: AppTheme.primary),
                          ],
                        ),
                      ),

                      if (isDocsOpen) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: docs.map((d) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text("• $d", style: const TextStyle(fontSize: 11, color: AppTheme.textDark)),
                            )).toList(),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _feeRow(String label, String value, {Color? valueColor, double fontSize = 13, bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        Text(
          value,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: valueColor ?? AppTheme.textDark,
          ),
        ),
      ],
    );
  }
}
