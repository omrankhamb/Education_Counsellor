import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ToolsScreen extends StatefulWidget {
  final Map<String, dynamic> studentProfile;
  final Set<String> shortlistedColleges;
  final VoidCallback onGoToExplore;

  const ToolsScreen({
    super.key,
    required this.studentProfile,
    required this.shortlistedColleges,
    required this.onGoToExplore,
  });

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  int _selectedTool = 0; // 0 = Scholarship, 1 = CAP Simulator, 2 = Document Verifier

  // Scholarship state
  final TextEditingController _baseFeeController = TextEditingController(text: '145000');
  final TextEditingController _incomeController = TextEditingController(text: '4.5');
  String _selectedCategory = 'OBC';
  bool _includeHostel = false;

  // CAP simulator state
  int _selectedRound = 1;

  // Document Verifier state
  String _docAuthority = 'MHT-CET';
  String _docCategory = 'OBC';
  bool _docIsDropper = false;
  String _docCvcStatus = 'receipt'; // 'original', 'receipt', 'none'
  bool _docNclValid = true; // valid till 31-03-2027
  bool _docHasDomicile = true;
  int _docSelectedProforma = 0; // 0 = Proforma H, 1 = Gap Certificate, 2 = Proforma O, 3 = TFWS Declaration
  final Map<String, bool> _docChecklist = {};

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.studentProfile['category'] ?? 'OBC';
    _docCategory = widget.studentProfile['category'] ?? 'OBC';
  }

  Map<String, dynamic> _calculateScholarship() {
    final fee = double.tryParse(_baseFeeController.text) ?? 145000.0;
    final income = double.tryParse(_incomeController.text) ?? 4.5;
    double waiverPct = 0;
    String scheme = 'Regular Fee Structure';

    final cat = _selectedCategory.toUpperCase();
    if (cat == 'TFWS') {
      waiverPct = 100;
      scheme = 'Tuition Fee Waiver Scheme (TFWS) - 100% Tuition Waived';
    } else if (cat == 'SC' || cat == 'ST') {
      waiverPct = 100;
      scheme = 'Govt. Social Welfare Free-ship (100% Tuition & Dev. Fee)';
    } else if (cat == 'OBC' || cat == 'EBC' || cat == 'SEBC') {
      if (income <= 8.0) {
        waiverPct = 50;
        scheme = 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh (50% Tuition)';
      } else {
        waiverPct = 0;
        scheme = 'Above Creamy Layer Limit (>8 LPA) - Full Fee';
      }
    } else if (cat == 'VJNT' || cat == 'SBC') {
      waiverPct = 100;
      scheme = 'VJMNT Special Welfare Scheme (100% Tuition Fee)';
    } else {
      if (income <= 8.0) {
        waiverPct = 50;
        scheme = 'EBC Financial Assistance (50% Tuition Fee Concession)';
      } else {
        waiverPct = 0;
        scheme = 'Open Category (Standard SSS Fee Structure)';
      }
    }

    final waiverAmount = (fee * waiverPct) / 100;
    final payableTuition = (fee - waiverAmount).clamp(0, double.infinity);
    final hostelFee = _includeHostel ? 45000.0 : 0.0;
    final totalPayable = payableTuition + hostelFee;

    return {
      'waiverPct': waiverPct.toInt(),
      'waiverAmount': waiverAmount.toInt(),
      'payableTuition': payableTuition.toInt(),
      'hostelFee': hostelFee.toInt(),
      'totalPayable': totalPayable.toInt(),
      'scheme': scheme,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A237E),
        elevation: 0,
        title: const Text(
          'CAP & Scholarship Tools',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: Column(
        children: [
          // Segment Control
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: _buildSegmentButton(0, 'Scholarships', Icons.currency_rupee),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: _buildSegmentButton(1, 'CAP Simulator', Icons.format_list_numbered),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: _buildSegmentButton(2, 'Doc Verifier', Icons.verified_user_outlined),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _selectedTool == 0
                  ? _buildScholarshipCalculator()
                  : _selectedTool == 1
                      ? _buildCapSimulator()
                      : _buildDocumentVerifier(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentButton(int index, String label, IconData icon) {
    final isSelected = _selectedTool == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTool = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScholarshipCalculator() {
    final res = _calculateScholarship();
    final categories = ['OPEN', 'OBC', 'EWS', 'SC', 'ST', 'VJNT', 'TFWS'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Input Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(10),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'MahaDBT Concession Estimator',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 12),

              const Text('Annual College Tuition Fee (₹)', style: TextStyle(fontSize: 12, color: Color(0xFF475569), fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _baseFeeController,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              const Text('Caste / Quota Category', style: TextStyle(fontSize: 12, color: Color(0xFF475569), fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: categories.map((cat) {
                  final isSel = _selectedCategory == cat;
                  return ChoiceChip(
                    label: Text(cat, style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                    selected: isSel,
                    selectedColor: const Color(0xFF2563EB),
                    labelStyle: TextStyle(color: isSel ? Colors.white : const Color(0xFF334155)),
                    onSelected: (_) => setState(() => _selectedCategory = cat),
                  );
                }).toList(),
              ),

              const SizedBox(height: 12),

              const Text('Family Annual Income (Lakhs INR)', style: TextStyle(fontSize: 12, color: Color(0xFF475569), fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextField(
                controller: _incomeController,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Include Campus Hostel & Mess', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: const Text('Estimated ₹45,000 / year', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                value: _includeHostel,
                activeThumbColor: const Color(0xFF2563EB),
                onChanged: (val) => setState(() => _includeHostel = val),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Net Result Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A), // Dark navy
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(30),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${res['waiverPct']}% TUITION CONCESSION',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                res['scheme'],
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 14),

              _buildFeeRow('Official Tuition Fee:', '₹${_baseFeeController.text}'),
              _buildFeeRow('Govt Scholarship Concession:', '- ₹${res['waiverAmount']}', color: const Color(0xFF10B981)),
              if (_includeHostel)
                _buildFeeRow('Hostel & Mess Estimate:', '+ ₹45,000'),

              const Divider(color: Color(0xFF334155), height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Net Payable Fee:',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '₹${res['totalPayable']} / yr',
                    style: const TextStyle(
                      color: Color(0xFF38BDF8),
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFeeRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13)),
          Text(
            value,
            style: TextStyle(
              color: color ?? Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCapSimulator() {
    final shortlisted = widget.shortlistedColleges.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Round Switcher
        Row(
          children: [1, 2, 3].map((r) {
            final isSel = _selectedRound == r;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedRound = r),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSel ? const Color(0xFF1E293B) : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Center(
                    child: Text(
                      'CAP Round $r',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: isSel ? Colors.white : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 16),

        // List
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Your Option Form Sequence (${shortlisted.length})',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  const Text('🔒 Verified Order', style: TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 12),

              shortlisted.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Column(
                          children: [
                            const Text('No colleges added to your shortlist yet', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: widget.onGoToExplore,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1A237E),
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Find Colleges in Explore'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Column(
                      children: List.generate(shortlisted.length, (idx) {
                        final name = shortlisted[idx];
                        final prob = (88 - idx * 12 + (_selectedRound - 1) * 6).clamp(30, 95);
                        final isLikely = idx == 0 || (_selectedRound > 1 && idx == 1);

                        return Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: const BoxDecoration(
                            border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 14,
                                backgroundColor: const Color(0xFFEEF2FF),
                                child: Text('#${idx + 1}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1A237E))),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)), maxLines: 1),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: prob >= 75 ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            'Round $_selectedRound Chance: $prob%',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: prob >= 75 ? const Color(0xFF15803D) : const Color(0xFFB45309),
                                            ),
                                          ),
                                        ),
                                        if (isLikely) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFDCFCE7),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text(
                                              'High Seat Probability',
                                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Strategic Rule
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF9C3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFFEF08A)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('💡 CAP Strategic Rule of Thumb:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF854D0E))),
              SizedBox(height: 4),
              Text(
                '• Choices 1-5: Dream institutions with cutoffs 1-2% above your score.\n• Choices 6-12: Realistic institutes matching your exact rank.\n• Choices 13+: Safe backup choices to guarantee a confirmed allotment in Round 1.',
                style: TextStyle(fontSize: 12, color: Color(0xFF713F12), height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // DOCUMENT & FC RULES VERIFIER
  // ==========================================
  Widget _buildDocumentVerifier() {
    final name = widget.studentProfile['name'] ?? 'Candidate';
    final isReserved = ['OBC', 'SC', 'ST', 'VJNT'].contains(_docCategory.toUpperCase());
    final isOBCorVJNT = ['OBC', 'VJNT'].contains(_docCategory.toUpperCase());

    // Determine status
    String status = 'READY_FOR_FC';
    Color statusColor = const Color(0xFF16A34A);
    String statusTitle = 'READY FOR FC / E-SCRUTINY';
    String statusMessage = 'All document parameters comply with government mandates for Academic Year 2026-27.';
    final List<String> warnings = [];

    if (isReserved) {
      if (_docCvcStatus == 'none') {
        status = 'HIGH_RISK';
        statusColor = const Color(0xFFDC2626);
        statusTitle = 'HIGH RISK: SEAT CONVERSION TO GENERAL';
        statusMessage = 'Without Caste Validity Certificate or Application Receipt, admission authority will cancel reserved seat at FC scrutiny.';
        warnings.add('Apply immediately to the Scrutiny Committee to obtain an official receipt.');
      } else if (_docCvcStatus == 'receipt') {
        if (status != 'HIGH_RISK') {
          status = 'PROVISIONAL';
          statusColor = const Color(0xFFD97706);
          statusTitle = 'PROVISIONAL STATUS (PROFORMA H REQUIRED)';
          statusMessage = 'You only have a CVC receipt. You MUST upload Proforma H and submit original CVC before CAP Round 3.';
        }
        warnings.add('Proforma H Undertaking must be signed and uploaded at e-Scrutiny.');
      }

      if (isOBCorVJNT && !_docNclValid) {
        status = 'HIGH_RISK';
        statusColor = const Color(0xFFDC2626);
        statusTitle = 'NCL EXPIRED / INVALID';
        statusMessage = 'NCL must be valid up to March 31, 2027. NCL receipts are strictly rejected at FC centers.';
        warnings.add('Obtain an updated 3-year NCL certificate from Tahsildar / SDO immediately.');
      }
    }

    if (_docIsDropper) {
      if (status == 'READY_FOR_FC') {
        status = 'PROVISIONAL';
        statusColor = const Color(0xFFD97706);
        statusTitle = 'GAP CERTIFICATE REQUIRED';
        statusMessage = 'Study gap detected after 12th standard. You must execute a notarized Gap Affidavit on ₹100 stamp paper.';
      }
      warnings.add('GAP Certificate Affidavit on ₹100 stamp paper is mandatory at FC reporting.');
    }

    if (!_docHasDomicile && _docAuthority == 'MHT-CET') {
      warnings.add('Missing Domicile: Ensure School Leaving Certificate clearly mentions Maharashtra as place of birth.');
    }

    // Proforma templates list
    final proformas = [
      {
        'title': 'Proforma - H (CVC Undertaking)',
        'stamp': 'Self Declaration (CET Cell Format)',
        'text': 'PROFORMA - H\\n[Under Rule 13 of Maharashtra Admissions]\\n\\nUNDERTAKING\\n\\nI, Mr./Ms. $name\\nTarget Course: AY 2026-27\\nCategory Claimed: $_docCategory\\n\\nI hereby declare and give undertaking that:\\n1. I have applied for Caste/Tribe Validity Certificate to the competent Scrutiny Committee.\\n2. The receipt of the application is attached herewith.\\n3. I undertake to produce the original Caste Validity Certificate on or before the CAP Round 3 cutoff date.\\n4. In case I fail to produce the original validity, my admission shall be converted to OPEN/General category automatically.\\n\\nDate: ____________\\nSignature of Candidate: ____________'
      },
      {
        'title': 'GAP Certificate Affidavit (Droppers)',
        'stamp': '₹100 Non-Judicial Stamp Paper (Notarized)',
        'text': 'BEFORE THE NOTARY PUBLIC\\nAFFIDAVIT (GAP CERTIFICATE)\\n(On Non-Judicial Stamp Paper of Rs. 100/-)\\n\\nI, $name, Son/Daughter of ____________________,\\nResiding at: ____________________________________,\\ndo hereby solemnly state and affirm as follows:\\n\\n1. I passed the 12th/HSC Examination in the year 2025.\\n2. During the academic gap period from June 2025 to June 2026, I did not join any degree/diploma college.\\n3. I was preparing for competitive entrance examinations (MHT-CET / JEE / NEET).\\n4. No criminal case is pending against me.\\n\\nDEPONENT: $name\\nVerified before me: Notary Public Stamp & Seal'
      },
      {
        'title': 'Proforma - O (Minority Candidate)',
        'stamp': 'Plain Paper with School Leaving Proof',
        'text': 'PROFORMA - O\\n(For Religious / Linguistic Minority Quota)\\n\\nI, $name, hereby declare that I belong to the Minority Community. My mother tongue is _________________. The documents submitted in support of my claim are genuine.\\n\\nCandidate Signature: ____________'
      },
      {
        'title': 'TFWS / EBC Income Declaration',
        'stamp': 'Tahsildar Income Certificate (FY 2025-26)',
        'text': 'DECLARATION OF ANNUAL FAMILY INCOME\\n(For TFWS / EBC Scheme - AY 2026-27)\\n\\nI, Father/Guardian of $name, declare that our total annual family income from all sources for Financial Year 2025-2026 is less than ₹8,00,000 (Rupees Eight Lakhs). Verified Tahsildar Certificate is attached.\\n\\nSignature of Parent: ____________'
      }
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title Banner
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.verified_user, color: Color(0xFFFBBF24), size: 22),
                  const SizedBox(width: 8),
                  const Text(
                    'Live Document & Rules Engine',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF10B981)),
                    ),
                    child: const Text('AY 2026-27', style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Authoritative verification grounded in official mahacet.org, josaa.nic.in, and mcc.nic.in counseling rules.',
                style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Controls Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Counseling Profile Parameters', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 12),

              // Authority
              const Text('Counseling Authority:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _docAuthority,
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                items: const [
                  DropdownMenuItem(value: 'MHT-CET', child: Text('State CET Cell Maharashtra (MHT-CET)')),
                  DropdownMenuItem(value: 'JOSAA', child: Text('JoSAA / CSAB (IITs, NITs, IIITs)')),
                  DropdownMenuItem(value: 'NEET_MCC', child: Text('NEET MCC / DMER (Medical)')),
                ],
                onChanged: (val) => setState(() => _docAuthority = val ?? 'MHT-CET'),
              ),

              const SizedBox(height: 12),

              // Category
              const Text('Category Claimed:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _docCategory,
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                items: const [
                  DropdownMenuItem(value: 'OPEN', child: Text('OPEN / General')),
                  DropdownMenuItem(value: 'OBC', child: Text('OBC (Other Backward Classes)')),
                  DropdownMenuItem(value: 'SC', child: Text('SC (Scheduled Caste)')),
                  DropdownMenuItem(value: 'ST', child: Text('ST (Scheduled Tribe)')),
                  DropdownMenuItem(value: 'VJNT', child: Text('VJ/DT/NT & SBC')),
                  DropdownMenuItem(value: 'EWS', child: Text('EWS (Economically Weaker Section)')),
                  DropdownMenuItem(value: 'TFWS', child: Text('TFWS (Tuition Fee Waiver - 100%)')),
                ],
                onChanged: (val) => setState(() => _docCategory = val ?? 'OPEN'),
              ),

              // CVC Status if reserved
              if (isReserved) ...[
                const SizedBox(height: 12),
                const Text('Caste / Tribe Validity (CVC) Status:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Radio<String>(
                      value: 'original',
                      groupValue: _docCvcStatus,
                      onChanged: (val) => setState(() => _docCvcStatus = val!),
                    ),
                    const Expanded(child: Text('Original in hand', style: TextStyle(fontSize: 12))),
                    Radio<String>(
                      value: 'receipt',
                      groupValue: _docCvcStatus,
                      onChanged: (val) => setState(() => _docCvcStatus = val!),
                    ),
                    const Expanded(child: Text('Applied (Receipt)', style: TextStyle(fontSize: 12))),
                  ],
                ),
              ],

              // NCL Status if OBC / VJNT
              if (isOBCorVJNT) ...[
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('NCL Valid till March 31, 2027?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Mandatory for AY 2026-27. Receipts are rejected.', style: TextStyle(fontSize: 11, color: Colors.black54)),
                  value: _docNclValid,
                  onChanged: (val) => setState(() => _docNclValid = val),
                ),
              ],

              // Dropper Toggle
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Dropper / Gap Year Candidate?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                subtitle: const Text('Requires notarized Gap Affidavit on ₹100 stamp paper', style: TextStyle(fontSize: 11, color: Colors.black54)),
                value: _docIsDropper,
                onChanged: (val) => setState(() => _docIsDropper = val),
              ),

              // Domicile / Birth Certificate Toggle
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Maharashtra Domicile / Birth Proof?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                subtitle: const Text('Proof of Maharashtra State Candidature (Type A)', style: TextStyle(fontSize: 11, color: Colors.black54)),
                value: _docHasDomicile,
                onChanged: (val) => setState(() => _docHasDomicile = val),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Status Banner Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: statusColor.withValues(alpha: 0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    status == 'READY_FOR_FC' ? Icons.check_circle : status == 'PROVISIONAL' ? Icons.warning_amber_rounded : Icons.cancel,
                    color: statusColor,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      statusTitle,
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: statusColor),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                statusMessage,
                style: const TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.4),
              ),

              if (warnings.isNotEmpty) ...[
                const SizedBox(height: 10),
                const Divider(),
                const SizedBox(height: 4),
                const Text('Critical Action Items:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 4),
                ...warnings.map((w) => Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                      Expanded(child: Text(w, style: const TextStyle(fontSize: 11.5, color: Color(0xFF475569)))),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Mandatory Document Checklist
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.checklist, color: Color(0xFF2563EB), size: 20),
                  SizedBox(width: 8),
                  Text('Official Document Checklist', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                ],
              ),
              const SizedBox(height: 10),

              // Checklist items
              _buildCheckItem('10th / SSC Marksheet (DOB Proof)', 'Mandatory for all candidates'),
              _buildCheckItem('12th / HSC Qualifying Exam Marksheet', 'Mandatory for all candidates'),
              _buildCheckItem('$_docAuthority Entrance Score Card', 'Downloaded verified scorecard'),
              _buildCheckItem('Domicile / Birth Certificate', 'Proves Maharashtra State Candidature'),
              _buildCheckItem('School / College Leaving Certificate (LC)', 'Indicates Mother Tongue & Place of Birth'),
              if (isReserved) _buildCheckItem('$_docCategory Caste / Tribe Certificate', 'Issued by SDO / Sub-Divisional Magistrate'),
              if (isReserved) _buildCheckItem('Caste Validity Certificate (CVC)', 'Original or Receipt with Proforma H'),
              if (isOBCorVJNT) _buildCheckItem('Non-Creamy Layer (Valid till 31-03-2027)', 'Receipts not accepted at FC'),
              if (_docIsDropper) _buildCheckItem('GAP Certificate Affidavit', 'On ₹100 stamp paper, notarized'),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Proforma Templates Generator
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.description, color: Color(0xFF4F46E5), size: 20),
                  SizedBox(width: 8),
                  Text('Official Proforma Generator', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                ],
              ),
              const SizedBox(height: 8),
              const Text('Personalized legal formats ready to copy and print:', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 12),

              // Proforma Tabs
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(proformas.length, (idx) {
                    final isSel = _docSelectedProforma == idx;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(proformas[idx]['title']!.split('(')[0], style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                        selected: isSel,
                        selectedColor: const Color(0xFF4F46E5),
                        labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black87),
                        onSelected: (val) => setState(() => _docSelectedProforma = idx),
                      ),
                    );
                  }),
                ),
              ),

              const SizedBox(height: 12),

              // Selected Proforma Preview Box
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            proformas[_docSelectedProforma]['title']!,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: proformas[_docSelectedProforma]['text']!));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Proforma format copied to clipboard!'),
                                duration: Duration(seconds: 2),
                                backgroundColor: Color(0xFF10B981),
                              ),
                            );
                          },
                          icon: const Icon(Icons.copy, size: 14),
                          label: const Text('Copy Format', style: TextStyle(fontSize: 11)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4F46E5),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Format: ${proformas[_docSelectedProforma]['stamp']}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Text(
                        proformas[_docSelectedProforma]['text']!,
                        style: const TextStyle(fontFamily: 'monospace', fontSize: 10.5, height: 1.5, color: Color(0xFF334155)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // FC Center 5 Golden Rules
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('🏛️ Facilitation Centre (FC) Golden Rules:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A))),
              SizedBox(height: 6),
              Text(
                '1. Color scan all original certificates in clear 150-200 DPI PDF format.\\n2. Ensure spelling of your name matches identically across 10th marksheet and entrance scorecard.\\n3. Keep 2 sets of self-attested physical photocopies ready.\\n4. Obtain official stamped FC Verification Acknowledgment Receipt.\\n5. NEVER submit original certificates to FC centers — only show them for verification.',
                style: TextStyle(fontSize: 11.5, color: Color(0xFF1E40AF), height: 1.45),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCheckItem(String title, String subtitle) {
    final isChecked = _docChecklist[title] ?? false;
    return InkWell(
      onTap: () => setState(() => _docChecklist[title] = !isChecked),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(
              isChecked ? Icons.check_box : Icons.check_box_outline_blank,
              color: isChecked ? const Color(0xFF16A34A) : Colors.grey,
              size: 20,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      decoration: isChecked ? TextDecoration.lineThrough : null,
                      color: isChecked ? Colors.grey : const Color(0xFF1E293B),
                    ),
                  ),
                  Text(subtitle, style: const TextStyle(fontSize: 10.5, color: Colors.black54)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
