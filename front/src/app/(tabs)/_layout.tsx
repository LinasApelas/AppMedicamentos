import { Tabs, Stack } from 'expo-router'; 
import { LogBox } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; 
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';

LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);


export default function Layout() {
    return (
        <>
            {/* --- ESTA É A LINHA MÁGICA QUE ESCONDE O "(tabs)" DO TOPO --- */}
            <Stack.Screen options={{ headerShown: false }} />

            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#1a73e8', // Cor do ícone e texto quando a aba está selecionada
                    tabBarIconStyle: {flex: 1,justifyContent: 'center',alignItems: 'center',},
                    tabBarInactiveTintColor: '#808080', // Cor quando a aba não está selecionada
                    headerShown: true, // Mantemos como true para manter o título limpo das abas (Lembretes, Perfil, etc)
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
        </>
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