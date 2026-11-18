-- Plano mínimo para o esquema local inspecionado em 18/11/2026.
-- NÃO EXECUTADO. Aplicar somente após revisão, backup e autorização.
-- Permite os históricos de lembretes sem remover históricos de tratamentos.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.historico ALTER COLUMN tratamento_id DROP NOT NULL;
COMMIT;
