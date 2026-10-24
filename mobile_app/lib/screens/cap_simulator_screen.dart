import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class CapSimulatorScreen extends StatefulWidget {
  final StudentProfile studentProfile;

  const CapSimulatorScreen({
    super.key,
    required this.studentProfile,
  });

  @override
  State<CapSimulatorScreen> createState() => _CapSimulatorScreenState();
}

class _CapSimulatorScreenState extends State<CapSimulatorScreen> {
  String _selectedCategory = 'OBC';
  String _selectedRound = 'CAP Round 1';
  bool _isLoadingRebalance = false;

  // 10-20 Default Preference Choices matching Web Parity
  List<Map<String, dynamic>> _choices = [
    {
      'code': '6006',
      'name': 'COEP Technological University',
      'branch': 'Computer Engineering',
      'c26': 99.88,
      'tier': 'Dream',
      'prob': 25,
      'fees': 135000,
    },
    {
      'code': '3012',
      'name': 'VJTI Mumbai',
      'branch': 'Computer Engineering',
      'c26': 99.85,
      'tier': 'Dream',
      'prob': 30,
      'fees': 92000,
    },
    {
      'code': '6271',
      'name': 'PICT Pune',
      'branch': 'Computer Engineering',
      'c26': 99.65,
      'tier': 'Dream',
      'prob': 35,
      'fees': 115000,
    },
    {
      'code': '3215',
      'name': 'SPIT Mumbai',
      'branch': 'Computer Engineering',
      'c26': 99.60,
      'tier': 'Target',
      'prob': 55,
      'fees': 172000,
    },
    {
      'code': '6271',
      'name': 'PICT Pune',
      'branch': 'Information Technology',
      'c26': 99.45,
      'tier': 'Target',
      'prob': 65,
      'fees': 115000,
    },
    {
      'code': '6007',
      'name': 'Walchand College of Engineering (WCE)',
      'branch': 'Computer Science & Engineering',
      'c26': 99.25,
      'tier': 'Target',
      'prob': 75,
      'fees': 88000,
    },
    {
      'code': '6276',
      'name': 'Cummins College of Engineering (Women)',
      'branch': 'Computer Engineering',
      'c26': 98.85,
      'tier': 'Target',
      'prob': 75,
      'fees': 168000,
    },
    {
      'code': '6175',
      'name': 'PCCOE Pune',
      'branch': 'Computer Engineering',
      'c26': 99.05,
      'tier': 'Safe',
      'prob': 85,
      'fees': 138000,
    },
    {
      'code': '6284',
      'name': 'VIIT Kondhwa Pune',
      'branch': 'Computer Engineering',
      'c26': 98.05,
      'tier': 'Safe',
      'prob': 95,
      'fees': 158000,
    },
    {
      'code': '6145',
      'name': 'AISSMS IOIT Pune',
      'branch': 'Computer Engineering',
      'c26': 96.50,
      'tier': 'Safe',
      'prob': 98,
      'fees': 125000,
    },
  ];

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.studentProfile.category;
  }

  // Generate 9-digit DTE Choice Code: College Code (4) + Branch Code (3) + Status (2)
  String _getChoiceCode(String collegeCode, String branch) {
    String branchCode = "245";
    final b = branch.toLowerCase();
    if (b.contains("info") || b.contains("it")) branchCode = "246";
    if (b.contains("ai") || b.contains("data")) branchCode = "263";
    if (b.contains("elect") || b.contains("tele")) branchCode = "372";
    if (b.contains("mech")) branchCode = "612";
    if (b.contains("civil")) branchCode = "191";
    return "$collegeCode${branchCode}10";
  }

  // Calculate dynamic adjusted cutoff based on Category & Round
  double _getAdjustedCutoff(double baseCutoff) {
    double catOffset = 0.0;
    if (_selectedCategory == 'OBC') catOffset = -0.75;
    if (_selectedCategory == 'EWS') catOffset = -0.40;
    if (_selectedCategory == 'TFWS') catOffset = 0.35;
    if (_selectedCategory == 'SC') catOffset = -4.20;
    if (_selectedCategory == 'ST') catOffset = -8.50;

    double roundOffset = 0.0;
    if (_selectedRound == 'CAP Round 2') roundOffset = -0.65;
    if (_selectedRound == 'CAP Round 3') roundOffset = -1.40;
    if (_selectedRound == 'Spot Round') roundOffset = -2.25;

    return double.parse((baseCutoff + catOffset + roundOffset).toStringAsFixed(2));
  }

  // Provisional Allotment Simulator Logic (Scans 1 to N sequentially)
  Map<String, dynamic>? _getProvisionalAllotment() {
    for (int i = 0; i < _choices.length; i++) {
      final c = _choices[i];
      final adjCutoff = _getAdjustedCutoff((c['c26'] as num).toDouble());
      if (widget.studentProfile.marks >= adjCutoff) {
        return {
          'pref': i + 1,
          'choice': c,
          'adjCutoff': adjCutoff,
          'isAutoFreeze': i == 0,
        };
      }
    }
    return null;
  }

  void _applyPresetStrategy(String strategy) {
    if (strategy == 'pune_mumbai') {
      setState(() {
        _choices.sort((a, b) {
          final aIsHub = (a['name'] as String).contains('Pune') || (a['name'] as String).contains('Mumbai') || (a['name'] as String).contains('COEP') || (a['name'] as String).contains('VJTI') || (a['name'] as String).contains('PICT');
          final bIsHub = (b['name'] as String).contains('Pune') || (b['name'] as String).contains('Mumbai') || (b['name'] as String).contains('COEP') || (b['name'] as String).contains('VJTI') || (b['name'] as String).contains('PICT');
          if (aIsHub && !bIsHub) return -1;
          if (!aIsHub && bIsHub) return 1;
          return (b['c26'] as num).compareTo(a['c26'] as num);
        });
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Applied Pune & Mumbai Tech Hub Strategy!")),
      );
    } else if (strategy == 'seat_lock') {
      setState(() {
        // Move high-probability and safe choices to top
        _choices.sort((a, b) => (b['prob'] as num).compareTo(a['prob'] as num));
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Applied 100% Round 1 Seat Lock Strategy!")),
      );
    } else if (strategy == 'cs_only') {
      setState(() {
        _choices.sort((a, b) {
          final aIsCs = (a['branch'] as String).toLowerCase().contains('computer') || (a['branch'] as String).toLowerCase().contains('information');
          final bIsCs = (b['branch'] as String).toLowerCase().contains('computer') || (b['branch'] as String).toLowerCase().contains('information');
          if (aIsCs && !bIsCs) return -1;
          if (!aIsCs && bIsCs) return 1;
          return (b['c26'] as num).compareTo(a['c26'] as num);
        });
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Applied Tech / CS Only Track Strategy!")),
      );
    } else {
      _handleAutoRebalance();
    }
  }

  void _showAllotmentExplanationModal(Map<String, dynamic> allotment) {
    final bool isAutoFreeze = allotment['isAutoFreeze'] == true;
    final choice = allotment['choice'] as Map<String, dynamic>;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isAutoFreeze ? Icons.lock : Icons.verified,
                  color: isAutoFreeze ? Colors.red : AppTheme.safeGreen,
                  size: 24,
                ),
                const SizedBox(width: 10),
                Text(
                  isAutoFreeze ? "Auto-Freeze Seat Allotment (Rule 9)" : "Provisional Seat Allotted",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isAutoFreeze ? Colors.red.shade50 : AppTheme.safeGreenBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isAutoFreeze ? Colors.red.shade200 : AppTheme.safeGreen),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Allotted Choice #${allotment['pref']}: ${choice['name']}",
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Branch: ${choice['branch']}",
                    style: const TextStyle(fontSize: 12, color: AppTheme.textDark),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "DTE Choice Code: ${_getChoiceCode(choice['code'], choice['branch'])} • Cutoff: ${allotment['adjCutoff']}%ile",
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Text(
              isAutoFreeze
                  ? "⚠️ Official Rule: Since this is Preference #1, this seat is AUTO-FROZEN by the State CET Cell. You must accept this seat and pay the Seat Acceptance Fee (₹1,000) on MahaCET portal. You cannot participate in subsequent CAP Rounds 2 or 3."
                  : "💡 Official Option: This seat is allotted at Choice #${allotment['pref']}. You can choose:\n\n1. Betterment / Float: Keep this seat secured and try for higher preferences (#1 to #${(allotment['pref'] as int) - 1}) in CAP Round 2.\n2. Self-Freeze: Finalize and take admission now if you are satisfied with this college.",
              style: const TextStyle(fontSize: 12, height: 1.4, color: Colors.black87),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
              ),
              child: const Text("Understood"),
            ),
          ],
        ),
      ),
    );
  }

  // Golden Ratio Auto-Rebalancer (30% Dream : 40% Target : 30% Safe)
  Future<void> _handleAutoRebalance() async {
    setState(() => _isLoadingRebalance = true);

    // Call backend rebalance API
    final res = await ApiService.rebalanceCapWithAi(
      profile: widget.studentProfile,
      choices: _choices,
      capRound: _selectedRound,
      strategyType: 'golden_ratio',
    );

    if (mounted) {
      if (res != null && res['rebalanced_choices'] is List) {
        setState(() {
          _choices = (res['rebalanced_choices'] as List).map((item) {
            return {
              'code': item['college_code']?.toString() ?? '6006',
              'name': item['college_name']?.toString() ?? 'College',
              'branch': item['selected_branch']?.toString() ?? 'Computer Engineering',
              'c26': (item['cutoff_2026'] as num?)?.toDouble() ?? 98.0,
              'tier': item['tier']?.toString() ?? 'Target',
              'prob': (item['admission_probability'] as num?)?.toInt() ?? 70,
              'fees': (item['annual_fees'] as num?)?.toDouble() ?? 120000,
            };
          }).toList();
          _isLoadingRebalance = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("🪄 Option form balanced to Golden Ratio (30% Dream : 40% Target : 30% Safe)!"),
            backgroundColor: AppTheme.safeGreen,
          ),
        );
      } else {
        setState(() => _isLoadingRebalance = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final allotment = _getProvisionalAllotment();
    final safeCount = _choices.where((c) => c['tier'] == 'Safe').length;
    final targetCount = _choices.where((c) => c['tier'] == 'Target').length;
    final dreamCount = _choices.where((c) => c['tier'] == 'Dream').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('CAP Option Form Simulator'),
        actions: [
          IconButton(
            icon: const Icon(Icons.copy),
            tooltip: 'Copy all preference choice codes',
            onPressed: () {
              final codes = _choices
                  .asMap()
                  .entries
                  .map((e) => "Choice #${e.key + 1}: ${_getChoiceCode(e.value['code'], e.value['branch'])} - ${e.value['name']} (${e.value['branch']})")
                  .join("\n");
              Clipboard.setData(ClipboardData(text: codes));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text("Copied 9-digit DTE Choice Codes to clipboard!")),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. FILTER RIBBON (EXAM, CATEGORY, ROUND)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFF0F172A),
            child: Row(
              children: [
                // Category Selector
                Expanded(
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedCategory,
                      dropdownColor: const Color(0xFF1E293B),
                      isDense: true,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      items: ['OPEN', 'OBC', 'EWS', 'TFWS', 'SC', 'ST'].map((cat) {
                        return DropdownMenuItem(value: cat, child: Text("Quota: $cat"));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedCategory = val);
                      },
                    ),
                  ),
                ),
                Container(width: 1, height: 20, color: Colors.white24),
                // Round Selector
                Expanded(
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedRound,
                      dropdownColor: const Color(0xFF1E293B),
                      isDense: true,
                      style: const TextStyle(color: AppTheme.secondary, fontSize: 12, fontWeight: FontWeight.bold),
                      items: ['CAP Round 1', 'CAP Round 2', 'CAP Round 3', 'Spot Round'].map((r) {
                        return DropdownMenuItem(value: r, child: Text(r));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedRound = val);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. PROVISIONAL ALLOTMENT ADVISORY BANNER
          if (allotment != null) ...[
            InkWell(
              onTap: () => _showAllotmentExplanationModal(allotment),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: allotment['isAutoFreeze'] ? AppTheme.safeGreenBg : const Color(0xFFE0F2FE),
                child: Row(
                  children: [
                    Icon(
                      allotment['isAutoFreeze'] ? Icons.check_circle : Icons.swap_vert,
                      color: allotment['isAutoFreeze'] ? AppTheme.safeGreen : const Color(0xFF0284C7),
                      size: 22,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "🎯 Choice #${allotment['pref']} Allotted in $_selectedRound",
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textDark),
                              ),
                              const Text("Rule Info ℹ️", style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Text(
                            "${allotment['choice']['name']} • ${allotment['choice']['branch']} (Adj Cutoff: ${allotment['adjCutoff']}%ile)",
                            style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            allotment['isAutoFreeze']
                                ? "🔒 Mandatory Auto-Freeze (1st Preference Allotment)"
                                : "✨ Seat Secured! Tap for Betterment / Freeze Rules →",
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                              color: allotment['isAutoFreeze'] ? AppTheme.safeGreen : const Color(0xFF0369A1),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: AppTheme.dreamRedBg,
              child: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: AppTheme.dreamRed, size: 22),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      "🚨 ZERO ALLOTMENT ALERT! None of your choices cleared the cutoff in this round. Add safe backup colleges immediately!",
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppTheme.dreamRed),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // 2.5 PRESET STRATEGY SHORTCUTS (Matching Web Application)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                ActionChip(
                  avatar: const Icon(Icons.auto_awesome, size: 14, color: AppTheme.primary),
                  label: const Text("Golden Ratio (30:40:30)", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  onPressed: () => _applyPresetStrategy('golden_ratio'),
                ),
                const SizedBox(width: 6),
                ActionChip(
                  avatar: const Icon(Icons.location_city, size: 14, color: Colors.blue),
                  label: const Text("Pune & Mumbai Hub", style: TextStyle(fontSize: 11)),
                  onPressed: () => _applyPresetStrategy('pune_mumbai'),
                ),
                const SizedBox(width: 6),
                ActionChip(
                  avatar: const Icon(Icons.lock, size: 14, color: Colors.green),
                  label: const Text("100% Round 1 Lock", style: TextStyle(fontSize: 11)),
                  onPressed: () => _applyPresetStrategy('seat_lock'),
                ),
                const SizedBox(width: 6),
                ActionChip(
                  avatar: const Icon(Icons.laptop_chromebook, size: 14, color: Colors.purple),
                  label: const Text("Tech / CS Only", style: TextStyle(fontSize: 11)),
                  onPressed: () => _applyPresetStrategy('cs_only'),
                ),
              ],
            ),
          ),

          // 3. PORTFOLIO RATIO STRIP & GOLDEN RATIO REBALANCER BUTTON
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      _ratioPill("Dream: $dreamCount", AppTheme.dreamRed, AppTheme.dreamRedBg),
                      const SizedBox(width: 4),
                      _ratioPill("Target: $targetCount", AppTheme.targetAmber, AppTheme.targetAmberBg),
                      const SizedBox(width: 4),
                      _ratioPill("Safe: $safeCount", AppTheme.safeGreen, AppTheme.safeGreenBg),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  icon: _isLoadingRebalance
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.auto_awesome, size: 16),
                  label: const Text("Golden Ratio", style: TextStyle(fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onPressed: _isLoadingRebalance ? null : _handleAutoRebalance,
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // 4. REORDERABLE PREFERENCE CHOICE LIST
          Expanded(
            child: ReorderableListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: _choices.length,
              onReorder: (oldIndex, newIndex) {
                setState(() {
                  if (newIndex > oldIndex) newIndex -= 1;
                  final item = _choices.removeAt(oldIndex);
                  _choices.insert(newIndex, item);
                });
              },
              itemBuilder: (ctx, index) {
                final c = _choices[index];
                final adjCutoff = _getAdjustedCutoff((c['c26'] as num).toDouble());
                final isAllotted = allotment != null && allotment['pref'] == index + 1;
                final choiceCode = _getChoiceCode(c['code'], c['branch']);

                return Card(
                  key: ValueKey("choice_${c['code']}_${c['branch']}_$index"),
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                    side: BorderSide(
                      color: isAllotted ? AppTheme.safeGreen : AppTheme.borderLight,
                      width: isAllotted ? 2 : 1,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Preference Number
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: isAllotted ? AppTheme.safeGreen : AppTheme.primary.withAlpha(20),
                          child: Text(
                            "#${index + 1}",
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isAllotted ? Colors.white : AppTheme.primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // College & Branch Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                c['name'],
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                c['branch'],
                                style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      "Code: $choiceCode",
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    "Cutoff: $adjCutoff%ile",
                                    style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Tier Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: c['tier'] == 'Safe'
                                ? AppTheme.safeGreenBg
                                : c['tier'] == 'Target'
                                    ? AppTheme.targetAmberBg
                                    : AppTheme.dreamRedBg,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            c['tier'],
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                              color: c['tier'] == 'Safe'
                                  ? AppTheme.safeGreen
                                  : c['tier'] == 'Target'
                                      ? AppTheme.targetAmber
                                      : AppTheme.dreamRed,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Drag Handle
                        const Icon(Icons.drag_indicator, color: AppTheme.textMuted, size: 20),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _ratioPill(String label, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }
}
