import { Tabs } from 'expo-router'

export default function Layout() {
    return (
        
        <Tabs>

            <Tabs.Screen
            name='Lembretes'
            options={{ title: 'Lembretes' }}
            />

            <Tabs.Screen
            name='Adicionar'
            options={{ title: 'Adicionar' }}
            />

            <Tabs.Screen
            name='Perfil'
            options={{ title: 'Perfil' }}
            />

        </Tabs>

    )
}
