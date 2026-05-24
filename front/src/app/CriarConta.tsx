import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';

export default function CriarConta() {
  {/* Variáveis de estado para guardar o que o usuario escreve */}
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const router = useRouter();
  
  // Função chamada quando o usuario clica em "CADASTRAR"
  const handleCadastro = () => { 
    router.replace('../(tabs)/Lembretes');
  };

  return (
    // Impede que o teclado cubra os campos de texto
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Esconde o teclado ao tocar fora dos campos */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          
          {/* Nome e Logo */}
          <View style={styles.header}>
            {/* Colocar Logo */}
          </View>

          {/* Parte Inferior - O Contentor Branco com a Curva Superior */}
          <View style={styles.formContainer}>
            <Text style={styles.TextoBoasVindas}>Criar Conta</Text>

            {/* Input: Nome de Usuário */}
            <Input 
              iconName="user"
              placeholder="Nome de usuário"
              value={nomeUsuario}
              onChangeText={setNomeUsuario}
              autoCapitalize="words"
            />

            {/* Input: Email */}
            <Input 
              iconName="mail"
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Input: Senha */}
            <Input 
              iconName="lock"
              placeholder="Senha"
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

            {/* Botão Principal: Cadastrar */}
            <View style={{ marginTop: 10 }}>
              <Button titulo="CADASTRAR" onPress={handleCadastro} />
            </View>

            {/* Link: Voltar para Login */}
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
    flex: 0.2, // Reduzido um pouco para dar mais espaço para os 4 inputs
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
    flex: 0.8, // Aumentado para acomodar os novos campos
    backgroundColor: '#DEF2F5',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    paddingHorizontal: 40,
    paddingTop: 40, // Corrigido de 400 para 40 para não quebrar a tela
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
    marginBottom: 30, // Diminuído um pouco para caber melhor os inputs
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