import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/college.dart';
import '../models/student_profile.dart';
import 'local_data.dart';

class ApiService {
  static const String defaultBaseUrl = 'http://localhost:8000/api'; // Reverse forwarded over ADB
  static const String _prefKey = 'api_base_url';

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefKey);
    if (saved != null && saved.trim().isNotEmpty) {
      return saved.trim();
    }
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    return defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, url.trim());
  }

  // --- 1. FEATURED COLLEGES (For Landing Page) ---
  static Future<List<College>> fetchFeaturedColleges({String stream = 'All'}) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/featured-colleges?stream=${Uri.encodeComponent(stream)}');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['colleges'] is List) {
          final list = (data['colleges'] as List)
              .map((c) => College.fromJson(c as Map<String, dynamic>, defaultMarks: 97.4))
              .toList();
          if (list.isNotEmpty) return list;
        }
      }
    } catch (_) {}

    final local = LocalCollegeData.getFeaturedColleges(
      examType: 'MHT-CET',
      studentMarks: 97.4,
      category: 'OBC',
    );
    if (stream != 'All') {
      return local.where((c) => c.stream.toLowerCase() == stream.toLowerCase()).toList();
    }
    return local;
  }

  // --- 2. RECOMMENDATIONS (For Dashboard) ---
  static Future<List<College>> fetchRecommendations(StudentProfile profile) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/recommend');

      final body = jsonEncode({
        'student_profile': {
          'name': profile.name,
          'exam_type': profile.examType,
          'marks': profile.marks,
          'score_unit': profile.scoreUnit,
          'category': profile.category,
          'stream': profile.stream,
          'preferred_state': profile.preferredState,
          'home_district': profile.homeDistrict,
        }
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['colleges'] is List) {
          final list = (data['colleges'] as List)
              .map((c) => College.fromJson(c as Map<String, dynamic>, defaultMarks: profile.marks))
              .toList();
          if (list.isNotEmpty) return list;
        }
      }
    } catch (_) {}

    return LocalCollegeData.getFeaturedColleges(
      examType: profile.examType,
      studentMarks: profile.marks,
      category: profile.category,
    );
  }

  // --- 3. CAP SIMULATOR APIS ---
  static Future<List<Map<String, dynamic>>> fetchCapCatalog({String examType = 'MHT-CET'}) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/cap-table/catalog?exam_type=${Uri.encodeComponent(examType)}');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['colleges'] is List) {
          return List<Map<String, dynamic>>.from(data['colleges']);
        }
      }
    } catch (_) {}
    return [];
  }

  static Future<Map<String, dynamic>?> simulateCap({
    required StudentProfile studentProfile,
    required List<Map<String, dynamic>> choices,
    String capRound = 'CAP Round 1',
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/cap-table/simulate');

      final body = jsonEncode({
        'student_profile': {
          'name': studentProfile.name,
          'marks': studentProfile.marks,
          'exam_type': studentProfile.examType,
          'score_unit': studentProfile.scoreUnit,
          'category': studentProfile.category,
          'stream': studentProfile.stream,
        },
        'cap_round': capRound,
        'choices': choices,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  static Future<Map<String, dynamic>?> rebalanceCapWithAi({
    required StudentProfile profile,
    required List<Map<String, dynamic>> choices,
    String capRound = 'CAP Round 1',
    String strategyType = 'golden_ratio',
    String prompt = '',
    String? preferredBranch,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/cap-table/rebalance');

      final body = jsonEncode({
        'student_score': profile.marks,
        'exam_type': profile.examType,
        'category': profile.category,
        'cap_round': capRound,
        'strategy_type': strategyType,
        'prompt': prompt,
        'preferred_branch': preferredBranch ?? 'auto',
        'current_choices': choices,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  // --- 4. SCHOLARSHIPS CALCULATOR API ---
  static Future<Map<String, dynamic>?> calculateScholarships({
    required double annualFees,
    required String category,
    required double annualIncome,
    String gender = 'male',
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/calculate-scholarships');

      final body = jsonEncode({
        'annual_fees': annualFees,
        'category': category,
        'annual_family_income': annualIncome,
        'gender': gender,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  // --- 5. AI COUNSELOR CHAT API (WITH CHROMADB RAG) ---
  static Future<Map<String, dynamic>?> sendChatMessage({
    required String message,
    required StudentProfile profile,
    List<Map<String, String>> history = const [],
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/chat');

      final body = jsonEncode({
        'message': message,
        'student_profile': profile.toJson(),
        'history': history,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  // --- 6. REGIONAL LANGUAGE TRANSLATOR API ---
  static Future<String?> translateText({
    required String text,
    required String targetLang,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/translate');

      final body = jsonEncode({
        'text': text,
        'target_lang': targetLang,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['translated_text']?.toString();
      }
    } catch (_) {}
    return null;
  }

  // --- 7. DOCUMENT AUDIT API ---
  static Future<Map<String, dynamic>?> verifyDocuments({
    required String examType,
    required String category,
    required bool hasGap,
    required String cvcStatus,
    required double income,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/documents/verify');

      final body = jsonEncode({
        'exam_type': examType,
        'category': category,
        'has_gap': hasGap,
        'cvc_status': cvcStatus,
        'annual_income': income,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  // --- 8. REVIEWS API ---
  static Future<bool> submitReview({
    required String collegeName,
    required String userName,
    required String studentRole,
    required String tag,
    required int rating,
    required String reviewText,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/reviews');

      final body = jsonEncode({
        'college_name': collegeName,
        'user_name': userName,
        'student_role': studentRole,
        'tag': tag,
        'rating': rating,
        'review_text': reviewText,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 5));

      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  static Future<List<Map<String, dynamic>>> fetchReviews(String collegeName) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/reviews/${Uri.encodeComponent(collegeName)}');

      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['reviews'] is List) {
          return List<Map<String, dynamic>>.from(data['reviews']);
        }
      }
    } catch (_) {}

    return [
      {
        'user_name': 'Aarav Patil (Alumni)',
        'rating': 5,
        'tag': 'Placements & Academics',
        'student_role': 'Class of 2024 • Computer Engg',
        'review_text':
            'Exceptional placement record. Coding culture is at par with NITs. Companies like Microsoft, Barclays, and Nvidia visit regularly.',
        'created_at': '2 days ago',
      },
      {
        'user_name': 'Sneha Kulkarni',
        'rating': 5,
        'tag': 'Campus Life',
        'student_role': '3rd Year Student • IT',
        'review_text':
            'Active tech clubs (MindSpark, Zest, CSI) and great campus atmosphere in central city location.',
        'created_at': '1 week ago',
      },
    ];
  }
}
