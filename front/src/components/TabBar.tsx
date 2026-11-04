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
        <Animated.View style={[styles.icon, {
          transform: [{ translateY: selection.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }],
        }]}>
          <Animated.View style={[styles.halo, { opacity: selection }]} />
          <Animated.View style={[styles.bubble, { opacity: selection,
            transform: [{ scale: selection.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
          }]} />
          {fontsReady ? <MaterialIcons style={styles.glyph} name={focused ? item.activeIcon : item.icon} size={28}
            color={focused ? '#12323A' : '#808080'} /> :
            <Text style={styles.fallback}>{name === 'Adicionar' ? '+' : name === 'Perfil' ? 'P' : 'L'}</Text>}
        </Animated.View>
        <Animated.Text style={[styles.label, focused && styles.labelSelected,
          { transform: [{ translateY: selection.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }]}>{item.label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [fontsLoaded, fontError] = useFonts(MaterialIcons.font);
  const reduced = useReducedMotion();

  const [keyboardVisible, setKeyboardVisible] = useState(false);


  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible) return null;
  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 12), paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16) }]}>
      <View style={styles.shell}>
        <View pointerEvents="none" style={styles.surface} />
        <View style={styles.track}>
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
  safeArea: { backgroundColor: '#ffffff', paddingTop: 6 },
  shell: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 6 },
  surface: { position: 'absolute', top: 26, bottom: 0, left: 0, right: 0, borderRadius: 36, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#E2F1F8',
    shadowColor: '#12323A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  track: { flexDirection: 'row', position: 'relative', zIndex: 1, elevation: 9 },
  touchTarget: { flex: 1, minHeight: 102, alignItems: 'center', justifyContent: 'center', paddingTop: 32, paddingBottom: 6 },
  item: { width: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { width: 52, height: 44, alignItems: 'center', justifyContent: 'center' },
  glyph: { zIndex: 2, elevation: 5 },
  halo: { position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: '#ffffff' },
  bubble: { position: 'absolute', width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#9DD7E2', borderWidth: 1, borderColor: '#E2F1F8',
    shadowColor: '#12323A', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  label: { color: '#808080', fontSize: 11, lineHeight: 16, includeFontPadding: false, fontWeight: '600', textAlign: 'center', paddingHorizontal: 2 },
  labelSelected: { color: '#1a73e8', fontWeight: '700' },
  fallback: { fontSize: 24, fontWeight: '700', color: '#12323A' },
});
