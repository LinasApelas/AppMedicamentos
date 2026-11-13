import Motion from '../components/Motion';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, Alert, Image } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
// --- IMPORTAÇÃO DA IMAGE ADICIONADA AQUI ---

import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, error: sessionError, refresh } = useAuth();

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha!');
      return;
    }

    setLoading(true);
    try {
      const usuarioLogado = await login(email, senha);
      Alert.alert('Sucesso', `Bem-vindo, ${usuarioLogado.nome}!`);
      router.replace('/(tabs)/Lembretes');
    } catch (error: any) {
      const errorMessage = error?.message || 'Ocorreu um erro ao fazer login.';
      if (errorMessage.includes('401')) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
      } else {
        Alert.alert('Erro', errorMessage);
      }
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >

        <ScrollView contentContainerStyle={styles.innerContainer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            {/* --- IMAGEM ADICIONADA AQUI NA PARTE BRANCA --- */}
            <Image
              source={require('../img/Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Motion style={styles.formContainer}>
            <Text style={styles.TextoBoasVindas}>Login</Text>
            {sessionError ? <TouchableOpacity onPress={() => void refresh()}><Text accessibilityRole="alert">{sessionError} Toque para tentar novamente.</Text></TouchableOpacity> : null}

            <Input
              iconName="mail"
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              iconName="lock"
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TouchableOpacity style={styles.EsqueceuSenha} onPress={() => router.push('/RecuperarSenhaEmail')}>
              <Text style={styles.EsqueceuSenhaLink}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <Button titulo={loading ? "Entrando..." : "Entrar"} loading={loading} onPress={handleLogin} />

            <View style={styles.registerContainer}>
              <Text style={styles.TextoCriaConta}>Ainda não tem conta? </Text>
              <TouchableOpacity onPress={() => router.push('/CriarConta')}>
                <Text style={styles.CriaContaLink}>Crie aqui</Text>
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
    width: 150,  // Você pode aumentar ou diminuir conforme achar melhor
    height: 150,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginTop: 10,
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
    marginBottom: 28,
    textAlign: 'center',
  },
  EsqueceuSenha: {
    marginBottom: 30,
    marginTop: -10,
  },
  EsqueceuSenhaLink: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
  },
  TextoCriaConta: {
    color: '#7f8c8d',
    fontSize: 15,
  },
  CriaContaLink: {
    color: '#1a73e8',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
