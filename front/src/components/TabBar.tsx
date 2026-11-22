import React, { useEffect, useState } from 'react';
import { Animated, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { selectionAsync } from 'expo-haptics';
import { useReducedMotion } from './Motion';

const items: Record<string, { label: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  Lembretes: { label: 'Lembretes', icon: 'notifications-none' },
  Adicionar: { label: 'Adicionar', icon: 'add' },
  Farmacias: { label: 'Farmácias', icon: 'location-on' },
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
  const item = items[name] ?? { label: name, icon: 'circle' as const };

  const [selection] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    if (reduced) { selection.setValue(focused ? 1 : 0); return; }
    const animation = Animated.spring(selection, { toValue: focused ? 1 : 0, damping: 16, stiffness: 180, mass: 0.7, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, selection]);

  return (
    <Pressable style={styles.touchTarget} onPress={onPress} onLongPress={onLongPress}
      accessibilityRole="tab" accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? item.label} testID={testID}>
      <View pointerEvents="none" style={styles.item}>
        <View style={styles.icon}>
          <Animated.View style={[styles.halo, { opacity: selection }]} />
          <Animated.View style={[styles.bubble, { opacity: selection }]} />
          {fontsReady ? <MaterialIcons style={styles.glyph} name={item.icon} size={28}
            color={focused ? '#12323A' : '#808080'} /> :
            <Text style={styles.fallback}>{name === 'Adicionar' ? '+' : name === 'Farmacias' ? 'F' : 'L'}</Text>}
        </View>
        <Text style={[styles.label, focused && styles.labelSelected]}>{item.label}</Text>
      </View>
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
  halo: { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: '#ffffff' },
  bubble: { position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#9DD7E2', borderWidth: 1, borderColor: '#E2F1F8',
    shadowColor: '#12323A', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  label: { color: '#808080', fontSize: 11, lineHeight: 16, includeFontPadding: false, fontWeight: '600', textAlign: 'center', paddingHorizontal: 2 },
  labelSelected: { color: '#1a73e8', fontWeight: '700' },
  fallback: { fontSize: 24, fontWeight: '700', color: '#12323A' },
});
