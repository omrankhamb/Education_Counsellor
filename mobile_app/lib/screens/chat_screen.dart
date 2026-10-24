import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/voice/voice_service.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime time;
  final List<String>? sources;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.time,
    this.sources,
  });
}

class MessageTranslation {
  final String translatedText;
  final String targetLang;
  final String nativeName;
  final String flag;
  final String voiceCode;
  bool isShowingTranslated;

  MessageTranslation({
    required this.translatedText,
    required this.targetLang,
    required this.nativeName,
    required this.flag,
    required this.voiceCode,
    this.isShowingTranslated = true,
  });
}

class ChatScreen extends StatefulWidget {
  final Map<String, dynamic> studentProfile;
  final String? initialPrompt;

  const ChatScreen({
    super.key,
    required this.studentProfile,
    this.initialPrompt,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;

  // Voice & Language States
  String _selectedVoiceLang = 'auto';
  bool _autoSpeak = false;
  int? _speakingMsgIndex;
  bool _isSynthesizing = false;
  bool _isListening = false;
  String _interimSpeechText = '';
  int _lastSpokenIndex = -1;

  // Translations map keyed by message index
  final Map<int, MessageTranslation> _translations = {};
  final Set<int> _translatingIndices = {};

  // Feedback states (like/dislike) and Copied feedback
  final Map<int, String> _feedbackState = {};
  int? _copiedIndex;

  // Quick counseling follow-ups
  final List<String> _quickPrompts = [
    "Which college is the safest option for my marks?",
    "What are the 5-year cutoff trends for top colleges in my stream?",
    "Which branch has the highest placements?",
    "What scholarships can I apply for with my score?",
    "Compare Government vs Private colleges for my profile",
    "What is the CAP round seat allotment process and documents required?",
  ];

  @override
  void initState() {
    super.initState();
    final name = widget.studentProfile['name'] ?? 'Student';
    final score = widget.studentProfile['score'] ?? widget.studentProfile['marks'] ?? 97.4;
    final exam = widget.studentProfile['exam'] ?? widget.studentProfile['exam_type'] ?? 'MHT-CET';

    _messages.add(
      ChatMessage(
        text: "Hello $name! I'm your AI Admissions Counselor. I have loaded your verified score of $score in $exam. Ask me about cutoffs, CAP rounds, fee waivers, branch comparisons, or use the voice & language tools above!",
        isUser: false,
        time: DateTime.now(),
        sources: const ["CET Cell Gazette 2024", "MahaDBT Rules"],
      ),
    );

    if (widget.initialPrompt != null && widget.initialPrompt!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleSendMessage(widget.initialPrompt!);
      });
    }
  }

  @override
  void dispose() {
    VoiceService.stopSpeech();
    VoiceService.stopListening();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSendMessage(String text) async {
    final query = text.trim();
    if (query.isEmpty || _isLoading) return;

    if (_isListening) {
      _stopListening();
    }

    _controller.clear();
    setState(() {
      _messages.add(ChatMessage(text: query, isUser: true, time: DateTime.now()));
      _isLoading = true;
    });

    _scrollToBottom();

    final reply = await ApiService.sendChat(
      message: query,
      studentProfile: widget.studentProfile,
    );

    if (mounted) {
      setState(() {
        _messages.add(
          ChatMessage(
            text: reply,
            isUser: false,
            time: DateTime.now(),
            sources: const ["CET Cell Official Cutoffs", "Gazette 2024"],
          ),
        );
        _isLoading = false;
      });
      _scrollToBottom();

      // Auto-speak if enabled
      if (_autoSpeak) {
        final newIndex = _messages.length - 1;
        if (newIndex > _lastSpokenIndex) {
          _lastSpokenIndex = newIndex;
          _handleToggleSpeak(newIndex, reply);
        }
      }
    }
  }

  // --- VOICE SYNTHESIS (TTS) ---
  Future<void> _handleToggleSpeak(int index, String content, [String? langOverride]) async {
    if (_speakingMsgIndex == index) {
      VoiceService.stopSpeech();
      setState(() {
        _speakingMsgIndex = null;
        _isSynthesizing = false;
      });
      return;
    }

    VoiceService.stopSpeech();
    setState(() {
      _speakingMsgIndex = index;
      _isSynthesizing = true;
    });

    final targetLang = langOverride ?? _selectedVoiceLang;

    final success = await VoiceService.speak(
      text: content,
      lang: targetLang,
      onStart: () {
        if (mounted) {
          setState(() {
            _isSynthesizing = false;
          });
        }
      },
      onDone: () {
        if (mounted) {
          setState(() {
            _speakingMsgIndex = null;
            _isSynthesizing = false;
          });
        }
      },
      onError: () {
        if (mounted) {
          setState(() {
            _speakingMsgIndex = null;
            _isSynthesizing = false;
          });
        }
      },
    );

    if (!success && mounted) {
      setState(() {
        _speakingMsgIndex = null;
        _isSynthesizing = false;
      });
    }
  }

  // --- SPEECH-TO-TEXT MICROPHONE ---
  void _toggleMic() {
    if (_isListening) {
      _stopListening();
    } else {
      _startListening();
    }
  }

  void _startListening() {
    setState(() {
      _isListening = true;
      _interimSpeechText = '';
    });

    final targetLang = _selectedVoiceLang == 'auto' ? 'en' : _selectedVoiceLang;

    VoiceService.startListening(
      lang: targetLang,
      onResult: (text, isFinal) {
        if (mounted) {
          setState(() {
            if (isFinal) {
              final cur = _controller.text;
              _controller.text = cur.isEmpty ? text : '$cur $text';
              _controller.selection = TextSelection.fromPosition(
                TextPosition(offset: _controller.text.length),
              );
              _interimSpeechText = '';
            } else {
              _interimSpeechText = text;
            }
          });
        }
      },
      onDone: () {
        if (mounted) {
          setState(() {
            _isListening = false;
            _interimSpeechText = '';
          });
        }
      },
      onError: (err) {
        if (mounted) {
          setState(() {
            _isListening = false;
            _interimSpeechText = '';
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(err),
              backgroundColor: Colors.red.shade700,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
    );
  }

  void _stopListening() {
    VoiceService.stopListening();
    setState(() {
      _isListening = false;
      _interimSpeechText = '';
    });
  }

  // --- LANGUAGE TRANSLATOR FOR MESSAGES ---
  Future<void> _handleTranslateMessage(int index, String text, String targetLang) async {
    setState(() {
      _translatingIndices.add(index);
    });

    final res = await ApiService.translateText(
      text: text,
      targetLang: targetLang,
      sourceLang: 'en',
    );

    if (mounted) {
      setState(() {
        _translatingIndices.remove(index);
        if (res['success'] == true) {
          _translations[index] = MessageTranslation(
            translatedText: res['translated_text'] ?? text,
            targetLang: res['target_lang'] ?? targetLang,
            nativeName: res['native_name'] ?? targetLang,
            flag: res['flag'] ?? '🌐',
            voiceCode: res['voice_code'] ?? targetLang,
            isShowingTranslated: true,
          );
        }
      });
    }
  }

  void _toggleTranslationView(int index) {
    setState(() {
      final t = _translations[index];
      if (t != null) {
        t.isShowingTranslated = !t.isShowingTranslated;
      }
    });
  }

  // --- CLIPBOARD & FEEDBACK ---
  Future<void> _copyMessage(int index, String content) async {
    await Clipboard.setData(ClipboardData(text: content));
    if (mounted) {
      setState(() {
        _copiedIndex = index;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Response copied to clipboard!'),
          duration: Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted && _copiedIndex == index) {
          setState(() {
            _copiedIndex = null;
          });
        }
      });
    }
  }

  void _toggleFeedback(int index, String type) {
    setState(() {
      if (_feedbackState[index] == type) {
        _feedbackState.remove(index);
      } else {
        _feedbackState[index] = type;
      }
    });
  }

  void _regenerateResponse(int index) {
    // Find preceding user question
    for (int i = index - 1; i >= 0; i--) {
      if (_messages[i].isUser) {
        final query = _messages[i].text;
        _handleSendMessage(query);
        break;
      }
    }
  }

  void _clearChat() {
    VoiceService.stopSpeech();
    setState(() {
      _messages.clear();
      _translations.clear();
      _feedbackState.clear();
      _speakingMsgIndex = null;
      _lastSpokenIndex = -1;
      final name = widget.studentProfile['name'] ?? 'Student';
      _messages.add(
        ChatMessage(
          text: "Chat cleared! How can I assist you with your college admissions journey today, $name?",
          isUser: false,
          time: DateTime.now(),
        ),
      );
    });
  }

  // --- STANDALONE LANGUAGE CONVERTER DIALOG ---
  void _openStandaloneConverter() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => const _LanguageConverterDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.studentProfile['name'] ?? 'Student';
    final stream = widget.studentProfile['stream'] ?? 'Engineering';
    final score = widget.studentProfile['score'] ?? widget.studentProfile['marks'] ?? 97.4;
    final exam = widget.studentProfile['exam'] ?? widget.studentProfile['exam_type'] ?? 'MHT-CET';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A237E),
        elevation: 2,
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF3949AB), Color(0xFF1E3A8A)],
                ),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFFB300), width: 1.5),
              ),
              child: const Icon(Icons.school, color: Color(0xFFFFB300), size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const Flexible(
                        child: Text(
                          'AI Education Counselor',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'ONLINE',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '$name • $stream ($exam: $score)',
                    style: const TextStyle(fontSize: 11, color: Color(0xFFFFD54F)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.white70, size: 20),
            tooltip: 'Clear Chat',
            onPressed: _clearChat,
          ),
        ],
      ),
      body: Column(
        children: [
          // Voice & Regional Language Converter Control Bar
          _buildTopControlsBar(),

          // Main Messages Area (Centered with maxWidth: 860 for desktop/tablet/web)
          Expanded(
            child: Align(
              alignment: Alignment.topCenter,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 860),
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final msg = _messages[index];
                    return _buildMessageItem(msg, index);
                  },
                ),
              ),
            ),
          ),

          // Loading Counselor Indicator
          if (_isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 860),
                child: Row(
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2563EB)),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Counselor is analyzing CET Cell cutoffs & gazette...',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
            ),

          // Quick Counselor Prompts Bar
          _buildQuickPromptsBar(),

          // Modern Input Bar with Voice Input (Mic)
          _buildInputBar(),
        ],
      ),
    );
  }

  // --- TOP CONTROLS BAR: VOICE PACK + AUTO-VOICE + LANGUAGE CONVERTER ---
  Widget _buildTopControlsBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            // Lady Voice Selector Dropdown
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('👩 Lady Voice: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
                  DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedVoiceLang,
                      isDense: true,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                      items: ApiService.femaleVoiceList.map((v) {
                        return DropdownMenuItem<String>(
                          value: v['code'],
                          child: Text('${v['flag']} ${v['nativeName']}'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedVoiceLang = val;
                          });
                          VoiceService.stopSpeech();
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Auto-Voice Toggle Button
            InkWell(
              onTap: () {
                setState(() {
                  _autoSpeak = !_autoSpeak;
                  if (!_autoSpeak) {
                    VoiceService.stopSpeech();
                    _speakingMsgIndex = null;
                  }
                });
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: _autoSpeak ? const Color(0xFF1A237E) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _autoSpeak ? const Color(0xFF1A237E) : const Color(0xFFCBD5E1),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _autoSpeak ? Icons.volume_up : Icons.volume_off,
                      size: 13,
                      color: _autoSpeak ? Colors.white : const Color(0xFF475569),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Auto-Voice: ${_autoSpeak ? 'ON' : 'OFF'}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: _autoSpeak ? Colors.white : const Color(0xFF475569),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Standalone Language Converter Tool Button
            InkWell(
              onTap: _openStandaloneConverter,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEEF2FF), Color(0xFFE0E7FF)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF6366F1)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.translate, size: 13, color: Color(0xFF4F46E5)),
                    SizedBox(width: 4),
                    Text(
                      '🌐 Language Converter',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF4338CA),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- MESSAGE ITEM BUILDER ---
  Widget _buildMessageItem(ChatMessage msg, int index) {
    if (msg.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          constraints: const BoxConstraints(maxWidth: 580),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                    ),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(4),
                    ),
                    boxShadow: [
                      BoxShadow(color: Color(0x1A000000), blurRadius: 4, offset: Offset(0, 2)),
                    ],
                  ),
                  child: Text(
                    msg.text,
                    style: const TextStyle(color: Colors.white, fontSize: 13.5, height: 1.45),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const CircleAvatar(
                radius: 14,
                backgroundColor: Color(0xFFFFD54F),
                child: Icon(Icons.person, color: Color(0xFF1A237E), size: 16),
              ),
            ],
          ),
        ),
      );
    }

    // AI Counselor Response Card
    final tr = _translations[index];
    final isShowingTranslated = tr != null && tr.isShowingTranslated;
    final displayContent = isShowingTranslated ? tr.translatedText : msg.text;
    final isSpeaking = _speakingMsgIndex == index;
    final isCopied = _copiedIndex == index;
    final isLiked = _feedbackState[index] == 'liked';
    final isDisliked = _feedbackState[index] == 'disliked';
    final isTranslating = _translatingIndices.contains(index);

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        constraints: const BoxConstraints(maxWidth: 720),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                ),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFFB300), width: 1),
                boxShadow: const [
                  BoxShadow(color: Color(0x1A000000), blurRadius: 3, offset: Offset(0, 1)),
                ],
              ),
              child: const Icon(Icons.school, color: Color(0xFFFFB300), size: 16),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Counselor Header with Verified Badge
                  Row(
                    children: [
                      const Text(
                        'AI Counselor',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF93C5FD)),
                        ),
                        child: const Text(
                          'Verified Guide',
                          style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Translation Toggle Notice Bar (if translated)
                  if (tr != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFC7D2FE)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              '${tr.flag} ${isShowingTranslated ? "Converted to ${tr.nativeName} (${tr.targetLang.toUpperCase()})" : "Showing Original English"}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF4338CA)),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          InkWell(
                            onTap: () => _toggleTranslationView(index),
                            child: Text(
                              isShowingTranslated ? '🇬🇧 Show English' : '🔄 Show ${tr.nativeName}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5), decoration: TextDecoration.underline),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Message Card Content
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(4),
                        topRight: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                      border: Border.all(
                        color: isSpeaking ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0),
                        width: isSpeaking ? 1.5 : 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isSpeaking ? const Color(0x336366F1) : const Color(0x0D000000),
                          blurRadius: isSpeaking ? 8 : 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SelectableText(
                          displayContent,
                          style: const TextStyle(
                            color: Color(0xFF1E293B),
                            fontSize: 13.5,
                            height: 1.55,
                          ),
                        ),

                        // Sources badge
                        if (msg.sources != null && msg.sources!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Text(
                                  '📄 Gazette Grounded: ${msg.sources!.join(", ")}',
                                  style: const TextStyle(fontSize: 10, color: Color(0xFF475569), fontWeight: FontWeight.w500),
                                ),
                              ),
                            ],
                          ),
                        ],

                        const SizedBox(height: 10),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 8),

                        // Bottom Action Bar: Copy, Voice, Like, Dislike, Regenerate, Convert
                        Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            // Left Icons: Copy, Voice TTS, Thumbs Up/Down, Regenerate
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Copy
                                _buildActionIcon(
                                  icon: isCopied ? Icons.check : Icons.copy,
                                  color: isCopied ? Colors.green : const Color(0xFF64748B),
                                  tooltip: isCopied ? 'Copied!' : 'Copy Response',
                                  onTap: () => _copyMessage(index, displayContent),
                                ),
                                const SizedBox(width: 4),

                                // Listen Lady Voice
                                _buildActionIcon(
                                  icon: isSpeaking ? Icons.stop : Icons.volume_up,
                                  color: isSpeaking ? Colors.red : const Color(0xFF64748B),
                                  tooltip: isSpeaking ? 'Stop Voice' : 'Listen in Lady Voice',
                                  isLoading: isSpeaking && _isSynthesizing,
                                  onTap: () {
                                    final voiceLang = isShowingTranslated ? tr.voiceCode : _selectedVoiceLang;
                                    _handleToggleSpeak(index, displayContent, voiceLang);
                                  },
                                ),
                                const SizedBox(width: 4),

                                // Thumbs Up
                                _buildActionIcon(
                                  icon: isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                                  color: isLiked ? const Color(0xFF1A237E) : const Color(0xFF64748B),
                                  tooltip: 'Good Response',
                                  onTap: () => _toggleFeedback(index, 'liked'),
                                ),
                                const SizedBox(width: 4),

                                // Thumbs Down
                                _buildActionIcon(
                                  icon: isDisliked ? Icons.thumb_down : Icons.thumb_down_outlined,
                                  color: isDisliked ? Colors.red : const Color(0xFF64748B),
                                  tooltip: 'Bad Response',
                                  onTap: () => _toggleFeedback(index, 'disliked'),
                                ),
                                const SizedBox(width: 4),

                                // Regenerate
                                _buildActionIcon(
                                  icon: Icons.refresh,
                                  color: const Color(0xFF64748B),
                                  tooltip: 'Regenerate Response',
                                  onTap: () => _regenerateResponse(index),
                                ),
                              ],
                            ),

                            // Right: Regional Language Converter Dropdown
                            PopupMenuButton<String>(
                              tooltip: 'Convert into Regional Language',
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: isTranslating
                                    ? const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SizedBox(
                                            width: 10,
                                            height: 10,
                                            child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF4F46E5)),
                                          ),
                                          SizedBox(width: 4),
                                          Text('Converting...', style: TextStyle(fontSize: 10.5, color: Color(0xFF4F46E5))),
                                        ],
                                      )
                                    : Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.translate, size: 12, color: Color(0xFF4F46E5)),
                                          const SizedBox(width: 3),
                                          Text(
                                            tr != null ? '${tr.flag} ${tr.nativeName}' : '🌐 Convert',
                                            style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                          ),
                                          const Icon(Icons.arrow_drop_down, size: 14, color: Color(0xFF64748B)),
                                        ],
                                      ),
                              ),
                              itemBuilder: (ctx) {
                                return [
                                  const PopupMenuItem<String>(
                                    enabled: false,
                                    height: 26,
                                    child: Text(
                                      'CONVERT FROM ENGLISH:',
                                      style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                                    ),
                                  ),
                                  ...ApiService.supportedLanguages.where((l) => l['code'] != 'en').map((lang) {
                                    return PopupMenuItem<String>(
                                      value: lang['code'],
                                      height: 34,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text('${lang['flag']} ${lang['nativeName']}', style: const TextStyle(fontSize: 12)),
                                          Text(lang['name'] ?? '', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                        ],
                                      ),
                                    );
                                  }),
                                  if (tr != null) ...[
                                    const PopupMenuDivider(height: 1),
                                    PopupMenuItem<String>(
                                      value: '__toggle__',
                                      height: 32,
                                      child: Text(
                                        isShowingTranslated ? '🇬🇧 Show Original English' : '🔄 Show ${tr.nativeName}',
                                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                                      ),
                                    ),
                                  ],
                                ];
                              },
                              onSelected: (code) {
                                if (code == '__toggle__') {
                                  _toggleTranslationView(index);
                                } else {
                                  _handleTranslateMessage(index, msg.text, code);
                                }
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionIcon({
    required IconData icon,
    required Color color,
    required String tooltip,
    required VoidCallback onTap,
    bool isLoading = false,
  }) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: isLoading ? null : onTap,
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(4),
          ),
          child: isLoading
              ? const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF1A237E)),
                )
              : Icon(icon, size: 14, color: color),
        ),
      ),
    );
  }

  // --- QUICK PROMPTS BAR ---
  Widget _buildQuickPromptsBar() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      color: Colors.white,
      child: Align(
        alignment: Alignment.center,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 860),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                const Row(
                  children: [
                    Text('✨ Quick: ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                  ],
                ),
                ..._quickPrompts.map((p) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ActionChip(
                      label: Text(p, style: const TextStyle(fontSize: 11, color: Color(0xFF1E293B))),
                      backgroundColor: const Color(0xFFF1F5F9),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
                      onPressed: () => _handleSendMessage(p),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- INPUT BAR WITH MICROPHONE (SPEECH-TO-TEXT) ---
  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        boxShadow: [
          BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        child: Align(
          alignment: Alignment.center,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 860),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Live Interim Speech Feedback Banner
                if (_isListening)
                  Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red),
                        ),
                        const SizedBox(width: 8),
                        const Text('Listening... ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.red)),
                        Expanded(
                          child: Text(
                            _interimSpeechText.isNotEmpty
                                ? '"$_interimSpeechText"'
                                : 'Speak now in Marathi, Hindi, English, etc...',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        InkWell(
                          onTap: _stopListening,
                          child: const Text('Done', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.red)),
                        ),
                      ],
                    ),
                  ),

                // Text Input Pill
                Row(
                  children: [
                    // Microphone Speech Input Button
                    Tooltip(
                      message: _isListening ? 'Stop listening' : 'Speak into microphone (Voice Input)',
                      child: InkWell(
                        onTap: _toggleMic,
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: _isListening ? const Color(0xFFDC2626) : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _isListening ? Colors.red : const Color(0xFFCBD5E1),
                            ),
                          ),
                          child: Icon(
                            _isListening ? Icons.stop : Icons.mic,
                            size: 19,
                            color: _isListening ? Colors.white : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Main Textfield
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        minLines: 1,
                        maxLines: 4,
                        decoration: InputDecoration(
                          hintText: _isListening
                              ? 'Listening to your voice...'
                              : 'Ask about cutoffs, colleges, CAP rounds, or click mic...',
                          hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: Color(0xFF1A237E), width: 1.5),
                          ),
                        ),
                        onSubmitted: _handleSendMessage,
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Send Button
                    Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: Color(0x261A237E), blurRadius: 4, offset: Offset(0, 2)),
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.send, color: Colors.white, size: 17),
                        onPressed: () => _handleSendMessage(_controller.text),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 4),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Press Enter to send', style: TextStyle(fontSize: 9.5, color: Color(0xFF94A3B8))),
                    Text('🎙️ Voice Input • 👩 Neural Lady Voice • 🌐 Language Converter', style: TextStyle(fontSize: 9.5, color: Color(0xFF94A3B8))),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// STANDALONE ENGLISH TO REGIONAL LANGUAGE CONVERTER DIALOG
// ============================================================================
class _LanguageConverterDialog extends StatefulWidget {
  const _LanguageConverterDialog();

  @override
  State<_LanguageConverterDialog> createState() => _LanguageConverterDialogState();
}

class _LanguageConverterDialogState extends State<_LanguageConverterDialog> {
  final TextEditingController _inputController = TextEditingController();
  String _targetLang = 'mr';
  bool _isLoading = false;
  Map<String, dynamic>? _result;
  bool _isSpeaking = false;
  bool _copied = false;

  final List<String> _quickTemplates = [
    "What is the CAP round seat allotment process and how to freeze seats?",
    "Which top engineering colleges in Maharashtra offer 95 percentile cutoffs?",
    "What documents and eligibility are required for state scholarship?",
    "Compare Government vs Private colleges for placements and fees.",
  ];

  @override
  void dispose() {
    VoiceService.stopSpeech();
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _handleConvert() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _isLoading = true;
      _result = null;
      _copied = false;
    });

    final res = await ApiService.translateText(
      text: text,
      targetLang: _targetLang,
      sourceLang: 'en',
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        _result = res;
      });
    }
  }

  Future<void> _copyResult() async {
    final text = _result?['translated_text'];
    if (text != null) {
      await Clipboard.setData(ClipboardData(text: text));
      setState(() {
        _copied = true;
      });
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() {
            _copied = false;
          });
        }
      });
    }
  }

  Future<void> _toggleSpeakResult() async {
    final text = _result?['translated_text'];
    if (text == null) return;

    if (_isSpeaking) {
      VoiceService.stopSpeech();
      setState(() {
        _isSpeaking = false;
      });
      return;
    }

    setState(() {
      _isSpeaking = true;
    });

    final voiceCode = _result?['voice_code'] ?? _targetLang;
    await VoiceService.speak(
      text: text,
      lang: voiceCode,
      onDone: () {
        if (mounted) setState(() => _isSpeaking = false);
      },
      onError: () {
        if (mounted) setState(() => _isSpeaking = false);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 680, maxHeight: 720),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Modal Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(40),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.language, color: Color(0xFFFFD54F), size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'English to Regional Language Converter',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        Text(
                          'Convert admission rules, cutoffs, or queries to Marathi, Hindi, Telugu, and more',
                          style: TextStyle(fontSize: 10.5, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Modal Body
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Quick Templates
                    const Text('💡 Quick templates (click to populate):', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _quickTemplates.map((tpl) {
                        return InkWell(
                          onTap: () {
                            setState(() {
                              _inputController.text = tpl;
                            });
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Text(
                              tpl.length > 44 ? '${tpl.substring(0, 44)}...' : tpl,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF334155)),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),

                    // English Source Input
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('🇬🇧 English Text / Admission Query:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                        if (_inputController.text.isNotEmpty)
                          InkWell(
                            onTap: () => setState(() => _inputController.clear()),
                            child: const Text('Clear', style: TextStyle(fontSize: 11, color: Color(0xFF2563EB), decoration: TextDecoration.underline)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _inputController,
                      minLines: 3,
                      maxLines: 5,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Type or paste any English text, question, or guidance you want to convert...',
                        hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),

                    // Language Selector and Convert Button Bar
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Text('Convert into: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                          const SizedBox(width: 8),
                          Expanded(
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _targetLang,
                                isDense: true,
                                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF1A237E)),
                                items: ApiService.supportedLanguages.where((l) => l['code'] != 'en').map((lang) {
                                  return DropdownMenuItem<String>(
                                    value: lang['code'],
                                    child: Text('${lang['flag']} ${lang['nativeName']} (${lang['name']})'),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _targetLang = val;
                                    });
                                  }
                                },
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            icon: _isLoading
                                ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white))
                                : const Icon(Icons.translate, size: 14),
                            label: Text(_isLoading ? 'Translating...' : 'Convert Now', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1A237E),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: _isLoading || _inputController.text.trim().isEmpty ? null : _handleConvert,
                          ),
                        ],
                      ),
                    ),

                    // Converted Output Result
                    if (_result != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF93C5FD)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Text(_result?['flag'] ?? '🚩', style: const TextStyle(fontSize: 16)),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${_result?['native_name'] ?? _targetLang} Translation:',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    // Listen
                                    IconButton(
                                      icon: Icon(_isSpeaking ? Icons.stop : Icons.volume_up, size: 18, color: _isSpeaking ? Colors.red : const Color(0xFF1E3A8A)),
                                      tooltip: _isSpeaking ? 'Stop voice' : 'Listen voice',
                                      onPressed: _toggleSpeakResult,
                                    ),
                                    // Copy
                                    IconButton(
                                      icon: Icon(_copied ? Icons.check : Icons.copy, size: 16, color: _copied ? Colors.green : const Color(0xFF1E3A8A)),
                                      tooltip: _copied ? 'Copied!' : 'Copy translation',
                                      onPressed: _copyResult,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const Divider(height: 8, color: Color(0xFFBFDBFE)),
                            SelectableText(
                              _result?['translated_text'] ?? '',
                              style: const TextStyle(fontSize: 13.5, height: 1.5, color: Color(0xFF0F172A)),
                            ),
                          ],
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
