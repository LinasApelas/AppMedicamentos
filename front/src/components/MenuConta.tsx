import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';

export default function MenuConta() {
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const [visible, setVisible] = useState(false);
  const [top, setTop] = useState(80);
  const { width, height } = useWindowDimensions();
  useFocusEffect(useCallback(() => () => setVisible(false), []));
  const close = () => setVisible(false);
  const open = () => anchor.current?.measureInWindow((_x, y, _w, h) => {
    setTop(y + h + 8);
    setVisible(true);
  });
  return <>
    <View ref={anchor} collapsable={false}>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Abrir menu da conta"
        accessibilityState={{ expanded: visible }} style={styles.trigger}>
        <MaterialIcons name="more-vert" size={26} color="#12323A" />
      </Pressable>
    </View>
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Fechar menu" onPress={close} />
        <View accessibilityViewIsModal style={[styles.menu, { top: Math.min(top, Math.max(16, height - 180)), width: Math.min(240, width - 32) }]}>
          <Text style={styles.heading}>Minha conta</Text>
          <Pressable accessibilityRole="button" style={styles.item} onPress={() => { close(); router.push('/Perfil'); }}>
            <MaterialIcons name="person-outline" size={24} color="#12323A" /><Text style={styles.label}>Meu perfil</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.item} onPress={() => { close(); router.push({ pathname: '/termos', params: { consulta: '1' } }); }}>
            <MaterialIcons name="description" size={24} color="#12323A" /><Text style={styles.label}>Termos de uso</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { width: 44, height: 44, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#E6F6F8' },
  overlay: { flex: 1, backgroundColor: 'rgba(18,50,58,0.12)' },
  menu: { position: 'absolute', right: 16, padding: 12, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2F1F8', elevation: 8, shadowColor: '#12323A', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  heading: { fontSize: 13, lineHeight: 18, color: '#52656b', paddingHorizontal: 12, marginVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12 },
  label: { flexShrink: 1, fontSize: 16, lineHeight: 22, includeFontPadding: false, color: '#12323A', fontWeight: '600' },
});
