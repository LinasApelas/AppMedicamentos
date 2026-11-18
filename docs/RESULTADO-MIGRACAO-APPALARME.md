# Migração do AppAlarme — 18/11/2026

Migração `2026-11-18-historico-tratamento-opcional.sql` executada com autorização
explícita no PostgreSQL local `localhost:5432`, banco `AppAlarme`.

## Verificações antes da execução

- Destino confirmado pelo servidor: AppAlarme, endereço de loopback ::1, porta 5432.
- Backup `C:/Users/junio/Documents/AppMedicamentos/Backups/AppAlarme_20261118_162329Z.dump`
  preservado, com SHA-256 igual ao registrado e leitura integral bem-sucedida pelo pg_restore.
- Conteúdo de todas as cinco tabelas comparado com o estado do backup por contagens e
  hashes das linhas ordenadas: nenhuma mudança; não foi necessário gerar outro backup.
- Texto integral do script conferido com o conteúdo previamente validado; hash registrado
  e reconferido imediatamente antes da execução. O arquivo SQL não foi modificado.

## Execução e comparação

Executado somente o script autorizado, usando psql com `ON_ERROR_STOP=1`.
Resultado: BEGIN, SET, ALTER TABLE, COMMIT, sem erros.

A comparação dos dumps de esquema confirmou uma única mudança:
`historico.tratamento_id` passou de `bigint NOT NULL` para `bigint` nullable.
Todas as restrições e índices do esquema public permaneceram iguais, incluindo as
chaves estrangeiras de histórico para medicamento e tratamento, a chave primária e
a restrição única `(medicamento_id, ocorrencia)`.

| Tabela | Antes | Depois |
| --- | ---: | ---: |
| medicamento | 7 | 7 |
| usuario | 4 | 4 |
| perfil | 0 | 0 |
| tratamento | 0 | 0 |
| historico | 0 | 0 |

Além das contagens, os hashes do conteúdo integral das tabelas permaneceram iguais.
Nenhum registro foi excluído ou alterado.

## Spring Boot e testes

As fontes atuais foram comparadas com a cópia usada no empacotamento validado.
O Spring Boot iniciou contra AppAlarme em 17,596 segundos, com sobrescritas somente
no ambiente do processo: `ddl-auto=validate`, inicialização SQL desabilitada e conexão
PostgreSQL `default_transaction_read_only=on`. Não foi permitido update automático.
O processo foi encerrado após confirmar a inicialização.

Não ocorreu erro de nivel_aviso nem falha de validação do esquema. Nova comparação
depois do startup confirmou que esquema e dados continuaram iguais ao estado
imediatamente posterior à migração. O backup também mantém seu hash original.

Testes direcionados executados em H2, na cópia isolada, com Maven 3.9.16:

- `NivelAvisoSchemaTest`;
- `lembreteConfirmaUmaVezEPreservaIsolamentoENivel`;
- `tratamentosEHistoricosRejeitamReferenciasDeOutraConta`;
- `listasEAlteracoesNaoPermitemAcessoAosDadosDeOutraConta`;
- `cadastroDeRecursosIgnoraIdsForjadosEVinculaProprietarioDaSessao`.

Resultado: **5 testes aprovados, 0 falhas, 0 erros, BUILD SUCCESS**.
Nenhum teste destrutivo foi executado no banco original. A suíte completa não foi
repetida nesta etapa; a falha conhecida de exclusão de conta (esperado 409, recebido
200) permanece pendente, conforme o relatório anterior.

## Evidências e disponibilidade

Arquivos preservados em `C:/Users/junio/Documents/AppMedicamentos/ValidacaoMaven-20261118/`:

- `original-migration-state.json` e `original-post-migration.json`;
- `original-before-migration.sql`, `original-after-migration.sql`, `original-after-startup.sql`;
- `original-startup-validate.log`, `original-startup-result.json`, `original-final-check.json`;
- `post-migration-tests.log`.

O banco está pronto, quanto ao esquema validado, para testes do aplicativo e confirmação
de lembretes sem tratamento associado. Testes físicos Android/iOS continuam necessários.
O backend de validação não ficou em execução. Para testes posteriores, recomenda-se
usar `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` para impedir mudanças implícitas de esquema;
o arquivo de configuração compartilhado não foi alterado nesta execução.

Branch `ajuste/syncmed-android-ios` preservada. Sem commit, push, staging ou outras
migrações. A indisponibilidade temporária da revisão automática de aprovação interrompeu
somente a primeira tentativa da conferência final; a retomada foi aprovada e concluída.
