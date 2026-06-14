import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// Definir quais são as propriedades que o botão vai receber
interface BotaoProps {
  titulo: string;
  onPress: () => void;
  corFundo?: string;
}

export default function Botao({ titulo, onPress , corFundo }: BotaoProps) {
  return (
    <TouchableOpacity style={[styles.button , { backgroundColor: corFundo || '#9DD7E2' }]}
    onPress={onPress}>
    <Text style={styles.buttonText}>{titulo}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
  },
});