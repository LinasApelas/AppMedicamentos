import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
// --- IMPORTAÇÃO DA IMAGE ADICIONADA AQUI ---
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, Alert, Image } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { apiService } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const router = useRouter();
  const db = useSQLiteContext();

  const sincronizarMedicamentosServer = async () => {
    try {
      const medicamentosSeriais = await apiService.listarMedicamentos();
      for (const medicamento of medicamentosSeriais) {
        const localId = `server-${medicamento.id}`;
        await db.runAsync(
          `INSERT OR REPLACE INTO lembretes (id, username, nome, intervalo, frequencia, dose) VALUES (?, ?, ?, ?, ?, ?);`,
          [
            localId,
            '',
            medicamento.nome,
            null,
            null,
            medicamento.descricao || medicamento.unidadeMedida || '',
          ]
        );
      }
    } catch (syncError) {
      console.error('Erro ao sincronizar medicamentos do servidor:', syncError);
    }
  };

  const handleLogin = async () => { 
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha!');
      return;
    }

    try {
      const usuarioLogado = await apiService.fazerLogin({
        email: email,
        senha: senha,
      });

      await sincronizarMedicamentosServer();
      Alert.alert('Sucesso', `Bem-vindo, ${usuarioLogado.nome}!`);
      router.replace('../(tabs)/Perfil');
    } catch (error: any) {
      const errorMessage = error?.message || 'Ocorreu um erro ao fazer login.';
      if (errorMessage.includes('401')) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
      } else {
        Alert.alert('Erro', errorMessage);
      }
      console.error('Erro na requisição:', error);
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
            {/* --- IMAGEM ADICIONADA AQUI NA PARTE BRANCA --- */}
            <Image 
              source={require('../img/Logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
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
  // --- ESTILO DA LOGO ---
  logo: {
    width: 200,  // Você pode aumentar ou diminuir conforme achar melhor
    height: 200,
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