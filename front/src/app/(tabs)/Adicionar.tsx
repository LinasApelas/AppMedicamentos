import Motion from '../../components/Motion';
import { StyleSheet, Text, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useCallback, useState } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { dataLocal, lerData, type Remedio } from '../../services/agenda';
import { enviarLembrete } from '../../services/lembretes';
import { atualizarAlarmes } from '../../services/alarmes';
import { capturarSessaoLocal, sessaoLocalAtual, validarSessaoLocal } from '../../services/sessaoLocal';

export default function Adicionar() {
    const router = useRouter();
    const db = useSQLiteContext();
    const [sessao] = useState(capturarSessaoLocal);
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [original, setOriginal] = useState<Remedio | null>(null);
    const [ParaOutraPessoa, setParaOutraPessoa] = useState(false);
    const [nomePessoa, setNomePessoa] = useState('');
    const [nomeMedicacao, setMedicacao] = useState('');
    const [proximaDose, setProximaDose] = useState('');
    const [inicio, setInicio] = useState(dataLocal());
    const [intervalo, setIntervalo] = useState('');
    const [frequencia, setFrequencia] = useState('');
    const [loading, setLoading] = useState(false);
    const [carregando, setCarregando] = useState(false);

    useFocusEffect(useCallback(() => {
        let active = true;
        if (!sessaoLocalAtual(sessao)) return;
        setOriginal(null);
        setMedicacao(''); setNomePessoa(''); setParaOutraPessoa(false);
        setProximaDose(''); setIntervalo(''); setFrequencia(''); setInicio(dataLocal());
        if (id) {
            setCarregando(true);
            db.getFirstAsync<Remedio>('SELECT * FROM lembretes WHERE id = ?', [id]).then(item => {
                if (!active || !sessaoLocalAtual(sessao)) return;
                if (!item) throw new Error('Medicamento não encontrado');
                setOriginal(item); setMedicacao(item.nome); setNomePessoa(item.username || '');
                setParaOutraPessoa(!!item.username); setProximaDose(/^\d{2}:\d{2}$/.test(item.dose || '') ? item.dose! : '');
                setIntervalo(item.intervalo?.toString() || ''); setFrequencia(item.frequencia?.toString() || '');
                setInicio(item.inicio || dataLocal());
            }).catch(() => { if (active && sessaoLocalAtual(sessao)) { Alert.alert('Erro', 'Não foi possível carregar o medicamento.'); router.replace('/Lembretes'); } })
              .finally(() => { if (active && sessaoLocalAtual(sessao)) setCarregando(false); });
        } else setCarregando(false);
        return () => { active = false; };
    }, [db, id, router, sessao]));

    const handleSalvar = async () => {
        if (!sessaoLocalAtual(sessao) || loading || carregando || (id && !original)) return;
        if (!nomeMedicacao.trim() || (ParaOutraPessoa && !nomePessoa.trim())) {
            Alert.alert('Atenção', 'Preencha o nome do medicamento e da pessoa.'); return;
        }
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(proximaDose) || !lerData(inicio)) {
            Alert.alert('Atenção', 'Use horário HH:MM e uma data válida no formato AAAA-MM-DD.'); return;
        }
        if (!/^\d+$/.test(intervalo) || !/^\d+$/.test(frequencia) || Number(intervalo) < 1 || Number(intervalo) > 8760 || Number(frequencia) < 1 || Number(frequencia) > 365) {
            Alert.alert('Atenção', 'Informe intervalo de 1 a 8760 horas e duração de 1 a 365 dias.'); return;
        }
        setLoading(true);
        const item: Remedio = { id: original?.id || Date.now().toString(), nome: nomeMedicacao.trim(),
            username: ParaOutraPessoa ? nomePessoa.trim() : '', dose: proximaDose, inicio,
            intervalo: Number(intervalo), frequencia: Number(frequencia), serverId: original?.serverId || null, pendente: 1 };
        try {
            await db.runAsync(`INSERT INTO lembretes (id, username, nome, intervalo, frequencia, dose, inicio, serverId, pendente)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET username=excluded.username,
                nome=excluded.nome, intervalo=excluded.intervalo, frequencia=excluded.frequencia, dose=excluded.dose,
                inicio=excluded.inicio, pendente=1`,
                [item.id, item.username, item.nome, item.intervalo, item.frequencia, item.dose, item.inicio, item.serverId]);
            validarSessaoLocal(sessao);
            try { await enviarLembrete(db, item, sessao); }
            catch { if (sessaoLocalAtual(sessao)) Alert.alert('Salvo no aparelho', 'A sincronização será tentada novamente ao abrir os lembretes.'); }
            validarSessaoLocal(sessao);
            try { await atualizarAlarmes(await db.getAllAsync<Remedio>('SELECT * FROM lembretes'), true, sessao); }
            catch { if (sessaoLocalAtual(sessao)) Alert.alert('Aviso', 'Medicamento salvo, mas não foi possível atualizar os alarmes. Confira a permissão de notificações.'); }
            validarSessaoLocal(sessao);
            router.setParams({ id: undefined });
            router.replace('/Lembretes');
        } catch { if (sessaoLocalAtual(sessao)) Alert.alert('Erro', 'Não foi possível salvar o medicamento.'); }
        finally { if (sessaoLocalAtual(sessao)) setLoading(false); }
    };
        return(

            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#ffffff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Motion style={styles.intro}><Text style={styles.title}>{id ? 'Editar medicamento' : 'Um cuidado de cada vez'}</Text><Text style={styles.subtitle}>Organize os horários do seu medicamento.</Text></Motion>

                <View style={styles.containerDeTroca}>
                    <TouchableOpacity
                    style={[ styles.botaoDeTroca, !ParaOutraPessoa ? styles.botaoAtivo : styles.botaoDesligado ]}
                    accessibilityRole="tab" accessibilityState={{ selected: !ParaOutraPessoa }}
                    onPress={() => setParaOutraPessoa(false)}>
                    <Text style={!ParaOutraPessoa ? styles.textoAtivo : styles.textoDesligado}> Para Mim </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    style={[ styles.botaoDeTroca, ParaOutraPessoa ? styles.botaoAtivo : styles.botaoDesligado ]}
                    accessibilityRole="tab" accessibilityState={{ selected: ParaOutraPessoa }}
                    onPress={() => setParaOutraPessoa(true)}>
                    <Text style={ParaOutraPessoa ? styles.textoAtivo : styles.textoDesligado}> Outra Pessoa </Text>
                    </TouchableOpacity>
                </View>

    {ParaOutraPessoa && (
        <Motion style={styles.input}>
            <Input
                iconName="user"
                placeholder="Nome da Outra Pessoa..." //input simples q captura o nome do outro paciente quando for o caso
                value={nomePessoa}
                onChangeText={setNomePessoa}
            />
        </Motion>
    )}

        <View style={styles.input}>
            <Input label="Data de início" placeholder="AAAA-MM-DD" value={inicio} onChangeText={setInicio} maxLength={10} iconName="calendar" />
            <Input
                iconName="edit-2"
                label="Medicamento"
                placeholder="Nome do medicamento" //input simples q captura o nome da medicação
                value={nomeMedicacao}
                onChangeText={setMedicacao}
            />

            <Input
                label="Horário da primeira dose"
                placeholder="HH:MM, por exemplo 08:00"
                keyboardType="numbers-and-punctuation" //horário que a primeira ou próxima dose será tomada
                iconName='info'
                value={proximaDose}
                onChangeText={setProximaDose}
            />

             <Input
                label="Intervalo em horas"
                placeholder="Ex.: 8"
                keyboardType="number-pad" //de quantas em quantas horas será tomada a medicação
                iconName='clock'
                value={intervalo}
                onChangeText={setIntervalo}
            />

            <Input
                label="Duração em dias"
                placeholder="Ex.: 7"
                keyboardType="number-pad" //quantidade de dias que a medicação será tomada
                iconName='calendar'
                value={frequencia}
                onChangeText={setFrequencia}
            />
            <Text style={styles.subtitle}>A duração inclui o dia de início. Os horários são calculados a partir da primeira dose.</Text>
        </View>

            <View style={styles.botao}>
                <Button
                    titulo={carregando ? 'Carregando...' : loading ? 'Salvando...' : id ? 'Salvar alterações' : 'Salvar'}
                    onPress={handleSalvar}
                    disabled={loading || carregando}
                    loading={loading}
                    icon="check"
                />
                {!!id && <View style={{ marginTop: 12 }}><Button titulo="Cancelar edição" corFundo="#E2F1F8" disabled={loading} onPress={() => { router.setParams({ id: undefined }); router.replace('/Lembretes'); }} /></View>}
            </View>
        </ScrollView>
        </KeyboardAvoidingView>

  );
}


const styles = StyleSheet.create({
intro: { width: '100%', marginBottom: 24 },
title: { fontSize: 24, lineHeight: 30, includeFontPadding: false, fontWeight: '700', color: '#12323A', marginBottom: 8 },
subtitle: { fontSize: 15, color: '#808080', lineHeight: 22 },

container: {
    flexGrow: 1,
    width: '100%', maxWidth: 560, alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingTop: 20,
},

botao: {
    marginTop: 12,
    width: '100%',
},

input: {
    width: '100%',
},

containerDeTroca: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#99D9EA',
    borderRadius: 20,
    marginBottom: 20,
    minHeight: 56,
    width: '100%',
    overflow: 'hidden',
},

botaoDeTroca: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
},

botaoAtivo: {
    backgroundColor: '#99D9EA',
},

botaoDesligado: {

},

textoAtivo: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 24,
    includeFontPadding: false,
},

textoDesligado: {
    color: '#808080',
    fontSize: 18,
    lineHeight: 24,
    includeFontPadding: false,
    fontWeight: 'bold',
},

})
