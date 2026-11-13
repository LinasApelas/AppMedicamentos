import React from 'react';
import { SafeAreaView, StyleSheet, View, Image, Text, ScrollView } from 'react-native';
import Button from '../components/Button';
import { router, useLocalSearchParams } from 'expo-router';

export default function Termos() {
  const { consulta } = useLocalSearchParams<{ consulta?: string }>();
  return (
    <SafeAreaView style={styles.container}>

      {/* Termos */}
      <View style={styles.bottomEstilo}>
        <Text style={styles.titulo}>Termos de Uso</Text>

        <ScrollView style={styles.textoContainer}>
          <Text style={styles.textoTermos}>
            Bem-vindo ao SyncMed. Ao utilizar nosso aplicativo, você concorda com os seguintes termos:{"\n\n"}
            1. O aplicativo serve para auxílio no controle de medicação e não substitui orientações médicas.{"\n\n"}
            2. Seus dados de saúde são armazenados de forma segura e privada.{"\n\n"}
            3. Você é responsável por configurar corretamente os horários dos seus avisos.{"\n\n"}
            4. O uso continuado do app implica na aceitação de futuras atualizações destes termos.{"\n\n"}
            Certifique-se de ler atentamente todas as diretrizes antes de prosseguir com o uso do aplicativo e cadastro.
          </Text>
        </ScrollView>
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
            titulo={consulta === '1' ? 'Voltar' : 'Aceitar e Continuar'}
            onPress={() => consulta === '1' && router.canGoBack() ? router.back() : router.replace('/Lembretes')}
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
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  textoContainer: {
    flex: 1,
  },
  textoTermos: {
    fontSize: 16,
    color: '#808080',
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
    width: '85%',
    marginBottom: 50,
  },
});
