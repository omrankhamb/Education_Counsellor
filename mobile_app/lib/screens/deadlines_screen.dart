import 'package:flutter/material.dart';

class DeadlinesScreen extends StatelessWidget {
  const DeadlinesScreen({super.key});

  final List<Map<String, dynamic>> _events = const [
    {
      'title': 'MHT-CET / State CAP Registration',
      'date': 'July 14 – July 28',
      'status': 'Completed',
      'statusColor': Color(0xFF64748B),
      'desc': 'Online registration & document verification at Facilitation Centers (FC).',
    },
    {
      'title': 'Display of Provisional Merit List',
      'date': 'August 03',
      'status': 'Completed',
      'statusColor': Color(0xFF64748B),
      'desc': 'Release of State General Merit Rank and Category Rank for all applicants.',
    },
    {
      'title': 'CAP Round 1 Option Form Submission',
      'date': 'August 10 – August 14',
      'status': 'Live Now',
      'statusColor': Color(0xFF10B981),
      'desc': 'Fill and freeze preference list of colleges and branches on the CET portal.',
    },
    {
      'title': 'Provisional Allotment of CAP Round 1',
      'date': 'August 18',
      'status': 'Upcoming',
      'statusColor': Color(0xFFF59E0B),
      'desc': 'Seat allotment display on portal. Self-verification of accepted seats.',
    },
    {
      'title': 'Seat Acceptance & Institute Reporting (R1)',
      'date': 'August 19 – August 22',
      'status': 'Upcoming',
      'statusColor': Color(0xFF2563EB),
      'desc': 'Pay seat acceptance fee (₹1,000) online or report with original certificates.',
    },
    {
      'title': 'CAP Round 2 Vacancy & Option Form',
      'date': 'August 24 – August 27',
      'status': 'Upcoming',
      'statusColor': Color(0xFF2563EB),
      'desc': 'Display of vacant seats for Round 2 and option betterment submission.',
    },
    {
      'title': 'CAP Round 3 Final Allotment',
      'date': 'September 02 – September 06',
      'status': 'Upcoming',
      'statusColor': Color(0xFF2563EB),
      'desc': 'Final centralized round allotment followed by institutional level admissions.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A237E),
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.calendar_month, color: Color(0xFFFACC15), size: 22),
            SizedBox(width: 8),
            Text(
              'Admission Deadlines & Schedule',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _events.length,
        itemBuilder: (context, index) {
          final ev = _events[index];
          final Color stColor = ev['statusColor'] as Color;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(8),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFC7D2FE)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.event, color: Color(0xFF1A237E), size: 18),
                      const SizedBox(height: 4),
                      Text(
                        ev['date'],
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A237E),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              ev['title'],
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: stColor.withAlpha(25),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              ev['status'],
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: stColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        ev['desc'],
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
