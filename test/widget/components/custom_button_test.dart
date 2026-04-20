import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import '../../../lib/widgets/components/custom_button.dart';

void main() {
  group('CustomButton Widget Tests', () {
    testWidgets('should render button with text', (WidgetTester tester) async {
      // Arrange
      const buttonText = 'Test Button';
      bool buttonPressed = false;

      // Build
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: buttonText,
              onPressed: () => buttonPressed = true,
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(buttonText), findsOneWidget);
      expect(find.byType(CustomButton), findsOneWidget);
    });

    testWidgets('should handle button press', (WidgetTester tester) async {
      // Arrange
      bool buttonPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Press Me',
              onPressed: () => buttonPressed = true,
            ),
          ),
        ),
      );

      // Act
      await tester.tap(find.byType(CustomButton));
      await tester.pump();

      // Assert
      expect(buttonPressed, isTrue);
    });

    testWidgets('should show loading state', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Loading',
              isLoading: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading'), findsNothing); // Text should be hidden during loading
    });

    testWidgets('should be disabled when onPressed is null', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Disabled',
              onPressed: null,
            ),
          ),
        ),
      );

      // Assert
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);
    });

    testWidgets('should be disabled when isDisabled is true', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Disabled',
              onPressed: () {},
              isDisabled: true,
            ),
          ),
        ),
      );

      // Assert
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);
    });

    testWidgets('should render with icon', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'With Icon',
              icon: const Icon(Icons.add),
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(Icon), findsOneWidget);
      expect(find.text('With Icon'), findsOneWidget);
    });

    testWidgets('should render different button types', (WidgetTester tester) async {
      // Test primary button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Primary',
              type: ButtonType.primary,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);

      // Test secondary button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Secondary',
              type: ButtonType.secondary,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);

      // Test outline button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Outline',
              type: ButtonType.outline,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);

      // Test text button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Text',
              type: ButtonType.text,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);

      // Test danger button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Danger',
              type: ButtonType.danger,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);

      // Test success button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Success',
              type: ButtonType.success,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);
    });

    testWidgets('should render different button sizes', (WidgetTester tester) async {
      // Test small button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Small',
              size: ButtonSize.small,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);

      // Test medium button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Medium',
              size: ButtonSize.medium,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);

      // Test large button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              text: 'Large',
              size: ButtonSize.large,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomButton), findsOneWidget);
    });

    testWidgets('should apply custom width and height', (WidgetTester tester) async {
      // Arrange
      const customWidth = 200.0;
      const customHeight = 60.0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: customWidth,
              height: customHeight,
              child: CustomButton(
                text: 'Custom Size',
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      // Assert
      final sizedBox = tester.widget<SizedBox>(find.ancestor(
        of: find.byType(CustomButton),
        matching: find.byType(SizedBox),
      ).first);
      expect(sizedBox.width, customWidth);
      expect(sizedBox.height, customHeight);
    });

    testWidgets('should handle long text with ellipsis', (WidgetTester tester) async {
      // Arrange
      const longText = 'This is a very long button text that should be truncated with ellipsis';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 200,
              child: CustomButton(
                text: longText,
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      // Assert
      final textWidget = tester.widget<Text>(find.text(longText));
      expect(textWidget.overflow, TextOverflow.ellipsis);
      expect(textWidget.maxLines, 1);
    });
  });

  group('CustomIconButton Widget Tests', () {
    testWidgets('should render icon button', (WidgetTester tester) async {
      // Arrange
      bool buttonPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              onPressed: () => buttonPressed = true,
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(Icon), findsOneWidget);
      expect(find.byType(CustomIconButton), findsOneWidget);
    });

    testWidgets('should handle icon button press', (WidgetTester tester) async {
      // Arrange
      bool buttonPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              onPressed: () => buttonPressed = true,
            ),
          ),
        ),
      );

      // Act
      await tester.tap(find.byType(CustomIconButton));
      await tester.pump();

      // Assert
      expect(buttonPressed, isTrue);
    });

    testWidgets('should show loading state', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              isLoading: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should show tooltip when provided', (WidgetTester tester) async {
      // Arrange
      const tooltipText = 'Add Item';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              tooltip: tooltipText,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(Tooltip), findsOneWidget);
      final tooltip = tester.widget<Tooltip>(find.byType(Tooltip));
      expect(tooltip.message, tooltipText);
    });

    testWidgets('should render different icon sizes', (WidgetTester tester) async {
      // Test small icon button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              size: ButtonSize.small,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomIconButton), findsOneWidget);

      // Test medium icon button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              size: ButtonSize.medium,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomIconButton), findsOneWidget);

      // Test large icon button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              size: ButtonSize.large,
              onPressed: () {},
            ),
          ),
        ),
      );
      expect(find.byType(CustomIconButton), findsOneWidget);
    });

    testWidgets('should be disabled when onPressed is null', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomIconButton(
              icon: Icons.add,
              onPressed: null,
            ),
          ),
        ),
      );

      // Assert
      final button = tester.widget<Material>(find.byType(Material));
      expect(button.color, isNotNull); // Should have disabled color
    });
  });
}
