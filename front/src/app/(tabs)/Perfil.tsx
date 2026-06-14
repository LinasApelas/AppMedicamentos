import { StyleSheet, Text, View, Alert,} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { router } from 'expo-router';

export default function Perfil() {
  return (
    <View style={styles.container}>

      <View style={styles.botao}>
        <Button
          titulo="Entrar"
          onPress={() => router.push('../termos')}
          corFundo='#9DD7E2'
          />
      </View>

      <View style={styles.botao}>
        <Button
          titulo="Criar Conta"
          onPress={() => router.push('../CriarConta')}
          corFundo='#ffffff'
          />
      </View>

    </View>

)}

const styles = StyleSheet.create({

container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
},

botao: {
    width: '95%', 
    paddingTop: 20,
},

})