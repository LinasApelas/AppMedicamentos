import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Button from '../../components/Button';
import MapaFarmacias from '../../components/farmacias/MapaFarmacias';
import ItemFarmacia from '../../components/farmacias/ItemFarmacia';
import { criarBuscaFarmacias, type Coordenada, type Farmacia, type RaioFarmacias } from '../../services/farmacias';
import { ErroLocalizacao, obterLocalizacao } from '../../services/localizacao';
import { abrirRota } from '../../services/rotasFarmacias';

export default function Farmacias() {
  const insets = useSafeAreaInsets();
  const lista = useRef<FlatList<Farmacia>>(null);
  const [origem, setOrigem] = useState<Coordenada | null>(null);
  const [items, setItems] = useState<Farmacia[]>([]);
  const [raio, setRaio] = useState<RaioFarmacias>(5);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [erro, setErro] = useState('');
  const [configuracoes, setConfiguracoes] = useState(false);
  const consulta = useRef(criarBuscaFarmacias());
  const ativa = useRef<AbortController | null>(null);
  const origemAtual = useRef<Coordenada | null>(null);
  const raioAtual = useRef<RaioFarmacias>(5);

  const buscar = useCallback(async (novoRaio = raioAtual.current, atualizarPosicao = false) => {
    if (ativa.current) return;
    const controller = new AbortController();
    ativa.current = controller;
    setCarregando(true); setErro(''); setConfiguracoes(false); setConsultado(false);
    setItems([]); setSelecionada(null); setRaio(novoRaio);
    raioAtual.current = novoRaio;
    if (atualizarPosicao) { origemAtual.current = null; setOrigem(null); }
    try {
      const posicao = origemAtual.current ?? await obterLocalizacao();
      if (controller.signal.aborted) return;
      origemAtual.current = posicao;
      setOrigem(posicao);
      const farmacias = await consulta.current(posicao, novoRaio, controller.signal);
      if (controller.signal.aborted) return;
      setItems([...farmacias].sort((a, b) => a.distancia - b.distancia).slice(0, 5)); setConsultado(true);
    } catch (e) {
      if (!controller.signal.aborted) {
        setErro(e instanceof Error ? e.message : 'Não foi possível buscar farmácias. Tente novamente.');
        setConfiguracoes(e instanceof ErroLocalizacao && e.abrirConfiguracoes);
      }
    } finally {
      if (ativa.current === controller) { ativa.current = null; setCarregando(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void buscar(raioAtual.current, true);
    return () => {
      ativa.current?.abort();
      ativa.current = null;
      consulta.current = criarBuscaFarmacias();
      origemAtual.current = null;
      setOrigem(null); setItems([]); setSelecionada(null); setConsultado(false); setCarregando(false);
    };
  }, [buscar]));

  async function configuracao() {
    try { await Linking.openSettings(); }
    catch { Alert.alert('Configurações', 'Abra as configurações do aparelho e habilite a localização para o aplicativo.'); }
  }
  async function rota(item: Farmacia) {
    try { await abrirRota(item); }
    catch (e) { Alert.alert('Como chegar', e instanceof Error ? e.message : 'Não foi possível abrir o mapa.'); }
  }

  return <View style={styles.page}>
    <FlatList ref={lista} data={items} keyExtractor={item => item.id} extraData={selecionada}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
      ListHeaderComponent={<View style={styles.header}>
        {!origem && carregando && <View style={styles.mapLoading} accessibilityLabel="Obtendo sua localização para abrir o mapa" accessibilityRole="progressbar">
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.text}>Localizando você…</Text>
        </View>}
        {origem && <View style={styles.map}>
          <MapaFarmacias origem={origem} farmacias={items} raio={raio} selecionada={selecionada} onSelecionar={setSelecionada} />
        </View>}
        {origem && <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')
          .catch(() => Alert.alert('OpenStreetMap', 'Consulte https://www.openstreetmap.org/copyright'))} style={styles.credit}>
          <Text style={styles.link}>© OpenStreetMap contributors · ODbL</Text>
        </Pressable>}
        <View style={styles.searchHeading}>
          <Text style={styles.hint}>Farmácias perto de você</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Sobre a busca e sua localização" style={styles.info}
            onPress={() => Alert.alert('Sobre a busca', 'Ao abrir esta aba ou atualizar a busca, usamos sua localização para consultar farmácias no OpenStreetMap/Overpass. Não salvamos sua posição nem acompanhamos seus deslocamentos.\n\nAs distâncias são em linha reta. Os cadastros podem estar incompletos ou desatualizados.')}>
            <MaterialIcons name="info-outline" size={22} color="#52656b" />
          </Pressable>
        </View>
        <Button titulo={carregando ? 'Buscando…' : origem ? 'Atualizar localização' : 'Buscar perto de mim'}
          icon="map-pin" loading={carregando} onPress={() => void buscar(raio, true)} />
        <View style={styles.filters}>{([2, 5, 10] as const).map(valor =>
          <Pressable key={valor} accessibilityRole="button" accessibilityLabel={`Buscar em ${valor} quilômetros`}
            accessibilityState={{ selected: raio === valor, disabled: carregando }} disabled={carregando}
            onPress={() => { if (origem) void buscar(valor); else { raioAtual.current = valor; setRaio(valor); } }}
            style={[styles.filter, raio === valor && styles.active]}>
            <Text style={styles.label}>{valor} km</Text>
          </Pressable>)}</View>
        {!!erro && <View style={styles.feedback}>
          <Text accessibilityLiveRegion="polite" style={styles.error}>{erro}</Text>
          <Button titulo="Tentar novamente" icon="refresh-cw" disabled={carregando} onPress={() => void buscar()} />
          {configuracoes && Platform.OS !== 'web' && <Button titulo="Abrir configurações" icon="settings" onPress={() => void configuracao()} />}
          {configuracoes && Platform.OS === 'web' && <Text style={styles.text}>Habilite a localização nas permissões deste site no navegador.</Text>}
        </View>}
        {consultado && items.length > 0 && <Text accessibilityLiveRegion="polite" style={styles.label}>
          {items.length === 1 ? 'Farmácia mais próxima' : `${items.length} farmácias mais próximas`}
        </Text>}
      </View>}
      ListEmptyComponent={consultado && !carregando && !erro ? <Text style={styles.text}>Nenhuma farmácia mapeada neste raio. Tente ampliar a busca.</Text> : undefined}
      renderItem={({ item, index }) => <ItemFarmacia item={item} posicao={index + 1} selecionada={selecionada === item.id}
        onRota={() => { setSelecionada(item.id); void rota(item); }} />} />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingHorizontal: 20, paddingTop: 8, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { gap: 12, marginBottom: 16 },
  searchHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hint: { flex: 1, fontSize: 16, lineHeight: 22, color: '#38535A' },
  info: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, lineHeight: 22, color: '#38535A' },
  label: { fontSize: 16, color: '#12323A', fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 12 },
  filter: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#E2F1F8', borderWidth: 2, borderColor: 'transparent' },
  active: { borderColor: '#12323A', backgroundColor: '#9DD7E2' },
  map: { borderRadius: 24, overflow: 'hidden' },
  mapLoading: { height: 300, borderRadius: 24, backgroundColor: '#E6F6F8', alignItems: 'center', justifyContent: 'center', gap: 12 },
  feedback: { gap: 12 },
  error: { color: '#A62228', fontSize: 16, lineHeight: 24 },
  credit: { minHeight: 44, justifyContent: 'center' },
  link: { color: '#52656b', textDecorationLine: 'underline', fontSize: 11, lineHeight: 16 },
});
