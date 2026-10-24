import 'dart:async';
import 'package:flutter/material.dart';
import '../models/college.dart';
import '../services/api_service.dart';
import '../widgets/college_card.dart';
import '../widgets/reviews_dialog.dart';
import 'college_details_screen.dart';

class LandingHomePage extends StatefulWidget {
  final Function(int, {String? prompt}) onNavigateTab;
  final Set<String> shortlistedColleges;
  final Function(String) onToggleShortlist;
  final Map<String, dynamic> studentProfile;
  final VoidCallback onOpenCapSimulator;

  const LandingHomePage({
    super.key,
    required this.onNavigateTab,
    required this.shortlistedColleges,
    required this.onToggleShortlist,
    required this.studentProfile,
    required this.onOpenCapSimulator,
  });

  @override
  State<LandingHomePage> createState() => _LandingHomePageState();
}

class _LandingHomePageState extends State<LandingHomePage> {
  final PageController _carouselController = PageController();
  int _currentSlide = 0;
  Timer? _carouselTimer;

  String _activeStream = 'All';
  List<College> _featuredColleges = [];
  bool _loading = true;
  final Set<String> _comparedColleges = {};
  final ScrollController _scrollController = ScrollController();

  final List<Map<String, String>> _slides = [
    {
      'badge': '✨ Live AI Indian College Recommendations',
      'title1': 'Find Your Ideal College',
      'title2': 'Based on Your Real Score',
      'desc':
          'Enter your marks and stream — our AI dynamically evaluates 5-year cutoffs, placement packages, and merit lists to find your best matches.',
      'btn': '🚀 Open My Dashboard',
    },
    {
      'badge': '🏛️ Premier Institutes Across Maharashtra & India',
      'title1': 'COEP, VJTI, AIIMS &',
      'title2': 'Top Tier-1 Campuses',
      'desc':
          'Compare average placement CTC, campus facilities, NIRF rankings, and closing cutoff percentiles for general and reserved categories.',
      'btn': 'Check My Eligibility Now →',
    },
    {
      'badge': '🤖 AI Counselor with Interactive Tables',
      'title1': 'Instant Cutoff Tables &',
      'title2': 'Admission Deadlines',
      'desc':
          'Ask detailed questions like "5-year cutoff comparison for CSE" and get organized tables and counselor insights in seconds.',
      'btn': 'Chat with AI Counselor →',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadFeatured();
    _startCarouselTimer();
  }

  @override
  void dispose() {
    _carouselTimer?.cancel();
    _carouselController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _startCarouselTimer() {
    _carouselTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_carouselController.hasClients) {
        final nextPage = (_currentSlide + 1) % _slides.length;
        _carouselController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _loadFeatured() async {
    setState(() => _loading = true);
    final list = await ApiService.fetchFeaturedColleges(stream: _activeStream);
    if (mounted) {
      setState(() {
        _featuredColleges = list;
        _loading = false;
      });
    }
  }

  void _onStreamChanged(String stream) {
    if (_activeStream == stream) return;
    setState(() => _activeStream = stream);
    _loadFeatured();
  }

  void _scrollToColleges() {
    _scrollController.animateTo(
      650,
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
    );
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
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // 1. STICKY APP BAR (Web Signature Indigo Gradient)
          SliverAppBar(
            pinned: true,
            elevation: 2,
            backgroundColor: const Color(0xFF1A237E),
            flexibleSpace: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                ),
              ),
            ),
            title: Row(
              children: [
                const Icon(Icons.school, color: Color(0xFFFFB300), size: 28),
                const SizedBox(width: 8),
                const Text(
                  'EduCounsellor AI',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            actions: [
              // CAP Simulator Button
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                child: OutlinedButton.icon(
                  onPressed: widget.onOpenCapSimulator,
                  icon: const Icon(Icons.track_changes, color: Color(0xFFFFB300), size: 14),
                  label: const Text(
                    'CAP Simulator',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFFFFD54F)),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFFB300)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                  ),
                ),
              ),

              // Scholarships Button
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                child: OutlinedButton.icon(
                  onPressed: () => widget.onNavigateTab(2), // Scholarships tab
                  icon: const Icon(Icons.monetization_on, color: Colors.white, size: 14),
                  label: const Text(
                    'Scholarships',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                  ),
                ),
              ),

              // Dashboard CTA Button
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                child: ElevatedButton.icon(
                  onPressed: () => widget.onNavigateTab(1), // Dashboard tab
                  icon: const Icon(Icons.dashboard, size: 14, color: Color(0xFF1A237E)),
                  label: const Text(
                    'Dashboard →',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFB300),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
              ),
            ],
          ),

          // 2. HERO SLIDER BANNER (Gradient #1A237E -> #283593 -> #1565C0)
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1A237E), Color(0xFF283593), Color(0xFF1565C0)],
                ),
              ),
              child: Column(
                children: [
                  SizedBox(
                    height: 380,
                    child: PageView.builder(
                      controller: _carouselController,
                      itemCount: _slides.length,
                      onPageChanged: (idx) => setState(() => _currentSlide = idx),
                      itemBuilder: (context, index) {
                        final slide = _slides[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 820),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  // Badge
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFB300).withAlpha(45),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: const Color(0xFFFFB300)),
                                    ),
                                    child: Text(
                                      slide['badge']!,
                                      style: const TextStyle(
                                        color: Color(0xFFFFD54F),
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 14),

                                  // Title
                                  Text(
                                    slide['title1']!,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      height: 1.15,
                                    ),
                                  ),
                                  Text(
                                    slide['title2']!,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFFFFB300), // Web Gold
                                      height: 1.15,
                                    ),
                                  ),
                                  const SizedBox(height: 14),

                                  // Desc
                                  Text(
                                    slide['desc']!,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.white70,
                                      height: 1.5,
                                    ),
                                  ),
                                  const SizedBox(height: 22),

                                  // Buttons
                                  Wrap(
                                    spacing: 12,
                                    runSpacing: 10,
                                    alignment: WrapAlignment.center,
                                    children: [
                                      ElevatedButton(
                                        onPressed: () {
                                          if (index == 2) {
                                            widget.onNavigateTab(3); // AI Counselor
                                          } else {
                                            widget.onNavigateTab(1); // Dashboard
                                          }
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFFFFB300),
                                          foregroundColor: const Color(0xFF1A237E),
                                          padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 14),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                                          elevation: 4,
                                        ),
                                        child: Text(
                                          slide['btn']!,
                                          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      OutlinedButton(
                                        onPressed: _scrollToColleges,
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: Colors.white,
                                          side: const BorderSide(color: Colors.white70),
                                          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                                        ),
                                        child: const Text('Explore Top Colleges ↓', style: TextStyle(fontSize: 13.5)),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Carousel Indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_slides.length, (i) {
                      final isActive = _currentSlide == i;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                        width: isActive ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isActive ? const Color(0xFFFFB300) : Colors.white38,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),

          // 3. FLOATING STATS BAR (Elevated White Card with -30 offset look)
          SliverToBoxAdapter(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1100),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(20),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final isNarrow = constraints.maxWidth < 600;
                      return Wrap(
                        alignment: WrapAlignment.spaceAround,
                        runSpacing: 16,
                        children: [
                          _buildStatItem(Icons.account_balance, const Color(0xFF2563EB), '500+', 'Verified Indian Colleges', isNarrow),
                          _buildStatItem(Icons.smart_toy, const Color(0xFFF59E0B), '100% Live', 'Real-Time AI Evaluation', isNarrow),
                          _buildStatItem(Icons.analytics, const Color(0xFF10B981), '5-Year', 'Cutoff Trend Analytics', isNarrow),
                          _buildStatItem(Icons.verified, const Color(0xFFEF4444), 'Free', 'For Every Indian Student', isNarrow),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ),

          // 4. FEATURED COLLEGES SECTION HEADER
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 28, 16, 14),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 900),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          '🏛️ Explore Top Campuses',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1A237E),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Featured Indian Colleges & Cutoffs',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Browse top accredited institutions with real campus imagery, NIRF stats, and average placement packages.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 16),

                      // Stream Filter Pills: All | Engineering | Medical
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: ['All', 'Engineering', 'Medical'].map((st) {
                          final isSelected = _activeStream == st;
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: ChoiceChip(
                              label: Text(
                                st,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: isSelected ? Colors.white : const Color(0xFF1A237E),
                                ),
                              ),
                              selected: isSelected,
                              selectedColor: const Color(0xFF1A237E),
                              backgroundColor: Colors.white,
                              side: BorderSide(
                                color: isSelected ? const Color(0xFF1A237E) : const Color(0xFFCBD5E1),
                              ),
                              onSelected: (_) => _onStreamChanged(st),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 5. FEATURED COLLEGES GRID (Virtualized & locked to 452px height - NO extra space!)
          if (_loading)
            const SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: Color(0xFF1A237E)),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid.builder(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 600,
                  mainAxisExtent: 452,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: _featuredColleges.length,
                itemBuilder: (context, idx) {
                  final col = _featuredColleges[idx];
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
                    onToggleCompare: () {
                      setState(() {
                        if (_comparedColleges.contains(col.collegeName)) {
                          _comparedColleges.remove(col.collegeName);
                        } else {
                          _comparedColleges.add(col.collegeName);
                        }
                      });
                    },
                  );
                },
              ),
            ),

          // 6. CALL TO ACTION BANNER (Matching LandingPage.jsx bottom banner)
          SliverToBoxAdapter(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1100),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1A237E).withAlpha(50),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'Want Personalized Recommendations for Your Score?',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Enter your entrance exam marks (JEE / NEET / MHT-CET) to view your safe, borderline, and aspirational college dashboard.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13.5, color: Colors.white70),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () => widget.onNavigateTab(1), // Go to Dashboard
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFB300),
                          foregroundColor: const Color(0xFF1A237E),
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                          elevation: 6,
                        ),
                        child: const Text(
                          '🚀 Open My Student Dashboard →',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 7. FOOTER (Matching LandingPage.jsx footer)
          SliverToBoxAdapter(
            child: Container(
              color: const Color(0xFF0D1457),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1100),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.school, color: Color(0xFFFFB300), size: 28),
                          SizedBox(width: 8),
                          Text(
                            'EduCounsellor AI',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'An open, AI-powered platform for Indian students across all educational streams.\nEmpowering admissions with live cutoff predictions, merit trends, and smart counselor guidance.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white60, fontSize: 12, height: 1.5),
                      ),
                      const SizedBox(height: 20),
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 8,
                        children: ['Engineering', 'Medical', 'Commerce', 'Science', 'Law', 'Design'].map((st) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(20),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Text(
                              st,
                              style: const TextStyle(color: Colors.white70, fontSize: 11),
                            ),
                          );
                        }).toList(),
                      ),
                      const Divider(color: Colors.white24, height: 40),
                      const Text(
                        '© 2026 EduCounsellor AI. All rights reserved. • Built for Indian Students',
                        style: TextStyle(color: Colors.white38, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, Color color, String value, String label, bool isNarrow) {
    return SizedBox(
      width: isNarrow ? 140 : 200,
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
