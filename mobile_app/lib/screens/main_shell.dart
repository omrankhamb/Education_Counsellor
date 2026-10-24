import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/student_profile.dart';
import '../theme/app_theme.dart';
import 'landing_home_screen.dart';
import 'dashboard_screen.dart';
import 'cap_simulator_screen.dart';
import 'chat_screen.dart';
import 'profile_screen.dart';
import 'scholarships_screen.dart';
import 'document_audit_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  String? _chatPrompt;
  StudentProfile _profile = StudentProfile();
  static const String _profilePrefKey = 'student_profile_data';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_profilePrefKey);
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        final data = jsonDecode(jsonStr);
        if (mounted) {
          setState(() {
            _profile = StudentProfile.fromJson(data);
          });
        }
      } catch (_) {}
    }
  }

  Future<void> _updateProfile(StudentProfile newProfile) async {
    setState(() {
      _profile = newProfile;
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_profilePrefKey, jsonEncode(newProfile.toJson()));
  }

  void _openDocumentAudit() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DocumentAuditScreen(studentProfile: _profile),
      ),
    );
  }

  void _openScholarships() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ScholarshipsScreen(studentProfile: _profile),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      LandingHomeScreen(
        studentProfile: _profile,
        onSwitchTab: (idx) => setState(() => _currentIndex = idx),
        onOpenDocAudit: _openDocumentAudit,
        onOpenScholarships: _openScholarships,
      ),
      DashboardScreen(
        studentProfile: _profile,
        onUpdateProfile: _updateProfile,
        onSwitchTab: (idx, {initialPrompt}) {
          setState(() {
            _currentIndex = idx;
            if (initialPrompt != null) {
              _chatPrompt = initialPrompt;
            }
          });
        },
        onOpenDocAudit: _openDocumentAudit,
        onOpenScholarships: _openScholarships,
      ),
      CapSimulatorScreen(
        studentProfile: _profile,
      ),
      ChatScreen(
        key: ValueKey("chat_$_chatPrompt"),
        studentProfile: _profile,
        initialPrompt: _chatPrompt,
      ),
      ProfileScreen(
        studentProfile: _profile,
        onSaveProfile: _updateProfile,
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        backgroundColor: Colors.white,
        elevation: 6,
        indicatorColor: AppTheme.primary.withAlpha(30),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: AppTheme.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore, color: AppTheme.primary),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.table_chart_outlined),
            selectedIcon: Icon(Icons.table_chart, color: AppTheme.primary),
            label: 'CAP Simulator',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble, color: AppTheme.primary),
            label: 'Counselor',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppTheme.primary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
