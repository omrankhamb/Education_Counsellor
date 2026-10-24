import 'package:flutter/material.dart';
import '../models/college.dart';
import '../services/api_service.dart';
import '../widgets/college_card.dart';
import '../widgets/reviews_dialog.dart';
import 'college_details_screen.dart';
import 'compare_screen.dart';
import 'deadlines_screen.dart';

class DashboardPage extends StatefulWidget {
  final Function(int, {String? prompt}) onNavigateTab;
  final Set<String> shortlistedColleges;
  final Function(String) onToggleShortlist;
  final Map<String, dynamic> studentProfile;
  final VoidCallback onOpenCapSimulator;

  const DashboardPage({
    super.key,
    required this.onNavigateTab,
    required this.shortlistedColleges,
    required this.onToggleShortlist,
    required this.studentProfile,
    required this.onOpenCapSimulator,
  });

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  List<College> _colleges = [];
  bool _loading = true;

  // Search & Filters
  String _searchQuery = '';
  String _selectedState = 'All';
  String _selectedType = 'All'; // 'All', 'Government', 'Private', 'Autonomous'
  String _selectedEligibility = 'All'; // 'All', 'eligible', 'borderline', 'not_eligible'
  bool _filterShortlistOnly = false;
  String _sortBy = 'recommended'; // 'recommended', 'cutoff_desc', 'cutoff_asc', 'rating', 'fees'

  final Set<String> _comparedColleges = {};
  final TextEditingController _searchController = TextEditingController();

  final List<String> _states = ['All', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi NCR', 'Gujarat'];
  final List<String> _collegeTypes = ['All', 'Government', 'Private', 'Autonomous'];

  @override
  void initState() {
    super.initState();
    _loadColleges();
  }

  @override
  void didUpdateWidget(covariant DashboardPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.studentProfile != widget.studentProfile) {
      _loadColleges();
    }
  }

  Future<void> _loadColleges() async {
    setState(() => _loading = true);
    final prof = widget.studentProfile;
    final list = await ApiService.fetchRecommendations(
      name: prof['name'] ?? 'Omprasad',
      examType: prof['exam'] ?? 'MHT-CET',
      score: (prof['score'] as num?)?.toDouble() ?? 97.4,
      category: prof['category'] ?? 'OBC',
      stream: prof['stream'] ?? 'Engineering',
      homeDistrict: prof['district'] ?? 'Pune',
      preferredState: _selectedState == 'All' ? 'Maharashtra' : _selectedState,
    );
    if (mounted) {
      setState(() {
        _colleges = list;
        _loading = false;
      });
    }
  }

  void _toggleCompare(String name) {
    setState(() {
      if (_comparedColleges.contains(name)) {
        _comparedColleges.remove(name);
      } else {
        if (_comparedColleges.length >= 4) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You can compare up to 4 colleges at a time!')),
          );
          return;
        }
        _comparedColleges.add(name);
      }
    });
  }

  void _resetAllFilters() {
    setState(() {
      _searchQuery = '';
      _searchController.clear();
      _selectedState = 'All';
      _selectedType = 'All';
      _selectedEligibility = 'All';
      _sortBy = 'recommended';
      _filterShortlistOnly = false;
    });
  }

  void _showPdfReportDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        final prof = widget.studentProfile;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.picture_as_pdf, color: Color(0xFFEF4444)),
              SizedBox(width: 8),
              Text('Personalized Admission Report', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Candidate: ${prof['name'] ?? 'Student'}', style: const TextStyle(fontWeight: FontWeight.bold)),
              Text('Entrance Exam: ${prof['exam'] ?? 'MHT-CET'} (Score: ${prof['score'] ?? 97.4}%)'),
              Text('Category: ${prof['category'] ?? 'OBC'} • Quota: State Level'),
              const Divider(height: 20),
              const Text('Counseling Analysis:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 4),
              const Text('• Verified Institutions: 140+ Analyzed\n• Safe / Eligible Choices: COEP, VJTI, PICT Pune\n• MahaDBT Fee Concession: 50% - 100% tuition waiver\n• CAP Round Strategy: Put high-cutoff top dream branches in top 3 positions.'),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A237E), foregroundColor: Colors.white),
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('✓ Counseling Report prepared and ready!'), backgroundColor: Color(0xFF10B981)),
                );
              },
              child: const Text('Download PDF'),
            ),
          ],
        );
      },
    );
  }

  List<College> get _filteredColleges {
    var list = _colleges.where((c) {
      final matchesSearch = c.collegeName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c.location.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (c.branchSummary ?? '').toLowerCase().contains(_searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (_filterShortlistOnly) {
        if (!widget.shortlistedColleges.contains(c.collegeName)) return false;
      }

      if (_selectedEligibility != 'All') {
        if (c.eligibilityStatus != _selectedEligibility) return false;
      }

      if (_selectedType != 'All') {
        if (_selectedType == 'Government' && !c.isGovernment) return false;
        if (_selectedType == 'Private' && c.isGovernment) return false;
        if (_selectedType == 'Autonomous' && !c.isAutonomous) return false;
      }

      if (_selectedState != 'All') {
        if (!c.location.toLowerCase().contains(_selectedState.toLowerCase())) return false;
      }

      return true;
    }).toList();

    // Sorting
    if (_sortBy == 'cutoff_desc') {
      list.sort((a, b) => b.cutoffMarks.compareTo(a.cutoffMarks));
    } else if (_sortBy == 'cutoff_asc') {
      list.sort((a, b) => a.cutoffMarks.compareTo(b.cutoffMarks));
    } else if (_sortBy == 'fees') {
      list.sort((a, b) => a.annualFees.compareTo(b.annualFees));
    } else if (_sortBy == 'rating') {
      list.sort((a, b) => b.rating.compareTo(a.rating));
    }

    return list;
  }

  void _openReviews(College college) {
    showDialog(
      context: context,
      builder: (_) => ReviewsDialog(
        collegeName: college.collegeName,
        currentRating: college.rating,
      ),
    );
  }

  void _askAiAboutCollege(College college) {
    final prompt =
        'Tell me about ${college.collegeName}: 5-year cutoffs, placement CTC, branches, and admission criteria for my score in ${widget.studentProfile['exam'] ?? 'MHT-CET'}.';
    widget.onNavigateTab(3, prompt: prompt);
  }

  @override
  Widget build(BuildContext context) {
    final prof = widget.studentProfile;
    final name = prof['name'] ?? 'Omprasad';
    final exam = prof['exam'] ?? 'MHT-CET';
    final score = prof['score'] ?? 97.4;
    final stream = prof['stream'] ?? 'Engineering';

    final eligibleCount = _colleges.where((c) => c.eligibilityStatus == 'eligible').length;
    final borderCount = _colleges.where((c) => c.eligibilityStatus == 'borderline').length;
    final aspCount = _colleges.where((c) => c.eligibilityStatus == 'not_eligible').length;
    final shortlistedCount = widget.shortlistedColleges.length;

    final comparedList = _colleges.where((c) => _comparedColleges.contains(c.collegeName)).toList();

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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // App Brand Logo & Title
                  InkWell(
                    onTap: () => widget.onNavigateTab(0), // Go to Landing Home
                    child: Row(
                      children: const [
                        Icon(Icons.school, color: Color(0xFFFFB300), size: 28),
                        SizedBox(width: 8),
                        Text(
                          'EduCounsellor AI',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Right Actions
                  Row(
                    children: [
                      // Quick CAP Simulator
                      OutlinedButton.icon(
                        onPressed: widget.onOpenCapSimulator,
                        icon: const Icon(Icons.track_changes, color: Color(0xFFFFB300), size: 14),
                        label: const Text('CAP Simulator', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFFFFD54F))),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFFFB300)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Quick Deadlines
                      OutlinedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const DeadlinesScreen()),
                          );
                        },
                        icon: const Icon(Icons.calendar_month, color: Colors.white, size: 14),
                        label: const Text('Deadlines', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white38),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Score Capsule
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(35),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withAlpha(60)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFB300),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                exam == 'NEET' ? 'NEET' : 'CET',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF1A237E),
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '$score%',
                              style: const TextStyle(
                                color: Color(0xFFFFD54F),
                                fontWeight: FontWeight.bold,
                                fontSize: 12.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Talk to Counselor
                      ElevatedButton.icon(
                        icon: const Icon(Icons.headset_mic, color: Color(0xFFFFB300), size: 15),
                        label: const Text('Counselor', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1A237E))),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF1A237E),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          elevation: 1,
                        ),
                        onPressed: () => widget.onNavigateTab(3), // AI Chat
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
          constraints: const BoxConstraints(maxWidth: 1280),
          child: Column(
            children: [
              Expanded(
                child: CustomScrollView(
                  slivers: [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      sliver: SliverToBoxAdapter(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 1. SLEEK HERO GREETING & 5 METRIC PILLS
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(10),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEEF2FF),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  '✓ Verified Recommendations',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1A237E),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '• Exam: $exam',
                                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.school, color: Color(0xFF1A237E), size: 26),
                              const SizedBox(width: 8),
                              Text(
                                'Welcome, $name!',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF1A237E),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Targeting $stream in ${_selectedState == 'All' ? 'Maharashtra & All India' : _selectedState} with your verified score of $score%.',
                            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 18),

                          // 5 Interactive Filters Strip (Matches Web UI)
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              // 1. All Matches
                              _buildMetricPill(
                                label: 'All Matches',
                                count: _colleges.length,
                                isSelected: _selectedEligibility == 'All' && !_filterShortlistOnly,
                                selectedColor: const Color(0xFF1A237E),
                                icon: Icons.list_alt,
                                onTap: () {
                                  setState(() {
                                    _selectedEligibility = 'All';
                                    _filterShortlistOnly = false;
                                  });
                                },
                              ),

                              // 2. Above Cutoff
                              _buildMetricPill(
                                label: 'Above cutoff',
                                count: eligibleCount,
                                isSelected: _selectedEligibility == 'eligible' && !_filterShortlistOnly,
                                selectedColor: const Color(0xFF10B981),
                                unselectedBg: const Color(0xFFF0FDF4),
                                unselectedBorder: const Color(0xFFBBF7D0),
                                unselectedText: const Color(0xFF15803D),
                                icon: Icons.check_circle,
                                onTap: () {
                                  setState(() {
                                    _selectedEligibility = _selectedEligibility == 'eligible' ? 'All' : 'eligible';
                                    _filterShortlistOnly = false;
                                  });
                                },
                              ),

                              // 3. Near Cutoff
                              _buildMetricPill(
                                label: 'Near cutoff',
                                count: borderCount,
                                isSelected: _selectedEligibility == 'borderline' && !_filterShortlistOnly,
                                selectedColor: const Color(0xFFF59E0B),
                                unselectedBg: const Color(0xFFFFFBEB),
                                unselectedBorder: const Color(0xFFFDE68A),
                                unselectedText: const Color(0xFFB45309),
                                icon: Icons.warning_amber_rounded,
                                onTap: () {
                                  setState(() {
                                    _selectedEligibility = _selectedEligibility == 'borderline' ? 'All' : 'borderline';
                                    _filterShortlistOnly = false;
                                  });
                                },
                              ),

                              // 4. Below Cutoff
                              _buildMetricPill(
                                label: 'Below cutoff',
                                count: aspCount,
                                isSelected: _selectedEligibility == 'not_eligible' && !_filterShortlistOnly,
                                selectedColor: const Color(0xFFEF4444),
                                unselectedBg: const Color(0xFFFEF2F2),
                                unselectedBorder: const Color(0xFFFECACA),
                                unselectedText: const Color(0xFFB91C1C),
                                icon: Icons.cancel_outlined,
                                onTap: () {
                                  setState(() {
                                    _selectedEligibility = _selectedEligibility == 'not_eligible' ? 'All' : 'not_eligible';
                                    _filterShortlistOnly = false;
                                  });
                                },
                              ),

                              // 5. Shortlisted
                              _buildMetricPill(
                                label: 'Shortlist',
                                count: shortlistedCount,
                                isSelected: _filterShortlistOnly,
                                selectedColor: const Color(0xFF4338CA),
                                unselectedBg: const Color(0xFFEEF2FF),
                                unselectedBorder: const Color(0xFFC7D2FE),
                                unselectedText: const Color(0xFF3730A3),
                                icon: Icons.favorite,
                                onTap: () {
                                  setState(() {
                                    _filterShortlistOnly = !_filterShortlistOnly;
                                  });
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 2. THREE QUICK ACTION CARDS (CAP Simulator | Scholarships | Report)
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isMulti = constraints.maxWidth > 700;
                        if (isMulti) {
                          return Row(
                            children: [
                              Expanded(child: _buildActionCard(
                                title: 'CAP Simulator',
                                desc: 'Simulate Rounds 1-3 CAP Mock Allotment & Generate Option Form',
                                btnText: 'Launch CAP Simulator →',
                                icon: Icons.track_changes,
                                iconColor: const Color(0xFFF59E0B),
                                onTap: widget.onOpenCapSimulator,
                              )),
                              const SizedBox(width: 12),
                              Expanded(child: _buildActionCard(
                                title: 'MahaDBT Scholarships',
                                desc: 'Calculate Tuition Waivers: EBC, TFWS, SC/ST, Minority Schemes',
                                btnText: 'Browse 24+ Scholarships →',
                                icon: Icons.monetization_on,
                                iconColor: const Color(0xFF10B981),
                                onTap: () => widget.onNavigateTab(2), // Scholarships
                              )),
                              const SizedBox(width: 12),
                              Expanded(child: _buildActionCard(
                                title: 'Admission Report',
                                desc: 'Download Full Analysis, Cutoff Trends, Placement Breakdown',
                                btnText: 'View Full Report →',
                                icon: Icons.picture_as_pdf,
                                iconColor: const Color(0xFF2563EB),
                                onTap: _showPdfReportDialog,
                              )),
                            ],
                          );
                        }

                        return Column(
                          children: [
                            _buildActionCard(
                              title: 'CAP Simulator',
                              desc: 'Simulate Rounds 1-3 CAP Mock Allotment & Generate Option Form',
                              btnText: 'Launch CAP Simulator →',
                              icon: Icons.track_changes,
                              iconColor: const Color(0xFFF59E0B),
                              onTap: widget.onOpenCapSimulator,
                            ),
                            const SizedBox(height: 10),
                            _buildActionCard(
                              title: 'MahaDBT Scholarships',
                              desc: 'Calculate Tuition Waivers: EBC, TFWS, SC/ST, Minority Schemes',
                              btnText: 'Browse 24+ Scholarships →',
                              icon: Icons.monetization_on,
                              iconColor: const Color(0xFF10B981),
                              onTap: () => widget.onNavigateTab(2),
                            ),
                            const SizedBox(height: 10),
                            _buildActionCard(
                              title: 'Admission Report',
                              desc: 'Download Full Analysis, Cutoff Trends, Placement Breakdown',
                              btnText: 'View Full Report →',
                              icon: Icons.picture_as_pdf,
                              iconColor: const Color(0xFF2563EB),
                              onTap: _showPdfReportDialog,
                            ),
                          ],
                        );
                      },
                    ),

                    const SizedBox(height: 16),

                    // 3. SEARCH & FILTER TOOLBAR
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          // Search field
                          TextField(
                            controller: _searchController,
                            onChanged: (val) => setState(() => _searchQuery = val),
                            decoration: InputDecoration(
                              hintText: 'Search college name, branch, city...',
                              hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                              prefixIcon: const Icon(Icons.search, color: Color(0xFF1A237E)),
                              suffixIcon: _searchQuery.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() => _searchQuery = '');
                                      },
                                    )
                                  : null,
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              contentPadding: const EdgeInsets.symmetric(vertical: 10),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Dropdowns row: State | Type | Sort
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: [
                              // State Dropdown
                              _buildDropdown(
                                label: 'State',
                                value: _selectedState,
                                items: _states,
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() => _selectedState = val);
                                    _loadColleges();
                                  }
                                },
                              ),

                              // Type Dropdown
                              _buildDropdown(
                                label: 'Type',
                                value: _selectedType,
                                items: _collegeTypes,
                                onChanged: (val) {
                                  if (val != null) setState(() => _selectedType = val);
                                },
                              ),

                              // Sort Dropdown
                              _buildDropdown(
                                label: 'Sort By',
                                value: _sortBy,
                                items: const ['recommended', 'cutoff_desc', 'cutoff_asc', 'rating', 'fees'],
                                itemLabels: const {
                                  'recommended': 'AI Recommended',
                                  'cutoff_desc': 'Highest Cutoff',
                                  'cutoff_asc': 'Lowest Cutoff',
                                  'rating': 'Top Rated',
                                  'fees': 'Lowest Fees',
                                },
                                onChanged: (val) {
                                  if (val != null) setState(() => _sortBy = val);
                                },
                              ),

                              // Reset Filters Button
                              OutlinedButton.icon(
                                onPressed: _resetAllFilters,
                                icon: const Icon(Icons.refresh, size: 14, color: Color(0xFF64748B)),
                                label: const Text('Reset', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Showing count info
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Showing ${_filteredColleges.length} Verified Colleges',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF334155),
                          ),
                        ),
                        if (_comparedColleges.isNotEmpty)
                          TextButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => CompareScreen(
                                    colleges: comparedList,
                                    onRemove: (name) => _toggleCompare(name),
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.balance, size: 14, color: Color(0xFF1A237E)),
                            label: Text(
                              'Compare (${_comparedColleges.length})',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 12),

                        ],
                      ),
                    ),
                  ),

                  // 4. COLLEGES GRID (Virtualized & locked to 452px height - NO extra space!)
                  if (_loading)
                    const SliverToBoxAdapter(
                      child: Center(
                        child: Padding(
                          padding: EdgeInsets.all(40),
                          child: CircularProgressIndicator(color: Color(0xFF1A237E)),
                        ),
                      ),
                    )
                  else if (_filteredColleges.isEmpty)
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverToBoxAdapter(
                        child: Container(
                          padding: const EdgeInsets.all(40),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            children: [
                              const Icon(Icons.search_off, size: 48, color: Color(0xFF94A3B8)),
                              const SizedBox(height: 12),
                              const Text(
                                'No colleges match the active filters.',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Try resetting your search query, state, or eligibility filter.',
                                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _resetAllFilters,
                                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A237E), foregroundColor: Colors.white),
                                child: const Text('Reset All Filters'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      sliver: SliverGrid.builder(
                        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 600,
                          mainAxisExtent: 452,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: _filteredColleges.length,
                        itemBuilder: (context, idx) {
                          final col = _filteredColleges[idx];
                          return CollegeCard(
                            college: col,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => CollegeDetailsScreen(
                                    college: col,
                                    isShortlisted: widget.shortlistedColleges.contains(col.collegeName),
                                    onToggleShortlist: () => widget.onToggleShortlist(col.collegeName),
                                    onAskAi: (prompt) => widget.onNavigateTab(3, prompt: prompt),
                                  ),
                                ),
                              );
                            },
                            onOpenReviews: () => _openReviews(col),
                            onAskAi: () => _askAiAboutCollege(col),
                            isShortlisted: widget.shortlistedColleges.contains(col.collegeName),
                            onToggleShortlist: () => widget.onToggleShortlist(col.collegeName),
                            isCompared: _comparedColleges.contains(col.collegeName),
                            onToggleCompare: () => _toggleCompare(col.collegeName),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),

              // 5. FLOATING COMPARE DRAWER (If 1-4 colleges selected)
              if (_comparedColleges.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    boxShadow: [
                      BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, -4)),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.balance, color: Color(0xFFFFB300), size: 22),
                      const SizedBox(width: 10),
                      Text(
                        '${_comparedColleges.length} Colleges selected to compare',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => setState(() => _comparedColleges.clear()),
                        child: const Text('Clear', style: TextStyle(color: Colors.white70)),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CompareScreen(
                                colleges: comparedList,
                                onRemove: (name) => _toggleCompare(name),
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFB300),
                          foregroundColor: const Color(0xFF1A237E),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Compare Now →', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricPill({
    required String label,
    required int count,
    required bool isSelected,
    required Color selectedColor,
    Color unselectedBg = const Color(0xFFF8FAFC),
    Color unselectedBorder = const Color(0xFFE2E8F0),
    Color unselectedText = const Color(0xFF64748B),
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? selectedColor : unselectedBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isSelected ? selectedColor : unselectedBorder),
          boxShadow: isSelected
              ? [BoxShadow(color: selectedColor.withAlpha(40), blurRadius: 6, offset: const Offset(0, 2))]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: isSelected ? Colors.white : unselectedText),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : unselectedText,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withAlpha(50) : unselectedBorder,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : unselectedText,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required String title,
    required String desc,
    required String btnText,
    required IconData icon,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            desc,
            style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.4),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: onTap,
            child: Row(
              children: [
                Text(
                  btnText,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A237E),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    Map<String, String>? itemLabels,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          onChanged: onChanged,
          isDense: true,
          style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A)),
          items: items.map((it) {
            final displayText = itemLabels != null && itemLabels.containsKey(it) ? itemLabels[it]! : it;
            return DropdownMenuItem<String>(
              value: it,
              child: Text('$label: $displayText'),
            );
          }).toList(),
        ),
      ),
    );
  }
}
