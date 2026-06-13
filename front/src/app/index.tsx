import { useRouter, Stack } from 'expo-router';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
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
      
      <View style={styles.bottomEstilo}>
        
        {/* --- LOGO DO APP --- */}
        <Image 
          source={require('../img/Logo.png')} // Verifique se é .png ou .jpg
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Texto de Boas Vindas */}
        <Text style={styles.textoGrande}>Bem-vindo ao SyncMed!</Text>

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
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {  
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topoContainer: {
    position: 'absolute',
    top: -100, // Voltou ao original
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
    marginTop: 260, // Voltou ao original
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60, 
    width: '100%',
    
    // Alinhamento original (Tudo no fundo)
    justifyContent: 'flex-end', 
    alignItems: 'center',       
    paddingBottom: 80,          
  },
  
  // --- ESTILO DA LOGO ---
  logo: {
    width: 170,       
    height: 170,
    marginTop: 80,        // <-- ALTERADO AQUI: De 30 para 60 para descer a imagem
    marginBottom: 'auto', // O SEGREDO: Empurra o texto e os botões de volta lá para o fundo
  },

  textoGrande: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30, // Voltou ao original
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20, // Voltou ao original
  },
  Login: {
    fontSize: 16,
    color: '#00C2FF',
    fontWeight: '600',
    marginLeft: 8,
  },
  botao: {
    width: '50%' // Voltou ao original
  },
});