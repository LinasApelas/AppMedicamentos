import { StyleSheet, View, Text} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function Adicionar() {
    return(

        <View style={styles.container}>

            <View style={styles.input}>

                <Input
                label='Nome da Medicação:'
                iconName='edit-2'
                />

                <Input
                label='Intervalo de Tempo:'
                iconName='clock'
                />

                <Input
                label='Frequência:'
                iconName='calendar'
                />

                <Input
                label='Horário da Próxima Dose:'
                iconName='info'
                />

            </View>

             <View style={styles.botao}>
                <Button 
                titulo="Salvar"
                onPress={() => null} 
                />
            </View>
        </View>
        
    )    
}

const styles = StyleSheet.create({

container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
},


fonte: {
    fontSize: 18,
},

botao: {
    position: 'absolute',
    bottom: 10,
    width: '95%', 
  },

input: {
    width: '95%',
}
});