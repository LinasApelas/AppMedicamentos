import Motion from '../components/Motion';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import Button from '../components/Button';
import Input from '../components/Input';
import { apiService } from '../services/api';

export default function CriarConta() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCadastro = async () => {
    if (loading) return;
    if (!nomeUsuario || !email || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem!');
      return;
    }

    setLoading(true);
    try {
      await apiService.criarUsuario({
        nome: nomeUsuario,
        email: email,
        senha: senha,
        fusoHorario: "America/Sao_Paulo"
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/login');
    } catch (error: any) {
      const errorMessage = error?.message || 'Não foi possível criar a conta.';
      Alert.alert('Erro', errorMessage);
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
            {/* Colocar Logo */}
          </View>

          <Motion style={styles.formContainer}>
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
              <Button titulo={loading ? "Criando conta..." : "Criar conta"} loading={loading} onPress={handleCadastro} />
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.TextoCriaConta}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                 <Text style={styles.CriaContaLink}>Entre aqui</Text>
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
    minHeight: 90,
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
