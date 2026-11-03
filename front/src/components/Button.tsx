import React, { useState } from 'react';
import { Animated, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useReducedMotion } from './Motion';

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  corFundo?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
}

export default function Botao({ titulo, onPress, corFundo = '#9DD7E2', disabled = false, loading = false, icon }: BotaoProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  const blocked = disabled || loading;
  const animate = (value: number) => {
    Animated.spring(scale, { toValue: reduced ? 1 : value, speed: 32, bounciness: 4, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }], opacity: blocked ? 0.65 : 1 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={titulo}
        accessibilityState={{ disabled: blocked, busy: loading }} disabled={blocked}
        onPress={onPress} onPressIn={() => animate(0.97)} onPressOut={() => animate(1)}
        style={[styles.button, { backgroundColor: corFundo }]}>
        {loading ? <ActivityIndicator color="#000000" /> : icon ? <Feather name={icon} size={20} color="#000000" /> : null}
        <Text style={styles.buttonText}>{titulo}</Text>
        {!loading && <Feather name="arrow-right" size={18} color="#000000" />}
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  button: { borderRadius: 20, minHeight: 56, paddingVertical: 16, paddingHorizontal: 22, flexDirection: 'row', gap: 12,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09, shadowRadius: 12, elevation: 3 },
  buttonText: { color: '#000000', fontSize: 16, lineHeight: 24, includeFontPadding: false, fontWeight: '700', letterSpacing: 0.3, flexShrink: 1 },
});
