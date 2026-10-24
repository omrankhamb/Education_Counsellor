import 'dart:async';
import 'package:flutter/material.dart';
import '../models/college.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/college_card.dart';
import 'college_details_screen.dart';

class LandingHomeScreen extends StatefulWidget {
  final StudentProfile studentProfile;
  final Function(int tabIndex) onSwitchTab;
  final VoidCallback onOpenDocAudit;
  final VoidCallback onOpenScholarships;

  const LandingHomeScreen({
    super.key,
    required this.studentProfile,
    required this.onSwitchTab,
    required this.onOpenDocAudit,
    required this.onOpenScholarships,
  });

  @override
  State<LandingHomeScreen> createState() => _LandingHomeScreenState();
}

class _LandingHomeScreenState extends State<LandingHomeScreen> {
  final PageController _pageController = PageController();
  int _currentSlide = 0;
  Timer? _carouselTimer;

  // Typewriter animated headline
  final List<String> _rotatingPhrases = [
    "Based on Your Real Score",
    "Grounded in 5-Year Cutoffs",
    "Covering 3,000+ Colleges",
    "With Zero Allotment Risk",
    "For MHT-CET, NEET & JEE",
  ];
  int _phraseIdx = 0;
  String _typedHeadline = "";
  bool _isDeleting = false;
  Timer? _typewriterTimer;

  // Animated live counters
  int _collegesCount = 0;
  int _liveCount = 0;
  int _yearsCount = 0;
  Timer? _counterTimer;

  String _activeStream = 'All';
  List<College> _colleges = [];
  bool _isLoading = true;
  final Set<String> _shortlisted = {};

  final List<String> _streams = [
    'All',
    'Engineering',
    'Medical',
    'Management',
    'Science',
    'Law',
    'Commerce',
  ];

  final List<Map<String, String>> _heroSlides = [
    {
      'badge': '✨ Live AI Indian College Recommendations',
      'title': 'Find Your Ideal College',
      'subtitle': 'Based on Your Real Score',
      'desc':
          'Enter your percentile and stream — our AI dynamically evaluates 5-year cutoffs, placement packages, and merit lists to find your best matches.',
      'btn': '🚀 Open My Recommendations',
    },
    {
      'badge': '🏛️ Premier Institutes Across Maharashtra & India',
      'title': 'COEP, VJTI, AIIMS &',
      'subtitle': 'Top Tier-1 Campuses',
      'desc':
          'Compare average placement CTC, campus facilities, NIRF rankings, and closing cutoff percentiles for general and reserved categories.',
      'btn': '📊 Explore CAP Simulator',
    },
    {
      'badge': '🤖 AI Counselor with Interactive Tables',
      'title': 'Instant Cutoff Insights &',
      'subtitle': 'Admission Deadlines',
      'desc':
          'Ask detailed counseling questions and get organized comparison tables, authentic fees, and guidance in regional Indian languages.',
      'btn': '💬 Chat with AI Counselor',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadColleges();
    _startTimer();
    _startTypewriter();
    _startCounters();
  }

  @override
  void dispose() {
    _carouselTimer?.cancel();
    _typewriterTimer?.cancel();
    _counterTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startCounters() {
    int step = 0;
    const totalSteps = 30;
    _counterTimer = Timer.periodic(const Duration(milliseconds: 35), (timer) {
      step++;
      final ratio = step / totalSteps;
      final eased = 1 - (1 - ratio) * (1 - ratio) * (1 - ratio);
      if (mounted) {
        setState(() {
          _collegesCount = (eased * 3240).round();
          _liveCount = (eased * 100).round();
          _yearsCount = (eased * 5).round();
        });
      }
      if (step >= totalSteps) {
        timer.cancel();
      }
    });
  }

  void _startTypewriter() {
    _typewriterTimer = Timer.periodic(const Duration(milliseconds: 65), (_) {
      if (!mounted) return;
      final target = _rotatingPhrases[_phraseIdx];
      if (!_isDeleting && _typedHeadline == target) {
        // Pause at full word before deleting
        _isDeleting = true;
      } else if (_isDeleting && _typedHeadline.isEmpty) {
        _isDeleting = false;
        _phraseIdx = (_phraseIdx + 1) % _rotatingPhrases.length;
      } else {
        setState(() {
          if (_isDeleting) {
            _typedHeadline = target.substring(0, _typedHeadline.length - 1);
          } else {
            _typedHeadline = target.substring(0, _typedHeadline.length + 1);
          }
        });
      }
    });
  }

  void _startTimer() {
    _carouselTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_pageController.hasClients) {
        final next = (_currentSlide + 1) % _heroSlides.length;
        _pageController.animateToPage(
          next,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _loadColleges() async {
    setState(() => _isLoading = true);
    final list = await ApiService.fetchFeaturedColleges(stream: _activeStream);
    if (mounted) {
      setState(() {
        _colleges = list;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.school, size: 22, color: AppTheme.secondary),
            const SizedBox(width: 8),
            const Text(
              'EduCounsellor AI',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.table_chart_outlined, size: 20),
            tooltip: "CAP Simulator",
            onPressed: () => widget.onSwitchTab(2),
          ),
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined, size: 20),
            tooltip: "Scholarships",
            onPressed: widget.onOpenScholarships,
          ),
          IconButton(
            icon: const Icon(Icons.verified_user_outlined, size: 20),
            tooltip: "FC Document Checker",
            onPressed: widget.onOpenDocAudit,
          ),
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(30),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified, size: 13, color: AppTheme.secondary),
                const SizedBox(width: 3),
                Text(
                  "${widget.studentProfile.marks}%ile",
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadColleges,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. HERO CAROUSEL BANNER
              _buildHeroCarousel(),

              // 2. QUICK SHORTCUT TILES (CAP Simulator, Document Audit, Scholarships, Chat)
              _buildQuickActions(),

              const SizedBox(height: 16),

              // 3. STATS STRIP
              _buildStatsStrip(),

              const SizedBox(height: 20),

              // 4. STREAM SELECTOR CHIPS
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Explore by Stream",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                    ),
                    Text(
                      "${_colleges.length} Institutes",
                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              _buildStreamChips(),

              const SizedBox(height: 16),

              // 5. FEATURED COLLEGES LIST
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Premier Benchmark Colleges",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                    ),
                    TextButton(
                      onPressed: () => widget.onSwitchTab(1), // Switch to Dashboard tab
                      child: const Text("View All →", style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),

              if (_isLoading) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: CircularProgressIndicator()),
                ),
              ] else if (_colleges.isEmpty) ...[
                const Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(
                    child: Text("No colleges found for this stream."),
                  ),
                ),
              ] else ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: _colleges.map((c) {
                      return CollegeCard(
                        college: c,
                        isShortlisted: _shortlisted.contains(c.collegeName),
                        onToggleShortlist: () {
                          setState(() {
                            if (_shortlisted.contains(c.collegeName)) {
                              _shortlisted.remove(c.collegeName);
                            } else {
                              _shortlisted.add(c.collegeName);
                            }
                          });
                        },
                        onAskAI: (college) {
                          widget.onSwitchTab(3);
                        },
                        onOpenReviews: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CollegeDetailsScreen(
                                college: c,
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
                                college: c,
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

              // 6. PERSONALIZED RECOMMENDATIONS CTA BANNER (Matching Web)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, Color(0xFF3949AB)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withAlpha(50),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text(
                        "Want Personalized Recommendations for Your Score?",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        "Enter your marks or entrance exam score (MHT-CET / JEE / NEET) to see your Safe, Target, and Dream college matches.",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        onPressed: () => widget.onSwitchTab(4), // Profile Tab
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.secondary,
                          foregroundColor: AppTheme.primaryDark,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                        child: const Text(
                          "Update My Student Profile →",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroCarousel() {
    return Container(
      height: 240,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary, Color(0xFF283593), Color(0xFF1565C0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (idx) => setState(() => _currentSlide = idx),
            itemCount: _heroSlides.length,
            itemBuilder: (ctx, i) {
              final slide = _heroSlides[i];
              return Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber.withAlpha(40),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.secondary),
                      ),
                      child: Text(
                        slide['badge']!,
                        style: const TextStyle(
                          color: AppTheme.secondary,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      slide['title']!,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        height: 1.15,
                      ),
                    ),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            i == 0 && _typedHeadline.isNotEmpty ? _typedHeadline : slide['subtitle']!,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.secondary,
                              height: 1.15,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (i == 0)
                          Container(
                            width: 3,
                            height: 18,
                            margin: const EdgeInsets.only(left: 4),
                            color: AppTheme.secondary,
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      slide['desc']!,
                      style: const TextStyle(fontSize: 12, color: Colors.white70, height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () {
                        if (i == 0) widget.onSwitchTab(1); // Dashboard
                        if (i == 1) widget.onSwitchTab(2); // CAP Simulator
                        if (i == 2) widget.onSwitchTab(3); // Counselor Chat
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.secondary,
                        foregroundColor: AppTheme.primaryDark,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        visualDensity: VisualDensity.compact,
                      ),
                      child: Text(
                        slide['btn']!,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          // Dots indicator
          Positioned(
            bottom: 12,
            right: 20,
            child: Row(
              children: List.generate(
                _heroSlides.length,
                (idx) => Container(
                  margin: const EdgeInsets.only(left: 4),
                  width: _currentSlide == idx ? 18 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: _currentSlide == idx ? AppTheme.secondary : Colors.white38,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      transform: Matrix4.translationValues(0, -20, 0),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _actionTile(
                icon: Icons.table_chart_outlined,
                color: const Color(0xFF0284C7),
                label: "CAP Simulator",
                onTap: () => widget.onSwitchTab(2),
              ),
              _actionTile(
                icon: Icons.verified_user_outlined,
                color: const Color(0xFF16A34A),
                label: "FC Audit",
                onTap: widget.onOpenDocAudit,
              ),
              _actionTile(
                icon: Icons.account_balance_wallet_outlined,
                color: const Color(0xFFD97706),
                label: "MahaDBT",
                onTap: widget.onOpenScholarships,
              ),
              _actionTile(
                icon: Icons.chat_bubble_outline,
                color: const Color(0xFF9333EA),
                label: "AI Counselor",
                onTap: () => widget.onSwitchTab(3),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionTile({
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textDark),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsStrip() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(count: _collegesCount > 0 ? "$_collegesCount+" : "3,240+", label: "Colleges"),
          _StatItem(count: _liveCount > 0 ? "$_liveCount% Live" : "100% Live", label: "Real-Time AI"),
          _StatItem(count: _yearsCount > 0 ? "$_yearsCount Years" : "5 Years", label: "Trends (22-26)"),
          const _StatItem(count: "100%", label: "Official FRA"),
        ],
      ),
    );
  }

  Widget _buildStreamChips() {
    return SizedBox(
      height: 38,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _streams.length,
        itemBuilder: (ctx, i) {
          final s = _streams[i];
          final isSelected = s == _activeStream;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(s),
              selected: isSelected,
              onSelected: (val) {
                if (val) {
                  setState(() => _activeStream = s);
                  _loadColleges();
                }
              },
              backgroundColor: Colors.white,
              selectedColor: AppTheme.primary,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppTheme.textDark,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected ? AppTheme.primary : AppTheme.borderLight,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String count;
  final String label;

  const _StatItem({required this.count, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          count,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppTheme.secondary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: Colors.white70),
        ),
      ],
    );
  }
}
