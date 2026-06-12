import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; 
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
// 1. Importando o SQLiteProvider
import { SQLiteProvider } from 'expo-sqlite'; 

// 2. Função para criar a tabela na primeira vez que o app abrir
async function inicializarBanco(db: any) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS lembretes (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL,
        intervalo TEXT,
        frequencia TEXT,
        dose TEXT
      );
    `);
    console.log("Banco de dados inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
  }
}

export default function Layout() {
    return (
        // 3. Envolvendo suas Tabs com o provedor do banco de dados
        <SQLiteProvider databaseName="medicamentos.db" onInit={inicializarBanco}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#1a73e8', // Cor do ícone e texto quando a aba está selecionada
                    tabBarStyle: {height: 100 , paddingBottom: 40 , paddingTop: 10}, // Aumenta a altura da barra de navegação
                    tabBarIconStyle: {flex: 1,justifyContent: 'center',alignItems: 'center',},
                    tabBarInactiveTintColor: '#808080', // Cor quando a aba não está selecionada
                    headerShown: true, // Opcional: esconde o cabeçalho padrão superior
                }}
            >
                <Tabs.Screen
                    name='Lembretes'
                    options={{ 
                        title: 'Lembretes',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="home" size={size} color={color} />
                        )
                    }}
                />

                <Tabs.Screen
                    name='Adicionar'
                    options={{ 
                        title: 'Adicionar',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="add-circle-outline" size={size} color={color} />
                        )
                    }}
                />

                <Tabs.Screen
                    name='Perfil'
                    options={{ 
                        title: 'Perfil',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="account-circle" size={size} color={color} />
                        )
                    }}
                />
            </Tabs>
        </SQLiteProvider>
    )
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      paddingTop: 20,
  },
  navBar: {
      height: 60,
  },
});