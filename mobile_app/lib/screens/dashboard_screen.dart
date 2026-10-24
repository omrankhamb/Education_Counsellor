import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/college.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/college_card.dart';
import 'college_details_screen.dart';

class DashboardScreen extends StatefulWidget {
  final StudentProfile studentProfile;
  final Function(StudentProfile) onUpdateProfile;
  final Function(int tabIndex, {String? initialPrompt})? onSwitchTab;
  final VoidCallback? onOpenDocAudit;
  final VoidCallback? onOpenScholarships;

  const DashboardScreen({
    super.key,
    required this.studentProfile,
    required this.onUpdateProfile,
    this.onSwitchTab,
    this.onOpenDocAudit,
    this.onOpenScholarships,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<College> _allColleges = [];
  bool _isLoading = true;
  String _selectedTier = 'All';
  String _selectedType = 'All';
  String _selectedState = 'All';
  String _sortBy = 'recommended';
  String _searchQuery = '';
  bool _shortlistOnly = false;
  final Set<String> _shortlisted = {};
  final Set<String> _selectedForCompare = {};

  @override
  void initState() {
    super.initState();
    _fetchColleges();
  }

  Future<void> _fetchColleges() async {
    setState(() => _isLoading = true);
    final list = await ApiService.fetchRecommendations(widget.studentProfile);
    if (mounted) {
      setState(() {
        _allColleges = list;
        _isLoading = false;
      });
    }
  }

  void _adjustScore(double delta) {
    final newScore = double.parse((widget.studentProfile.marks + delta).toStringAsFixed(2));
    if (newScore > 0 && newScore <= 100) {
      final updated = widget.studentProfile.copyWith(marks: newScore);
      widget.onUpdateProfile(updated);
      _fetchColleges();
    }
  }

  void _toggleCompare(College c) {
    setState(() {
      if (_selectedForCompare.contains(c.collegeName)) {
        _selectedForCompare.remove(c.collegeName);
      } else {
        if (_selectedForCompare.length >= 4) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("You can compare up to 4 colleges at a time.")),
          );
          return;
        }
        _selectedForCompare.add(c.collegeName);
      }
    });
  }

  List<String> get _availableStates {
    final s = <String>{'All'};
    for (var c in _allColleges) {
      if (c.location.contains(',')) {
        s.add(c.location.split(',').last.trim());
      } else {
        s.add(c.location.trim());
      }
    }
    return s.toList();
  }

  List<College> get _filteredColleges {
    var list = _allColleges.where((c) {
      // Tier filter
      if (_selectedTier != 'All' && c.tier != _selectedTier) {
        return false;
      }
      // College Type filter
      if (_selectedType != 'All' && c.collegeType.toLowerCase() != _selectedType.toLowerCase()) {
        return false;
      }
      // State filter
      if (_selectedState != 'All' && !c.location.toLowerCase().contains(_selectedState.toLowerCase())) {
        return false;
      }
      // Shortlist filter
      if (_shortlistOnly && !_shortlisted.contains(c.collegeName)) {
        return false;
      }
      // Search filter
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final nameMatch = c.collegeName.toLowerCase().contains(q);
        final locMatch = c.location.toLowerCase().contains(q);
        final codeMatch = c.collegeCode != null && c.collegeCode!.contains(q);
        final branchMatch = c.branchSummary != null && c.branchSummary!.toLowerCase().contains(q);
        if (!nameMatch && !locMatch && !codeMatch && !branchMatch) {
          return false;
        }
      }
      return true;
    }).toList();

    // Sorting logic matching web
    if (_sortBy == 'cutoffDesc') {
      list.sort((a, b) => b.cutoffMarks.compareTo(a.cutoffMarks));
    } else if (_sortBy == 'cutoffAsc') {
      list.sort((a, b) => a.cutoffMarks.compareTo(b.cutoffMarks));
    } else if (_sortBy == 'rating') {
      list.sort((a, b) => b.rating.compareTo(a.rating));
    } else if (_sortBy == 'fees') {
      list.sort((a, b) => a.annualFees.compareTo(b.annualFees));
    }

    return list;
  }

  void _showCompareModal() {
    final collegesToCompare = _allColleges
        .where((c) => _selectedForCompare.contains(c.collegeName))
        .toList();

    if (collegesToCompare.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Select at least 2 colleges to compare side-by-side.")),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primary, Color(0xFF3949AB)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.balance, color: AppTheme.secondary, size: 20),
                        SizedBox(width: 8),
                        Text(
                          "Side-by-Side College Comparison",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),

              // Comparison Table
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowColor: WidgetStateProperty.all(AppTheme.primary.withAlpha(15)),
                      border: TableBorder.all(color: Colors.grey.shade300),
                      columns: [
                        const DataColumn(
                          label: Text("Feature / Metric", style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                        ...collegesToCompare.map(
                          (c) => DataColumn(
                            label: Text(
                              c.collegeName.split(',')[0],
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                      rows: [
                        DataRow(
                          cells: [
                            const DataCell(Text("Campus Location", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map((c) => DataCell(Text(c.location))),
                          ],
                        ),
                        DataRow(
                          cells: [
                            const DataCell(Text("College Type", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map(
                              (c) => DataCell(
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: c.collegeType == 'Government' ? Colors.green.shade100 : Colors.amber.shade100,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    c.collegeType,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: c.collegeType == 'Government' ? Colors.green.shade800 : Colors.brown.shade800,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        DataRow(
                          cells: [
                            const DataCell(Text("Cutoff Required", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map(
                              (c) => DataCell(
                                Text(
                                  "${c.cutoffMarks.toStringAsFixed(1)} %ile",
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
                                ),
                              ),
                            ),
                          ],
                        ),
                        DataRow(
                          cells: [
                            const DataCell(Text("Your Score", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map(
                              (_) => DataCell(
                                Text(
                                  "${widget.studentProfile.marks}%ile",
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                                ),
                              ),
                            ),
                          ],
                        ),
                        DataRow(
                          cells: [
                            const DataCell(Text("Admission Tier", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map(
                              (c) => DataCell(
                                Text(
                                  c.tier,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: c.tier == 'Safe'
                                        ? AppTheme.safeGreen
                                        : c.tier == 'Target'
                                            ? AppTheme.targetAmber
                                            : AppTheme.dreamRed,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        DataRow(
                          cells: [
                            const DataCell(Text("Annual Fees", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map((c) => DataCell(Text(c.formattedFees))),
                          ],
                        ),
                        DataRow(
                          cells: [
                            const DataCell(Text("Average CTC", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map(
                              (c) => DataCell(
                                Text(
                                  c.placementAvg,
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                                ),
                              ),
                            ),
                          ],
                        ),
                        DataRow(
                          cells: [
                            const DataCell(Text("Rating & NIRF", style: TextStyle(fontWeight: FontWeight.bold))),
                            ...collegesToCompare.map(
                              (c) => DataCell(
                                Text("⭐ ${c.rating.toStringAsFixed(1)} • ${c.nirfRank ?? 'Top Ranked'}"),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeadlinesModal() {
    final deadlines = [
      {'title': 'CAP Round 1 Option Form Filling', 'date': 'July 20–25, 2026', 'status': 'Upcoming', 'color': Colors.blue},
      {'title': 'Facilitation Center (FC) E-Scrutiny Deadline', 'date': 'July 18, 2026', 'status': 'Mandatory', 'color': Colors.red},
      {'title': 'Final Merit List Display', 'date': 'July 19, 2026', 'status': 'Scheduled', 'color': Colors.orange},
      {'title': 'CAP Round 1 Provisional Seat Allotment', 'date': 'July 28, 2026', 'status': 'Scheduled', 'color': Colors.green},
      {'title': 'Seat Acceptance & Freeze/Float Confirmation', 'date': 'July 29–August 1, 2026', 'status': 'Critical', 'color': Colors.purple},
      {'title': 'CAP Round 2 Vacancy & Choice Filling', 'date': 'August 3–6, 2026', 'status': 'Scheduled', 'color': Colors.teal},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.calendar_month, color: AppTheme.secondary, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      "Admission Deadlines (${widget.studentProfile.stream})",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              "Official State CET Cell & JoSAA admission timeline milestones:",
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 16),
            ...deadlines.map(
              (d) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            d['title'] as String,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            "📅 ${d['date']}",
                            style: const TextStyle(color: AppTheme.primary, fontSize: 11.5, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: (d['color'] as MaterialColor).shade50,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: (d['color'] as MaterialColor).shade200),
                      ),
                      child: Text(
                        d['status'] as String,
                        style: TextStyle(
                          color: (d['color'] as MaterialColor).shade800,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showReportModal() {
    final top10 = _allColleges.take(10).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(20),
          child: ListView(
            controller: scrollController,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.picture_as_pdf, color: Colors.red, size: 22),
                      SizedBox(width: 8),
                      Text(
                        "Admission Counseling Report",
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(),
              // Candidate Summary Box
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Candidate: ${widget.studentProfile.name}", style: const TextStyle(fontWeight: FontWeight.bold)),
                        Text("Exam: ${widget.studentProfile.examType}", style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Score: ${widget.studentProfile.marks}%ile", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                        Text("Category: ${widget.studentProfile.category}"),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Top Recommended Matches:",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              ...top10.map(
                (c) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c.collegeName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                            Text("${c.location} • ${c.collegeType}", style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text("${c.cutoffMarks.toStringAsFixed(1)}%ile", style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 12)),
                          Text(c.formattedFees, style: const TextStyle(fontSize: 11, color: Colors.black87)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.copy),
                label: const Text("Copy Report Summary"),
                onPressed: () {
                  final collegeList = top10.map((c) => "• ${c.collegeName} (Cutoff: ${c.cutoffMarks}%ile, Fees: ${c.formattedFees})").join("\n");
                  final text = "ADMISSION REPORT FOR ${widget.studentProfile.name}\nExam: ${widget.studentProfile.examType} (${widget.studentProfile.marks}%ile)\nCategory: ${widget.studentProfile.category}\nTop Colleges:\n$collegeList";
                  Clipboard.setData(ClipboardData(text: text));
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Report summary copied to clipboard!")),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final safeCount = _allColleges.where((c) => c.tier == 'Safe').length;
    final targetCount = _allColleges.where((c) => c.tier == 'Target').length;
    final dreamCount = _allColleges.where((c) => c.tier == 'Dream').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recommendations'),
        actions: [
          if (widget.onOpenDocAudit != null)
            IconButton(
              icon: const Icon(Icons.verified_user_outlined, size: 20),
              tooltip: 'FC Document Checker',
              onPressed: widget.onOpenDocAudit,
            ),
          if (widget.onOpenScholarships != null)
            IconButton(
              icon: const Icon(Icons.account_balance_wallet_outlined, size: 20),
              tooltip: 'Scholarships',
              onPressed: widget.onOpenScholarships,
            ),
          IconButton(
            icon: const Icon(Icons.calendar_month, size: 20),
            tooltip: 'Admission Deadlines',
            onPressed: _showDeadlinesModal,
          ),
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_outlined, size: 20),
            tooltip: 'Counseling Report',
            onPressed: _showReportModal,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh recommendations',
            onPressed: _fetchColleges,
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. CANDIDATE SCORE HEADER & SENSITIVITY ADJUSTMENT (Matching Web Indigo Gradient)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primary, Color(0xFF283593), Color(0xFF1565C0)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  widget.studentProfile.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.secondary,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    widget.studentProfile.category,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryDark,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "${widget.studentProfile.examType} • ${widget.studentProfile.stream} • ${widget.studentProfile.homeDistrict}",
                              style: const TextStyle(color: Colors.white70, fontSize: 11.5),
                            ),
                          ],
                        ),
                      ),
                      // Score Box with +/- Buttons
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(25),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white.withAlpha(40)),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.remove, size: 16, color: Colors.white),
                              onPressed: () => _adjustScore(-0.5),
                              tooltip: "Decrease 0.5%ile",
                            ),
                            Text(
                              "${widget.studentProfile.marks.toStringAsFixed(1)} %ile",
                              style: const TextStyle(
                                color: AppTheme.secondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13.5,
                              ),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.add, size: 16, color: Colors.white),
                              onPressed: () => _adjustScore(0.5),
                              tooltip: "Increase 0.5%ile",
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. METRIC STRIP BUTTONS (Matching Web Strip)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    children: [
                      _metricFilterPill(
                        label: "All Matches",
                        count: _allColleges.length,
                        isSelected: _selectedTier == 'All' && !_shortlistOnly,
                        color: AppTheme.primary,
                        onTap: () => setState(() {
                          _selectedTier = 'All';
                          _shortlistOnly = false;
                        }),
                      ),
                      const SizedBox(width: 8),
                      _metricFilterPill(
                        label: "Above Cutoff",
                        count: safeCount,
                        isSelected: _selectedTier == 'Safe' && !_shortlistOnly,
                        color: const Color(0xFF16A34A),
                        onTap: () => setState(() {
                          _selectedTier = _selectedTier == 'Safe' ? 'All' : 'Safe';
                          _shortlistOnly = false;
                        }),
                      ),
                      const SizedBox(width: 8),
                      _metricFilterPill(
                        label: "Near Cutoff",
                        count: targetCount,
                        isSelected: _selectedTier == 'Target' && !_shortlistOnly,
                        color: const Color(0xFFD97706),
                        onTap: () => setState(() {
                          _selectedTier = _selectedTier == 'Target' ? 'All' : 'Target';
                          _shortlistOnly = false;
                        }),
                      ),
                      const SizedBox(width: 8),
                      _metricFilterPill(
                        label: "Below Cutoff",
                        count: dreamCount,
                        isSelected: _selectedTier == 'Dream' && !_shortlistOnly,
                        color: const Color(0xFFDC2626),
                        onTap: () => setState(() {
                          _selectedTier = _selectedTier == 'Dream' ? 'All' : 'Dream';
                          _shortlistOnly = false;
                        }),
                      ),
                      const SizedBox(width: 8),
                      _metricFilterPill(
                        label: "Shortlisted",
                        count: _shortlisted.length,
                        isSelected: _shortlistOnly,
                        color: Colors.red,
                        icon: Icons.favorite,
                        onTap: () => setState(() {
                          _shortlistOnly = !_shortlistOnly;
                        }),
                      ),
                    ],
                  ),
                ),

                // 3. THREE FEATURE QUICK-CARDS (Signature Indigo, Gold & Green Left Borders Matching Web)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      // Card 1: CAP Simulator
                      _featureQuickCard(
                        title: "CAP Admission Simulator",
                        badge: "Round 1–3 Simulation",
                        badgeBg: const Color(0xFFFEF3C7),
                        badgeColor: const Color(0xFF92400E),
                        borderColor: const Color(0xFFFFB300),
                        desc: "Simulate seat allotment, test cutoff drift, and generate an optimal choice list.",
                        onTap: () {
                          if (widget.onSwitchTab != null) {
                            widget.onSwitchTab!(2);
                          }
                        },
                      ),
                      const SizedBox(height: 8),

                      // Card 2: Scholarships
                      _featureQuickCard(
                        title: "Scholarships & Fee Concessions",
                        badge: "MahaDBT & TFWS",
                        badgeBg: const Color(0xFFD1FAE5),
                        badgeColor: const Color(0xFF065F46),
                        borderColor: const Color(0xFF10B981),
                        desc: "Calculate 50% to 100% tuition waivers for EBC, TFWS, SC/ST, and girls schemes.",
                        onTap: () {
                          if (widget.onOpenScholarships != null) {
                            widget.onOpenScholarships!();
                          }
                        },
                      ),
                      const SizedBox(height: 8),

                      // Card 3: Document Checker
                      _featureQuickCard(
                        title: "Document Verification & Proforma",
                        badge: "FC Scrutiny Audit",
                        badgeBg: const Color(0xFFEEF2FF),
                        badgeColor: const Color(0xFF3730A3),
                        borderColor: const Color(0xFF3949AB),
                        desc: "Audit mandatory caste validity, NCL certificate, and generate Proforma H affidavits.",
                        onTap: () {
                          if (widget.onOpenDocAudit != null) {
                            widget.onOpenDocAudit!();
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // 4. SEARCH & FILTER TOOLBAR
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      TextField(
                        decoration: InputDecoration(
                          hintText: "Search college, branch, or city (e.g. COEP, Pune)...",
                          prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                          isDense: true,
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, size: 16),
                                  onPressed: () => setState(() => _searchQuery = ''),
                                )
                              : null,
                        ),
                        onChanged: (val) => setState(() => _searchQuery = val.trim()),
                      ),
                      const SizedBox(height: 8),

                      // Dropdown row: State, Type, Sort
                      Row(
                        children: [
                          // State Dropdown
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.borderLight),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedState,
                                  isDense: true,
                                  isExpanded: true,
                                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textDark),
                                  items: _availableStates.map((st) {
                                    return DropdownMenuItem(value: st, child: Text(st, overflow: TextOverflow.ellipsis));
                                  }).toList(),
                                  onChanged: (v) => setState(() => _selectedState = v ?? 'All'),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),

                          // College Type Dropdown
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.borderLight),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedType,
                                  isDense: true,
                                  isExpanded: true,
                                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textDark),
                                  items: const [
                                    DropdownMenuItem(value: 'All', child: Text("All Types")),
                                    DropdownMenuItem(value: 'Government', child: Text("Govt Only")),
                                    DropdownMenuItem(value: 'Private', child: Text("Private Only")),
                                  ],
                                  onChanged: (v) => setState(() => _selectedType = v ?? 'All'),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),

                          // Sort Dropdown
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.borderLight),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _sortBy,
                                  isDense: true,
                                  isExpanded: true,
                                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textDark),
                                  items: const [
                                    DropdownMenuItem(value: 'recommended', child: Text("Best Match")),
                                    DropdownMenuItem(value: 'rating', child: Text("Top Rated")),
                                    DropdownMenuItem(value: 'fees', child: Text("Fees: Low")),
                                    DropdownMenuItem(value: 'cutoffDesc', child: Text("Cutoff: High")),
                                    DropdownMenuItem(value: 'cutoffAsc', child: Text("Cutoff: Low")),
                                  ],
                                  onChanged: (v) => setState(() => _sortBy = v ?? 'recommended'),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 5. COLLEGES LIST
                if (_isLoading) ...[
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 60),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ] else if (_filteredColleges.isEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.all(40),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.search_off, size: 48, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text("No matching colleges found", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 4),
                          const Text("Try broadening your state, score, or college type filters.", style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, _selectedForCompare.isNotEmpty ? 90 : 30),
                    child: Column(
                      children: _filteredColleges.map((college) {
                        return CollegeCard(
                          college: college,
                          isShortlisted: _shortlisted.contains(college.collegeName),
                          isCompared: _selectedForCompare.contains(college.collegeName),
                          onToggleCompare: () => _toggleCompare(college),
                          onToggleShortlist: () {
                            setState(() {
                              if (_shortlisted.contains(college.collegeName)) {
                                _shortlisted.remove(college.collegeName);
                              } else {
                                _shortlisted.add(college.collegeName);
                              }
                            });
                          },
                          onAskAI: (c) {
                            if (widget.onSwitchTab != null) {
                              final prompt = "Tell me all about ${c.collegeName}: cutoffs, placements, branch choices, and admission roadmap for my score of ${widget.studentProfile.marks}%ile in ${widget.studentProfile.examType}?";
                              widget.onSwitchTab!(3, initialPrompt: prompt);
                            }
                          },
                          onOpenReviews: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CollegeDetailsScreen(
                                  college: college,
                                  studentProfile: widget.studentProfile,
                                ),
                              ),
                            );
                          },
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CollegeDetailsScreen(
                                  college: college,
                                  studentProfile: widget.studentProfile,
                                ),
                              ),
                            );
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // 6. FLOATING COMPARISON TRAY BAR (When >= 1 college selected)
          if (_selectedForCompare.isNotEmpty)
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryDark,
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(80),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: AppTheme.secondary,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        "${_selectedForCompare.length}",
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primaryDark),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        "Colleges Selected",
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _selectedForCompare.clear()),
                      child: const Text("Clear", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ),
                    ElevatedButton(
                      onPressed: _showCompareModal,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.secondary,
                        foregroundColor: AppTheme.primaryDark,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      child: const Text("Compare →", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _metricFilterPill({
    required String label,
    required int count,
    required bool isSelected,
    required Color color,
    IconData? icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color : color.withAlpha(20),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withAlpha(isSelected ? 255 : 60)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 12, color: isSelected ? Colors.white : color),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : color,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withAlpha(60) : Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                count.toString(),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _featureQuickCard({
    required String title,
    required String badge,
    required Color badgeBg,
    required Color badgeColor,
    required Color borderColor,
    required String desc,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(10),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 48,
              decoration: BoxDecoration(
                color: borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: badgeBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor),
                        ),
                      ),
                      Row(
                        children: [
                          Text("Launch", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: borderColor)),
                          Icon(Icons.arrow_forward_ios, size: 9, color: borderColor),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    desc,
                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
