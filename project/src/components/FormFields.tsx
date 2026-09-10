import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, TextStyle, ViewStyle } from 'react-native';
import { Colors } from '../lib/theme';

type FieldLabelProps = { children: React.ReactNode };
export function FieldLabel({ children }: FieldLabelProps) {
  return <Text style={styles.label}>{children}</Text>;
}

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'number-pad' | 'decimal-pad';
  multiline?: boolean;
};

export function TextField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
};

export function SelectField({ label, value, onPress, placeholder = 'Select...' }: SelectFieldProps) {
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable style={styles.select} onPress={onPress}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
    </View>
  );
}

type OptionListProps = {
  options: { label: string; value: string; icon?: string; color?: string }[];
  onSelect: (value: string) => void;
  selected?: string;
};

export function OptionList({ options, onSelect, selected }: OptionListProps) {
  return (
    <View style={styles.optionList}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.option, selected === opt.value && styles.optionSelected]}
          onPress={() => onSelect(opt.value)}
        >
          {opt.icon && <Text style={styles.optionIcon}>{opt.icon}</Text>}
          <Text style={[styles.optionText, selected === opt.value && styles.optionTextSelected]}>
            {opt.label}
          </Text>
          {opt.color && <View style={[styles.colorDot, { backgroundColor: opt.color }]} />}
          {selected === opt.value && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
      ))}
    </View>
  );
}

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  style?: ViewStyle;
};
export function PrimaryButton({ label, onPress, disabled, color, style }: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: color || Colors.primary },
        disabled && styles.btnDisabled,
        pressed && styles.btnPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  chevron: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  optionList: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.cardElevated,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  checkmark: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
