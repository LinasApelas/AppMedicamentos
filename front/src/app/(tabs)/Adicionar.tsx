import { StyleSheet, Text, TouchableOpacity, View, Alert,} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useState } from 'react';

export default function Adicionar() {
    const [ParaOutraPessoa, setParaOutraPessoa] = useState(false);
    const [nomePessoa, setNomePessoa] = useState('');
    const [nomeMedicação, setMedicação] = useState('');
    const [proximaDose, setProximaDose] = useState('');
    const [intervalo, setIntervalo] = useState('');
    const [frequencia, setFrequencia] = useState('');
    
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
                value={nomeMedicação}
                onChangeText={setMedicação}
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
                    titulo="Salvar"
                    onPress={() => Alert.alert('teste!')} 
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
    fontWeight: 'normal',
    fontSize: 18,
},

textoDesligado: {
    color: '#808080',
    fontSize: 18,
},
  
})