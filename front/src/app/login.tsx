import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, Alert } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';

// ATENÇÃO: Substitua pelo IP da sua máquina
const API_URL = 'http://192.168.1.14:8080/usuarios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const router = useRouter();
  
  const handleLogin = async () => { 
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          senha: senha,
        }),
      });

      if (response.ok) {
        const usuarioLogado = await response.json();
        Alert.alert('Sucesso', `Bem-vindo, ${usuarioLogado.nome}!`);
        router.replace('../(tabs)/Lembretes');
      } else if (response.status === 401) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao fazer login.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      Alert.alert('Erro', 'Falha na conexão com o servidor. Verifique seu IP.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          
          <View style={styles.header}>
            {/* Colocar Logo */}
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.TextoBoasVindas}>Login</Text>

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

            <Button titulo="ENTRAR" onPress={handleLogin} />

            <View style={styles.registerContainer}>
              <Text style={styles.TextoCriaConta}>Ainda não tem conta? </Text>
              <TouchableOpacity onPress={() => router.push('/CriarConta')}>
                <Text style={styles.CriaContaLink}>Crie aqui</Text>
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
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginTop: 10,
  },
  formContainer: {
    flex: 0.6,
    backgroundColor: '#DEF2F5',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 0,
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
    marginBottom: 50,
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
    marginTop: 30,
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