import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { formatarDistancia, type Farmacia } from '../../services/farmacias';

export default function ItemFarmacia({ item, posicao, selecionada, onRota }: {
  item: Farmacia; posicao: number; selecionada: boolean; onRota: () => void;
}) {
  return <Pressable onPress={onRota} accessibilityRole="link"
      accessibilityLabel={`${posicao}. ${item.nome}, ${formatarDistancia(item.distancia)}. Abrir no Google Maps`}
      style={({ pressed }) => [styles.card, selecionada && styles.selected, pressed && styles.pressed]}>
      <View style={styles.rank}><Text style={styles.rankText}>{posicao}</Text></View>
      <View style={{ flex: 1, gap: 6 }}><Text style={styles.name}>{item.nome}</Text>
        <Text numberOfLines={2} style={styles.text}>{item.endereco}</Text>
        <Text style={styles.text}>{formatarDistancia(item.distancia)} em linha reta</Text></View>
      <MaterialIcons name="open-in-new" size={22} color="#175B8E" />
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DEF2F5', borderRadius: 20, padding: 16, gap: 12, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: '#12323A' },
  pressed: { opacity: 0.7 },
  rank: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#9DD7E2', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 15, fontWeight: '700', color: '#12323A' },
  name: { fontSize: 18, fontWeight: '700', color: '#12323A' },
  text: { fontSize: 14, color: '#38535A' },
});
