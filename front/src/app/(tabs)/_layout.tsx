import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // 1. Importando os ícones
import { StyleSheet, Text, TouchableOpacity, View, Alert,} from 'react-native';


export default function Layout() {
    return (

        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#1a73e8', // Cor do ícone e texto quando a aba está selecionada
                tabBarStyle: {height: 70 , paddingBottom: 10},
                tabBarIconStyle: {flex: 1,justifyContent: 'center',alignItems: 'center',},
                tabBarInactiveTintColor: '#808080', // Cor quando a aba não está selecionada
                headerShown: true, // Opcional: esconde o cabeçalho padrão superior, caso você já tenha feito o seu na tela
            }}
        >

            <Tabs.Screen
                name='Lembretes'
                options={{ 
                    title: 'Lembretes',
                    // 2. Adicionando o ícone
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

})