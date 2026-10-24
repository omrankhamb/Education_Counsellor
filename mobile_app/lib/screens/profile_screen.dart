import 'package:flutter/material.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  final StudentProfile studentProfile;
  final Function(StudentProfile) onSaveProfile;

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
  late TextEditingController _incomeController;
  late TextEditingController _ipController;

  late String _selectedExam;
  late String _selectedCategory;
  late String _selectedStream;
  bool _testingConnection = false;
  String? _connectionStatus;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.studentProfile.name);
    _scoreController = TextEditingController(text: widget.studentProfile.marks.toString());
    _incomeController = TextEditingController(text: widget.studentProfile.annualIncome.toInt().toString());
    _ipController = TextEditingController();

    _selectedExam = widget.studentProfile.examType;
    _selectedCategory = widget.studentProfile.category;
    _selectedStream = widget.studentProfile.stream;

    _loadIp();
  }

  Future<void> _loadIp() async {
    final url = await ApiService.getBaseUrl();
    _ipController.text = url;
  }

  void _saveProfile() {
    final score = double.tryParse(_scoreController.text) ?? widget.studentProfile.marks;
    final income = double.tryParse(_incomeController.text) ?? widget.studentProfile.annualIncome;

    final updated = widget.studentProfile.copyWith(
      name: _nameController.text.trim().isEmpty ? widget.studentProfile.name : _nameController.text.trim(),
      marks: score,
      examType: _selectedExam,
      category: _selectedCategory,
      stream: _selectedStream,
      annualIncome: income,
    );

    widget.onSaveProfile(updated);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("✅ Profile updated successfully!"),
        backgroundColor: AppTheme.safeGreen,
      ),
    );
  }

  Future<void> _testConnection() async {
    setState(() {
      _testingConnection = true;
      _connectionStatus = null;
    });

    final newUrl = _ipController.text.trim();
    if (newUrl.isNotEmpty) {
      await ApiService.setBaseUrl(newUrl);
    }

    try {
      final colleges = await ApiService.fetchFeaturedColleges();
      setState(() {
        _testingConnection = false;
        _connectionStatus = colleges.isNotEmpty
            ? "✅ Connected to FastAPI! (${colleges.length} colleges synced)"
            : "⚠️ Reached server but returned 0 colleges.";
      });
    } catch (e) {
      setState(() {
        _testingConnection = false;
        _connectionStatus = "❌ Failed to connect. Check IP & port 8000.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Profile & Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ACADEMIC PROFILE CARD
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Academic Identity",
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 14),

                    // Student Name
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: "Student Full Name",
                        prefixIcon: Icon(Icons.person, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Exam Type Dropdown
                    DropdownButtonFormField<String>(
                      initialValue: _selectedExam,
                      decoration: const InputDecoration(
                        labelText: "Target Entrance Exam",
                        prefixIcon: Icon(Icons.school, size: 18),
                      ),
                      items: ['MHT-CET', 'JEE Main', 'JEE Advanced', 'NEET', 'CLAT', 'CUET'].map((e) {
                        return DropdownMenuItem(value: e, child: Text(e));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedExam = val);
                      },
                    ),
                    const SizedBox(height: 12),

                    // Score / Marks / Percentile
                    TextField(
                      controller: _scoreController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: "Entrance Score / Percentile (%ile)",
                        prefixIcon: Icon(Icons.speed, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Category
                    DropdownButtonFormField<String>(
                      initialValue: _selectedCategory,
                      decoration: const InputDecoration(
                        labelText: "Reservation Category",
                        prefixIcon: Icon(Icons.category, size: 18),
                      ),
                      items: ['OPEN', 'OBC', 'EWS', 'TFWS', 'SC', 'ST', 'VJNT'].map((c) {
                        return DropdownMenuItem(value: c, child: Text(c));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedCategory = val);
                      },
                    ),
                    const SizedBox(height: 12),

                    // Stream
                    DropdownButtonFormField<String>(
                      initialValue: _selectedStream,
                      decoration: const InputDecoration(
                        labelText: "Disciplinary Stream",
                        prefixIcon: Icon(Icons.account_tree, size: 18),
                      ),
                      items: ['Engineering', 'Medical', 'Management', 'Science', 'Law', 'Commerce'].map((s) {
                        return DropdownMenuItem(value: s, child: Text(s));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedStream = val);
                      },
                    ),
                    const SizedBox(height: 12),

                    // Family Income
                    TextField(
                      controller: _incomeController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: "Annual Family Income (₹)",
                        prefixIcon: Icon(Icons.account_balance_wallet, size: 18),
                      ),
                    ),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saveProfile,
                        child: const Text("Save Profile Changes"),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // BACKEND WI-FI SERVER IP SETTINGS
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.wifi, size: 18, color: AppTheme.primary),
                        SizedBox(width: 8),
                        Text(
                          "FastAPI Backend Server Settings",
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      "On physical phones, enter your laptop's Wi-Fi IP address (e.g. http://192.168.1.5:8000/api).",
                      style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 12),

                    TextField(
                      controller: _ipController,
                      decoration: const InputDecoration(
                        labelText: "API Base URL",
                        prefixIcon: Icon(Icons.link, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: _testingConnection
                                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Icon(Icons.sync, size: 16),
                            label: const Text("Test Connection"),
                            onPressed: _testingConnection ? null : _testConnection,
                          ),
                        ),
                      ],
                    ),

                    if (_connectionStatus != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        _connectionStatus!,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _connectionStatus!.startsWith("✅") ? AppTheme.safeGreen : AppTheme.dreamRed,
                        ),
                      ),
                    ],
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
