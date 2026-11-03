import Motion from '../components/Motion';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
// --- IMPORTAÇÃO DA IMAGE ADICIONADA AQUI ---

import Button from '../components/Button';
import Input from '../components/Input';

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const router = useRouter();

  const handleRedefinirSenha = () => {
    // Lógica para salvar a nova senha no banco de dados entraria aqui
    console.log("Senha alterada com sucesso!");
    router.replace('/login');
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
            <Text style={styles.TextoBoasVindas}>Nova Senha</Text>

            {/* Input: Senha */}
            <Input
              iconName="lock"
              placeholder="Nova senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            {/* Input: Confirmar Senha */}
            <Input
              iconName="lock"
              placeholder="Confirmar senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />

            {/* Texto Explicativo (Embaixo dos Inputs) */}
            <Text style={styles.textoInstrucao}>
              Crie uma nova senha segura para acessar sua conta.
            </Text>

            {/* Botão Principal */}
            <Button titulo="SALVAR SENHA" onPress={handleRedefinirSenha} />

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
    width: 180,  // Deixei um pouco menor que no Login (200) para caber bem no flex: 0.3
    height: 180,
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
