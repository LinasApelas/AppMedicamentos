import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

interface InputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Feather.glyphMap;
}
export default function Input({ label, iconName, style, onFocus, onBlur, secureTextEntry, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {/* Mantém o pai nativo estável quando o estilo de foco muda. */}
      <View collapsable={false} style={[styles.inputContainer, focused && styles.focused]}>
        {iconName && <Feather name={iconName} size={20} color="#5d6d7e" style={styles.icon} />}
        <TextInput {...rest} accessibilityLabel={rest.accessibilityLabel || label || rest.placeholder}
          placeholderTextColor="#808080" style={[styles.input, style]} secureTextEntry={secureTextEntry && !visible}
          onFocus={event => { setFocused(true); onFocus?.(event); }}
          onBlur={event => { setFocused(false); onBlur?.(event); }} />
        {secureTextEntry && <Pressable onPress={() => setVisible(!visible)} accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} style={styles.toggle}>
          <Feather name={visible ? 'eye-off' : 'eye'} size={20} color="#5d6d7e" />
        </Pressable>}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 18 },
  label: { color: '#808080', fontSize: 13, lineHeight: 18, includeFontPadding: false, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, minHeight: 56,
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2F1F8', backgroundColor: '#ffffff' },
  focused: { borderColor: '#9DD7E2' },
  icon: { marginRight: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingVertical: 14, paddingHorizontal: 0, fontSize: 16, lineHeight: 24, includeFontPadding: false, textAlignVertical: 'center', color: 'rgb(0, 0, 0)' },
  toggle: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
