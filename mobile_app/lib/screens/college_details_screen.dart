import 'package:flutter/material.dart';
import '../models/college.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class CollegeDetailsScreen extends StatefulWidget {
  final College college;
  final StudentProfile studentProfile;

  const CollegeDetailsScreen({
    super.key,
    required this.college,
    required this.studentProfile,
  });

  @override
  State<CollegeDetailsScreen> createState() => _CollegeDetailsScreenState();
}

class _CollegeDetailsScreenState extends State<CollegeDetailsScreen> {
  List<Map<String, dynamic>> _reviews = [];
  bool _isLoadingReviews = true;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    final list = await ApiService.fetchReviews(widget.college.collegeName);
    if (mounted) {
      setState(() {
        _reviews = list;
        _isLoadingReviews = false;
      });
    }
  }

  void _showAddReviewModal() {
    int selectedRating = 5;
    String selectedRole = "Current Student";
    String selectedTag = "Placements & Academics";
    final reviewTextController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: const EdgeInsets.all(20),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.rate_review, color: AppTheme.secondary, size: 22),
                          SizedBox(width: 8),
                          Text(
                            "Share Campus Experience",
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
                  const SizedBox(height: 8),
                  Text(
                    "Write an honest review for ${widget.college.collegeName} to guide future aspirants.",
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 16),

                  // Rating Stars
                  const Text("Overall Rating", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  Row(
                    children: List.generate(5, (idx) {
                      return IconButton(
                        icon: Icon(
                          idx < selectedRating ? Icons.star : Icons.star_border,
                          color: AppTheme.secondary,
                          size: 28,
                        ),
                        onPressed: () => setModalState(() => selectedRating = idx + 1),
                      );
                    }),
                  ),
                  const SizedBox(height: 12),

                  // Student Role Selector
                  const Text("Your Association", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: ["Current Student", "Alumni / Graduate", "Hostelite", "Day Scholar"].map((role) {
                      final isSelected = selectedRole == role;
                      return ChoiceChip(
                        label: Text(role, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : AppTheme.textDark)),
                        selected: isSelected,
                        selectedColor: AppTheme.primary,
                        onSelected: (val) {
                          if (val) setModalState(() => selectedRole = role);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),

                  // Review Text Field
                  const Text("Your Review", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: reviewTextController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: "Share details on lab facilities, faculty mentorship, campus life, and placement drives...",
                      hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Submit Button
                  ElevatedButton(
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final text = reviewTextController.text.trim();
                            if (text.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text("Please write a few words about your experience.")),
                              );
                              return;
                            }
                            final nav = Navigator.of(ctx);
                            final messenger = ScaffoldMessenger.of(context);
                            setModalState(() => isSubmitting = true);
                            await ApiService.submitReview(
                              collegeName: widget.college.collegeName,
                              userName: widget.studentProfile.name,
                              studentRole: selectedRole,
                              tag: selectedTag,
                              rating: selectedRating,
                              reviewText: text,
                            );
                            if (mounted) {
                              nav.pop();
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text("✅ Review posted successfully! Thank you for helping students."),
                                  backgroundColor: AppTheme.safeGreen,
                                ),
                              );
                              _loadReviews();
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 44),
                    ),
                    child: isSubmitting
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text("Submit Review", style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.college;

    return Scaffold(
      appBar: AppBar(
        title: Text(c.collegeCode != null ? "${c.collegeName.split(',')[0]} (${c.collegeCode})" : c.collegeName),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. HERO IMAGE HEADER
            Container(
              height: 180,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.accentBlue],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: c.imageUrl != null && c.imageUrl!.isNotEmpty
                  ? Image.network(
                      c.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (ctx, err, stack) => const Center(
                        child: Icon(Icons.school, size: 64, color: Colors.white24),
                      ),
                    )
                  : const Center(
                      child: Icon(Icons.school, size: 64, color: Colors.white24),
                    ),
            ),

            // 2. COLLEGE IDENTITY & RATINGS
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withAlpha(20),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          c.collegeType,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.star, size: 16, color: AppTheme.secondary),
                          const SizedBox(width: 4),
                          Text(
                            "${c.rating.toStringAsFixed(1)} / 5.0",
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    c.collegeName,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 1.25),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(c.location, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // KEY METRICS BAR (Authentic Annual Fees + Average Placement + Highest CTC)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        _metricItem("Annual Fees", c.formattedFees, AppTheme.primary),
                        _divider(),
                        _metricItem("Average CTC", c.placementAvg, const Color(0xFF16A34A)),
                        _divider(),
                        _metricItem("Highest Package", c.highestPackage, const Color(0xFFD97706)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 3. 5-YEAR CUTOFF TRAJECTORY
                  if (c.fiveYearTrend != null && c.fiveYearTrend!.isNotEmpty) ...[
                    const Text(
                      "5-Year Closing Cutoff Trajectory",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: c.fiveYearTrend!.entries.map((e) {
                          return Column(
                            children: [
                              Text(e.key, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                              const SizedBox(height: 4),
                              Text(
                                "${e.value}%ile",
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 4. BRANCH-WISE CUTOFFS
                  if (c.branches.isNotEmpty) ...[
                    const Text(
                      "Branch Cutoffs & Availability",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    Column(
                      children: c.branches.map((b) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  b.branch,
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withAlpha(15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  "${b.cutoffGeneral.toStringAsFixed(2)} %ile",
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 5. VERIFIED REVIEWS HEADER WITH 'WRITE A REVIEW' BUTTON
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Verified Student Reviews",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.rate_review, size: 16),
                        label: const Text("Write Review", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: _showAddReviewModal,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_isLoadingReviews) ...[
                    const Center(child: CircularProgressIndicator()),
                  ] else ...[
                    Column(
                      children: _reviews.map((r) {
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      r['user_name']?.toString() ?? 'Student',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                    Row(
                                      children: List.generate(
                                        5,
                                        (star) => const Icon(Icons.star, size: 12, color: AppTheme.secondary),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  r['student_role']?.toString() ?? 'Campus Student',
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  r['review_text']?.toString() ?? '',
                                  style: const TextStyle(fontSize: 12, height: 1.3),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metricItem(String label, String value, Color valueColor) {
    return Expanded(
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
          const SizedBox(height: 3),
          Text(
            value,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: valueColor),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _divider() {
    return Container(width: 1, height: 26, color: Colors.grey.shade300);
  }
}
