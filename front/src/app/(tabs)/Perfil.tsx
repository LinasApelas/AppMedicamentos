import React, { useState } from 'react';
import Button from '../../components/Button';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Input from '../../components/Input'; // <-- IMPORTANDO O COMPONENTE AQUI

export default function Perfil() {
  const [nome, setNome] = useState('Nome Usuario');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSalvar = () => {
    console.log("Dados salvos:", { nome, email, senha });
    // Aqui entra a lógica para salvar as alterações no banco de dados
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Sessão da Foto de Perfil */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="person" size={120} color="#F2F2F2" />
              
              {/* Ícone de Câmera */}
              <TouchableOpacity style={styles.cameraBadge}>
                <MaterialIcons name="camera-alt" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Nome de Usuário editável */}
            <View style={styles.nameContainer}>
              <TextInput 
                style={styles.nameText}
                value={nome}
                onChangeText={setNome}
              />
              <Feather name="edit-2" size={18} color="#1B3B45" style={{ marginLeft: 5 }} />
            </View>
          </View>

          {/* Sessão do Formulário */}
          <View style={styles.formSection}>
            
            {/* Componente Input: Email */}
            <Input
              iconName="edit"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Componente Input: Senha */}
            <Input
              iconName="edit"
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

          </View>

          {/* Botão Salvar */}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#E2F1F8', // Azul clarinho do topo
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    fontSize: 22,
    color: '#1B3B45',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center', // Centraliza os itens na tela
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatarContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#A6A6A6', // Cor cinza do círculo
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    top: 10,
    right: 5,
    backgroundColor: '#E6E6E6',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  nameText: {
    fontSize: 22,
    color: '#1B3B45',
    fontWeight: '500',
  },
  formSection: {
    width: '100%',
    paddingHorizontal: 35,
    marginTop: 40,
  },
  buttonSalvar: {
    backgroundColor: '#9DD5D9', // Azul ciano/claro do botão Salvar
    width: '75%', 
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonSalvarText: {
    fontSize: 22,
    color: '#1B3B45',
    fontWeight: '400',
  },
});