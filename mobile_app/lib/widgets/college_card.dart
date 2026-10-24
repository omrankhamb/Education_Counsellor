import 'package:flutter/material.dart';
import '../models/college.dart';
import '../theme/app_theme.dart';

class CollegeCard extends StatelessWidget {
  final College college;
  final bool isShortlisted;
  final VoidCallback onToggleShortlist;
  final VoidCallback onTap;
  final VoidCallback? onOpenReviews;
  final Function(College)? onAskAI;
  final bool isCompared;
  final VoidCallback? onToggleCompare;

  const CollegeCard({
    super.key,
    required this.college,
    required this.isShortlisted,
    required this.onToggleShortlist,
    required this.onTap,
    this.onOpenReviews,
    this.onAskAI,
    this.isCompared = false,
    this.onToggleCompare,
  });

  @override
  Widget build(BuildContext context) {
    final status = college.eligibilityStatus;
    final bool isEligible = status == 'eligible';
    final bool isBorderline = status == 'borderline';

    final Color leftBorderColor = isEligible
        ? const Color(0xFF10B981)
        : isBorderline
            ? const Color(0xFFF59E0B)
            : const Color(0xFF1A237E);

    final String tierLabel = isEligible
        ? "Eligible"
        : isBorderline
            ? "Borderline"
            : "Aspirational";

    final Color tierBgColor = isEligible
        ? const Color(0xFF10B981)
        : isBorderline
            ? const Color(0xFFF59E0B)
            : const Color(0xFFDC2626);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 4px Accent Line on top/left
          Container(height: 3.5, color: leftBorderColor),

          // 1. HERO IMAGE BANNER (Height 170px)
          Stack(
            children: [
              InkWell(
                onTap: onTap,
                child: SizedBox(
                  height: 165,
                  width: double.infinity,
                  child: college.imageUrl != null && college.imageUrl!.isNotEmpty
                      ? Image.network(
                          college.imageUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, err, stack) => _imagePlaceholder(),
                        )
                      : _imagePlaceholder(),
                ),
              ),

              // Gradient Overlay for readability
              Positioned.fill(
                child: IgnorePointer(
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Color.fromRGBO(0, 0, 0, 0.25),
                          Color.fromRGBO(26, 35, 126, 0.65),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),
              ),

              // Top-Left Badges: Stream & Govt/Private
              Positioned(
                top: 10,
                left: 10,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(235),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        college.stream,
                        style: const TextStyle(
                          color: AppTheme.textDark,
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: college.isGovernment ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            college.isGovernment ? Icons.account_balance : Icons.business,
                            size: 11,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            college.isGovernment ? "Govt" : "Private",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Top-Right Badges: Eligibility Pill & Shortlist Heart
              Positioned(
                top: 8,
                right: 8,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: tierBgColor,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(30),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isEligible
                                ? Icons.check_circle
                                : isBorderline
                                    ? Icons.warning_amber
                                    : Icons.cancel,
                            size: 11,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            tierLabel,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Material(
                      color: isShortlisted ? Colors.red : Colors.white.withAlpha(235),
                      shape: const CircleBorder(),
                      child: InkWell(
                        onTap: onToggleShortlist,
                        customBorder: const CircleBorder(),
                        child: Padding(
                          padding: const EdgeInsets.all(5),
                          child: Icon(
                            isShortlisted ? Icons.favorite : Icons.favorite_border,
                            color: isShortlisted ? Colors.white : Colors.black87,
                            size: 16,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom-Left Location on Image
              Positioned(
                bottom: 8,
                left: 10,
                right: 10,
                child: Row(
                  children: [
                    const Icon(Icons.location_on, size: 13, color: AppTheme.secondary),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        college.location,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          shadows: [Shadow(color: Colors.black54, blurRadius: 4)],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (college.collegeCode != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: Colors.black.withAlpha(120),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "DTE: ${college.collegeCode}",
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),

          // 2. CARD BODY
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // College Title
                InkWell(
                  onTap: onTap,
                  child: Text(
                    college.collegeName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 6),

                // Branches Available Pill & Summary
                if (college.branches.isNotEmpty || college.branchSummary != null) ...[
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withAlpha(15),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: AppTheme.primary.withAlpha(35)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.school, size: 12, color: AppTheme.primary),
                            const SizedBox(width: 4),
                            Text(
                              "${college.branches.isNotEmpty ? college.branches.length : 1} Branches",
                              style: const TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          college.branchSummary ?? "Computer, IT, AI & Data Science",
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],

                // 3 STATS COLORED BOXES (Cutoff | Your Score | Rating)
                Row(
                  children: [
                    // Box 1: Cutoff
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFC7D2FE)),
                        ),
                        child: Column(
                          children: [
                            Text(
                              "${college.cutoffMarks.toStringAsFixed(1)}%ile",
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                            const Text(
                              "Cutoff",
                              style: TextStyle(fontSize: 9.5, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Box 2: Your Score
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FFF4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Column(
                          children: [
                            Text(
                              "${college.studentMarks.toStringAsFixed(1)}%ile",
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF16A34A),
                              ),
                            ),
                            const Text(
                              "Your Score",
                              style: TextStyle(fontSize: 9.5, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Box 3: Rating
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFFDE68A)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.star, size: 12, color: AppTheme.secondary),
                                const SizedBox(width: 2),
                                Text(
                                  college.rating.toStringAsFixed(1),
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFD97706),
                                  ),
                                ),
                              ],
                            ),
                            const Text(
                              "Rating",
                              style: TextStyle(fontSize: 9.5, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Rich Metrics Strip: NIRF & Annual Fees + Average Placement
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.emoji_events, size: 13, color: AppTheme.secondary),
                              const SizedBox(width: 4),
                              Text(
                                college.nirfRank ?? "Top Ranked",
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textDark,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            college.formattedFees,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Avg: ${college.placementAvg}",
                            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                          ),
                          Text(
                            "High: ${college.highestPackage}",
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF16A34A),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Quick Compare Checkbox Bar (if onToggleCompare provided)
                if (onToggleCompare != null) ...[
                  InkWell(
                    onTap: onToggleCompare,
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isCompared ? const Color(0xFFEEF2FF) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isCompared ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.balance,
                                size: 14,
                                color: isCompared ? AppTheme.primary : AppTheme.textMuted,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                isCompared ? "Selected to Compare" : "Compare with Other Colleges",
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                  color: isCompared ? AppTheme.primary : AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                          Icon(
                            isCompared ? Icons.check_box : Icons.check_box_outline_blank,
                            size: 16,
                            color: isCompared ? AppTheme.primary : AppTheme.textMuted,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                // 3 ACTION BUTTONS: [More Info] [Reviews] [Ask AI]
                Row(
                  children: [
                    // Button 1: More Info
                    Expanded(
                      flex: 4,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.info_outline, size: 13),
                        label: const Text(
                          "More Info",
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF1D4ED8),
                          backgroundColor: const Color(0xFFEFF6FF),
                          side: const BorderSide(color: Color(0xFFBFDBFE)),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: onTap,
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Button 2: Reviews
                    Expanded(
                      flex: 4,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.chat_bubble_outline, size: 13, color: AppTheme.secondary),
                        label: const Text(
                          "Reviews",
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        ),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: const Color(0xFFF1F5F9),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: onOpenReviews ?? onTap,
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Button 3: Ask AI (Signature Indigo Gradient)
                    Expanded(
                      flex: 4,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.school, size: 13, color: AppTheme.secondary),
                        label: const Text(
                          "Ask AI",
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: () {
                          if (onAskAI != null) {
                            onAskAI!(college);
                          } else {
                            onTap();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary, AppTheme.accentBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.school, size: 54, color: Colors.white24),
      ),
    );
  }
}
