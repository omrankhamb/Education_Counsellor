import 'package:flutter/material.dart';
import '../models/college.dart';

class CompareScreen extends StatelessWidget {
  final List<College> colleges;
  final Function(String) onRemove;

  const CompareScreen({
    super.key,
    required this.colleges,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A237E),
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.compare_arrows, color: Color(0xFFFACC15), size: 22),
            const SizedBox(width: 8),
            Text(
              'Compare Colleges (${colleges.length}/4)',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
      ),
      body: colleges.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.balance, size: 48, color: Color(0xFF1A237E)),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No Colleges Selected for Comparison',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tap the "Compare" checkbox on any college card in Explore to view a side-by-side comparison.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4),
                    ),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Notice Header
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF9C3),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFEF08A)),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.lightbulb, color: Color(0xFF854D0E), size: 20),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Side-by-side comparison for Cutoffs, Placements, Fees, and ROI.',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF854D0E)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Side-by-side Table
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: colleges.map((c) => _buildCollegeColumn(context, c)).toList(),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildCollegeColumn(BuildContext context, College c) {
    return Container(
      width: 250,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with Remove Button
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFF1A237E),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(15),
                topRight: Radius.circular(15),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    c.collegeName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                GestureDetector(
                  onTap: () => onRemove(c.collegeName),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(40),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, color: Colors.white, size: 14),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                _buildRow('College Type', c.collegeType),
                _buildRow('General Cutoff', '${c.cutoffMarks}%'),
                _buildRow('Your Eligibility', c.eligibilityStatus.toUpperCase(),
                    isBadge: true,
                    badgeColor: c.eligibilityStatus == 'eligible'
                        ? const Color(0xFF10B981)
                        : const Color(0xFFF59E0B)),
                _buildRow('Avg Package', c.placementAvg, isHighlight: true),
                _buildRow('Highest Package', c.highestPackage),
                _buildRow('Annual Fees', '₹${(c.annualFees / 1000).toInt()}k / yr'),
                _buildRow('Rating', '★ ${c.rating} / 5.0'),
                _buildRow('Top Programs', c.branchSummary ?? 'Core Engineering'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value,
      {bool isBadge = false, Color? badgeColor, bool isHighlight = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            flex: 3,
            child: isBadge
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: (badgeColor ?? const Color(0xFF10B981)).withAlpha(25),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      value,
                      style: TextStyle(
                        color: badgeColor ?? const Color(0xFF10B981),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                : Text(
                    value,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isHighlight ? const Color(0xFF2563EB) : const Color(0xFF0F172A),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
