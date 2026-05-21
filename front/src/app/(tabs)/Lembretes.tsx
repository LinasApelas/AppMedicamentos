import { StyleSheet, View, Text , TouchableOpacity} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Lembretes() {
    return(

        <View style={styles.container}>
            <Text style={styles.fonte}> HOME {'\n'} (Botão de Adicionar Lembretes + Lembretes Salvos) </Text>

{/* Botão de adicionar usando touchableOpacity,
comentei porque se precisar de algo do tipo já tá pronto e o botão agora fica no meio da navbar.

                    <TouchableOpacity
                    style ={styles.adicionar}
                    onPress={() => router.push('/adicionar')} 
                    >
                    <MaterialIcons name="add-circle-outline" size={24} color="#000000" />
                    <Text style={styles.fonte}>Adicionar</Text>
                    </TouchableOpacity>
*/}

        </View>
        
    )
}

const styles = StyleSheet.create({
    
container: {
    flex: 1,
    backgroundColor: '#2bff00',
    alignItems: 'center',
    justifyContent: 'center',
},

fonte: {
    fontSize: 18,
    marginLeft: 4,
    color: '#000000',
    fontWeight: 'normal',
},

adicionar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9DD7E2',
    height: 60,
    borderRadius: 30,
    bottom: 10,  
    left: 280,   
    right: 10,
},

});
