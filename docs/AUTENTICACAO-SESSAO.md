# Correção de contas e sessão — SyncMed

## Causa confirmada no código

Antes da correção, `front/src/services/api.ts` mantinha o usuário somente em
`currentUser`, uma variável em memória. Ao recarregar o JavaScript, ela voltava a
`null`. Em `front/src/app/(tabs)/Perfil.tsx`, o efeito executava:

```tsx
apiService.listarUsuarios().then((usuarios) => {
  if (usuarios.length > 0) setUser(usuarios[0]);
});
```

O botão **Atualizar** também limpava esse estado, acionando a mesma seleção. Essa
era a origem das consultas de todos os usuários. A conta de teste aparecia quando
era o primeiro registro retornado; não havia uma autenticação dessa conta nem uma
garantia de ordenação da consulta. Não foi encontrada seleção pelo e-mail de teste
no código de produção.

O backend já consultava o e-mail informado e verificava a senha com BCrypt, mas o
login apenas devolvia dados: não estabelecia sessão. Os endpoints de dados eram
públicos, aceitavam IDs sem autorização e usavam listagens globais. O SQLite
`medicamentos_v2.db` também era compartilhado: no login, pendências locais de
qualquer conta podiam ser enviadas ao servidor.

## Funcionamento corrigido

1. O cadastro mantém o fluxo existente: cria a conta e direciona ao login.
2. Após validar e-mail e BCrypt, o servidor cria uma `HttpSession` padrão do
   servlet. Uma sessão anterior é substituída. A identidade fica no servidor.
3. O container emite `JSESSIONID` com `HttpOnly`, `SameSite=Lax` e duração de sete
   dias. O cliente envia cookies com `credentials: 'include'`. Não armazena senha,
   token manual ou ID local como prova de autenticação.
4. Ao abrir o app, `GET /usuarios/me` valida o cookie e devolve apenas o usuário
   daquela sessão. Sem sessão válida, abre o login. Falha de conexão não libera
   telas privadas nem seleciona uma conta alternativa.
5. As rotas privadas só montam após a validação. O perfil e seu botão Atualizar
   usam essa mesma sessão. `GET /usuarios` foi mantido por compatibilidade, mas
   retorna somente a própria conta; não determina quem está logado.
6. Perfis, medicamentos, tratamentos e históricos são filtrados e autorizados
   pelo dono. IDs alheios ou referências cruzadas não dão acesso. O cadastro de
   recursos ignora IDs/proprietários forjados.
7. Cada conta usa `medicamentos_usuario_<id>.db`, aberto somente após autenticação.
   Sincronizações, callbacks e alarmes antigos são bloqueados quando a sessão muda.
   As notificações têm identificação de proprietário e são removidas no logout.
8. O logout invalida a sessão no servidor, expira o cookie e limpa o estado local.
   Se a rede falhar, uma **intenção de logout**, sem credenciais, fica no armazenamento
   local. Ela impede restaurar a sessão anterior até a saída ser confirmada.
9. `X-SyncMed-User` confere se a sessão do cookie ainda corresponde ao contexto
   local, inclusive entre abas web. Ele nunca autentica alguém. Mutações exigem
   `X-SyncMed-Client`, com CORS limitado a origens configuradas.

## Arquivos envolvidos

| Arquivos | Correção |
| --- | --- |
| `front/src/services/api.ts`, `config.ts`, `session-storage.ts` | Cookies, restauração, logout, tratamento de 401, intenção de saída e bloqueio de respostas antigas. |
| `front/src/contexts/AuthContext.tsx`, `hooks/useApi.ts` | Estado compartilhado de autenticação e revalidação da sessão. |
| `front/src/app/_layout.tsx`, `index.tsx`, `login.tsx` | Proteção de navegação, abertura no login/sessão validada e retirada da sincronização do banco global. |
| `front/src/app/(tabs)/_layout.tsx`, `Perfil.tsx` | Banco por conta, restauração de alarmes e perfil obtido da sessão. |
| `front/src/services/sessaoLocal.ts`, `lembretes.ts`, `alarmes.ts` | Isolamento das tarefas assíncronas e notificações. |
| `front/src/app/(tabs)/Adicionar.tsx`, `Lembretes.tsx` | Operações locais vinculadas à sessão que abriu a tela. |
| `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/config/SessaoConfig.java` | Cookie, CORS e exigência de sessão nas rotas da API. |
| `.../security/SessaoUsuario.java`, `AcessoConta.java` | Identidade validada, autorização por proprietário e proteção de vínculos legados. |
| `.../controller/UsuarioController.java`, `.../service/UsuarioService.java` | Login com sessão, `/me`, logout e acesso somente à própria conta, preservando BCrypt. |
| `.../controller/PerfilController.java`, `MedicamentoController.java`, `TratamentoController.java`, `HistoricoController.java` | CRUD autorizado. Histórico recebe DTO com referência de tratamento para evitar desserialização cíclica. |
| `.../repository/PerfilRepository.java`, `MedicamentoRepository.java`, `TratamentoRepository.java`, `HistoricoRepository.java` | Consultas filtradas por dono e verificações de vínculos entre contas. |
| `.../entity/Medicamento.java`, `Historico.java` | Proprietário do medicamento e controle da serialização dos relacionamentos. |
| `front/tests/auth-session.cjs`, `local-session.cjs`, `sync-recovery.cjs` | Testes de sessão, concorrência, SQLite separado e regressões de sincronização. |
| `.../src/test/java/.../controller/SessionIsolationIntegrationTest.java`, `SessionCookieHttpIntegrationTest.java`, `UsuarioControllerTest.java`, `UsuarioAtualizacaoContractTest.java` | Integração A/B, cookie HTTP real, logout, autorização e contratos existentes. |

## Preservação dos dados e limites

- Não foi feita conexão com o PostgreSQL para executar os testes. Não houve
  exclusão de contas, registros, tabelas ou banco `AppAlarme`, nem troca de senhas.
- `application.properties` e versões de dependências foram preservados. O
  mapeamento novo de `medicamento.usuario_id` é nullable; a configuração existente
  `ddl-auto=update` acrescentará essa coluna ao iniciar o backend atualizado.
- Medicamentos/perfis legados sem dono e vínculos ambíguos continuam armazenados,
  mas não são atribuídos automaticamente a ninguém. Sua associação exige revisão
  explícita dos registros. O SQLite global antigo também permanece preservado,
  sem importação automática para uma conta nova.
- A sessão do servidor reside na memória do processo. Reiniciar o backend exige
  novo login; reiniciar somente o aplicativo permite restauração enquanto cookie
  e sessão forem válidos. O servidor expira a sessão após sete dias de inatividade;
  o cookie também possui validade de sete dias.
- A restauração inicial precisa alcançar a API. Os testes automatizados não
  substituem a confirmação da persistência do cookie no Expo Go após encerrar o
  processo do aplicativo no aparelho.
- CORS web aceita inicialmente `localhost` e `127.0.0.1` nas portas 8081/19006.
  Para outro endereço web, configure a origem exata em
  `syncmed.cors.allowed-origins`. Expo Go nativo não usa o CORS do navegador.
  Em uma implantação HTTPS, use `syncmed.session.cookie-secure=true`.

Referências do mecanismo: [sessões servlet no Spring Boot](https://docs.spring.io/spring-boot/reference/web/servlet.html)
e [limitações de cookies documentadas pelo React Native](https://reactnative.dev/docs/network).

## Validação executada

Os testes Java usam exclusivamente H2 em memória, com o perfil `test`. A execução
foi feita em `../validation-session-backend`, uma cópia dos fontes e testes sem o
`application.properties` de produção, para preservar os artefatos locais do projeto.
O IDE pode recompilar seu próprio `target` automaticamente; esses arquivos não
foram apagados ou restaurados pelo assistente.

Resultado da suíte Java completa em 10/11/2026: **65 testes, zero falhas, zero
erros e zero ignorados (`BUILD SUCCESS`)**, com Java 21 e as dependências existentes.
Inclui BCrypt, cadastro/login A, reuso de sessão, logout, login B, ausência de
sessão, isolamento de recursos, referências cruzadas, CORS e cookie HTTP real.
A execução final também confirmou `409` na exclusão de conta, perfil e medicamento
com vínculos legados entre contas, preservando os registros relacionados.

No frontend foram executados:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node tests/auth-session.cjs
node tests/local-session.cjs
node tests/sync-recovery.cjs
```

Todos os comandos acima passaram. Também passou ESLint nos fontes revisados, sem
erros ou avisos. Os testes Node simulam HTTP e
notificações; o teste local usa SQLite real em memória. O teste HTTP Java inicia
Tomcat em porta aleatória, verifica atributos de cookie, usa novo cliente com o
mesmo cookie e testa a rejeição do cookie invalidado no logout.

## Teste manual no Expo Go

1. Mantenha o PostgreSQL em execução. Inicie/reinicie o Spring Boot atualizado
   pela IDE, com o perfil normal e a configuração existente do `AppAlarme`.
   Confirme a porta 8080. Não ative o perfil `test` no servidor usado pelo aplicativo.
2. Na pasta `AppMedicamentos/front`, execute `npm start` e abra o QR Code no Expo Go.
   Computador e celular devem alcançar a mesma rede. A API usa por padrão o host
   do Metro na porta 8080. Se necessário, antes do comando defina
   `$env:EXPO_PUBLIC_API_URL = 'http://IP_DO_COMPUTADOR:8080'`.
3. Sem sessão, confirme que aparece o login. Cadastre uma **conta A nova**, com
   e-mail exclusivo, e faça login com ela.
4. Confira nome/e-mail em Perfil. Use **Atualizar**, recarregue pelo menu do Expo,
   encerre e reabra o Expo Go. Sem reiniciar o backend, a identidade deve continuar A.
5. Adicione um lembrete identificável da conta A. Faça **Sair**. Confirme o login
   e a remoção dos alarmes da conta anterior.
6. Cadastre/acesse uma **conta B nova**. Confirme o perfil B e que os lembretes de A
   não aparecem. Adicione um lembrete de B; saia e volte a A para confirmar que
   cada conta mantém os próprios dados.
7. Saia e reabra o aplicativo. Deve permanecer no login, sem escolher
   `teste.bcrypt@example.com` nem qualquer outra conta.
8. Faça login A, reinicie somente o backend e tente atualizar o perfil. A sessão
   antiga deve ser recusada e o login solicitado novamente.
9. Opcionalmente, desligue a rede antes de sair. Depois reabra o app: a conta
   anterior não deve reaparecer. Restabeleça a rede para concluir a saída e entrar.

**Pendente:** executar esses passos no aparelho físico; não foi declarado teste
manual do Expo Go como aprovado.
