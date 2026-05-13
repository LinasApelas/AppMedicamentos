import React from 'react';
import { SafeAreaView, StyleSheet, View, Image, Text } from 'react-native'; 
import Button from '../components/Button';

export default function Termos() {
  return (
    <SafeAreaView style={styles.container}>
      
      {/* Termos */}
      <View style={styles.bottomEstilo}>
        <Text style={styles.titulo}>Termos de Uso</Text>
        
        <View style={styles.textoContainer}>
          <Text style={styles.textoTermos}>
            Bem-vindo ao AppMedicamentos. Ao utilizar nossa plataforma, você concorda com os seguintes termos:{"\n\n"}
            1. O aplicativo serve para auxílio no controle de medicação e não substitui orientações médicas.{"\n\n"}
            2. Seus dados de saúde são armazenados de forma segura e privada.{"\n\n"}
            3. Você é responsável por configurar corretamente os horários dos seus avisos.{"\n\n"}
            4. O uso continuado do app implica na aceitação de futuras atualizações destes termos.{"\n\n"}
            Certifique-se de ler atentamente todas as diretrizes antes de prosseguir com o seu cadastro.
          </Text>
        </View>
      </View>

      {/* Rodape */}
      <View style={styles.rodapeContainer}>
        
        {/* Imagem de fundo */}
        <Image 
          source={require('../img/image.png')} 
          style={styles.imagemFundo}
          resizeMode="contain" 
        />

        {/* Botao para aceitar os termos */}
        <View style={styles.Botao}>
          <Button 
            titulo="    Aceitar e Continuar    " 
            onPress={() => console.log('Termos aceitos!')} 
          />
        </View>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {  
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bottomEstilo: { 
    height: '75%', 
    backgroundColor: '#E2F1F8', 
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60, 
    width: '100%',
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 2,     
    elevation: 5,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  textoContainer: {
    flex: 1, 
  },
  textoTermos: {
    fontSize: 16,
    color: '#5d6d7e',
    lineHeight: 24,
    textAlign: 'justify',
  },
  rodapeContainer: {
    flex: 1, 
    justifyContent: 'flex-end', 
    alignItems: 'center',
  },
  imagemFundo: {
    position: 'absolute', 
    width: 450,
    height: 450,
    bottom: -100, 
    zIndex: 0,
  },
  Botao: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 50, 
    zIndex: 3,        
  },
});