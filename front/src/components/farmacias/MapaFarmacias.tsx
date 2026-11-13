import { useEffect, useRef } from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';
import type { Coordenada, Farmacia, RaioFarmacias } from '../../services/farmacias';

export interface MapaProps {
  origem: Coordenada; farmacias: Farmacia[]; raio: RaioFarmacias;
  selecionada: string | null; onSelecionar: (id: string) => void;
}

export default function MapaFarmacias({ origem, farmacias, raio, selecionada, onSelecionar }: MapaProps) {
  const mapa = useRef<MapView>(null);
  const escolhida = farmacias.find(item => item.id === selecionada);
  const latitude = escolhida?.latitude ?? origem.latitude;
  const longitude = escolhida?.longitude ?? origem.longitude;
  const delta = escolhida ? 0.012 : raio / 40;
  useEffect(() => { mapa.current?.animateToRegion({ latitude, longitude,
    latitudeDelta: delta, longitudeDelta: delta }, 400); }, [latitude, longitude, delta]);
  return <MapView ref={mapa} style={{ height: 300, width: '100%' }}
    initialRegion={{ ...origem, latitudeDelta: raio / 40, longitudeDelta: raio / 40 }}
    showsUserLocation={false} showsMyLocationButton={false} showsPointsOfInterests={false} toolbarEnabled={false}>
    <Marker coordinate={origem} title="Sua localização nesta busca" pinColor="#1a73e8" />
    <Circle center={origem} radius={raio * 1000} strokeColor="#1a73e8" fillColor="rgba(157,215,226,0.12)" />
    {farmacias.map(item => <Marker key={item.id} coordinate={item} title={item.nome}
      description={item.endereco} pinColor={item.id === selecionada ? '#12323A' : '#d43b40'}
      onPress={() => onSelecionar(item.id)} />)}
  </MapView>;
}
