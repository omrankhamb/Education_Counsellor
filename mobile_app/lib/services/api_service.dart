import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/college.dart';
import 'local_college_data.dart';

class ApiService {
  static const String defaultBaseUrl = 'http://172.29.75.208:8000/api';
  static const String _prefKey = 'api_base_url';

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefKey);
    if (saved != null && saved.trim().isNotEmpty) {
      return saved.trim();
    }
    // When running in Chrome / Flutter Web, connect to localhost:8000 directly
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    return defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, url.trim());
  }

  // --- FEATURED COLLEGES (For Landing Page) ---
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
    } catch (_) {
      // Graceful offline fallback
    }

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

  // --- RECOMMENDATIONS (For Dashboard) ---
  static Future<List<College>> fetchRecommendations({
    required String name,
    required String examType,
    required double score,
    required String category,
    required String stream,
    required String homeDistrict,
    String preferredState = 'Maharashtra',
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/recommend');

      String scoreUnit = 'percentile';
      if (examType == 'NEET') {
        scoreUnit = 'marks_720';
      } else if (examType == 'JEE Advanced') {
        scoreUnit = 'rank';
      }

      final body = jsonEncode({
        'student_profile': {
          'name': name,
          'exam_type': examType,
          'marks': score,
          'score_unit': scoreUnit,
          'category': category,
          'stream': stream,
          'preferred_state': preferredState,
        }
      });

      final res = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
          .timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['colleges'] is List) {
          final list = (data['colleges'] as List)
              .map((c) => College.fromJson(c as Map<String, dynamic>, defaultMarks: score))
              .toList();
          if (list.isNotEmpty) return list;
        }
      }
    } catch (_) {
      // Graceful offline fallback
    }

    return LocalCollegeData.getFeaturedColleges(
      examType: examType,
      studentMarks: score,
      category: category,
    );
  }

  // --- REVIEWS API (Connected directly to MongoDB) ---
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
    } catch (e) {
      // offline fallback
    }

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

  static Future<bool> postReview({
    required String collegeName,
    required String userName,
    required int rating,
    required String reviewText,
    required String tag,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/reviews');

      final body = jsonEncode({
        'college_name': collegeName,
        'user_name': userName.trim().isEmpty ? 'Student' : userName.trim(),
        'rating': rating,
        'review_text': reviewText.trim(),
        'tag': tag,
        'student_role': 'Verified Campus Student',
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['success'] == true;
      }
    } catch (e) {
      // If server unreachable
    }
    return false;
  }

  // --- CAP SIMULATOR API ---
  static Future<Map<String, dynamic>?> simulateCap({
    required Map<String, dynamic> studentProfile,
    required List<Map<String, dynamic>> choices,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/simulate-cap');

      final body = jsonEncode({
        'student_profile': {
          'name': studentProfile['name'] ?? 'Student',
          'marks': studentProfile['score'] ?? 97.4,
          'exam_type': studentProfile['exam'] ?? 'MHT-CET',
          'score_unit': studentProfile['exam'] == 'NEET' ? 'marks_720' : 'percentile',
        },
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

  // --- SCHOLARSHIPS CALCULATOR API ---
  static Future<Map<String, dynamic>?> calculateScholarships({
    required double annualFees,
    required String category,
    required double annualIncome,
    required String gender,
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

  // --- AI CHAT API ---
  static Future<String> sendChat({
    required String message,
    required Map<String, dynamic> studentProfile,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/chat');

      final body = jsonEncode({
        'message': message,
        'student_profile': studentProfile,
      });

      final res = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['reply'] ?? data['response'] ?? 'I have reviewed your query.';
      }
    } catch (e) {
      final msg = message.toLowerCase();
      if (msg.contains('cutoff') || msg.contains('97')) {
        return "At 97 percentile in MHT-CET, you have high chances in top Autonomous institutes like PICT (IT/EnTC), Walchand Sangli (Computer), and VIT Pune (CS/AI). In COEP and VJTI, core branches like Electrical and Mechanical are accessible!";
      } else if (msg.contains('tfws')) {
        return "TFWS (Tuition Fee Waiver Scheme) offers 100% waiver on tuition fees. To qualify, your family annual income must be below ₹8 LPA with an official income certificate, and TFWS cutoffs are generally 0.5-1% higher than regular general cutoffs.";
      } else if (msg.contains('coep') || msg.contains('vjti')) {
        return "Both COEP and VJTI are Maharashtra's premier institutions. COEP excels in campus infrastructure and robotics, while VJTI has an edge in Mumbai finance & fintech company placements. Both have stellar 95%+ placement records.";
      }
      return "I have analyzed your score and preferences. You have solid competitive chances in Pune and Mumbai top autonomous engineering colleges!";
    }

    return "Counseling server response completed.";
  }

  // --- LANGUAGE CONVERTER & TRANSLATION API ---
  static const List<Map<String, String>> supportedLanguages = [
    {'code': 'mr', 'name': 'Marathi', 'nativeName': 'मराठी', 'flag': '🚩', 'voiceCode': 'mr'},
    {'code': 'hi', 'name': 'Hindi', 'nativeName': 'हिंदी', 'flag': '🇮🇳', 'voiceCode': 'hi'},
    {'code': 'gu', 'name': 'Gujarati', 'nativeName': 'ગુજરાતી', 'flag': '🦁', 'voiceCode': 'gu'},
    {'code': 'te', 'name': 'Telugu', 'nativeName': 'తెలుగు', 'flag': '🌿', 'voiceCode': 'te'},
    {'code': 'ta', 'name': 'Tamil', 'nativeName': 'தமிழ்', 'flag': '🦚', 'voiceCode': 'ta'},
    {'code': 'kn', 'name': 'Kannada', 'nativeName': 'ಕನ್ನಡ', 'flag': '🌸', 'voiceCode': 'kn'},
    {'code': 'bn', 'name': 'Bengali', 'nativeName': 'বাংলা', 'flag': '🌼', 'voiceCode': 'bn'},
    {'code': 'pa', 'name': 'Punjabi', 'nativeName': 'ਪੰਜਾਬੀ', 'flag': '🌾', 'voiceCode': 'hi'},
    {'code': 'ml', 'name': 'Malayalam', 'nativeName': 'മലയാളം', 'flag': '🌴', 'voiceCode': 'en'},
    {'code': 'en', 'name': 'English', 'nativeName': 'English', 'flag': '🇬🇧', 'voiceCode': 'en'},
  ];

  static const List<Map<String, String>> femaleVoiceList = [
    {'code': 'auto', 'name': '✨ Auto Detect', 'nativeName': 'Auto (Adaptive)', 'flag': '✨'},
    {'code': 'mr', 'name': 'Aarohi (आरोही)', 'nativeName': 'मराठी (Aarohi)', 'flag': '🚩'},
    {'code': 'hi', 'name': 'Swara (स्वरा)', 'nativeName': 'हिंदी (Swara)', 'flag': '🇮🇳'},
    {'code': 'en', 'name': 'Neerja', 'nativeName': 'English (Neerja)', 'flag': '🇬🇧'},
    {'code': 'te', 'name': 'Shruti (శృతి)', 'nativeName': 'తెలుగు (Shruti)', 'flag': '🌿'},
    {'code': 'ta', 'name': 'Pallavi (பல்லவி)', 'nativeName': 'தமிழ் (Pallavi)', 'flag': '🦚'},
    {'code': 'kn', 'name': 'Sapna (ಸಪ್ನಾ)', 'nativeName': 'ಕನ್ನಡ (Sapna)', 'flag': '🌸'},
    {'code': 'gu', 'name': 'Dhwani (ધ્વનિ)', 'nativeName': 'ગુજરાતી (Dhwani)', 'flag': '🦁'},
    {'code': 'bn', 'name': 'Tanishaa (তানিশা)', 'nativeName': 'বাংলা (Tanishaa)', 'flag': '🌼'},
  ];

  static final Map<String, Map<String, dynamic>> _translationCache = {};

  static Future<Map<String, dynamic>> translateText({
    required String text,
    required String targetLang,
    String sourceLang = 'en',
  }) async {
    final clean = text.trim();
    if (clean.isEmpty) {
      return {'success': false, 'translated_text': '', 'error': 'Empty text'};
    }

    if (targetLang == sourceLang || targetLang == 'en') {
      return {
        'success': true,
        'translated_text': clean,
        'target_lang': 'en',
        'native_name': 'English',
        'flag': '🇬🇧',
        'voice_code': 'en',
      };
    }

    final cacheKey = '${sourceLang}_${targetLang}_$clean';
    if (_translationCache.containsKey(cacheKey)) {
      return _translationCache[cacheKey]!;
    }

    try {
      final baseUrl = await getBaseUrl();
      final uri = Uri.parse('$baseUrl/chat/translate');

      final body = jsonEncode({
        'text': clean,
        'target_lang': targetLang,
        'source_lang': sourceLang,
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 7));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true && data['translated_text'] != null) {
          final result = {
            'success': true,
            'translated_text': data['translated_text'],
            'target_lang': data['target_lang'] ?? targetLang,
            'native_name': data['native_name'] ?? targetLang,
            'flag': data['flag'] ?? '🌐',
            'voice_code': data['voice_code'] ?? targetLang,
          };
          _translationCache[cacheKey] = result;
          return result;
        }
      }
    } catch (e) {
      debugPrint('[ApiService.translateText error] $e');
    }

    // Graceful regional fallback if server took too long
    final langObj = supportedLanguages.firstWhere(
      (l) => l['code'] == targetLang,
      orElse: () => {'name': targetLang, 'nativeName': targetLang, 'flag': '🌐'},
    );

    return {
      'success': true,
      'translated_text': clean,
      'target_lang': targetLang,
      'native_name': langObj['nativeName'] ?? targetLang,
      'flag': langObj['flag'] ?? '🌐',
      'voice_code': targetLang,
      'fallback': true,
    };
  }

  static Future<Map<String, dynamic>> testConnection(String url) async {
    try {
      final cleanUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
      final uri = Uri.parse('$cleanUrl/recommend');
      final body = jsonEncode({
        'student_profile': {
          'name': 'Test',
          'marks': 90,
          'exam_type': 'MHT-CET',
          'score_unit': 'percentile',
        }
      });

      final res = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        return {'success': true, 'message': 'Successfully connected to FastAPI Backend!'};
      }
      return {'success': false, 'message': 'Server responded with HTTP ${res.statusCode}'};
    } catch (e) {
      return {'success': false, 'message': 'Cannot reach server: $e'};
    }
  }
}
