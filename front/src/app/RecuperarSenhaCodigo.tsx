import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';

export default function RecuperarSenhaCodigo() {
  const [codigo, setCodigo] = useState('');
  const router = useRouter();

  // Função chamada quando o usuario clica em "VERIFICAR CÓDIGO"
  const handleVerificarCodigo = () => { 
    // Lógica para verificar o código entraria aqui
    console.log("Código de verificação inserido:", codigo);
    router.replace('/RecuperarSenha'); // Volta para a tela de redefinição de senha após verificar
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          
          {/* Espaço Superior */}
          <View style={styles.header}></View>

          {/* Parte Inferior - O Contentor Branco com a Curva Superior */}
          <View style={styles.formContainer}>
            <Text style={styles.TextoBoasVindas}>Digite o código</Text>

            {/* Input: Código */}
            <Input 
              iconName="key"
              placeholder="Código de verificação"
              value={codigo}
              onChangeText={setCodigo}
              keyboardType="default"
              autoCapitalize="none"
            />

            {/* Texto Explicativo (Embaixo do Input) */}
            <Text style={styles.textoInstrucao}>
              Digite o codigo que foi enviado para o seu e-mail.
            </Text>

            {/* Botão Principal */}
            <Button titulo="VERIFICAR CÓDIGO" onPress={handleVerificarCodigo} />

            {/* Link para Voltar ao Login */}
            <View style={styles.registerContainer}>
              <TouchableOpacity onPress={() => router.push('/login')}>
                 <Text style={styles.CriaContaLink}>Voltar para o Login</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 0.6,
    backgroundColor: '#DEF2F5',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    paddingHorizontal: 40,
    paddingTop: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  TextoBoasVindas: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 40,
    textAlign: 'center',
  },
  textoInstrucao: {
    fontSize: 14,
    color: '#5d6d7e',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: -5,
    lineHeight: 20,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  CriaContaLink: {
    color: '#1a73e8',
    fontSize: 15,
    fontWeight: 'bold',
  },
});