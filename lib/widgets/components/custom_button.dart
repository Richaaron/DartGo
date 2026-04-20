import 'package:flutter/material.dart';

enum ButtonType {
  primary,
  secondary,
  outline,
  text,
  danger,
  success,
}

enum ButtonSize {
  small,
  medium,
  large,
}

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonType type;
  final ButtonSize size;
  final bool isLoading;
  final bool isDisabled;
  final Widget? icon;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final BorderSide? borderSide;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final TextStyle? textStyle;
  final BorderRadiusGeometry? borderRadius;
  final BoxShadow? boxShadow;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.type = ButtonType.primary,
    this.size = ButtonSize.medium,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.width,
    this.height,
    this.padding,
    this.borderSide,
    this.backgroundColor,
    this.foregroundColor,
    this.textStyle,
    this.borderRadius,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    
    // Get button properties based on type
    final buttonProperties = _getButtonProperties(colors);
    
    // Get size properties
    final sizeProperties = _getSizeProperties();

    return SizedBox(
      width: width,
      height: height ?? sizeProperties.height,
      child: Material(
        type: MaterialType.button,
        color: backgroundColor ?? buttonProperties.backgroundColor,
        borderRadius: borderRadius ?? BorderRadius.circular(8),
        elevation: boxShadow != null ? 0 : buttonProperties.elevation,
        shadowColor: boxShadow?.color ?? buttonProperties.shadowColor,
        child: InkWell(
          onTap: (isDisabled || isLoading) ? null : onPressed,
          borderRadius: borderRadius ?? BorderRadius.circular(8),
          splashFactory: InkRipple.splashFactory,
          child: Container(
            padding: padding ?? sizeProperties.padding,
            decoration: BoxDecoration(
              border: borderSide ?? buttonProperties.borderSide,
              borderRadius: borderRadius ?? BorderRadius.circular(8),
              boxShadow: boxShadow != null ? [boxShadow!] : buttonProperties.boxShadow,
            ),
            child: Center(
              child: isLoading
                  ? _buildLoadingWidget(buttonProperties)
                  : _buildContentWidget(buttonProperties),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingWidget(ButtonProperties properties) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(properties.foregroundColor),
      ),
    );
  }

  Widget _buildContentWidget(ButtonProperties properties) {
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          icon!,
          if (text.isNotEmpty) ...[
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                text,
                style: textStyle ?? properties.textStyle,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      );
    }

    return Text(
      text,
      style: textStyle ?? properties.textStyle,
      textAlign: TextAlign.center,
      overflow: TextOverflow.ellipsis,
      maxLines: 1,
    );
  }

  ButtonProperties _getButtonProperties(ColorScheme colors) {
    switch (type) {
      case ButtonType.primary:
        return ButtonProperties(
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          borderSide: BorderSide(color: colors.primary),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          elevation: 2,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: colors.shadow.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        );

      case ButtonType.secondary:
        return ButtonProperties(
          backgroundColor: colors.secondaryContainer,
          foregroundColor: colors.onSecondaryContainer,
          borderSide: BorderSide(color: colors.secondaryContainer),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          elevation: 1,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: colors.shadow.withOpacity(0.05),
              blurRadius: 2,
              offset: const Offset(0, 1),
            ),
          ],
        );

      case ButtonType.outline:
        return ButtonProperties(
          backgroundColor: colors.surface,
          foregroundColor: colors.primary,
          borderSide: BorderSide(color: colors.primary),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          elevation: 0,
          shadowColor: colors.shadow,
        );

      case ButtonType.text:
        return ButtonProperties(
          backgroundColor: colors.surface,
          foregroundColor: colors.primary,
          borderSide: BorderSide.none,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          elevation: 0,
          shadowColor: colors.shadow,
        );

      case ButtonType.danger:
        return ButtonProperties(
          backgroundColor: colors.error,
          foregroundColor: colors.onError,
          borderSide: BorderSide(color: colors.error),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          elevation: 2,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: colors.error.withOpacity(0.2),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        );

      case ButtonType.success:
        return ButtonProperties(
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          borderSide: const BorderSide(color: Colors.green),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          elevation: 2,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: Colors.green.withOpacity(0.2),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        );
    }
  }

  SizeProperties _getSizeProperties() {
    switch (size) {
      case ButtonSize.small:
        return SizeProperties(
          height: 32,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        );

      case ButtonSize.medium:
        return SizeProperties(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        );

      case ButtonSize.large:
        return SizeProperties(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        );
    }
  }
}

class ButtonProperties {
  final Color backgroundColor;
  final Color foregroundColor;
  final BorderSide borderSide;
  final TextStyle textStyle;
  final double elevation;
  final Color shadowColor;
  final List<BoxShadow>? boxShadow;

  const ButtonProperties({
    required this.backgroundColor,
    required this.foregroundColor,
    required this.borderSide,
    required this.textStyle,
    required this.elevation,
    required this.shadowColor,
    this.boxShadow,
  });
}

class SizeProperties {
  final double height;
  final EdgeInsetsGeometry padding;

  const SizeProperties({
    required this.height,
    required this.padding,
  });
}

// Icon button variant
class CustomIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final ButtonType type;
  final ButtonSize size;
  final bool isLoading;
  final bool isDisabled;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final BorderRadiusGeometry? borderRadius;
  final String? tooltip;

  const CustomIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.type = ButtonType.primary,
    this.size = ButtonSize.medium,
    this.isLoading = false,
    this.isDisabled = false,
    this.width,
    this.height,
    this.padding,
    this.backgroundColor,
    this.foregroundColor,
    this.borderRadius,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    
    // Get button properties based on type
    final buttonProperties = _getButtonProperties(colors);
    
    // Get size properties
    final sizeProperties = _getSizeProperties();

    Widget button = SizedBox(
      width: width ?? sizeProperties.height,
      height: height ?? sizeProperties.height,
      child: Material(
        type: MaterialType.button,
        color: backgroundColor ?? buttonProperties.backgroundColor,
        borderRadius: borderRadius ?? BorderRadius.circular(8),
        elevation: buttonProperties.elevation,
        shadowColor: buttonProperties.shadowColor,
        child: InkWell(
          onTap: (isDisabled || isLoading) ? null : onPressed,
          borderRadius: borderRadius ?? BorderRadius.circular(8),
          splashFactory: InkRipple.splashFactory,
          child: Container(
            padding: padding ?? sizeProperties.padding,
            decoration: BoxDecoration(
              borderRadius: borderRadius ?? BorderRadius.circular(8),
              boxShadow: buttonProperties.boxShadow,
            ),
            child: Center(
              child: isLoading
                  ? SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          foregroundColor ?? buttonProperties.foregroundColor,
                        ),
                      ),
                    )
                  : Icon(
                      icon,
                      size: _getIconSize(),
                      color: foregroundColor ?? buttonProperties.foregroundColor,
                    ),
            ),
          ),
        ),
      ),
    );

    if (tooltip != null) {
      return Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }

  double _getIconSize() {
    switch (size) {
      case ButtonSize.small:
        return 16;
      case ButtonSize.medium:
        return 20;
      case ButtonSize.large:
        return 24;
    }
  }

  ButtonProperties _getButtonProperties(ColorScheme colors) {
    switch (type) {
      case ButtonType.primary:
        return ButtonProperties(
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          borderSide: BorderSide(color: colors.primary),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          elevation: 2,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: colors.shadow.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        );

      case ButtonType.secondary:
        return ButtonProperties(
          backgroundColor: colors.secondaryContainer,
          foregroundColor: colors.onSecondaryContainer,
          borderSide: BorderSide(color: colors.secondaryContainer),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          elevation: 1,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: colors.shadow.withOpacity(0.05),
              blurRadius: 2,
              offset: const Offset(0, 1),
            ),
          ],
        );

      case ButtonType.outline:
        return ButtonProperties(
          backgroundColor: colors.surface,
          foregroundColor: colors.primary,
          borderSide: BorderSide(color: colors.primary),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          elevation: 0,
          shadowColor: colors.shadow,
        );

      case ButtonType.text:
        return ButtonProperties(
          backgroundColor: colors.surface,
          foregroundColor: colors.primary,
          borderSide: BorderSide.none,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          elevation: 0,
          shadowColor: colors.shadow,
        );

      case ButtonType.danger:
        return ButtonProperties(
          backgroundColor: colors.error,
          foregroundColor: colors.onError,
          borderSide: BorderSide(color: colors.error),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          elevation: 2,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: colors.error.withOpacity(0.2),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        );

      case ButtonType.success:
        return ButtonProperties(
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          borderSide: const BorderSide(color: Colors.green),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          elevation: 2,
          shadowColor: colors.shadow,
          boxShadow: [
            BoxShadow(
              color: Colors.green.withOpacity(0.2),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        );
    }
  }

  SizeProperties _getSizeProperties() {
    switch (size) {
      case ButtonSize.small:
        return SizeProperties(
          height: 32,
          padding: const EdgeInsets.all(6),
        );

      case ButtonSize.medium:
        return SizeProperties(
          height: 44,
          padding: const EdgeInsets.all(10),
        );

      case ButtonSize.large:
        return SizeProperties(
          height: 52,
          padding: const EdgeInsets.all(14),
        );
    }
  }
}
