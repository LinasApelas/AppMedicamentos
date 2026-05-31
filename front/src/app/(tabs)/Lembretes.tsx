import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Lembretes() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  const [weekDays, setWeekDays] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [takenDays, setTakenDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    // inicializa a seleção com hoje
    const monthDays = getMonthDays(now);
    if (monthDays.length) setSelectedDate(monthDays.find(d => d.isToday)?.dateString ?? monthDays[0].dateString);
  }, []);

  function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }

  function getMonthDays(baseDate: Date) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const names = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const arr: Array<{date: Date; dateString: string; dayNumber: number; dayShort: string; isToday?: boolean}> = [];
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

  return (
    <View style={styles.container}>
      
      <View style={styles.topBar}>
        <Text style={styles.title}>Alarmes</Text>
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

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >

        {/* 3. Lista de Remédios */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Remédios de Hoje</Text>
        </View>

        {/* Espaço extra no final da lista para não ficar escondido atrás do botão */}
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
    position: 'relative',
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
    // optional container style when selected
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  saudacao: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B3B45',
  },
  subtitulo: {
    fontSize: 16,
    color: '#5d6d7e',
    marginTop: 4,
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
});