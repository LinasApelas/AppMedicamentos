import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';

export default function Home() {
    return(
    <View style={styles.container}>
        <Text style={styles.fonte}> PLACEHOLDER DA HOME! {'\n'} (ALARMES SALVOS COM BOTÃO DE ADD) </Text>
    </View>
)    
};

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
}
)