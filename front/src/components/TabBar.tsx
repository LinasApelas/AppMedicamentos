import React, { useEffect, useState } from 'react';
import { Animated, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { selectionAsync } from 'expo-haptics';
import { useReducedMotion } from './Motion';

const items: Record<string, { label: string; icon: keyof typeof MaterialIcons.glyphMap; activeIcon: keyof typeof MaterialIcons.glyphMap }> = {
  Lembretes: { label: 'Lembretes', icon: 'notifications-none', activeIcon: 'notifications' },
  Adicionar: { label: 'Adicionar', icon: 'add', activeIcon: 'add' },
  Perfil: { label: 'Perfil', icon: 'person-outline', activeIcon: 'person' },
};

interface ItemProps {
  name: string;
  focused: boolean;
  reduced: boolean;
  fontsReady: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

function TabItem({ name, focused, reduced, fontsReady, onPress, onLongPress, accessibilityLabel, testID }: ItemProps) {
  const item = items[name] ?? { label: name, icon: 'circle' as const, activeIcon: 'circle' as const };
  const primary = name === 'Adicionar';
  const [selection] = useState(() => new Animated.Value(focused ? 1 : 0));
  const [press] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduced) { selection.setValue(focused ? 1 : 0); return; }
    const animation = Animated.spring(selection, { toValue: focused ? 1 : 0, damping: 16, stiffness: 180, mass: 0.7, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, selection]);

  const pressTo = (value: number) => {
    Animated.spring(press, { toValue: reduced ? 1 : value, speed: 35, bounciness: 5, useNativeDriver: true }).start();
  };

  return (
    <Pressable style={styles.touchTarget} onPress={onPress} onLongPress={onLongPress}
      onPressIn={() => pressTo(0.9)} onPressOut={() => pressTo(1)}
      accessibilityRole="tab" accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? item.label} testID={testID}>
      <Animated.View pointerEvents="none" style={[styles.item, { transform: [{ scale: press }] }]}>
        <Animated.View style={[
          primary ? styles.primaryIcon : styles.icon,
          primary && focused && styles.primarySelected,
          { transform: [{ translateY: selection.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : -3] }) }] },
        ]}>
          {fontsReady ? <MaterialIcons name={focused ? item.activeIcon : item.icon} size={primary ? 32 : 27}
            color={primary ? '#12323A' : focused ? '#1a73e8' : '#808080'} /> :
            <Text style={styles.fallback}>{primary ? '+' : name === 'Perfil' ? 'P' : 'L'}</Text>}
        </Animated.View>
        <Text style={[styles.label, focused && styles.labelSelected]}>{item.label}</Text>
        <Animated.View style={[styles.dot, { opacity: selection, transform: [{ scale: selection.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [fontsLoaded, fontError] = useFonts(MaterialIcons.font);
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [position] = useState(() => new Animated.Value(state.index));

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (reduced) { position.setValue(state.index); return; }
    const animation = Animated.spring(position, { toValue: state.index, damping: 22, stiffness: 220, mass: 0.9, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [position, reduced, state.index]);

  if (keyboardVisible) return null;
  const slotWidth = width / state.routes.length;
  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 12), paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16) }]}>
      <View style={styles.shell}>
        <View style={styles.track} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
          {width > 0 && <Animated.View pointerEvents="none" style={[styles.indicator, { width: slotWidth - 8,
            transform: [{ translateX: Animated.multiply(position, slotWidth) }] }]} />}
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const options = descriptors[route.key].options;
            return <TabItem key={route.key} name={route.name} focused={focused} reduced={reduced}
              fontsReady={fontsLoaded && !fontError} accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  if (Platform.OS !== 'web' && !reduced) void selectionAsync().catch(() => {});
                  navigateToTab(route.key);
                }
              }}
              onLongPress={() => { emitter.emit({ type: 'tabLongPress', target: route.key }); }} />;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#ffffff', paddingTop: 20 },
  shell: { width: '100%', maxWidth: 520, alignSelf: 'center', borderRadius: 30, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#E2F1F8', paddingHorizontal: 6, paddingVertical: 6,
    shadowColor: '#12323A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  track: { flexDirection: 'row', position: 'relative' },
  indicator: { position: 'absolute', top: 0, bottom: 0, left: 4, borderRadius: 24, backgroundColor: '#E2F1F8' },
  touchTarget: { flex: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  item: { width: '100%', alignItems: 'center', justifyContent: 'center', gap: 3 },
  icon: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center' },
  primaryIcon: { width: 56, height: 48, marginTop: -18, marginBottom: 2, borderRadius: 20,
    backgroundColor: '#9DD7E2', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff',
    shadowColor: '#12323A', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  primarySelected: { borderColor: '#9DD7E2' },
  label: { color: '#808080', fontSize: 11, lineHeight: 16, includeFontPadding: false, fontWeight: '600', textAlign: 'center', paddingHorizontal: 2 },
  labelSelected: { color: '#1a73e8', fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a73e8', marginTop: 2 },
  fallback: { fontSize: 24, fontWeight: '700', color: '#12323A' },
});
