import 'package:flutter/foundation.dart';

class VoiceService {
  static bool get isSupported => false;
  static bool get isRecognitionSupported => false;
  static bool get isCurrentlyListening => false;

  static Future<bool> speak({
    required String text,
    String lang = 'en',
    VoidCallback? onStart,
    VoidCallback? onDone,
    VoidCallback? onError,
  }) async {
    debugPrint('[VoiceService Stub] speak not supported on this platform');
    return false;
  }

  static void stopSpeech() {
    debugPrint('[VoiceService Stub] stopSpeech');
  }

  static Future<bool> startListening({
    required String lang,
    required Function(String text, bool isFinal) onResult,
    required VoidCallback onDone,
    required Function(String error) onError,
  }) async {
    debugPrint('[VoiceService Stub] startListening not supported on this platform');
    onError('Speech recognition not available on this platform');
    return false;
  }

  static void stopListening() {
    debugPrint('[VoiceService Stub] stopListening');
  }
}
