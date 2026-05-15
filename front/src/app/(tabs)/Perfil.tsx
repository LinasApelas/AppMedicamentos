import { StyleSheet, View, Text} from 'react-native';

export default function Perfil() {
    return(
        <View style={styles.container}>
            <Text style={styles.fonte}> PLACEHOLDER DO PERFIL! {'\n'} (LOCAL PRA FAZER LOGIN E VISUALIZAR O PROPRIO PERFIL) </Text>
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