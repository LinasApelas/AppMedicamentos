import Motion from '../../components/Motion';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';

import { useRouter } from 'expo-router';
import Button from '../../components/Button';
import { apiService } from '../../services/api';

export default function Perfil() {
  const router = useRouter();
  const [user, setUser] = useState(apiService.currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      apiService.listarUsuarios()
        .then((usuarios) => {
          if (usuarios.length > 0) {
            setUser(usuarios[0]);
          } else {
            setError('Nenhum usuário encontrado.');
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar perfil:', err);
          setError('Erro ao carregar informações do perfil.');
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleLogout = () => {
    apiService.logout();
    router.replace('/login');
  };

  const handleRefresh = () => {
    setUser(null);
    setError(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Motion style={{ marginBottom: 24 }}><View style={styles.avatar}><MaterialIcons name="person-outline" size={38} color="#12323A" /></View><Text style={styles.title}>Seu perfil</Text><Text style={styles.message}>Suas informações, sempre à mão.</Text></Motion>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : user ? (
        <Motion style={styles.card}>
          <Text style={styles.label}>Nome</Text>
          <Text style={styles.value}>{user.nome}</Text>

          <Text style={styles.label}>E-mail</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Fuso Horário</Text>
          <Text style={styles.value}>{user.fusoHorario || 'Não definido'}</Text>
        </Motion>
      ) : (
        <Text style={styles.message}>Nenhum usuário logado.</Text>
      )}

      <View style={styles.controls}>
        <Button titulo="Atualizar" onPress={handleRefresh} corFundo="#9DD7E2" icon="refresh-cw" disabled={loading} />
        <View style={{ height: 12 }} />
        <Button titulo="Sair" onPress={handleLogout} corFundo="#e74c3c" icon="log-out" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 76, height: 76, borderRadius: 26, backgroundColor: '#DEF2F5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#12323A',
  },
  card: {
    backgroundColor: '#DEF2F5',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#5d6d7e',
    marginTop: 12,
  },
  value: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    color: '#808080',
    marginBottom: 24,
  },
  error: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 24,
  },
  controls: {
    width: '100%',
  },
});
