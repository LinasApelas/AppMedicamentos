import Motion from '../components/Motion';
import { ScrollView, SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';

import { MaterialIcons } from '@expo/vector-icons';
import Button from '../components/Button';

export default function App() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>

      {/* Esconde o Cabeçalho */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Imagem de Fundo (Cápsulas) */}
      <View style={styles.topoContainer}>
        <Image
          source={require('../img/image.png')}
          style={styles.imagem}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <Motion style={styles.bottomEstilo}>

        {/* --- LOGO DO APP --- */}
        <Image
          source={require('../img/Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Texto de Boas Vindas */}
        <Text style={styles.textoGrande}>Seu cuidado,
          no tempo certo.</Text>

        <Text style={styles.subtitle}>Bem-vindo ao SyncMed. Seus medicamentos e lembretes em um só lugar.</Text>
        {/* Botao para Termos */}
        <View style={styles.botao}>
        <Button
          titulo="Começar"
          onPress={() => router.push('/termos')}
        />
        </View>

        {/* Texto para a tela Login */}
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => router.push('/login')}
        >
          <MaterialIcons name="exit-to-app" size={24} color="#00C2FF" />
          <Text style={styles.Login}>Entrar</Text>
        </TouchableOpacity>

      </Motion>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 16, lineHeight: 24, color: '#2c3e50', textAlign: 'center', marginBottom: 28, maxWidth: 330 },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topoContainer: {
    position: 'absolute',
    top: -100,
    width: '100%',
    alignItems: 'center',
    zIndex: 0,
  },
  imagem: {
    width: 500,
    height: 500,
  },
  bottomEstilo: {
    flex: 1,
    backgroundColor: '#E2F1F8',
    marginTop: 260,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    width: '100%',

    // Conteúdo centralizado com rolagem em telas pequenas.
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 36,
    paddingHorizontal: 28,
    paddingTop: 28,
  },

  // --- ESTILO DA LOGO ---
  logo: {
    width: 170,
    height: 170,
    marginTop: 0,
    marginBottom: 24,
  },

  textoGrande: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    minHeight: 44,
  },
  Login: {
    fontSize: 16,
    color: '#00C2FF',
    fontWeight: '600',
    marginLeft: 8,
  },
  botao: {
    width: '100%',
    maxWidth: 380
  },
});
