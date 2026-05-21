import { StyleSheet, View, Text} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { MaterialIcons } from '@expo/vector-icons';

export default function Adicionar() {
    return(

        <View style={styles.container}>]

            <View style={styles.input}>
                <Input/>
                <Input/>
                <Input/>
                <Input/>
            </View>

            <Text style={styles.fonte}> CRIADOR DE LEMBRETE </Text>

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
    bottom: 20,  
    left: 10,
    width: '95%', 
  },

input: {
    width: '95%',
}
});