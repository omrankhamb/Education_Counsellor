import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  final Map<String, dynamic> studentProfile;
  final Function(Map<String, dynamic>) onSaveProfile;

  const ProfileScreen({
    super.key,
    required this.studentProfile,
    required this.onSaveProfile,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _scoreController;
  late TextEditingController _districtController;
  late TextEditingController _apiUrlController;

  String _selectedExam = 'MHT-CET';
  String _selectedCategory = 'OBC';
  bool _testingConnection = false;
  Map<String, dynamic>? _connectionResult;

  final List<Map<String, String>> _exams = [
    {'id': 'MHT-CET', 'name': 'MHT-CET', 'label': 'CET Percentile (0-100)'},
    {'id': 'JEE Main', 'name': 'JEE Main', 'label': 'JEE Percentile (0-100)'},
    {'id': 'JEE Advanced', 'name': 'JEE Adv', 'label': 'All India Rank (AIR)'},
    {'id': 'NEET', 'name': 'NEET', 'label': 'NEET Marks (out of 720)'},
  ];

  final List<String> _categories = ['OPEN', 'OBC', 'EWS', 'SC', 'ST', 'VJNT', 'TFWS'];

  @override
  void initState() {
    super.initState();
    final p = widget.studentProfile;
    _nameController = TextEditingController(text: p['name'] ?? 'Omprasad');
    _scoreController = TextEditingController(text: (p['score'] ?? 97.4).toString());
    _districtController = TextEditingController(text: p['district'] ?? 'Pune');
    _apiUrlController = TextEditingController();
    _selectedExam = p['exam'] ?? 'MHT-CET';
    _selectedCategory = p['category'] ?? 'OBC';

    ApiService.getBaseUrl().then((url) {
      if (mounted) setState(() => _apiUrlController.text = url);
    });
  }

  void _saveProfile() {
    final double? sc = double.tryParse(_scoreController.text);
    if (sc == null || sc < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid numeric score!')),
      );
      return;
    }

    widget.onSaveProfile({
      'name': _nameController.text.trim(),
      'exam': _selectedExam,
      'score': sc,
      'category': _selectedCategory,
      'district': _districtController.text.trim(),
      'stream': _selectedExam == 'NEET' ? 'Medical' : 'Engineering',
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Profile and cutoffs updated successfully!'),
        backgroundColor: Color(0xFF10B981),
      ),
    );
  }

  Future<void> _testConnection() async {
    setState(() {
      _testingConnection = true;
      _connectionResult = null;
    });

    final res = await ApiService.testConnection(_apiUrlController.text.trim());
    if (res['success'] == true) {
      await ApiService.setBaseUrl(_apiUrlController.text.trim());
    }

    if (mounted) {
      setState(() {
        _testingConnection = false;
        _connectionResult = res;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentExamObj = _exams.firstWhere((e) => e['id'] == _selectedExam, orElse: () => _exams[0]);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A237E),
        elevation: 0,
        title: const Text('Student Profile & Server', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Avatar Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: const Color(0xFF1A237E),
                    child: Text(
                      (_nameController.text.isNotEmpty ? _nameController.text.substring(0, 1) : 'U').toUpperCase(),
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _nameController.text,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$_selectedExam Aspirant • Quota: $_selectedCategory',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Academic Profile Form Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Academic Credentials', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  const SizedBox(height: 14),

                  const Text('Full Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _nameController,
                    decoration: _inputDecoration('Enter full name'),
                  ),

                  const SizedBox(height: 14),

                  const Text('Target Entrance Exam', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                  const SizedBox(height: 6),
                  Row(
                    children: _exams.map((e) {
                      final isSel = _selectedExam == e['id'];
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedExam = e['id']!),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: isSel ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(
                                e['name']!,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isSel ? Colors.white : const Color(0xFF334155),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 14),

                  Text(currentExamObj['label']!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _scoreController,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration('Enter verified exam score'),
                  ),

                  const SizedBox(height: 14),

                  const Text('Category / Quota', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _categories.map((c) {
                      final isSel = _selectedCategory == c;
                      return ChoiceChip(
                        label: Text(c, style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                        selected: isSel,
                        selectedColor: const Color(0xFF2563EB),
                        labelStyle: TextStyle(color: isSel ? Colors.white : const Color(0xFF334155)),
                        onSelected: (_) => setState(() => _selectedCategory = c),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 14),

                  const Text('Home District', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _districtController,
                    decoration: _inputDecoration('e.g. Pune, Mumbai, Nagpur'),
                  ),

                  const SizedBox(height: 18),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A237E),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Save Academic Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Server Settings Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('FastAPI Backend Settings', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  const SizedBox(height: 4),
                  const Text(
                    'Allows physical mobile phones to query your laptop on the local Wi-Fi.',
                    style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _apiUrlController,
                    decoration: _inputDecoration('http://172.29.75.208:8000/api'),
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            _apiUrlController.text = ApiService.defaultBaseUrl;
                            ApiService.setBaseUrl(ApiService.defaultBaseUrl);
                            _testConnection();
                          },
                          child: const Text('Reset Default IP', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _testingConnection ? null : _testConnection,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                          ),
                          child: _testingConnection
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Text('Test Connection', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                    ],
                  ),

                  if (_connectionResult != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _connectionResult!['success'] == true
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _connectionResult!['success'] == true ? Icons.check_circle : Icons.error,
                            size: 16,
                            color: _connectionResult!['success'] == true
                                ? const Color(0xFF15803D)
                                : const Color(0xFFB91C1C),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _connectionResult!['message'] ?? '',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: _connectionResult!['success'] == true
                                    ? const Color(0xFF15803D)
                                    : const Color(0xFFB91C1C),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
      ),
    );
  }
}
