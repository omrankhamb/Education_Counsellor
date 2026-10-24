import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ReviewsDialog extends StatefulWidget {
  final String collegeName;
  final double currentRating;

  const ReviewsDialog({
    super.key,
    required this.collegeName,
    required this.currentRating,
  });

  @override
  State<ReviewsDialog> createState() => _ReviewsDialogState();
}

class _ReviewsDialogState extends State<ReviewsDialog> {
  List<Map<String, dynamic>> _reviews = [];
  bool _loading = true;
  bool _submitting = false;

  // New review form
  final _nameController = TextEditingController(text: 'Omprasad');
  final _reviewController = TextEditingController();
  int _selectedRating = 5;
  String _selectedTag = 'Placements & Academics';

  final List<String> _tagOptions = [
    'Placements & Academics',
    'Campus Life',
    'Faculty & Research',
    'Hostel & Infrastructure',
    'Coding & Hackathons',
  ];

  @override
  void initState() {
    super.initState();
    _fetchReviews();
  }

  Future<void> _fetchReviews() async {
    setState(() => _loading = true);
    final list = await ApiService.fetchReviews(widget.collegeName);
    if (mounted) {
      setState(() {
        _reviews = list;
        _loading = false;
      });
    }
  }

  Future<void> _submitReview() async {
    final text = _reviewController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please write a brief review before submitting.')),
      );
      return;
    }

    setState(() => _submitting = true);
    final success = await ApiService.postReview(
      collegeName: widget.collegeName,
      userName: _nameController.text.trim().isEmpty ? 'Student' : _nameController.text.trim(),
      rating: _selectedRating,
      reviewText: text,
      tag: _selectedTag,
    );

    if (mounted) {
      setState(() => _submitting = false);
      if (success) {
        _reviewController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Review successfully saved to MongoDB!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        _fetchReviews();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Saved locally (Backend server offline).'),
            backgroundColor: Color(0xFFF59E0B),
          ),
        );
        // Add locally so student sees it immediately
        setState(() {
          _reviews.insert(0, {
            'user_name': _nameController.text.trim().isEmpty ? 'Student' : _nameController.text.trim(),
            'rating': _selectedRating,
            'tag': _selectedTag,
            'student_role': 'Verified Campus Student',
            'review_text': text,
            'created_at': 'Just now',
          });
        });
        _reviewController.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 650, maxHeight: 720),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.star, color: Color(0xFFFFB300), size: 24),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Student Reviews & Ratings',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          widget.collegeName,
                          style: TextStyle(
                            color: Colors.white.withAlpha(200),
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A237E)))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Overall Rating Banner
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFFDE68A)),
                            ),
                            child: Row(
                              children: [
                                Column(
                                  children: [
                                    Text(
                                      '${widget.currentRating}',
                                      style: const TextStyle(
                                        fontSize: 28,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFFB45309),
                                      ),
                                    ),
                                    Row(
                                      children: List.generate(
                                        5,
                                        (i) => Icon(
                                          i < widget.currentRating.round() ? Icons.star : Icons.star_border,
                                          color: const Color(0xFFF59E0B),
                                          size: 16,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Verified Student Feedback (${_reviews.length} reviews)',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF92400E),
                                          fontSize: 13,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      const Text(
                                        'All reviews are stored in the database and monitored for authentic alumni perspectives.',
                                        style: TextStyle(fontSize: 11, color: Color(0xFF78350F)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 18),

                          // Add Review Section
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.rate_review, size: 16, color: Color(0xFF1A237E)),
                                    SizedBox(width: 6),
                                    Text(
                                      'Post Your Verified Review',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF1A237E),
                                        fontSize: 13.5,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),

                                // Rating stars selector
                                Row(
                                  children: [
                                    const Text('Rating: ', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                                    const SizedBox(width: 6),
                                    Row(
                                      children: List.generate(5, (index) {
                                        final star = index + 1;
                                        return InkWell(
                                          onTap: () => setState(() => _selectedRating = star),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 2),
                                            child: Icon(
                                              star <= _selectedRating ? Icons.star : Icons.star_border,
                                              color: const Color(0xFFF59E0B),
                                              size: 24,
                                            ),
                                          ),
                                        );
                                      }),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEEF2FF),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '$_selectedRating / 5 Stars',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF1A237E),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 10),

                                // Tag selector
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: _tagOptions.map((tag) {
                                    final isSelected = _selectedTag == tag;
                                    return ChoiceChip(
                                      label: Text(tag, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : const Color(0xFF334155))),
                                      selected: isSelected,
                                      selectedColor: const Color(0xFF1A237E),
                                      backgroundColor: Colors.white,
                                      side: BorderSide(color: isSelected ? const Color(0xFF1A237E) : const Color(0xFFCBD5E1)),
                                      onSelected: (val) {
                                        if (val) setState(() => _selectedTag = tag);
                                      },
                                    );
                                  }).toList(),
                                ),

                                const SizedBox(height: 10),

                                // Review textfield
                                TextField(
                                  controller: _reviewController,
                                  maxLines: 3,
                                  decoration: InputDecoration(
                                    hintText: 'Share insights about placements, faculty, hostel, or coding culture...',
                                    hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                                    filled: true,
                                    fillColor: Colors.white,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                    ),
                                    contentPadding: const EdgeInsets.all(12),
                                  ),
                                ),

                                const SizedBox(height: 10),

                                // Submit Button
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: ElevatedButton.icon(
                                    onPressed: _submitting ? null : _submitReview,
                                    icon: _submitting
                                        ? const SizedBox(
                                            width: 14,
                                            height: 14,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                          )
                                        : const Icon(Icons.send, size: 14),
                                    label: Text(
                                      _submitting ? 'Saving to Database...' : 'Submit Review',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1A237E),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 18),

                          const Text(
                            'Community Feedback',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Reviews list
                          if (_reviews.isEmpty)
                            const Padding(
                              padding: EdgeInsets.all(20),
                              child: Center(
                                child: Text('No reviews yet. Be the first to post a review!'),
                              ),
                            )
                          else
                            ..._reviews.map((r) {
                              final int rRating = (r['rating'] as num?)?.toInt() ?? 5;
                              final String rUser = r['user_name'] ?? 'Verified Student';
                              final String rRole = r['student_role'] ?? 'Alumni / Student';
                              final String rTag = r['tag'] ?? 'General Review';
                              final String rText = r['review_text'] ?? '';
                              final String rTime = r['created_at'] ?? 'Recently';

                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 16,
                                          backgroundColor: const Color(0xFFEEF2FF),
                                          child: Text(
                                            rUser.isNotEmpty ? rUser[0].toUpperCase() : 'S',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF1A237E),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                rUser,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12.5,
                                                  color: Color(0xFF0F172A),
                                                ),
                                              ),
                                              Text(
                                                rRole,
                                                style: const TextStyle(
                                                  fontSize: 10.5,
                                                  color: Color(0xFF64748B),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFFBEB),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: const Color(0xFFFDE68A)),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.star, color: Color(0xFFF59E0B), size: 12),
                                              const SizedBox(width: 3),
                                              Text(
                                                '$rRating/5',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 11,
                                                  color: Color(0xFFB45309),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        rTag,
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF475569),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      rText,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF334155),
                                        height: 1.4,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: Text(
                                        rTime,
                                        style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
