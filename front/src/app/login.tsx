import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from '../components/Button';

export default function Login() {
  {/* Variáveis de estado para guardar o que o usuario escreve */}
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const router = useRouter();
  // Função chamada quando o usuario clica em "ENTRAR"
  const handleLogin = () => { router.replace('/estilobase');};

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
            <Text style={styles.headerTitle}>App</Text>
          </View>

          {/* Parte Inferior - O Contentor Branco com a Curva Superior */}
          <View style={styles.formContainer}>
            <Text style={styles.TextoBoasVindas}>Login</Text>

            {/* Campo: Email */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color="#5d6d7e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#7f8c8d"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Campo: Senha */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color="#5d6d7e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#7f8c8d"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
              />
            </View>

            {/* Link: Recuperar Senha */}
            <TouchableOpacity style={styles.EsqueceuSenha}>
              <Text style={styles.EsqueceuSenhaLink}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Botão Principal: Entrar */}
            <Button titulo="ENTRAR" onPress={handleLogin} />

            {/* Secção: Criar Conta */}
            <View style={styles.registerContainer}>
              <Text style={styles.TextoCriaConta}>Ainda não tem conta? </Text>
              <TouchableOpacity>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B2E3E8',
    borderRadius: 30,
    height: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
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
    letterSpacing: 1, // Espaçamento entre as letras para ficar mais elegante
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