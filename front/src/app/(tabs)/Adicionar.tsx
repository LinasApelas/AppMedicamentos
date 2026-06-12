import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
// --- Certifique-se de importar o contexto do SQLite ---
import { useSQLiteContext } from 'expo-sqlite'; 
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function Adicionar() {
    const router = useRouter();
    // --- Conecta com o banco de dados global ---
    const db = useSQLiteContext(); 

    const [nomeMedicacao, setNomeMedicacao] = useState('');
    const [intervalo, setIntervalo] = useState('');
    const [frequencia, setFrequencia] = useState('');
    const [proximaDose, setProximaDose] = useState('');

    const handleSalvar = async () => {
        if (!nomeMedicacao.trim()) {
            Alert.alert("Atenção", "Por favor, digite o nome do medicamento.");
            return;
        }

        // --- COMEÇA A LÓGICA DE SALVAMENTO REAL NO BANCO DE DADOS ---
        try {
            // Gera um ID único
            const idUnico = Date.now().toString();

            // Executa o comando SQL para inserir o registro de forma segura
            await db.runAsync(
                `INSERT INTO lembretes (id, nome, intervalo, frequencia, dose) VALUES (?, ?, ?, ?, ?);`,
                [idUnico, nomeMedicacao, intervalo, frequencia, proximaDose]
            );

            // --- ALTERAÇÃO AQUI: Removemos o Alert e fazemos direto ---

            // 1. Limpa os campos após salvar
            setNomeMedicacao('');
            setIntervalo('');
            setFrequencia('');
            setProximaDose('');

            // 2. Navega IMEDIATAMENTE para a tela de Lembretes
            // Usamos replace para garantir que a tela de Lembretes seja recarregada e mostre o novo item
            router.replace('/Lembretes'); 

        } catch (error) {
            console.error("Erro ao salvar no SQLite:", error);
            // Mantemos o alerta apenas em caso de erro real
            Alert.alert("Erro", "Não foi possível salvar o medicamento. Tente novamente.");
        }
        // --- FIM DA LÓGICA DE SALVAMENTO ---
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.inputContainer}>
                    <Input
                        iconName="edit-2" 
                        placeholder="Nome da Medicação:"
                        value={nomeMedicacao}
                        onChangeText={setNomeMedicacao}
                    />

                    <Input
                        placeholder="Intervalo de Tempo:"
                        iconName='clock'
                        value={intervalo}
                        onChangeText={setIntervalo}
                    />

                    <Input
                        placeholder="Frequência:"
                        iconName='calendar'
                        value={frequencia}
                        onChangeText={setFrequencia}
                    />

                    <Input
                        placeholder="Horário da Próxima Dose:"
                        iconName='info'
                        value={proximaDose}
                        onChangeText={setProximaDose}
                    />
                </View>
            </ScrollView>

             <View style={styles.botao}>
                <Button 
                    titulo="Salvar"
                    onPress={handleSalvar} 
                />
            </View>
        </KeyboardAvoidingView>
    );    
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    scrollContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    inputContainer: { width: '95%' },
    botao: { position: 'absolute', bottom: 10, width: '95%', alignSelf: 'center' }
});