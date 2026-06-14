import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : user ? (
        <View style={styles.card}>
          <Text style={styles.label}>Nome</Text>
          <Text style={styles.value}>{user.nome}</Text>

          <Text style={styles.label}>E-mail</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Fuso Horário</Text>
          <Text style={styles.value}>{user.fusoHorario || 'Não definido'}</Text>
        </View>
      ) : (
        <Text style={styles.message}>Nenhum usuário logado.</Text>
      )}

      <View style={styles.controls}>
        <Button titulo="Atualizar" onPress={handleRefresh} corFundo="#9DD7E2" />
        <View style={{ height: 12 }} />
        <Button titulo="Sair" onPress={handleLogout} corFundo="#e74c3c" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#12323A',
  },
  card: {
    backgroundColor: '#DEF2F5',
    borderRadius: 16,
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