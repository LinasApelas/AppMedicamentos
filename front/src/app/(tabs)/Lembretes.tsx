import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
// --- IMPORTAÇÃO DAS NOTIFICAÇÕES ---
import * as Notifications from 'expo-notifications';

interface Remedio {
  id: string; 
  nome: string;
  dose?: string;
  intervalo?: string;
  frequencia?: string;
  data?: string;
}

export default function Lembretes() {
  const router = useRouter();
  const db = useSQLiteContext(); 

  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [takenDays, setTakenDays] = useState<Record<string, boolean>>({});  

  const [remedios, setRemedios] = useState<Remedio[]>([]);
  
  // --- NOVO ESTADO: Controle individual dos checkboxes ---
  const [tomadosHoje, setTomadosHoje] = useState<Record<string, boolean>>({});

  // --- NOVA LÓGICA: Escuta cliques nos botões da notificação ---
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    // Se o usuário clicou na notificação e a ação foi "TOMAR"
    if (
        lastNotificationResponse && 
        lastNotificationResponse.actionIdentifier === 'TOMAR'
    ) {
        // Recupera o ID que escondemos na tela Adicionar
        const remedioId = lastNotificationResponse.notification.request.content.data?.id as string;        
        if (remedioId) {
            marcarComoTomado(remedioId);
        }
    }
  }, [lastNotificationResponse]);

  const carregarMedicamentos = async () => {
    try {
      const resultado = await db.getAllAsync('SELECT * FROM lembretes;');
      setRemedios(resultado as Remedio[]);    
    } catch (error) {
      console.error("Erro ao buscar medicamentos no SQLite:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarMedicamentos();
    }, [])
  );

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    const monthDays = getMonthDays(now);
    if (monthDays.length) setSelectedDate(monthDays.find(d => d.isToday)?.dateString ?? monthDays[0].dateString);
  }, []);

  function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }

  function getMonthDays(baseDate: Date) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const names = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const arr = [];
    const today = new Date();
    for (let d = 1; d <= lastDay; d++) {
      const dt = new Date(year, month, d);
      const dayNumber = dt.getDate();
      const dateString = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dayNumber)}`;
      arr.push({
        date: dt,
        dateString,
        dayNumber,
        dayShort: names[dt.getDay()],
        isToday: dt.toDateString() === today.toDateString(),
      });
    }
    return arr;
  }

  function getMonthName(d: Date) {
    return d.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  function toggleTaken(dateString: string) {
      setTakenDays(prev => ({ ...prev, [dateString]: !prev[dateString] }));
  }

  const deletarMedicamento = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM lembretes WHERE id = ?;', [id]);
      carregarMedicamentos(); 
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  // --- FUNÇÃO ATUALIZADA: Marca a caixa individual e o calendário ---
  const marcarComoTomado = (idRemedio: string) => {
    // Alterna a caixa de seleção do remédio específico
    setTomadosHoje(prev => ({ ...prev, [idRemedio]: !prev[idRemedio] }));

    // Acende a bolinha verde no calendário superior
    const hoje = new Date();
    const dateString = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
    setTakenDays(prev => ({ ...prev, [dateString]: true }));
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowMonthPicker(v => !v)}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {showMonthPicker && (
              <TouchableOpacity onPress={prevMonth} style={{padding:6}}>
                <MaterialIcons name="chevron-left" size={20} color="#12323A" />
              </TouchableOpacity>
            )}
            <Text style={styles.month}>{getMonthName(currentMonth)} {currentMonth.getFullYear()}</Text>
            {showMonthPicker && (
              <TouchableOpacity onPress={nextMonth} style={{padding:6}}>
                <MaterialIcons name="chevron-right" size={20} color="#12323A" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.weekStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
          {getMonthDays(currentMonth).map((d) => (
            <TouchableOpacity
              key={d.dateString}
              style={[styles.pill, d.dateString === selectedDate && styles.pillSelected]}
              onPress={() => setSelectedDate(d.dateString)}
              onLongPress={() => toggleTaken(d.dateString)}
            >
              <Text style={styles.pillDay}>{d.dayShort}</Text>
              <View style={[styles.pillCircle, d.dateString === selectedDate && styles.pillCircleSelected]}>
                <Text style={[styles.pillNumber, d.dateString === selectedDate && styles.pillNumberSelected]}>{d.dayNumber}</Text>
                {takenDays[d.dateString] && <View style={styles.takenDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Remédios de Hoje</Text>
        </View>

        {remedios.length === 0 ? (
          <Text style={styles.fonte}>Nenhum remédio agendado ainda.</Text>
        ) : (
          remedios.map((remedio) => (
            <View key={remedio.id} style={styles.cardRemedio}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {/* --- NOVO CHECKBOX (CAIXA DE SELEÇÃO) --- */}
                  <TouchableOpacity onPress={() => marcarComoTomado(remedio.id)}>
                    <MaterialIcons 
                        name={tomadosHoje[remedio.id] ? "check-box" : "check-box-outline-blank"} 
                        size={28} 
                        color={tomadosHoje[remedio.id] ? "#2E7D32" : "#808080"} 
                    />
                  </TouchableOpacity>
                  
                  {/* Nome do remédio (Fica riscado se for tomado) */}
                  <Text style={[styles.nomeRemedio, tomadosHoje[remedio.id] && { textDecorationLine: 'line-through', color: '#808080' }]}>
                    {remedio.nome}
                  </Text>
                </View>

                {/* Botão de Excluir */}
                <TouchableOpacity onPress={() => deletarMedicamento(remedio.id)} style={{ padding: 4 }}>
                  <MaterialIcons name="delete" size={24} color="#e74c3c" />
                </TouchableOpacity>

              </View>
              <Text style={styles.detalheRemedio}>Próxima dose: {remedio.dose || 'Não informada'}</Text>
              <Text style={styles.detalheRemedio}>
                Intervalo: {remedio.intervalo || 'Não informado'} | Frequência: {remedio.frequencia || 'Não informada'}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 44,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#12323A',
  },
  month: {
    fontSize: 14,
    fontWeight: '700',
    color: '#12323A',
  },
  weekStripContainer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  weekStrip: {
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
  },
  pill: {
    alignItems: 'center',
    marginRight: 12,
  },
  pillDay: {
    fontSize: 12,
    color: '#12323A',
    marginBottom: 6,
  },
  pillCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E6F6F8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pillCircleSelected: {
    backgroundColor: '#1a73e8',
  },
  pillNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#12323A',
  },
  pillNumberSelected: {
    color: '#fff',
  },
  pillSelected: {
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B3B45',
  },
  takenDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
    right: 4,
    bottom: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  fonte: {
    fontSize: 16,
    color: '#808080',
    textAlign: 'center',
    marginTop: 20,
  },
  cardRemedio: {
    backgroundColor: '#F7F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  nomeRemedio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#12323A',
  },
  detalheRemedio: {
    fontSize: 14,
    color: '#5d6d7e',
    marginTop: 4,
  },
});