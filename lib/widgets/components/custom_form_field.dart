import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum FieldType {
  text,
  email,
  password,
  number,
  phone,
  date,
  time,
  multiline,
  dropdown,
  search,
}

enum ValidationType {
  required,
  email,
  phone,
  minLength,
  maxLength,
  min,
  max,
  pattern,
}

class ValidationRule {
  final ValidationType type;
  final String? errorMessage;
  final dynamic value;

  ValidationRule({
    required this.type,
    this.errorMessage,
    this.value,
  });
}

class CustomFormField extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? helperText;
  final String? errorText;
  final String? initialValue;
  final FieldType fieldType;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final bool readOnly;
  final bool enabled;
  final bool obscureText;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final List<ValidationRule>? validationRules;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final EdgeInsetsGeometry? contentPadding;
  final InputBorder? border;
  final TextStyle? style;
  final TextStyle? labelStyle;
  final TextStyle? hintStyle;
  final TextStyle? errorStyle;
  final Color? fillColor;
  final bool filled;
  final BorderRadiusGeometry? borderRadius;
  final bool autofocus;
  final FocusNode? focusNode;
  final String? Function(String?)? validator;
  final void Function(String?)? onSaved;
  final void Function(String?)? onFieldSubmitted;

  const CustomFormField({
    super.key,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.initialValue,
    this.fieldType = FieldType.text,
    this.controller,
    this.onChanged,
    this.onTap,
    this.readOnly = false,
    this.enabled = true,
    this.obscureText = false,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.keyboardType,
    this.inputFormatters,
    this.validationRules,
    this.prefixIcon,
    this.suffixIcon,
    this.contentPadding,
    this.border,
    this.style,
    this.labelStyle,
    this.hintStyle,
    this.errorStyle,
    this.fillColor,
    this.filled = false,
    this.borderRadius,
    this.autofocus = false,
    this.focusNode,
    this.validator,
    this.onSaved,
    this.onFieldSubmitted,
  });

  @override
  State<CustomFormField> createState() => _CustomFormFieldState();
}

class _CustomFormFieldState extends State<CustomFormField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  bool _obscureText = false;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController(text: widget.initialValue);
    _focusNode = widget.focusNode ?? FocusNode();
    _obscureText = widget.obscureText;
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: widget.labelStyle ?? Theme.of(context).textTheme.labelMedium,
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: _controller,
          focusNode: _focusNode,
          readOnly: widget.readOnly,
          enabled: widget.enabled,
          autofocus: widget.autofocus,
          obscureText: _obscureText,
          maxLines: widget.fieldType == FieldType.multiline ? widget.maxLines : 1,
          minLines: widget.minLines,
          maxLength: widget.maxLength,
          keyboardType: _getKeyboardType(),
          inputFormatters: _getInputFormatters(),
          onChanged: (value) {
            if (widget.onChanged != null) {
              widget.onChanged!(value);
            }
            _validateField(value);
          },
          onTap: widget.onTap,
          validator: widget.validator ?? _validateField,
          onSaved: widget.onSaved,
          onFieldSubmitted: widget.onFieldSubmitted,
          style: widget.style,
          decoration: InputDecoration(
            hintText: widget.hint,
            helperText: widget.helperText,
            errorText: _errorText ?? widget.errorText,
            errorStyle: widget.errorStyle,
            prefixIcon: widget.prefixIcon,
            suffixIcon: _buildSuffixIcon(),
            contentPadding: widget.contentPadding,
            border: widget.border,
            enabledBorder: widget.border,
            focusedBorder: widget.border,
            errorBorder: widget.border,
            focusedErrorBorder: widget.border,
            fillColor: widget.fillColor,
            filled: widget.filled,
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
          ),
        ),
      ],
    );
  }

  Widget? _buildSuffixIcon() {
    if (widget.fieldType == FieldType.password || widget.fieldType == FieldType.text && widget.obscureText) {
      return IconButton(
        icon: Icon(
          _obscureText ? Icons.visibility_off : Icons.visibility,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
        ),
        onPressed: () {
          setState(() {
            _obscureText = !_obscureText;
          });
        },
      );
    }

    if (widget.fieldType == FieldType.search && _controller.text.isNotEmpty) {
      return IconButton(
        icon: Icon(
          Icons.clear,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
        ),
        onPressed: () {
          _controller.clear();
          if (widget.onChanged != null) {
            widget.onChanged!('');
          }
        },
      );
    }

    return widget.suffixIcon;
  }

  TextInputType? _getKeyboardType() {
    if (widget.keyboardType != null) {
      return widget.keyboardType;
    }

    switch (widget.fieldType) {
      case FieldType.email:
        return TextInputType.emailAddress;
      case FieldType.phone:
        return TextInputType.phone;
      case FieldType.number:
        return TextInputType.number;
      case FieldType.multiline:
        return TextInputType.multiline;
      case FieldType.search:
        return TextInputType.text;
      default:
        return TextInputType.text;
    }
  }

  List<TextInputFormatter>? _getInputFormatters() {
    if (widget.inputFormatters != null) {
      return widget.inputFormatters;
    }

    switch (widget.fieldType) {
      case FieldType.phone:
        return [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(15),
        ];
      case FieldType.number:
        return [
          FilteringTextInputFormatter.digitsOnly,
        ];
      default:
        return null;
    }
  }

  String? _validateField(String? value) {
    if (widget.validationRules == null || widget.validationRules!.isEmpty) {
      return null;
    }

    for (final rule in widget.validationRules!) {
      final error = _validateRule(rule, value);
      if (error != null) {
        setState(() {
          _errorText = error;
        });
        return error;
      }
    }

    setState(() {
      _errorText = null;
    });
    return null;
  }

  String? _validateRule(ValidationRule rule, String? value) {
    switch (rule.type) {
      case ValidationType.required:
        if (value == null || value.trim().isEmpty) {
          return rule.errorMessage ?? 'This field is required';
        }
        break;

      case ValidationType.email:
        if (value != null && value.isNotEmpty) {
          final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
          if (!emailRegex.hasMatch(value)) {
            return rule.errorMessage ?? 'Please enter a valid email address';
          }
        }
        break;

      case ValidationType.phone:
        if (value != null && value.isNotEmpty) {
          final phoneRegex = RegExp(r'^\+?[\d\s\-\(\)]+$');
          if (!phoneRegex.hasMatch(value)) {
            return rule.errorMessage ?? 'Please enter a valid phone number';
          }
        }
        break;

      case ValidationType.minLength:
        if (value != null && value.length < (rule.value as int)) {
          return rule.errorMessage ?? 'Minimum length is ${rule.value} characters';
        }
        break;

      case ValidationType.maxLength:
        if (value != null && value.length > (rule.value as int)) {
          return rule.errorMessage ?? 'Maximum length is ${rule.value} characters';
        }
        break;

      case ValidationType.min:
        if (value != null && value.isNotEmpty) {
          final num = double.tryParse(value);
          if (num == null || num < (rule.value as double)) {
            return rule.errorMessage ?? 'Minimum value is ${rule.value}';
          }
        }
        break;

      case ValidationType.max:
        if (value != null && value.isNotEmpty) {
          final num = double.tryParse(value);
          if (num == null || num > (rule.value as double)) {
            return rule.errorMessage ?? 'Maximum value is ${rule.value}';
          }
        }
        break;

      case ValidationType.pattern:
        if (value != null && value.isNotEmpty) {
          final pattern = RegExp(rule.value as String);
          if (!pattern.hasMatch(value)) {
            return rule.errorMessage ?? 'Invalid format';
          }
        }
        break;
    }

    return null;
  }
}

// Dropdown form field
class CustomDropdownField<T> extends StatelessWidget {
  final String? label;
  final String? hint;
  final String? helperText;
  final String? errorText;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?>? onChanged;
  final bool enabled;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final EdgeInsetsGeometry? contentPadding;
  final InputBorder? border;
  final TextStyle? style;
  final TextStyle? labelStyle;
  final TextStyle? hintStyle;
  final TextStyle? errorStyle;
  final Color? fillColor;
  final bool filled;
  final BorderRadiusGeometry? borderRadius;
  final String? Function(T?)? validator;
  final void Function(T?)? onSaved;

  const CustomDropdownField({
    super.key,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.value,
    required this.items,
    this.onChanged,
    this.enabled = true,
    this.prefixIcon,
    this.suffixIcon,
    this.contentPadding,
    this.border,
    this.style,
    this.labelStyle,
    this.hintStyle,
    this.errorStyle,
    this.fillColor,
    this.filled = false,
    this.borderRadius,
    this.validator,
    this.onSaved,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: widget.labelStyle ?? Theme.of(context).textTheme.labelMedium,
          ),
          const SizedBox(height: 8),
        ],
        DropdownButtonFormField<T>(
          value: widget.value,
          items: widget.items,
          onChanged: widget.enabled ? widget.onChanged : null,
          validator: widget.validator,
          onSaved: widget.onSaved,
          style: widget.style,
          decoration: InputDecoration(
            hintText: widget.hint,
            helperText: widget.helperText,
            errorText: widget.errorText,
            errorStyle: widget.errorStyle,
            prefixIcon: widget.prefixIcon,
            suffixIcon: widget.suffixIcon,
            contentPadding: widget.contentPadding,
            border: widget.border,
            enabledBorder: widget.border,
            focusedBorder: widget.border,
            errorBorder: widget.border,
            focusedErrorBorder: widget.border,
            fillColor: widget.fillColor,
            filled: widget.filled,
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
          ),
        ),
      ],
    );
  }
}

// Date picker form field
class CustomDateField extends StatelessWidget {
  final String? label;
  final String? hint;
  final String? helperText;
  final String? errorText;
  final DateTime? value;
  final ValueChanged<DateTime?>? onChanged;
  final bool enabled;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final EdgeInsetsGeometry? contentPadding;
  final InputBorder? border;
  final TextStyle? style;
  final TextStyle? labelStyle;
  final TextStyle? hintStyle;
  final TextStyle? errorStyle;
  final Color? fillColor;
  final bool filled;
  final BorderRadiusGeometry? borderRadius;
  final String? Function(DateTime?)? validator;
  final void Function(DateTime?)? onSaved;

  const CustomDateField({
    super.key,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.value,
    this.onChanged,
    this.enabled = true,
    this.prefixIcon,
    this.suffixIcon,
    this.contentPadding,
    this.border,
    this.style,
    this.labelStyle,
    this.hintStyle,
    this.errorStyle,
    this.fillColor,
    this.filled = false,
    this.borderRadius,
    this.validator,
    this.onSaved,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: widget.labelStyle ?? Theme.of(context).textTheme.labelMedium,
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: TextEditingController(
            text: widget.value != null
                ? _formatDate(widget.value!)
                : '',
          ),
          readOnly: true,
          enabled: widget.enabled,
          validator: widget.validator,
          onSaved: widget.onSaved,
          style: widget.style,
          decoration: InputDecoration(
            hintText: widget.hint,
            helperText: widget.helperText,
            errorText: widget.errorText,
            errorStyle: widget.errorStyle,
            prefixIcon: widget.prefixIcon ?? const Icon(Icons.calendar_today),
            suffixIcon: widget.suffixIcon,
            contentPadding: widget.contentPadding,
            border: widget.border,
            enabledBorder: widget.border,
            focusedBorder: widget.border,
            errorBorder: widget.border,
            focusedErrorBorder: widget.border,
            fillColor: widget.fillColor,
            filled: widget.filled,
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
          ),
          onTap: widget.enabled ? () => _selectDate(context) : null,
        ),
      ],
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: widget.value ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime(2100),
    );

    if (picked != null && widget.onChanged != null) {
      widget.onChanged!(picked);
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
