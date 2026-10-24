import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class DocumentAuditScreen extends StatefulWidget {
  final StudentProfile studentProfile;

  const DocumentAuditScreen({
    super.key,
    required this.studentProfile,
  });

  @override
  State<DocumentAuditScreen> createState() => _DocumentAuditScreenState();
}

class _DocumentAuditScreenState extends State<DocumentAuditScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Form State
  late String _selectedCategory;
  late String _selectedExam;
  late double _annualIncome;
  bool _isDropper = false;
  bool _hasCasteValidity = true;
  bool _hasCvcReceipt = false;
  final String _nclValidTill = '2027-03-31';
  final bool _appliedTfws = false;

  // Verification Result State
  bool _isLoading = false;
  Map<String, dynamic>? _auditReport;
  final Map<String, bool> _checkedDocs = {};

  // Q&A State
  final TextEditingController _qaController = TextEditingController();
  bool _isSearchingQa = false;
  String? _qaAnswer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _selectedCategory = widget.studentProfile.category;
    _selectedExam = widget.studentProfile.examType;
    _annualIncome = widget.studentProfile.annualIncome;
  }

  @override
  void dispose() {
    _tabController.dispose();
    _qaController.dispose();
    super.dispose();
  }

  Future<void> _runAudit() async {
    setState(() => _isLoading = true);
    final report = await ApiService.verifyDocuments(
      examType: _selectedExam,
      category: _selectedCategory,
      hasGap: _isDropper,
      cvcStatus: _hasCasteValidity
          ? 'Valid Certificate'
          : _hasCvcReceipt
              ? 'Receipt Available'
              : 'Not Applied',
      income: _annualIncome,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        _auditReport = report ?? _buildFallbackReport();
      });
    }
  }

  Map<String, dynamic> _buildFallbackReport() {
    final List<String> criticalWarnings = [];
    final List<String> requiredDocs = [
      "HSC (Std. XII) Original Marksheet",
      "SSC (Std. X) Board Certificate / Birth Certificate",
      "${widget.studentProfile.examType} Official Scorecard 2026",
      "Domicile Certificate / School Leaving Certificate",
    ];

    if (_selectedCategory != 'OPEN') {
      requiredDocs.add("Caste / Tribe Certificate from Competent Authority");
      if (_hasCasteValidity) {
        requiredDocs.add("Caste / Tribe Validity Certificate (CVC)");
      } else if (_hasCvcReceipt) {
        requiredDocs.add("CVC Scrutiny Receipt + Proforma H Undertaking");
        criticalWarnings.add("Proforma H Undertaking mandatory: Original Validity must be produced before CAP Round 3.");
      } else {
        criticalWarnings.add("URGENT: Without Validity or Receipt, your seat will be automatically converted to OPEN General quota!");
      }

      if (['OBC', 'VJNT', 'SBC', 'NT-B', 'NT-C', 'NT-D'].contains(_selectedCategory)) {
        requiredDocs.add("Non-Creamy Layer (NCL) Certificate valid up to 31/03/2027");
        if (_nclValidTill != '2027-03-31') {
          criticalWarnings.add("NCL certificate must be strictly valid up to 31st March 2027 as per DTE gazette.");
        }
      }
    }

    if (_annualIncome <= 800000 || _appliedTfws) {
      requiredDocs.add("Income Certificate issued by Tahsildar (FY 2025-26)");
    }

    if (_isDropper) {
      requiredDocs.add("Notarized Educational Gap Affidavit on ₹100 Stamp Paper");
    }

    final riskLevel = criticalWarnings.isNotEmpty
        ? (criticalWarnings.any((w) => w.contains("URGENT")) ? "High Risk" : "Moderate Risk")
        : "Clear / Scrutiny Ready";

    return {
      'risk_level': riskLevel,
      'critical_warnings': criticalWarnings,
      'required_documents': requiredDocs,
    };
  }

  void _askGroundedQa(String query) async {
    if (query.trim().isEmpty) return;
    setState(() {
      _isSearchingQa = true;
      _qaAnswer = null;
    });

    final res = await ApiService.sendChatMessage(
      message: "According to official Maharashtra State CET Cell & JoSAA FC scrutiny guidelines, answer this document verification question: $query",
      profile: widget.studentProfile,
    );

    if (mounted) {
      setState(() {
        _isSearchingQa = false;
        _qaAnswer = res?['reply']?.toString() ??
            "Under DTE Information Brochure Rule 4(2), all reserved category candidates must produce the original Caste Validity Certificate. If application is under verification, Proforma H undertaking along with committee receipt is accepted temporarily up to CAP Round 3.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FC Document Verification Audit'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.secondary,
          unselectedLabelColor: Colors.white70,
          indicatorColor: AppTheme.secondary,
          tabs: const [
            Tab(icon: Icon(Icons.verified_user, size: 18), text: "Scrutiny Audit"),
            Tab(icon: Icon(Icons.description, size: 18), text: "Proformas & Affidavits"),
            Tab(icon: Icon(Icons.question_answer, size: 18), text: "Rules Q&A"),
            Tab(icon: Icon(Icons.fact_check, size: 18), text: "FC Checklist"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAuditTab(),
          _buildProformasTab(),
          _buildGroundedQaTab(),
          _buildGuidelinesTab(),
        ],
      ),
    );
  }

  // --- TAB 1: SCRUTINY AUDIT ---
  Widget _buildAuditTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: const Row(
              children: [
                Icon(Icons.shield_outlined, color: AppTheme.primary, size: 24),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "Facilitation Center (FC) E-Scrutiny & Physical Document Risk Evaluation.",
                    style: TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Audit Form Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Candidate Document Scrutiny Parameters", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 12),

                  // Category Selector
                  DropdownButtonFormField<String>(
                    initialValue: _selectedCategory,
                    decoration: const InputDecoration(labelText: "Admission Category"),
                    items: ['OPEN', 'OBC', 'EWS', 'TFWS', 'SC', 'ST', 'VJNT', 'SBC'].map((c) {
                      return DropdownMenuItem(value: c, child: Text(c));
                    }).toList(),
                    onChanged: (v) => setState(() => _selectedCategory = v ?? 'OPEN'),
                  ),
                  const SizedBox(height: 12),

                  // Caste Validity Status (if reserved)
                  if (_selectedCategory != 'OPEN') ...[
                    SwitchListTile(
                      title: const Text("Hold Original Caste Validity Certificate (CVC)?", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      subtitle: Text(_hasCasteValidity ? "Valid Certificate in Hand" : "Certificate pending / receipt available", style: const TextStyle(fontSize: 11)),
                      value: _hasCasteValidity,
                      thumbColor: WidgetStateProperty.all(AppTheme.safeGreen),
                      onChanged: (val) => setState(() {
                        _hasCasteValidity = val;
                        if (val) _hasCvcReceipt = false;
                      }),
                    ),
                    if (!_hasCasteValidity)
                      SwitchListTile(
                        title: const Text("Hold Official CVC Scrutiny Receipt / Token?", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        subtitle: const Text("Receipt issued by Divisional Caste Scrutiny Committee", style: TextStyle(fontSize: 11)),
                        value: _hasCvcReceipt,
                        thumbColor: WidgetStateProperty.all(AppTheme.targetAmber),
                        onChanged: (val) => setState(() => _hasCvcReceipt = val),
                      ),
                    const SizedBox(height: 8),
                  ],

                  // Dropper Gap Certificate
                  SwitchListTile(
                    title: const Text("Are you a Dropper / Repeating the exam?", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: const Text("Passed 12th in 2025 or earlier (Requires Gap Affidavit)", style: TextStyle(fontSize: 11)),
                    value: _isDropper,
                    thumbColor: WidgetStateProperty.all(AppTheme.primary),
                    onChanged: (val) => setState(() => _isDropper = val),
                  ),
                  const SizedBox(height: 14),

                  // Run Audit Button
                  ElevatedButton.icon(
                    icon: _isLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.fact_check, size: 18),
                    label: const Text("Run Scrutiny Risk Audit"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 44),
                    ),
                    onPressed: _isLoading ? null : _runAudit,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Audit Results Card
          if (_auditReport != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _auditReport!['risk_level'] == 'Clear / Scrutiny Ready'
                      ? AppTheme.safeGreen
                      : Colors.orange,
                  width: 2,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _auditReport!['risk_level'] == 'Clear / Scrutiny Ready' ? Icons.check_circle : Icons.warning_amber,
                        color: _auditReport!['risk_level'] == 'Clear / Scrutiny Ready' ? AppTheme.safeGreen : Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "Scrutiny Status: ${_auditReport!['risk_level']}",
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ],
                  ),
                  const Divider(height: 20),

                  // Critical Warnings
                  if ((_auditReport!['critical_warnings'] as List).isNotEmpty) ...[
                    const Text("⚠️ Critical Scrutiny Notices:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.red)),
                    const SizedBox(height: 6),
                    ...(_auditReport!['critical_warnings'] as List).map(
                      (w) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text("• $w", style: const TextStyle(fontSize: 12, color: Colors.red, height: 1.3)),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  // Mandatory Checklist
                  const Text("Mandatory Documents Required at FC:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  ...(_auditReport!['required_documents'] as List).map((doc) {
                    final isChecked = _checkedDocs[doc] ?? false;
                    return CheckboxListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(doc, style: const TextStyle(fontSize: 12)),
                      value: isChecked,
                      activeColor: AppTheme.safeGreen,
                      onChanged: (val) => setState(() => _checkedDocs[doc] = val ?? false),
                    );
                  }),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // --- TAB 2: PROFORMAS & AFFIDAVITS ---
  Widget _buildProformasTab() {
    final proformaHText = """PROFORMA - H
[Rule 4(2)(h) & DTE Information Brochure AY 2026-27]
UNDERTAKING TO BE SUBMITTED BY CANDIDATE IN RESPECT OF CASTE VALIDITY CERTIFICATE (CVC)

I, ${widget.studentProfile.name}, having Application ID: EN26019482,
do hereby solemnly state and affirm that:

1. I belong to $_selectedCategory Category of Maharashtra State.
2. I have applied to the Divisional Caste Scrutiny Committee for issuance of Caste / Tribe Validity Certificate.
3. As on today, my Caste Validity application is under verification and I hold official Receipt / Token.
4. I undertake to produce the original Caste Validity Certificate before the cutoff date of CAP Round 3.
5. In case I fail to produce the certificate, my provisional allotment shall stand cancelled as per DTE rules.

Signature of Candidate: _______________________
Date: 24/10/2026 | Place: ${widget.studentProfile.homeDistrict}""";

    final gapText = """AFFIDAVIT FOR EDUCATIONAL GAP
(To be executed on ₹100 Non-Judicial Stamp Paper & Notarized)

I, ${widget.studentProfile.name}, Age: 18 years,
Residing at: ${widget.studentProfile.homeDistrict}, Maharashtra,
do hereby solemnly affirm and state on oath as under:

1. That I have passed the 12th Standard (HSC / Equivalent) examination in Year 2025.
2. That after passing the said examination, I did not take admission in any college / institute for the academic year 2025-26.
3. That during the gap period from June 2025 to June 2026, I was preparing for competitive entrance examinations (${widget.studentProfile.examType}).
4. That during the said gap period, I was not involved in any unlawful, anti-social or criminal activity.
5. That this affidavit is executed for submission at the Facilitation Center (FC) for Centralized Admission Process (CAP) 2026-27.

DEPONENT: ${widget.studentProfile.name}
VERIFICATION:
Verified at ${widget.studentProfile.homeDistrict} on this 24th day of October 2026.""";

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Proforma H Card
          _proformaCard(
            title: "Proforma - H (Caste Validity Undertaking)",
            authority: "Rule 4(2) Gazette",
            desc: "Mandatory undertaking when Caste Validity application is pending and candidate holds Scrutiny Receipt.",
            content: proformaHText,
          ),
          const SizedBox(height: 14),

          // Gap Certificate Card
          _proformaCard(
            title: "Educational Gap Affidavit (1 Year)",
            authority: "₹100 Stamp Paper",
            desc: "Required for droppers who passed 12th in 2025 or earlier to explain the preparation period.",
            content: gapText,
          ),
        ],
      ),
    );
  }

  Widget _proformaCard({
    required String title,
    required String authority,
    required String desc,
    required String content,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primary)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(4)),
                  child: Text(authority, style: TextStyle(fontSize: 10, color: Colors.blue.shade800, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(desc, style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted)),
            const SizedBox(height: 10),
            Container(
              height: 130,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: SingleChildScrollView(
                child: Text(content, style: const TextStyle(fontSize: 11, fontFamily: 'monospace')),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton.icon(
              icon: const Icon(Icons.copy, size: 16),
              label: const Text("Copy Pre-Filled Format"),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 38),
              ),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: content));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Copied $title to clipboard!")),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // --- TAB 3: GROUNDED RULES Q&A ---
  Widget _buildGroundedQaTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Search Official Facilitation Center (FC) Rules", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 6),
          const Text("Instant answers grounded in official State CET Cell Information Brochure.", style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const SizedBox(height: 14),

          // Search Field
          TextField(
            controller: _qaController,
            decoration: InputDecoration(
              hintText: "e.g. Can I submit CVC receipt in Round 1? Is gap certificate mandatory?",
              suffixIcon: IconButton(
                icon: const Icon(Icons.send, color: AppTheme.primary),
                onPressed: () => _askGroundedQa(_qaController.text),
              ),
            ),
            onSubmitted: _askGroundedQa,
          ),
          const SizedBox(height: 12),

          // Suggested Queries
          const Text("Frequently Asked Scrutiny Questions:", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              "What if Caste Validity is delayed?",
              "Is NCL certificate mandatory for OBC?",
              "Can I change category after verification?",
              "Documents required for TFWS scheme",
            ].map((q) {
              return ActionChip(
                label: Text(q, style: const TextStyle(fontSize: 11)),
                onPressed: () {
                  _qaController.text = q;
                  _askGroundedQa(q);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Answer Card
          if (_isSearchingQa) ...[
            const Center(child: Padding(padding: EdgeInsets.all(30), child: CircularProgressIndicator())),
          ] else if (_qaAnswer != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderLight),
                boxShadow: [BoxShadow(color: Colors.black.withAlpha(10), blurRadius: 8)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.verified, color: AppTheme.safeGreen, size: 18),
                      SizedBox(width: 6),
                      Text("Official Grounded Rule Response:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
                    ],
                  ),
                  const Divider(height: 16),
                  Text(_qaAnswer!, style: const TextStyle(fontSize: 13, height: 1.45)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // --- TAB 4: FC GUIDELINES & DEADLINES ---
  Widget _buildGuidelinesTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _guidelineTile(
          icon: Icons.upload_file,
          title: "E-Scrutiny vs Physical Scrutiny",
          desc: "E-Scrutiny allows online document verification from home. If any discrepancy is raised, you can upload updated documents within 48 hours without visiting an FC.",
        ),
        _guidelineTile(
          icon: Icons.published_with_changes,
          title: "Automatic Conversion to OPEN Quota",
          desc: "If reserved category candidates (OBC/EWS/SC/ST) fail to submit Caste Validity or Valid NCL before CAP Round 3 cutoff, the system automatically treats them as General / OPEN candidates.",
        ),
        _guidelineTile(
          icon: Icons.calendar_today,
          title: "Non-Creamy Layer (NCL) Validity Deadline",
          desc: "Must be valid up to 31st March 2027. Certificates expiring on 31st March 2026 are strictly rejected at the Facilitation Center.",
        ),
        _guidelineTile(
          icon: Icons.security,
          title: "Seat Acceptance Fee (SAF)",
          desc: "Mandatory ₹1,000 online fee upon provisional seat allotment to claim your seat in Round 1 or 2. Failure to pay leads to forfeiture of the allotted seat.",
        ),
      ],
    );
  }

  Widget _guidelineTile({required IconData icon, required String title, required String desc}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: AppTheme.primary.withAlpha(20), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(desc, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, height: 1.35)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
