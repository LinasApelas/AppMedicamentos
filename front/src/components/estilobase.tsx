import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bottomEstilo}>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {  //cor do fundo
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bottomEstilo: { //estilo da parte de baixo
    flex: 1,
    backgroundColor: '#E2F1F8', 
    marginTop: 260, 
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60, 
    width: '100%',
  },
});