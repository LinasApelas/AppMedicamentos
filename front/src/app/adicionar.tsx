import { StyleSheet, View, Text} from 'react-native';

export default function Adicionar() {
    return(
        <View style={styles.container}>
            <Text style={styles.fonte}> PLACEHOLDER DA TELA DE ADD! {'\n'} (LOCAL PRA CRIAR OS LEMBRETES DE ALARME) </Text>
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
    fontSize: 16,
},

});