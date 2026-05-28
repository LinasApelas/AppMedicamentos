import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, Alert } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';

// ATENÇÃO: Substitua pelo IP da sua máquina
const API_URL = 'http://192.168.1.14:8080/usuarios';

export default function CriarConta() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const router = useRouter();
  
  const handleCadastro = async () => { 
    if (!nomeUsuario || !email || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem!');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nomeUsuario,
          email: email,
          senha: senha,
          fusoHorario: "America/Sao_Paulo"
        }),
      });

      if (response.status === 201) {
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
        router.replace('/login');
      } else {
        Alert.alert('Erro', 'Não foi possível criar a conta.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      Alert.alert('Erro', 'Falha na conexão com o servidor.');
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
            <Text style={styles.TextoBoasVindas}>Criar Conta</Text>

            <Input 
              iconName="user"
              placeholder="Nome de usuário"
              value={nomeUsuario}
              onChangeText={setNomeUsuario}
              autoCapitalize="words"
            />

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

            <Input 
              iconName="lock"
              placeholder="Confirmar senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />

            <View style={{ marginTop: 10 }}>
              <Button titulo="CADASTRAR" onPress={handleCadastro} />
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.TextoCriaConta}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                 <Text style={styles.CriaContaLink}>Entre aqui</Text>
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
    flex: 0.2, 
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
    flex: 0.8, 
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
    marginBottom: 30, 
    textAlign: 'center',
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