import Motion from '../components/Motion';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
// --- IMPORTAÇÃO DA IMAGE ADICIONADA AQUI ---

import Button from '../components/Button';
import Input from '../components/Input';

export default function RecuperarSenhaEmail() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  // Função chamada quando o usuario clica em "ENVIAR LINK"
  const handleRecuperar = () => {
    // Lógica para enviar o e-mail de recuperação entraria aqui
    console.log("E-mail de recuperação enviado para:", email);
    router.push('/RecuperarSenhaCodigo'); // <-- ALTERADO PARA PUSH
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >

        <ScrollView contentContainerStyle={styles.innerContainer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>

          {/* Espaço Superior - Agora com a Logo */}
          <View style={styles.header}>
            <Image
              source={require('../img/Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Parte Inferior - O Contentor Branco com a Curva Superior */}
          <Motion style={styles.formContainer}>
            <Text style={styles.TextoBoasVindas}>Recuperar Senha</Text>

            {/* Input: Email */}
            <Input
              iconName="mail"
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Texto Explicativo (Embaixo do Input) */}
            <Text style={styles.textoInstrucao}>
              Digite seu e-mail e nós lhe enviaremos um link de redefinição de senha.
            </Text>

            {/* Botão Principal */}
            <Button titulo="ENVIAR LINK" onPress={handleRecuperar} />

            {/* Link para Voltar ao Login */}
            <View style={styles.registerContainer}>
              <TouchableOpacity onPress={() => router.push('/login')}>
                 <Text style={styles.CriaContaLink}>Voltar para o Login</Text>
              </TouchableOpacity>
            </View>

          </Motion>
        </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  innerContainer: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    flexGrow: 1,
  },
  header: {
    minHeight: 210,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- ESTILO DA LOGO ---
  logo: {
    width: 150,
    height: 150,
  },
  formContainer: {
    flexGrow: 1,
    backgroundColor: '#DEF2F5',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 36,
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
    flexWrap: 'wrap',
    marginTop: 24,
  },
  CriaContaLink: {
    color: '#1a73e8',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
