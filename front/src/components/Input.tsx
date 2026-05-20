import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Adicionamos a propriedade iconName para receber o nome do ícone
interface InputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap; 
}

export default function Input({ label, iconName, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        {/* Se for passado um ícone, ele renderiza aqui */}
        {iconName && (
          <MaterialIcons name={iconName} size={24} color="#5d6d7e" style={styles.icon} />
        )}
        
        <TextInput
          style={styles.input}
          placeholderTextColor="#7f8c8d"
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: '#1B3B45', 
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B2E3E8', // Cor de fundo do seu design original
    borderRadius: 30,
    height: 60,
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
});