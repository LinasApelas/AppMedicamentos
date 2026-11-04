# Diagnóstico e preparação da migração de senhas

## Estado observado

`Usuario.senha` é String com `@Column(nullable = false)` e WRITE_ONLY no JSON.
Sem length explícito, o comprimento esperado pelo mapeamento JPA é 255.
Não há confirmação do esquema PostgreSQL real nesta etapa. A configuração principal
usa PostgreSQLDialect, ddl-auto=update e show-sql=true. Não iniciar o contexto da
aplicação para um diagnóstico que precise ser somente leitura: update pode emitir DDL.

## Rotina de diagnóstico (não executada no PostgreSQL)

`PasswordStorageDiagnostic` recebe um DataSource explicitamente. Não é bean, endpoint
nem runner. Executa apenas SELECT, solicita conexão somente leitura e termina com rollback.
Os valores são processados transitoriamente, uma linha por vez, sem retornar IDs,
e-mails, senhas ou hashes. O relatório contém apenas contagens e capacidade da coluna.
Exceções JDBC são substituídas por mensagem fixa, sem causas ou detalhes sensíveis.

Antes de uma execução real autorizada, usar conexão dedicada, credenciais de um papel
com apenas SELECT e sem permissões de DDL/DML, sem contexto JPA. setReadOnly é uma
defesa adicional, não substitui privilégios. Desativar proxies JDBC, trace de resultados,
logs de parâmetros e exportação de dumps de memória. Configurar schema/search_path
explicitamente para a tabela pretendida. Não expor o relatório como endpoint público.
O diagnóstico faz varredura completa: agendar e dimensionar em função do volume.

A precisão é obtida do ResultSetMetaData da coluna efetivamente consultada. Para tipos
textuais variáveis, 60 caracteres suportam BCrypt bruto; 59 não. Precisão desconhecida
ou tipos diferentes são UNKNOWN, exigindo revisão. Isso não avalia constraints, triggers
nem o comportamento de versões específicas do PostgreSQL. Validar esses itens antes
da migração. Se usar DelegatingPasswordEncoder com prefixo, reservar ao menos 68 caracteres;
varchar(255) é uma opção para evolução. Não alterar DDL nesta etapa.

## Classificação e limitação

O diagnóstico confere formato completo de 60 caracteres, versão 2a/2b/2y, custo 04..31
e alfabeto BCrypt. Isso identifica candidatos, não comprova validade criptográfica,
origem ou que o valor não seja uma senha literal escolhida pelo usuário. Não executa
matches contra valores desconhecidos, evitando custo arbitrário vindo do banco.
Todos os outros valores não vazios são indeterminados; não são automaticamente texto puro.
Valores indeterminados acima de 72 bytes UTF-8 precisam de tratamento especial. Não
truncar nem assumir que podem ser migrados diretamente para BCrypt.

Não existe identificação infalível apenas pelo conteúdo. Esta etapa não implementa
conversão. Antes disso, confirmar a procedência por versões implantadas, histórico de
gravações e metadados confiáveis. Se não houver prova suficiente, usar redefinição de
senha por fluxo autenticado e verificado; não adivinhar o formato nem criar fallback
permanente de texto puro. As telas atuais de recuperação não bastam como mecanismo.

## Proposta para uma futura migração autorizada

1. Validar capacidade e integridade do esquema, recursos, backup e restauração em
   ambiente isolado. Backups históricos podem conter texto puro: restringir acesso,
   proteger armazenamento e definir retenção. Não exportar senhas para CSV ou logs.
2. Introduzir metadados explícitos de versão/formato (UNKNOWN, LEGACY_CONFIRMED,
   BCRYPT, RESET_REQUIRED). Somente evidência confiável permite LEGACY_CONFIRMED.
   Registrar apenas contagens e progresso técnico, sem valores individuais.
3. Coordenar implantação e pausa de gravações: o código atual ainda grava texto puro
   e autentica por igualdade SQL. Não executar migração enquanto esse código atender
   tráfego. Preparar cadastro, login e atualização BCrypt juntos antes do corte.
4. Converter apenas LEGACY_CONFIRMED compatíveis com o limite. Em lotes pequenos,
   usar transação e bloqueio por linha; gravar hash e marcador BCRYPT atomicamente.
   Ignorar BCRYPT e não recodificar em retomadas. UNKNOWN e valores inválidos seguem
   para redefinição. Não inferir estado pela aparência do valor.
5. Simular interrupção e retomada antes da produção. A idempotência depende do marcador
   persistido na mesma transação: lotes confirmados são ignorados e lotes interrompidos
   sofrem rollback. Esta lógica ainda não foi implementada.
6. Recuperação preferencial: corrigir e retomar a conversão. Hash não é reversível.
   Em falha grave, restaurar backup validado com escrita suspensa e versão de aplicação
   compatível, considerando as gravações após o backup. Nunca fazer rollback para o
   login antigo sobre uma base já convertida.
7. Validar contagens, ausência de pendências não tratadas e autenticação com contas
   sintéticas. Retirar suporte legado e reduzir permissões após o corte.

## Testes desta etapa

H2 independente e dados fictícios: agregação, valores nulos/vazios, estrutura completa
ambígua, prefixos incompletos, custo inválido, limite em bytes UTF-8, capacidades 59/60/255,
tipo desconhecido, conexão somente leitura/rollback e preservação dos registros,
além de sanitização de erros. Não validam o esquema real nem a idempotência de uma
conversão inexistente. Nenhuma execução no PostgreSQL é autorizada por estes testes.
