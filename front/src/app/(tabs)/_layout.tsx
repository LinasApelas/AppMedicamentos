import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // 1. Importando os ícones

export default function Layout() {
    return (
        <Tabs 
            screenOptions={{ 
                tabBarActiveTintColor: '#1a73e8', // Cor do ícone e texto quando a aba está selecionada
                tabBarInactiveTintColor: '#7f8c8d', // Cor quando a aba não está selecionada
                headerShown: false, // Opcional: esconde o cabeçalho padrão superior, caso você já tenha feito o seu na tela
            }}
        >

            <Tabs.Screen
                name='Lembretes'
                options={{ 
                    title: 'Lembretes',
                    // 2. Adicionando o ícone
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="event-note" size={size} color={color} />
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
    )
}