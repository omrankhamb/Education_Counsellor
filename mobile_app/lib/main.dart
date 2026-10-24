import 'package:flutter/material.dart';
import 'screens/landing_home_page.dart';
import 'screens/dashboard_page.dart';
import 'screens/scholarships_page.dart';
import 'screens/chat_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/cap_simulator_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const EduCounsellorApp());
}

class EduCounsellorApp extends StatelessWidget {
  const EduCounsellorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduCounsellor AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF1A237E),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1A237E),
          primary: const Color(0xFF1A237E),
          secondary: const Color(0xFFFFB300),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        navigationBarTheme: NavigationBarThemeData(
          height: 64,
          backgroundColor: Colors.white,
          indicatorColor: const Color(0xFFEEF2FF),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            final isSelected = states.contains(WidgetState.selected);
            return TextStyle(
              fontSize: 10.5,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? const Color(0xFF1A237E) : const Color(0xFF64748B),
              overflow: TextOverflow.ellipsis,
            );
          }),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1A237E),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  String? _incomingChatPrompt;

  final Set<String> _shortlistedColleges = {
    'College of Engineering, Pune (COEP Technological University)',
    'Veermata Jijabai Technological Institute (VJTI), Mumbai',
  };

  Map<String, dynamic> _studentProfile = {
    'name': 'Omprasad',
    'exam': 'MHT-CET',
    'score': 97.4,
    'category': 'OBC',
    'district': 'Pune',
    'stream': 'Engineering',
  };

  void _onNavigateTab(int index, {String? prompt}) {
    setState(() {
      _currentIndex = index;
      if (prompt != null) {
        _incomingChatPrompt = prompt;
      }
    });
  }

  void _toggleShortlist(String collegeName) {
    setState(() {
      if (_shortlistedColleges.contains(collegeName)) {
        _shortlistedColleges.remove(collegeName);
      } else {
        _shortlistedColleges.add(collegeName);
      }
    });
  }

  void _updateProfile(Map<String, dynamic> newProfile) {
    setState(() {
      _studentProfile = {..._studentProfile, ...newProfile};
    });
  }

  void _openCapSimulator() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CapSimulatorScreen(
          studentProfile: _studentProfile,
          shortlistedColleges: _shortlistedColleges,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      // Tab 0: Home / Landing Page
      LandingHomePage(
        onNavigateTab: _onNavigateTab,
        shortlistedColleges: _shortlistedColleges,
        onToggleShortlist: _toggleShortlist,
        studentProfile: _studentProfile,
        onOpenCapSimulator: _openCapSimulator,
      ),

      // Tab 1: Dashboard Page
      DashboardPage(
        onNavigateTab: _onNavigateTab,
        shortlistedColleges: _shortlistedColleges,
        onToggleShortlist: _toggleShortlist,
        studentProfile: _studentProfile,
        onOpenCapSimulator: _openCapSimulator,
      ),

      // Tab 2: Scholarships & MahaDBT
      ScholarshipsPage(
        studentProfile: _studentProfile,
        onBackToHome: () => _onNavigateTab(0),
      ),

      // Tab 3: AI Counselor Chat
      ChatScreen(
        studentProfile: _studentProfile,
        initialPrompt: _incomingChatPrompt,
      ),

      // Tab 4: Student Profile
      ProfileScreen(
        studentProfile: _studentProfile,
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
        onDestinationSelected: (idx) {
          setState(() {
            _currentIndex = idx;
            if (idx != 3) {
              _incomingChatPrompt = null;
            }
          });
        },
        backgroundColor: Colors.white,
        elevation: 8,
        height: 62,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        indicatorColor: const Color(0xFFEEF2FF),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFF1A237E)),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: Color(0xFF1A237E)),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.monetization_on_outlined),
            selectedIcon: Icon(Icons.monetization_on, color: Color(0xFF1A237E)),
            label: 'Waivers',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble, color: Color(0xFF1A237E)),
            label: 'Counselor',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFF1A237E)),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
