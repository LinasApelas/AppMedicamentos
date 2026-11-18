# Validação Maven e PostgreSQL — 18/11/2026

## Resultado

Empacotamento corrigido sem mudança no pom.xml ou nas versões do projeto. Inicialização
real do Spring Boot e migração validadas exclusivamente em cópia descartável do banco
restaurado. AppAlarme não foi conectado nem modificado nesta etapa. Sua migração continua
dependendo de nova autorização explícita.

Branch preservada: `ajuste/syncmed-android-ios`. Sem commits, push, staging ou descarte
de alterações. A compilação ocorreu fora do repositório, em
`C:/Users/junio/Documents/AppMedicamentos/ValidacaoMaven-20261118`.

## Causa e correção Maven

Reprodução com `C:/Maven/apache-maven-3.9.16/bin/mvn.cmd -o -e`, usando JDK 21.0.8.
O log mostrou primeiro `The POM for ... maven-jar-plugin:jar:3.4.2 is missing`, seguido
de `ClassNotFoundException: org.codehaus.plexus.archiver.FileSet`.

O JAR do plugin estava no cache, mas o POM não existia, e plexus-archiver também estava
ausente. Sem os metadados do plugin, o modo offline não resolvia suas dependências.
Não foi identificada necessidade de alterar dependências do aplicativo ou evidência
de incompatibilidade de Java/Spring Boot. A falha era um cache incompleto.

Executado `mvn -U -e -f <copia>/pom.xml package -DskipTests`: Maven baixou o POM ausente
e as dependências necessárias, incluindo plexus-archiver 4.9.2. Nenhum artefato foi
apagado e nenhuma versão do projeto foi modificada. O empacotamento passou online e
depois novamente offline (`-o -e package -DskipTests`). Logs detalhados com `-e` foram
suficientes; não foi necessário usar `-X`.

POM efetivo conferido com `help:effective-pom`:

| Componente | Versão |
| --- | --- |
| Maven utilizado | 3.9.16 |
| Java de execução | 21.0.8 |
| Java alvo no POM, preservado | 17 |
| Spring Boot / plugin | 4.0.3 |
| Hibernate no runtime | 7.2.4.Final |
| maven-jar-plugin | 3.4.2 |
| maven-compiler-plugin | 3.14.1 |
| maven-resources-plugin | 3.3.1 |
| maven-surefire-plugin | 3.5.4 |

## Testes Java

`mvn -o -e -f <copia>/pom.xml test -Dspring.profiles.active=test`, com o agente
Byte Buddy 1.17.8 já instalado, explicitamente anexado para o Mockito.

Resultado: **69 executados, 68 aprovados, 1 falha, 0 erros e 0 ignorados**.

A falha anterior permanece:
`SessionIsolationIntegrationTest.exclusaoDeContaComVinculosRetornaConflitoEPreservaDados`,
linha 77: esperado HTTP 409, recebido HTTP 200. A política de exclusão não foi alterada.
A suíte completa continua vermelha; sucesso do empacotamento com `-DskipTests` não é
sucesso da suíte.

Passaram explicitamente:

- `lembreteConfirmaUmaVezEPreservaIsolamentoENivel`;
- `tratamentosEHistoricosRejeitamReferenciasDeOutraConta`;
- `listasEAlteracoesNaoPermitemAcessoAosDadosDeOutraConta`;
- `NivelAvisoSchemaTest`;
- integração HTTP de sessão/cookies.

Esses testes de comportamento usam H2. A inicialização descrita abaixo usa PostgreSQL real.

## PostgreSQL temporário

Criada a cópia `syncmed_update_1795019545903` usando como template o banco já restaurado
`syncmed_validacao_20261118t162636815z`. Somente a cópia recebeu o SQL revisado de
`2026-11-18-historico-tratamento-opcional.sql`, com `ON_ERROR_STOP=1`.

O comando terminou com BEGIN, SET, ALTER TABLE e COMMIT. `historico.tratamento_id`
passou de NOT NULL a nullable. Comparação de todas as linhas, ordenadas e resumidas
por SHA-256, confirmou preservação de dados antes/depois da migração e da inicialização.

| Tabela | Antes | Depois |
| --- | ---: | ---: |
| medicamento | 7 | 7 |
| usuario | 4 | 4 |
| perfil | 0 | 0 |
| tratamento | 0 | 0 |
| historico | 0 | 0 |

Chaves estrangeiras preservadas: `historico.medicamento_id -> medicamento.id` e
`historico.tratamento_id -> tratamento.id`. Preservados também a chave primária `id`
e a restrição/índice único `(medicamento_id, ocorrencia)`.

O banco de origem não tinha históricos nem tratamentos; a comparação real confirma
preservação desse estado, enquanto os testes de integração exercitam registros relacionados.

## Inicialização real e ddl-auto=update

O JAR empacotado foi iniciado com URL sobrescrita por variável de ambiente para
`syncmed_update_1795019545903`, `ddl-auto=update`, endereço 127.0.0.1 e porta aleatória.
A aplicação iniciou em 16,455 segundos e foi encerrada após a confirmação.

Logging de SQL e schema ativado. Nenhum DDL adicional foi registrado. Os dumps de esquema
após a migração e após o startup são iguais, desconsiderando somente os tokens aleatórios
de proteção do pg_dump. Nenhum SQL inválido ou erro referente a nivel_aviso ocorreu.

A coluna nivel_aviso já era varchar(20) no backup: essa inicialização confirma o funcionamento
com o esquema real restaurado. O cenário de conversão do tipo antigo varchar(255) é coberto
pelo teste de geração de SQL `NivelAvisoSchemaTest`.

Avisos não bloqueantes: dialeto PostgreSQL explicitamente configurado é dispensável e
`spring.jpa.open-in-view` está habilitado por padrão. Não foram alterados nesta tarefa.

## Evidências e pendências

Todos os arquivos abaixo estão em
`C:/Users/junio/Documents/AppMedicamentos/ValidacaoMaven-20261118/`:

- `package-offline.log`: reprodução completa com -e;
- `package-repair.log` e `package-offline-recheck.log`: empacotamentos bem-sucedidos;
- `effective-pom.xml`: versões efetivas;
- `tests.log` e `target/surefire-reports/`: resultados dos testes;
- `database-validation.json`: dados, chaves e índices antes/depois;
- `schema-before-migration.sql`, `schema-after-migration.sql`, `schema-after-startup.sql`;
- `startup-update.log` e `startup-verification.json`: inicialização e comparação.

O backup original foi apenas lido para reconferir seu SHA-256, que permanece idêntico.
Os bancos temporários e os logs foram preservados. Nenhum serviço de validação ficou
em execução. A falha de exclusão de conta permanece pendente. Nenhuma autorização
para migrar o AppAlarme é inferida desta validação.
