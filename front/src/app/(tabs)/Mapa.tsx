import { StyleSheet, View, Text} from 'react-native';

export default function Mapa() {
    return(
        <View style={styles.container}>
            <Text style={styles.fonte}> PLACEHOLDER DA TELA DE MAPA! {'\n'} (LOCALIZADOR DE FARMACIA?) </Text>
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