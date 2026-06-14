import { StyleSheet, Text, TouchableOpacity, View, Alert,  KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite'; 
import * as Notifications from 'expo-notifications'; 
import { apiService } from '../../services/api';

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
    

    const [ParaOutraPessoa, setParaOutraPessoa] = useState(false);
    const [nomePessoa, setNomePessoa] = useState('');
    const [nomeMedicacao, setMedicacao] = useState('');
    const [proximaDose, setProximaDose] = useState('');
    const [intervalo, setIntervalo] = useState('');
    const [frequencia, setFrequencia] = useState('');
    const [loading, setLoading] = useState(false);

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

        const regexIntervalo = /^\d+$/;
        if (!regexIntervalo.test(intervalo)) {
        Alert.alert("Formato Inválido", "Por favor, Preencha os campos necessários ou digite apenas números.");
        return;
        }
        
        const regexFrequencia = /^\d+$/;
        if (!regexIntervalo.test(frequencia)) {
        Alert.alert("Formato Inválido", "Por favor, Preencha os campos necessários ou digite apenas números.");
        return;
        }

        setLoading(true);

        try {
            const idUnico = Date.now().toString();

            // Salvar no banco de dados local (SQLite)
            await db.runAsync(
                `INSERT INTO lembretes (id, username, nome, intervalo, frequencia, dose) VALUES (?, ?, ?, ?, ?, ?);`,
                [idUnico, nomePessoa, nomeMedicacao, intervalo, frequencia, proximaDose]
            );

            // Salvar no servidor backend também
            try {
                await apiService.criarMedicamento({
                    nome: nomeMedicacao,
                    unidadeMedida: 'porção',
                    descricao: `Intervalo: ${intervalo}h, Frequência: ${frequencia} dias`,
                });
            } catch (serverError) {
                console.error('Aviso: Não foi possível sincronizar com o servidor:', serverError);
                Alert.alert('Aviso', 'Medicamento salvo localmente, mas não foi possível sincronizar com o servidor.');
            }

            const [horaString, minutoString] = proximaDose.split(':');
            const hora = parseInt(horaString, 10);
            const minuto = parseInt(minutoString, 10);

            const { status } = await Notifications.requestPermissionsAsync();
            
            if (status === 'granted') {
                
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('remedios-urgentes', {
                        name: 'Alarmes de Medicamentos',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 1000, 500, 1000, 500, 1000, 500, 1000],
                        sound: 'default',
                        bypassDnd: true,
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
            
            setNomePessoa('');
            setMedicacao('');
            setIntervalo('');
            setFrequencia('');
            setProximaDose('');

            router.replace('/Lembretes'); 

        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível salvar.");
        } finally {
            setLoading(false);
        }
    };
    
        return(

            <View style={styles.container}>

                <View style={styles.containerDeTroca}>
                    <TouchableOpacity
                    style={[ styles.botaoDeTroca, !ParaOutraPessoa ? styles.botaoAtivo : styles.botaoDesligado ]}
                    onPress={() => setParaOutraPessoa(false)}>
                    <Text style={!ParaOutraPessoa ? styles.textoAtivo : styles.textoDesligado}> Para Mim </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    style={[ styles.botaoDeTroca, ParaOutraPessoa ? styles.botaoAtivo : styles.botaoDesligado ]}
                    onPress={() => setParaOutraPessoa(true)}>
                    <Text style={ParaOutraPessoa ? styles.textoAtivo : styles.textoDesligado}> Outra Pessoa </Text>
                    </TouchableOpacity>
                </View>

    {ParaOutraPessoa && (
        <View style={styles.input}>
            <Input
                iconName="user" 
                placeholder="Nome da Outra Pessoa..." //input simples q captura o nome do outro paciente quando for o caso
                value={nomePessoa}
                onChangeText={setNomePessoa}
            />
        </View>        
    )}

        <View style={styles.input}>
            <Input
                iconName="edit-2" 
                placeholder="Nome da(s) Medicação(ões)..." //input simples q captura o nome da medicação
                value={nomeMedicacao}
                onChangeText={setMedicacao}
            />

            <Input
                placeholder="Horário da Primeira/Próxima Dose..." //horário que a primeira ou próxima dose será tomada
                iconName='info'
                value={proximaDose}
                onChangeText={setProximaDose}
            />

             <Input
                placeholder="Intervalo de Tempo (ex: de 8 em 8 horas)..." //de quantas em quantas horas será tomada a medicação
                iconName='clock'
                value={intervalo}
                onChangeText={setIntervalo}
            />

            <Input
                placeholder="Frequência... (ex: quantidade de dias)" //quantidade de dias que a medicação será tomada
                iconName='calendar'
                value={frequencia}
                onChangeText={setFrequencia}
            />
        </View>

            <View style={styles.botao}>
                <Button 
                    titulo={loading ? 'Salvando...' : 'Salvar'}
                    onPress={handleSalvar}
                    disabled={loading}
                />
            </View>
        </View>

  );
}


const styles = StyleSheet.create({

container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingTop: 20,
},

botao: {
    position: 'absolute',
    bottom: 20,
    width: '95%', 
},

input: {
    width: '95%',
},

containerDeTroca: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#000000',
    borderRadius: 30,
    marginBottom: 20,
    height: 60,
    width: '95%',
    overflow: 'hidden',
},

botaoDeTroca: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
},

botaoAtivo: {
    backgroundColor: '#99D9EA',
},

botaoDesligado: {

},

textoAtivo: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 18,
},

textoDesligado: {
    color: '#808080',
    fontSize: 18,
    fontWeight: 'bold',
},
  
})