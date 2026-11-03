import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CalendarioProps {
  onDateSelected?: (date: string) => void;
  selectedDate?: string;
  hasSchedule?: (date: string) => boolean;
}

export default function Calendario({ onDateSelected, selectedDate, hasSchedule }: CalendarioProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [today, setToday] = useState('');

  useEffect(() => {
    // Pega a data atual do dispositivo
    const now = new Date();
    const dateString = formatDate(now);
    setToday(dateString);
    setCurrentDate(new Date(now));
  }, []);

  function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  function formatDate(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Preencher dias vazios no início
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Adicionar dias do mês
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  function getMonthName(d: Date) {
    return d.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
  }

  function formatDateWithDay(day: number) {
    return `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(day)}`;
  }

  const previousMonth = () => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(date);
    onDateSelected?.(formatDate(date));
  };

  const nextMonth = () => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(date);
    onDateSelected?.(formatDate(date));
  };

  return (
    <View style={styles.container}>
      {/* Header com mês/ano e setas */}
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={previousMonth} style={styles.arrow}>
          <MaterialIcons name="chevron-left" size={24} color="#1B3B45" />
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {getMonthName(currentDate)} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Próximo mês" onPress={nextMonth} style={styles.arrow}>
          <MaterialIcons name="chevron-right" size={24} color="#1B3B45" />
        </TouchableOpacity>
      </View>

      {/* Dias da semana */}
      <View style={styles.weekHeader}>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid de dias */}
      <View style={styles.daysGrid}>
      {days.map((day, index) => {
       const dateString = day ? formatDateWithDay(day) : null;
       const isSelected = dateString === selectedDate;
       const isToday = dateString === today;

      return (
       <TouchableOpacity
       key={index}
       accessibilityRole="button"
       accessibilityLabel={dateString || undefined}
       accessibilityState={{ selected: isSelected }}
       style={[
        styles.dayButton,
        isSelected && styles.dayButtonSelected,
        isToday && !isSelected && styles.dayButtonToday,
        !day && styles.dayButtonEmpty,
      ]}
       onPress={() => {
        // Verificar se dateString não é null antes de passar
        if (day && dateString && onDateSelected) {
          onDateSelected(dateString);
        }
      }}
      disabled={!day}
    >
      {day && (
        <>
          <Text
            style={[
              styles.dayText,
              isSelected && styles.dayTextSelected,
              isToday && !isSelected && styles.dayTextToday,
            ]}
          >
            {day}
          </Text>
          {dateString && hasSchedule?.(dateString) && <View style={[styles.todayDot, isSelected && { backgroundColor: '#fff' }]} />}
        </>
      )}
    </TouchableOpacity>
  );
})}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  arrow: {
    minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
  },
  monthYear: {
    fontSize: 16, lineHeight: 22, includeFontPadding: false,
    fontWeight: 'bold',
    color: '#1B3B45',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#12323A',
    width: '14.285714%',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.285714%',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#1a73e8',
  },
  dayButtonToday: {
    borderWidth: 2,
    borderColor: '#1a73e8',
  },
  dayButtonEmpty: {
    opacity: 0,
  },
  dayText: {
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
    fontWeight: '600',
    color: '#12323A',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextToday: {
    color: '#1a73e8',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1a73e8',
    position: 'absolute', bottom: 3,
  },
});
