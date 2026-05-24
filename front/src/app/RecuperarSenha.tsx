import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const router = useRouter();

  // Função chamada quando o usuario clica em "SALVAR SENHA"
  const handleRedefinirSenha = () => { 
    // Lógica para salvar a nova senha no banco de dados entraria aqui
    console.log("Senha alterada com sucesso!");
    router.replace('/login'); // Volta para o login após redefinir a senha
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          
          {/* Espaço Superior */}
          <View style={styles.header}></View>

          {/* Parte Inferior - O Contentor Branco com a Curva Superior */}
          <View style={styles.formContainer}>
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
    flex: 0.3, // Reduzi um pouco para dar mais espaço aos dois inputs
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 0.7, // Aumentei um pouco a área branca para os dois inputs não ficarem apertados
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
    marginTop: 30,
  },
  CriaContaLink: {
    color: '#1a73e8',
    fontSize: 15,
    fontWeight: 'bold',
  },
});