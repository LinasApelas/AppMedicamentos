-- SyncMed: aplicar antes de iniciar o backend atualizado em PostgreSQL existente.
-- Migração aditiva: não remove tabelas nem registros. Não executada pelo agente.
BEGIN;
ALTER TABLE medicamento ADD COLUMN IF NOT EXISTS nivel_aviso varchar(20) NOT NULL DEFAULT 'NOTIFICACAO';
ALTER TABLE medicamento ADD COLUMN IF NOT EXISTS dosagem varchar(255);
ALTER TABLE historico ALTER COLUMN tratamento_id DROP NOT NULL;
ALTER TABLE historico ADD COLUMN IF NOT EXISTS medicamento_id bigint REFERENCES medicamento(id);
ALTER TABLE historico ADD COLUMN IF NOT EXISTS ocorrencia varchar(200);
CREATE UNIQUE INDEX IF NOT EXISTS historico_medicamento_ocorrencia_unico ON historico(medicamento_id, ocorrencia);
COMMIT;
