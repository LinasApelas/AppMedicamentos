import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite'; 
import * as Notifications from 'expo-notifications'; 

import Button from '../../components/Button';
import Input from '../../components/Input';

// 1. Configuração padrão de exibição
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. CRIAR BOTÕES DE AÇÃO (Isso deixa a notificação MAIOR e interativa)
Notifications.setNotificationCategoryAsync('acoes-remedio', [
  {
    identifier: 'TOMAR',
    buttonTitle: '💊 Tomar Medicamento',
    options: { opensAppToForeground: true }, // Abre o app para registrar
  },
  {
    identifier: 'SONECA',
    buttonTitle: '⏰ Lembrar em 10 min',
    options: { opensAppToForeground: false },
  },
]);

export default function Adicionar() {
    const router = useRouter();
    const db = useSQLiteContext(); 

    const [nomeMedicacao, setNomeMedicacao] = useState('');
    const [intervalo, setIntervalo] = useState('');
    const [frequencia, setFrequencia] = useState('');
    const [proximaDose, setProximaDose] = useState('');

    const handleSalvar = async () => {
        if (!nomeMedicacao.trim()) {
            Alert.alert("Atenção", "Por favor, digite o nome do medicamento.");
            return;
        }

        const regexHora = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!regexHora.test(proximaDose)) {
            Alert.alert("Formato Inválido", "Por favor, digite o horário no formato HH:MM (ex: 14:30).");
            return;
        }

        try {
            const idUnico = Date.now().toString();

            await db.runAsync(
                `INSERT INTO lembretes (id, nome, intervalo, frequencia, dose) VALUES (?, ?, ?, ?, ?);`,
                [idUnico, nomeMedicacao, intervalo, frequencia, proximaDose]
            );

            const [horaString, minutoString] = proximaDose.split(':');
            const hora = parseInt(horaString, 10);
            const minuto = parseInt(minutoString, 10);

            const { status } = await Notifications.requestPermissionsAsync();
            
            if (status === 'granted') {
                
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('remedios-urgentes', {
                        name: 'Alarmes de Medicamentos',
                        importance: Notifications.AndroidImportance.MAX, // Força o pop-up na tela
                        // Padrão de vibração estilo despertador: vibra 1s, para 0.5s, vibra 1s...
                        vibrationPattern: [0, 1000, 500, 1000, 500, 1000, 500, 1000],
                        sound: 'default',
                        bypassDnd: true, // Tenta contornar o modo "Não Perturbe" se o usuário permitir
                    });
                }

                // Agenda a notificação com super prioridade
                 await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "🚨 HORA DO SEU MEDICAMENTO! 🚨",
                        body: `Não se esqueça de tomar o remédio: ${nomeMedicacao}`,
                        sound: true,
                        categoryIdentifier: 'acoes-remedio',
                        sticky: true,
                        data: { id: idUnico }, // Manda o ID escondido para a outra tela saber qual remédio é
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DAILY,
                        hour: hora,
                        minute: minuto,
                    },
                });
                
            } else {
                Alert.alert("Aviso", "Permita as notificações para os alarmes funcionarem.");
            }

            setNomeMedicacao('');
            setIntervalo('');
            setFrequencia('');
            setProximaDose('');

            router.replace('/Lembretes'); 

        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível salvar.");
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.inputContainer}>
                    <Input
                        iconName="edit-2" 
                        placeholder="Nome da Medicação:"
                        value={nomeMedicacao}
                        onChangeText={setNomeMedicacao}
                    />
                    <Input
                        placeholder="Intervalo de Tempo:"
                        iconName='clock'
                        value={intervalo}
                        onChangeText={setIntervalo}
                    />
                    <Input
                        placeholder="Frequência:"
                        iconName='calendar'
                        value={frequencia}
                        onChangeText={setFrequencia}
                    />
                    <Input
                        placeholder="Horário da Próxima Dose (Ex: 14:30):"
                        iconName='info'
                        value={proximaDose}
                        onChangeText={setProximaDose}
                    />
                </View>
            </ScrollView>

             <View style={styles.botao}>
                <Button titulo="Salvar" onPress={handleSalvar} />
            </View>
        </KeyboardAvoidingView>
    );    
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    scrollContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    inputContainer: { width: '95%' },
    botao: { position: 'absolute', bottom: 10, width: '95%', alignSelf: 'center' }
});