import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// Definir quais são as propriedades que o botão vai receber
interface BotaoProps {
  titulo: string;
  onPress: () => void;
}

export default function Botao({ titulo, onPress }: BotaoProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{titulo}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#9DD7E2', // Cor principal do botão
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#121b28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#1B3B45',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});