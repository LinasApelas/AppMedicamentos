import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';

// Função para criar a tabela no primeiro acesso
async function inicializarBanco(db: { execAsync: (arg0: string) => any; }) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS lembretes (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL,
        intervalo TEXT,
        frequencia TEXT,
        dose TEXT
      );
    `);
    console.log("Banco de dados inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
  }
}

export default function Layout() {
  return (
    // Envolve toda a aplicação com o provedor do banco de dados
    <SQLiteProvider databaseName="medicamentos.db" onInit={inicializarBanco}>
      <Stack />
    </SQLiteProvider>
  );
}