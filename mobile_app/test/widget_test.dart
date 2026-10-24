import 'package:flutter_test/flutter_test.dart';
import 'package:educounsellor_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const EduCounsellorApp());
    expect(find.text('🎓 EduCounsellor AI'), findsOneWidget);
  });
}
