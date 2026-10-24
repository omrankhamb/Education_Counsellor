// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'package:flutter/foundation.dart';

class VoiceService {
  static html.SpeechRecognition? _recognition;
  static bool _isListening = false;
  static html.AudioElement? _currentAudio;

  static bool get isSupported => html.window.speechSynthesis != null;
  static bool get isRecognitionSupported => html.SpeechRecognition.supported;
  static bool get isCurrentlyListening => _isListening;

  static final Map<String, String> _speechLocales = {
    'en': 'en-IN',
    'mr': 'mr-IN',
    'hi': 'hi-IN',
    'te': 'te-IN',
    'ta': 'ta-IN',
    'kn': 'kn-IN',
    'bn': 'bn-IN',
    'gu': 'gu-IN',
    'auto': 'en-IN',
  };

  /// Clean markdown, code blocks, links, and excessive punctuation for natural speech
  static String cleanTextForSpeech(String rawText, {int maxChars = 280}) {
    if (rawText.isEmpty) return '';
    var text = rawText;

    // Strip code blocks and inline code
    text = text.replaceAll(RegExp(r'```[\s\S]*?```'), ' ');
    text = text.replaceAll(RegExp(r'`([^`]+)`'), r'$1');

    // Strip markdown table rows
    text = text.split('\n').where((line) => !line.trim().startsWith('|')).join('\n');

    // Strip markdown links [text](url) -> text
    text = text.replaceAll(RegExp(r'\[([^\]]+)\]\([^\)]+\)'), r'$1');

    // Strip headers, bold, italics, bullets
    text = text.replaceAll(RegExp(r'^#{1,6}\s*', multiLine: true), '');
    text = text.replaceAll(RegExp(r'\*\*([^*]+)\*\*'), r'$1');
    text = text.replaceAll(RegExp(r'\*([^*]+)\*'), r'$1');
    text = text.replaceAll(RegExp(r'__([^_]+)__'), r'$1');
    text = text.replaceAll(RegExp(r'_([^_]+)_'), r'$1');
    text = text.replaceAll(RegExp(r'^\s*[-*•]\s+', multiLine: true), '');
    text = text.replaceAll(RegExp(r'^\s*\d+\.\s+', multiLine: true), '');

    // Strip citation brackets e.g. [1]
    text = text.replaceAll(RegExp(r'\[\d+\]'), '');

    // Collapse whitespace
    text = text.replaceAll(RegExp(r'\s+'), ' ').trim();

    // Sentence boundary truncation for fast snappy voice preview
    if (text.length > maxChars) {
      final trimmed = text.substring(0, maxChars);
      final lastDot = trimmed.lastIndexOf('.');
      final lastExcl = trimmed.lastIndexOf('!');
      final lastQ = trimmed.lastIndexOf('?');
      final lastDanda = trimmed.lastIndexOf('।');
      final lastPunct = [lastDot, lastExcl, lastQ, lastDanda].reduce((a, b) => a > b ? a : b);
      if (lastPunct > (maxChars * 0.45).toInt()) {
        text = trimmed.substring(0, lastPunct + 1).trim();
      } else {
        text = '${trimmed.trim()}...';
      }
    }

    return text;
  }

  /// Synthesize voice using browser SpeechSynthesis API (instantaneous 0ms latency)
  static Future<bool> speak({
    required String text,
    String lang = 'en',
    VoidCallback? onStart,
    VoidCallback? onDone,
    VoidCallback? onError,
  }) async {
    stopSpeech();

    final clean = cleanTextForSpeech(text);
    if (clean.isEmpty) {
      onError?.call();
      return false;
    }

    final synth = html.window.speechSynthesis;
    if (synth == null) {
      onError?.call();
      return false;
    }

    try {
      final utterance = html.SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.05;

      final targetLocale = _speechLocales[lang] ?? _speechLocales['en']!;
      utterance.lang = targetLocale;

      // Select female regional voice if available
      final voices = synth.getVoices();
      if (voices.isNotEmpty) {
        final lowerLang = lang.toLowerCase();
        html.SpeechSynthesisVoice? matchedVoice;
        for (final v in voices) {
          final vLang = (v.lang ?? '').toLowerCase();
          final vName = (v.name ?? '').toLowerCase();
          final isLangMatch = vLang.contains(lowerLang) || vLang.contains(targetLocale.toLowerCase());
          final isFemale = vName.contains('female') ||
              vName.contains('neerja') ||
              vName.contains('swara') ||
              vName.contains('aarohi') ||
              vName.contains('zira') ||
              vName.contains('priya');
          if (isLangMatch && isFemale) {
            matchedVoice = v;
            break;
          }
        }
        matchedVoice ??= voices.firstWhere(
          (v) => (v.lang ?? '').toLowerCase().contains(lowerLang),
          orElse: () => voices.first,
        );

        utterance.voice = matchedVoice;
      }

      utterance.onStart.listen((_) {
        onStart?.call();
      });

      utterance.onEnd.listen((_) {
        onDone?.call();
      });

      utterance.onError.listen((_) {
        onError?.call();
      });

      synth.speak(utterance);
      return true;
    } catch (e) {
      debugPrint('[VoiceService Web Speech Error] $e');
      onError?.call();
      return false;
    }
  }

  /// Stop any active speech synthesis or audio
  static void stopSpeech() {
    try {
      html.window.speechSynthesis?.cancel();
    } catch (_) {}

    try {
      _currentAudio?.pause();
      _currentAudio = null;
    } catch (_) {}
  }

  /// Start Web Speech Recognition from microphone
  static Future<bool> startListening({
    required String lang,
    required Function(String text, bool isFinal) onResult,
    required VoidCallback onDone,
    required Function(String error) onError,
  }) async {
    if (!html.SpeechRecognition.supported) {
      onError('Microphone speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return false;
    }

    stopListening();

    try {
      final rec = html.SpeechRecognition();
      _recognition = rec;
      rec.continuous = false;
      rec.interimResults = true;

      final targetLocale = _speechLocales[lang] ?? 'en-IN';
      rec.lang = targetLocale;

      _isListening = true;

      rec.onResult.listen((event) {
        final results = event.results;
        if (results != null && results.isNotEmpty) {
          final lastResult = results.last;
          final item = lastResult.item(0);
          final transcript = item.transcript ?? '';
          final isFinal = lastResult.isFinal ?? false;
          if (transcript.isNotEmpty) {
            onResult(transcript, isFinal);
          }
        }
      });

      rec.onError.listen((event) {
        debugPrint('[SpeechRecognition error] $event');
        _isListening = false;
        onError('Microphone input error. Please check permissions.');
      });

      rec.onEnd.listen((_) {
        _isListening = false;
        onDone();
      });

      rec.start();
      return true;
    } catch (e) {
      _isListening = false;
      debugPrint('[SpeechRecognition start error] $e');
      onError('Could not start microphone: $e');
      return false;
    }
  }

  /// Stop listening to microphone
  static void stopListening() {
    _isListening = false;
    try {
      _recognition?.stop();
      _recognition = null;
    } catch (_) {}
  }
}
