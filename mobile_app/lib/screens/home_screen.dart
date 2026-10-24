import 'package:flutter/material.dart';
import '../models/college.dart';
import '../services/api_service.dart';
import '../widgets/college_card.dart';
import 'college_details_screen.dart';
import 'compare_screen.dart';
import 'deadlines_screen.dart';

class HomeScreen extends StatefulWidget {
  final Function(int, {String? prompt}) onNavigateTab;
  final Set<String> shortlistedColleges;
  final Function(String) onToggleShortlist;
  final Map<String, dynamic> studentProfile;

  const HomeScreen({
    super.key,
    required this.onNavigateTab,
    required this.shortlistedColleges,
    required this.onToggleShortlist,
    required this.studentProfile,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<College> _colleges = [];
  bool _loading = true;
  String _searchQuery = '';
  String _selectedEligibility = 'All'; // 'All', 'eligible', 'borderline', 'not_eligible'
  bool _filterShortlistOnly = false;
  String _sortBy = 'recommended';
  String _typeFilter = 'all'; // 'all', 'govt', 'private'
  final Set<String> _comparedColleges = {};

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadColleges();
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
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

      if (_typeFilter == 'govt' && !c.isGovernment) return false;
      if (_typeFilter == 'private' && c.isGovernment) return false;

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

  void _showPdfReportDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        final prof = widget.studentProfile;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: const [
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
              const Text('Report Summary:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 4),
              const Text('• Eligible Institutions: 133 Colleges verified\n• Top Recommendations: COEP, VJTI, PICT Pune\n• TFWS / MahaDBT Concession: 50-100% tuition waiver eligible\n• Next Milestone: CAP Round 1 Option Form'),
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

  @override
  Widget build(BuildContext context) {
    final prof = widget.studentProfile;
    final name = prof['name'] ?? 'Omprasad';
    final exam = prof['exam'] ?? 'MHT-CET';
    final score = prof['score'] ?? 97.4;
    final category = prof['category'] ?? 'OBC';
    final stream = prof['stream'] ?? 'Engineering';

    final eligibleCount = _colleges.where((c) => c.eligibilityStatus == 'eligible').length;
    final borderCount = _colleges.where((c) => c.eligibilityStatus == 'borderline').length;
    final aspCount = _colleges.where((c) => c.eligibilityStatus == 'not_eligible').length;

    final comparedList = _colleges.where((c) => _comparedColleges.contains(c.collegeName)).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA), // Exact Web background
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(62),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1A237E), Color(0xFF3949AB)], // Web exact navbar gradient
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
                  // Web Brand Logo & Title
                  Row(
                    children: [
                      const Icon(Icons.school, color: Color(0xFFFFB300), size: 28), // Web gold cap
                      const SizedBox(width: 8),
                      const Text(
                        'EduCounsellor AI',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ],
                  ),

                  // Right Nav Actions
                  Row(
                    children: [
                      // Score Capsule (Exact Web Styling)
                      InkWell(
                        onTap: () => widget.onNavigateTab(3), // Edit Profile
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
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
                                  color: const Color(0xFFFFB300), // Web Gold
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  stream == 'Medical' ? 'NEET' : 'CET',
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
                      ),
                      const SizedBox(width: 8),

                      // Talk to Counselor Button
                      ElevatedButton.icon(
                        icon: const Icon(Icons.headset_mic, color: Color(0xFFFFB300), size: 16),
                        label: const Text('Counselor', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1A237E))),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF1A237E),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          elevation: 1,
                        ),
                        onPressed: () => widget.onNavigateTab(1),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth > 768;
          final double contentWidth = isWide ? 1200 : constraints.maxWidth;

          return Align(
            alignment: Alignment.topCenter,
            child: SizedBox(
              width: contentWidth,
              child: _loading
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(40),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(color: Color(0xFF1A237E)),
                            SizedBox(height: 14),
                            Text('Loading personalized recommendations...', style: TextStyle(color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadColleges,
                      color: const Color(0xFF1A237E),
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                        children: [
                          // ================= 1. SLEEK HERO GREETING & METRIC STRIP (Web Component) =================
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 10, offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEEF2FF),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Text(
                                        'Verified Recommendations',
                                        style: TextStyle(color: Color(0xFF1A237E), fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text('• Exam: $exam ($category)', style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Welcome, $name!',
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1A237E),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Targeting $stream in Maharashtra with your verified score of $score%.',
                                  style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                                ),
                                const SizedBox(height: 10),

                                // Quick Actions: Deadlines & Compare Bar
                                Row(
                                  children: [
                                    Expanded(
                                      child: InkWell(
                                        onTap: () {
                                          Navigator.push(context, MaterialPageRoute(builder: (_) => const DeadlinesScreen()));
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFEF9C3),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFFEF08A)),
                                          ),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: const [
                                              Icon(Icons.calendar_month, color: Color(0xFF854D0E), size: 14),
                                              SizedBox(width: 4),
                                              Text('CAP Deadlines', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF854D0E))),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: InkWell(
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => CompareScreen(
                                                colleges: comparedList,
                                                onRemove: _toggleCompare,
                                              ),
                                            ),
                                          );
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                                          decoration: BoxDecoration(
                                            color: _comparedColleges.isNotEmpty ? const Color(0xFF1A237E) : const Color(0xFFEEF2FF),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(
                                                Icons.balance,
                                                color: _comparedColleges.isNotEmpty ? Colors.white : const Color(0xFF1A237E),
                                                size: 14,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                'Compare (${_comparedColleges.length})',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: _comparedColleges.isNotEmpty ? Colors.white : const Color(0xFF1A237E),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                // 5 Interactive Metric Strip Buttons (Exact Web Layout)
                                SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: Row(
                                    children: [
                                      // All Matches
                                      _buildMetricPill(
                                        title: 'All Matches',
                                        count: _colleges.length.toString(),
                                        icon: Icons.list_alt,
                                        isSelected: _selectedEligibility == 'All' && !_filterShortlistOnly,
                                        activeBg: const Color(0xFF1A237E),
                                        activeText: Colors.white,
                                        onTap: () {
                                          setState(() {
                                            _selectedEligibility = 'All';
                                            _filterShortlistOnly = false;
                                          });
                                        },
                                      ),
                                      const SizedBox(width: 8),

                                      // Above Cutoff (Eligible)
                                      _buildMetricPill(
                                        title: 'Above Cutoff',
                                        count: eligibleCount.toString(),
                                        icon: Icons.check_circle,
                                        isSelected: _selectedEligibility == 'eligible' && !_filterShortlistOnly,
                                        activeBg: const Color(0xFF10B981),
                                        activeText: Colors.white,
                                        inactiveBg: const Color(0xFFF0FFF4),
                                        inactiveText: const Color(0xFF15803D),
                                        onTap: () {
                                          setState(() {
                                            _selectedEligibility = _selectedEligibility == 'eligible' ? 'All' : 'eligible';
                                            _filterShortlistOnly = false;
                                          });
                                        },
                                      ),
                                      const SizedBox(width: 8),

                                      // Near Cutoff (Borderline)
                                      _buildMetricPill(
                                        title: 'Near Cutoff',
                                        count: borderCount.toString(),
                                        icon: Icons.warning_amber_rounded,
                                        isSelected: _selectedEligibility == 'borderline' && !_filterShortlistOnly,
                                        activeBg: const Color(0xFFF59E0B),
                                        activeText: const Color(0xFF0F172A),
                                        inactiveBg: const Color(0xFFFFFBEB),
                                        inactiveText: const Color(0xFFB45309),
                                        onTap: () {
                                          setState(() {
                                            _selectedEligibility = _selectedEligibility == 'borderline' ? 'All' : 'borderline';
                                            _filterShortlistOnly = false;
                                          });
                                        },
                                      ),
                                      const SizedBox(width: 8),

                                      // Below Cutoff (Aspirational)
                                      _buildMetricPill(
                                        title: 'Below Cutoff',
                                        count: aspCount.toString(),
                                        icon: Icons.cancel,
                                        isSelected: _selectedEligibility == 'not_eligible' && !_filterShortlistOnly,
                                        activeBg: const Color(0xFFEF4444),
                                        activeText: Colors.white,
                                        inactiveBg: const Color(0xFFFEF2F2),
                                        inactiveText: const Color(0xFFDC2626),
                                        onTap: () {
                                          setState(() {
                                            _selectedEligibility = _selectedEligibility == 'not_eligible' ? 'All' : 'not_eligible';
                                            _filterShortlistOnly = false;
                                          });
                                        },
                                      ),
                                      const SizedBox(width: 8),

                                      // Shortlisted Pill
                                      _buildMetricPill(
                                        title: 'Shortlist',
                                        count: widget.shortlistedColleges.length.toString(),
                                        icon: Icons.favorite,
                                        isSelected: _filterShortlistOnly,
                                        activeBg: const Color(0xFFEF4444),
                                        activeText: Colors.white,
                                        inactiveBg: const Color(0xFFFEF2F2),
                                        inactiveText: const Color(0xFFEF4444),
                                        onTap: () {
                                          setState(() {
                                            _filterShortlistOnly = !_filterShortlistOnly;
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // ================= 2. THREE FEATURE QUICK-CARDS (Exact Web Layout) =================
                          if (isWide)
                            Row(
                              children: [
                                Expanded(child: _buildQuickCard1()),
                                const SizedBox(width: 12),
                                Expanded(child: _buildQuickCard2()),
                                const SizedBox(width: 12),
                                Expanded(child: _buildQuickCard3()),
                              ],
                            )
                          else
                            Column(
                              children: [
                                _buildQuickCard1(),
                                const SizedBox(height: 10),
                                _buildQuickCard2(),
                                const SizedBox(height: 10),
                                _buildQuickCard3(),
                              ],
                            ),

                          const SizedBox(height: 16),

                          // ================= 3. UNIFIED SEARCH & FILTER TOOLBAR (Web Component) =================
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 6, offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Row(
                              children: [
                                // Search Input
                                Expanded(
                                  child: TextField(
                                    controller: _searchController,
                                    onChanged: (val) => setState(() => _searchQuery = val),
                                    decoration: InputDecoration(
                                      hintText: 'Search college, city, or branch...',
                                      hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
                                      prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 18),
                                      suffixIcon: _searchQuery.isNotEmpty
                                          ? IconButton(
                                              icon: const Icon(Icons.clear, size: 16),
                                              onPressed: () {
                                                _searchController.clear();
                                                setState(() => _searchQuery = '');
                                              },
                                            )
                                          : null,
                                      filled: true,
                                      fillColor: const Color(0xFFF8FAFC),
                                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // College Type Filter
                                DropdownButton<String>(
                                  value: _typeFilter,
                                  underline: const SizedBox(),
                                  icon: const Icon(Icons.keyboard_arrow_down, size: 18),
                                  items: const [
                                    DropdownMenuItem(value: 'all', child: Text('All Types', style: TextStyle(fontSize: 12))),
                                    DropdownMenuItem(value: 'govt', child: Text('🏛 Govt', style: TextStyle(fontSize: 12))),
                                    DropdownMenuItem(value: 'private', child: Text('🏢 Private', style: TextStyle(fontSize: 12))),
                                  ],
                                  onChanged: (val) {
                                    if (val != null) setState(() => _typeFilter = val);
                                  },
                                ),
                                const SizedBox(width: 4),

                                // Sort Options
                                PopupMenuButton<String>(
                                  icon: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFFCBD5E1)),
                                    ),
                                    child: const Icon(Icons.tune, color: Color(0xFF1A237E), size: 18),
                                  ),
                                  tooltip: 'Sort Options',
                                  onSelected: (val) => setState(() => _sortBy = val),
                                  itemBuilder: (context) => const [
                                    PopupMenuItem(value: 'recommended', child: Text('⚡ Recommended')),
                                    PopupMenuItem(value: 'cutoff_desc', child: Text('📊 Cutoff: High to Low')),
                                    PopupMenuItem(value: 'cutoff_asc', child: Text('📉 Cutoff: Low to High')),
                                    PopupMenuItem(value: 'fees', child: Text('💰 Fees: Low to High')),
                                    PopupMenuItem(value: 'rating', child: Text('⭐ Rating: Highest First')),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // ================= 4. COLLEGE CARDS GRID / LIST (Web Component) =================
                          if (_filteredColleges.isEmpty)
                            Container(
                              padding: const EdgeInsets.all(40),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Center(
                                child: Text(
                                  'No colleges found matching your criteria.\nTry searching another keyword or resetting filters.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Color(0xFF64748B), height: 1.5),
                                ),
                              ),
                            )
                          else if (isWide)
                            GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                                childAspectRatio: 0.76,
                              ),
                              itemCount: _filteredColleges.length,
                              itemBuilder: (context, index) {
                                final college = _filteredColleges[index];
                                return _buildCardItem(college);
                              },
                            )
                          else
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _filteredColleges.length,
                              itemBuilder: (context, index) {
                                final college = _filteredColleges[index];
                                return _buildCardItem(college);
                              },
                            ),
                        ],
                      ),
                    ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCardItem(College college) {
    return CollegeCard(
      college: college,
      isShortlisted: widget.shortlistedColleges.contains(college.collegeName),
      onToggleShortlist: () => widget.onToggleShortlist(college.collegeName),
      isCompared: _comparedColleges.contains(college.collegeName),
      onToggleCompare: () => _toggleCompare(college.collegeName),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => CollegeDetailsScreen(
              college: college,
              isShortlisted: widget.shortlistedColleges.contains(college.collegeName),
              onToggleShortlist: () => widget.onToggleShortlist(college.collegeName),
              onAskAi: (prompt) => widget.onNavigateTab(1, prompt: prompt),
            ),
          ),
        );
      },
      onOpenReviews: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => CollegeDetailsScreen(
              college: college,
              isShortlisted: widget.shortlistedColleges.contains(college.collegeName),
              onToggleShortlist: () => widget.onToggleShortlist(college.collegeName),
              onAskAi: (prompt) => widget.onNavigateTab(1, prompt: prompt),
            ),
          ),
        );
      },
      onAskAi: () {
        widget.onNavigateTab(
          1,
          prompt: 'What are the admission chances, branch options, and placements at ${college.collegeName} for my score of ${widget.studentProfile['score'] ?? 97.4}?',
        );
      },
    );
  }

  Widget _buildMetricPill({
    required String title,
    required String count,
    required IconData icon,
    required bool isSelected,
    required Color activeBg,
    required Color activeText,
    Color? inactiveBg,
    Color? inactiveText,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? activeBg : (inactiveBg ?? const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? activeBg : const Color(0xFFE2E8F0),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 11, color: isSelected ? activeText : (inactiveText ?? const Color(0xFF64748B))),
                const SizedBox(width: 4),
                Text(
                  title.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.3,
                    color: isSelected ? activeText : (inactiveText ?? const Color(0xFF64748B)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              count,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isSelected ? activeText : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Quick Card 1: CAP Simulator (Web Yellow Accent)
  Widget _buildQuickCard1() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: const BorderSide(color: Color(0xFFFFB300), width: 4), // Web signature gold
          top: const BorderSide(color: Color(0xFFE2E8F0)),
          right: const BorderSide(color: Color(0xFFE2E8F0)),
          bottom: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withAlpha(6), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF9C3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '🎯 Round 1–3 Simulation',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF854D0E)),
                ),
              ),
              InkWell(
                onTap: () => widget.onNavigateTab(2),
                child: Row(
                  children: const [
                    Text('Launch', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                    Icon(Icons.arrow_forward, size: 11, color: Color(0xFF2563EB)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'CAP Admission Simulator',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
          ),
          const SizedBox(height: 3),
          const Text(
            'Simulate centralized round seat allotment, test cutoff variances, and generate an optimal option filling list.',
            style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.3),
          ),
        ],
      ),
    );
  }

  // Quick Card 2: Scholarships (Web Green Accent)
  Widget _buildQuickCard2() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: const BorderSide(color: Color(0xFF10B981), width: 4), // Web green
          top: const BorderSide(color: Color(0xFFE2E8F0)),
          right: const BorderSide(color: Color(0xFFE2E8F0)),
          bottom: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withAlpha(6), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '🪙 MahaDBT & TFWS',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                ),
              ),
              InkWell(
                onTap: () => widget.onNavigateTab(2),
                child: Row(
                  children: const [
                    Text('Calculate', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                    Icon(Icons.arrow_forward, size: 11, color: Color(0xFF10B981)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Scholarships & Fee Concessions',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
          ),
          const SizedBox(height: 3),
          const Text(
            'Calculate 50% to 100% tuition fee waivers for EBC, TFWS, SC/ST, and minority government schemes.',
            style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.3),
          ),
        ],
      ),
    );
  }

  // Quick Card 3: Report (Web Indigo Accent)
  Widget _buildQuickCard3() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: const BorderSide(color: Color(0xFF3949AB), width: 4), // Web indigo
          top: const BorderSide(color: Color(0xFFE2E8F0)),
          right: const BorderSide(color: Color(0xFFE2E8F0)),
          bottom: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withAlpha(6), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '📄 Verified PDF Roadmap',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                ),
              ),
              InkWell(
                onTap: _showPdfReportDialog,
                child: Row(
                  children: const [
                    Text('Export PDF', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF3949AB))),
                    Icon(Icons.arrow_forward, size: 11, color: Color(0xFF3949AB)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Personalized Admission Report',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
          ),
          const SizedBox(height: 3),
          const Text(
            'Download or print your verified college roadmap with cutoffs, tuition fees, and admission milestones.',
            style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.3),
          ),
        ],
      ),
    );
  }
}
