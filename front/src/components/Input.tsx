import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

interface InputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Feather.glyphMap; 
}

export default function Input({ label, iconName, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        {/* Se for passado um ícone, ele renderiza aqui */}
        {iconName && (
          <Feather name={iconName} size={24} color="#5d6d7e" style={styles.icon} />
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
    color: '#000000', 
    fontSize: 18,
    fontWeight: 'normal',
    marginBottom: 6,
    marginLeft: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    height: 60,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
});