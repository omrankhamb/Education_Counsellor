import 'package:flutter/material.dart';
import '../models/college.dart';

class CollegeCard extends StatelessWidget {
  final College college;
  final VoidCallback onTap;
  final VoidCallback onOpenReviews;
  final VoidCallback onAskAi;
  final bool isShortlisted;
  final VoidCallback onToggleShortlist;
  final bool isCompared;
  final VoidCallback onToggleCompare;

  const CollegeCard({
    super.key,
    required this.college,
    required this.onTap,
    required this.onOpenReviews,
    required this.onAskAi,
    required this.isShortlisted,
    required this.onToggleShortlist,
    required this.isCompared,
    required this.onToggleCompare,
  });

  String _formatScore(double val, String unit) {
    if (unit == 'rank') {
      return 'AIR ${val.toInt()}';
    } else if (unit == 'marks_720') {
      return '${val.toInt()}/720';
    }
    return '${val.toStringAsFixed(1)}%';
  }

  @override
  Widget build(BuildContext context) {
    final bool isEligible = college.eligibilityStatus == 'eligible';
    final bool isBorderline = college.eligibilityStatus == 'borderline';

    final Color statusColor = isEligible
        ? const Color(0xFF10B981) // Green
        : isBorderline
            ? const Color(0xFFF59E0B) // Amber
            : const Color(0xFFEF4444); // Red

    final String statusLabel = isEligible
        ? 'Eligible'
        : isBorderline
            ? 'Borderline'
            : 'Aspirational';

    final Color leftBorderColor = isEligible ? const Color(0xFF10B981) : const Color(0xFF1A237E);

    return Container(
      margin: EdgeInsets.zero,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18), // Web: 18px rounded
        border: Border.all(color: const Color(0x1F1A237E), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(color: leftBorderColor, width: 4.5), // Web 4px left highlight
            ),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // College Banner Image
                  Stack(
                    children: [
                      Image.network(
                        college.imageUrl ??
                            'https://images.unsplash.com/photo-1562774053-701939374585?w=700',
                        height: 158,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        cacheWidth: 600,
                        filterQuality: FilterQuality.low,
                        errorBuilder: (context, error, stackTrace) => Container(
                          height: 158,
                          color: const Color(0xFF1E293B),
                          child: const Center(
                            child: Icon(Icons.school, size: 50, color: Colors.white70),
                          ),
                        ),
                      ),
                      // Web Signature Gradient Overlay
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withAlpha(35),
                                const Color(0xFF1A237E).withAlpha(190), // Web signature indigo
                              ],
                            ),
                          ),
                        ),
                      ),

                      // Top Left Badges: Stream & Govt/Private
                      Positioned(
                        top: 10,
                        left: 10,
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(240),
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 4),
                                ],
                              ),
                              child: Text(
                                college.stream,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 5),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: college.isGovernment
                                    ? const Color(0xFF10B981) // Govt Green
                                    : const Color(0xFFF59E0B), // Private Amber
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 4),
                                ],
                              ),
                              child: Text(
                                college.isGovernment ? '🏛 Govt' : '🏢 Private',
                                style: TextStyle(
                                  color: college.isGovernment ? Colors.white : const Color(0xFF0F172A),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Top Right: Status Badge & Shortlist Heart
                      Positioned(
                        top: 10,
                        right: 10,
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: statusColor,
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withAlpha(25), blurRadius: 4),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isEligible
                                        ? Icons.check_circle
                                        : isBorderline
                                            ? Icons.warning_amber_rounded
                                            : Icons.cancel,
                                    size: 11,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 3),
                                  Text(
                                    statusLabel,
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
                            GestureDetector(
                              onTap: onToggleShortlist,
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: isShortlisted ? const Color(0xFFEF4444) : Colors.white.withAlpha(235),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(color: Colors.black.withAlpha(25), blurRadius: 4),
                                  ],
                                ),
                                child: Center(
                                  child: Icon(
                                    isShortlisted ? Icons.favorite : Icons.favorite_border,
                                    color: isShortlisted ? Colors.white : const Color(0xFF475569),
                                    size: 15,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Bottom Left: Location with Yellow Marker
                      Positioned(
                        bottom: 8,
                        left: 10,
                        right: 10,
                        child: Row(
                          children: [
                            const Icon(Icons.location_on, color: Color(0xFFFACC15), size: 14), // Web yellow pin
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                college.location,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Card Body
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // College Name
                        Text(
                          college.collegeName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1A237E), // Web exact signature navy
                            height: 1.25,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),

                        const SizedBox(height: 6),

                        // Specialized Branches Tag (Web styling)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFC7D2FE)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.school, size: 13, color: Color(0xFF1A237E)),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  college.branchSummary ?? 'Accredited Programs',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF1A237E),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 12),

                        // 3 Metric Stat Boxes (Exact Web Styling: Cutoff | Score | Rating)
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEEF2FF),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFC7D2FE)),
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      _formatScore(college.cutoffMarks, college.scoreUnit),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF1A237E),
                                      ),
                                    ),
                                    const Text(
                                      'Min Cutoff',
                                      style: TextStyle(fontSize: 9.5, color: Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0FFF4),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFBBF7D0)),
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      _formatScore(college.studentMarks, college.scoreUnit),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF15803D),
                                      ),
                                    ),
                                    const Text(
                                      'Your Score',
                                      style: TextStyle(fontSize: 9.5, color: Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFFEF08A)),
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.star, size: 11, color: Color(0xFFB45309)),
                                        const SizedBox(width: 2),
                                        Text(
                                          '${college.rating}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFFB45309),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const Text(
                                      'Rating',
                                      style: TextStyle(fontSize: 9.5, color: Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        // Rich Metrics: Placement & Fees (Web grey container)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8F9FA),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: const [
                                      Icon(Icons.emoji_events, size: 13, color: Color(0xFFF59E0B)),
                                      SizedBox(width: 4),
                                      Text(
                                        'Top Ranked',
                                        style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    '₹${(college.annualFees / 100000).toStringAsFixed(1)} Lakh/yr',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Avg: ${college.placementAvg}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF334155),
                                    ),
                                  ),
                                  Text(
                                    'Peak: ${college.highestPackage}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF15803D),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 10),

                        // Compare Checkbox Bar (Web Exact styling)
                        GestureDetector(
                          onTap: onToggleCompare,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isCompared ? const Color(0xFFEEF2FF) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
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
                                      size: 13,
                                      color: isCompared ? const Color(0xFF1A237E) : const Color(0xFF64748B),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      isCompared ? 'Selected to Compare' : 'Compare',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: isCompared ? const Color(0xFF1A237E) : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                                Checkbox(
                                  value: isCompared,
                                  onChanged: (_) => onToggleCompare(),
                                  activeColor: const Color(0xFF1A237E),
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  visualDensity: VisualDensity.compact,
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 10),

                        // Action Buttons: More Info | Reviews | Ask AI (Exact Web 3-button layout)
                        Row(
                          children: [
                            // 1. More Info
                            Expanded(
                              child: OutlinedButton(
                                onPressed: onTap,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF1A237E),
                                  side: const BorderSide(color: Color(0xFF1A237E), width: 1.2),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.info_outline, size: 13),
                                    SizedBox(width: 3),
                                    Text('More Info', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),

                            // 2. Reviews
                            Expanded(
                              child: OutlinedButton(
                                onPressed: onOpenReviews,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF334155),
                                  backgroundColor: const Color(0xFFF8FAFC),
                                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.star, size: 13, color: Color(0xFFFACC15)),
                                    SizedBox(width: 3),
                                    Text('Reviews', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),

                            // 3. Ask AI (Signature Web Gradient Button)
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                  boxShadow: [
                                    BoxShadow(color: const Color(0xFF1A237E).withAlpha(40), blurRadius: 4, offset: const Offset(0, 2)),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(10),
                                    onTap: onAskAi,
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(vertical: 8),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.psychology, size: 14, color: Color(0xFFFACC15)),
                                          SizedBox(width: 3),
                                          Text(
                                            'Ask AI',
                                            style: TextStyle(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
