export interface Remedio {
  id: string;
  nome: string;
  username: string;
  dose: string | null;
  intervalo: number | null;
  frequencia: number | null;
  inicio: string | null;
  serverId: number | null;
  pendente: number;
}

export function dataLocal(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function lerData(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return dataLocal(date) === value ? date : null;
}

export function horariosDoDia(remedio: Remedio, dia: string): Date[] {
  const inicio = lerData(remedio.inicio || '');
  const selected = lerData(dia);
  if (!inicio || !selected || !/^([01]\d|2[0-3]):[0-5]\d$/.test(remedio.dose || '') ||
      !Number.isInteger(remedio.intervalo) || !Number.isInteger(remedio.frequencia) ||
      remedio.intervalo! < 1 || remedio.frequencia! < 1) return [];
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + remedio.frequencia!);
  const [hour, minute] = remedio.dose!.split(':').map(Number);
  inicio.setHours(hour, minute, 0, 0);
  const nextDay = new Date(selected);
  nextDay.setDate(nextDay.getDate() + 1);
  const step = remedio.intervalo! * 3600000;
  const first = inicio.getTime() + Math.max(0, Math.ceil((selected.getTime() - inicio.getTime()) / step)) * step;
  const result: Date[] = [];
  for (let time = first; time < Math.min(fim.getTime(), nextDay.getTime()); time += step) result.push(new Date(time));
  return result;
}

export function horario(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
