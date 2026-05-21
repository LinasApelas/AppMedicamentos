import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from '../components/Button';

export default function App() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      {/* Imagem */}
      <View style={styles.topoContainer}>
        <Image 
          source={require('../img/image.png')} 
          style={styles.imagem}
          resizeMode="contain"
        />
      </View>
      <View style={styles.bottomEstilo}>
        
        {/* Texto de Boas Vindas */}
        <Text style={styles.textoGrande}>Bem-vindo ao SyncMed!</Text>

        {/* 2. Botao para Termos */}
        <Button
          titulo="                   Começar                   " 
          onPress={() => router.push('/termos')} 
        />

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
    
    // Alinhamento
    justifyContent: 'flex-end', 
    alignItems: 'center',       
    paddingBottom: 80,          
  },
  textoGrande: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  Login: {
    fontSize: 16,
    color: '#00C2FF',
    fontWeight: '600',
    marginLeft: 8,
  },
});