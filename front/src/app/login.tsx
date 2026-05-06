import React, {useState} from 'react';
import {StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons'; 

  // Estado para guardar o que o usuario escreve
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Função chamada quando o utilizador clica em "ENTRAR"
  const handleLogin = () => {
    console.log('Tentativa de login com:', email, senha);
    // Mais tarde, aqui irás adicionar a lógica para comunicar com a tua API ou Base de Dados
  };

  return (
    // KeyboardAvoidingView impede que o teclado cubra os campos de texto
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Esconde o teclado se o utilizador tocar fora dos campos */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          
          {/* Parte Superior - Fundo Azul e Logótipo do AppMedicamentos */}
          <View style={styles.header}>
            <MaterialIcons name="local-pharmacy" size={90} color="#1a73e8" />
            <Text style={styles.headerTitle}>AppMedicamentos</Text>
          </View>

          {/* Parte Inferior - O Contentor Branco com a Curva Superior */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>

            {/* Campo de Entrada: Email */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color="#5d6d7e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="O teu e-mail"
                placeholderTextColor="#7f8c8d"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none" // Evita que a primeira letra do email fique maiúscula
              />
            </View>

            {/* Campo de Entrada: Senha */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color="#5d6d7e" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="A tua senha"
                placeholderTextColor="#7f8c8d"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry // Esconde os caracteres da senha
              />
            </View>

            {/* Link: Recuperar Senha */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceste a senha?</Text>
            </TouchableOpacity>

            {/* Botão Principal: Entrar */}
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>ENTRAR</Text>
            </TouchableOpacity>

            {/* Secção: Criar Conta */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Ainda não tens conta? </Text>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Cria aqui</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Estilos detalhados da interface
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Azul muito claro para o fundo superior
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flex: 0.4, // Ocupa 40% da altura do ecrã
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
    flex: 0.6, // Ocupa os restantes 60% do ecrã
    backgroundColor: '#DEF2F5',
    // Aqui criamos a famosa curva orgânica no topo do formulário
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    paddingHorizontal: 40,
    paddingTop: 40,
    // Sombra para destacar o formulário do fundo azul
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B2E3E8', // Azul mais escuro que o fundo para os inputs
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
  forgotPassword: {
    alignSelf: 'flex-end', // Empurra o texto para a direita
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1a73e8', // Cor principal do botão
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    // Efeito 3D / Sombra no botão
    elevation: 5,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
  registerText: {
    color: '#7f8c8d',
    fontSize: 15,
  },
  registerLink: {
    color: '#1a73e8',
    fontSize: 15,
    fontWeight: 'bold',
  },
});