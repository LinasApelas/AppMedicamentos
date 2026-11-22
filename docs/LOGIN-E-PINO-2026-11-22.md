# Login e pino de Farmácias — 22/11/2026

## Diagnóstico

A porta 8085 foi identificada com processo Node/Expo do SyncMed, respondendo
packager-status:running em /status. Não era Spring Boot. /usuarios/me expirava;
8080 recusava conexão. Sem EXPO_PUBLIC_API_URL, o frontend usava 8080. IP Wi-Fi
observado: 192.168.3.95. Não é evidência de senha incorreta. O estado das portas
pode mudar; não iniciar Expo em 8085. Nenhuma regra de firewall foi alterada.

## Backend validado nesta execução

Duas tentativas em 8085 falharam com Port 8085 was already in use. A causa da
ocupação intermitente não foi isolada. Não houve encerramento de processo alheio
nem alteração de firewall. A alternativa **8086** iniciou com sucesso (PID 2020),
conectou ao AppAlarme e validou o esquema com ddl-auto=validate. GET /usuarios/me
retornou HTTP 401 em localhost e no IPv4 Wi-Fi, resultado esperado sem cookie.
Nenhuma migração, alteração de senha ou tentativa de login real foi executada.
O servidor foi deixado ativo nesta sessão; mantenha um terminal próprio para uso
persistente caso o processo deixe de estar disponível. Use 8086 no frontend.

## Correções

- Farmácias usa location-on em todos os estados, tamanho 28, sem escala/deslocamento.
- Porta padrão no host inferido do Metro: **8086**, alinhada ao backend validado;
  `EXPO_PUBLIC_API_URL` explícita prevalece, inclusive se especificar outra porta.
- Login distingue rede, timeout, HTTP 401 e erro do servidor. Se login retorna
  sucesso mas /usuarios/me recusa o cookie, informa falha de sessão, não de senha.
- Mantidos credentials:include e confirmação /usuarios/me antes de assumir usuário.
  Nenhuma senha, cookie ou chave é registrada no tratamento de erro da tela.
- Visitante e isolamento local preservados; backend e schema não editados.

TypeScript, ESLint e 30 testes frontend passaram. Testes incluem pino fixo,
navegação, falhas do login, confirmação de cookie, visitante e isolamento A/B.
Isso não comprova login real com a conta do usuário nem funcionamento no celular.
Nenhuma senha foi solicitada ou alterada. Login físico ainda precisa ser realizado.

## Dois terminais persistentes do VS Code

Se houver Expo em 8085, encerre apenas esse Expo com Ctrl+C no terminal dele.
Não encerre processos desconhecidos. Não duplique um backend já ativo.

Terminal 1, quando for necessário iniciar o backend:

```powershell
cd "C:\Users\junio\Documents\AppMedicamentos\AppMedicamentos\back\BackEndAlarme"
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
& 'C:\Maven\apache-maven-3.9.16\bin\mvn.cmd' spring-boot:run '-Dspring-boot.run.jvmArguments=-Dspring.devtools.restart.enabled=false' '-Dspring-boot.run.arguments=--server.port=8086 --server.address=0.0.0.0 --spring.jpa.hibernate.ddl-auto=validate --spring.sql.init.mode=never'
```

Não retirar ddl-auto=validate: application.properties do projeto usa update por
padrão. Aguardar Started ... e Tomcat started on port 8086. PostgreSQL deve estar
ativo e a configuração local existente válida. O comando compila target; não
adicionar os artefatos ao Git. Na validação do agente foi usada uma cópia isolada
em front/node_modules/.cache/syncmed-login-20261122 para preservar target original.

Terminal 2, frontend:

```powershell
cd "C:\Users\junio\Documents\AppMedicamentos\AppMedicamentos\front"
$ipBackend = Read-Host 'IPv4 atual do computador do backend (consulte ipconfig)'
$env:EXPO_PUBLIC_API_URL = "http://${ipBackend}:8086"
npx expo start --go --lan --port 8081 --clear
```

Preserve EXPO_PUBLIC_GEOAPIFY_API_KEY já configurada no ambiente/.env.local.
Se 8081 estiver ocupada, use uma porta livre como 8082; nunca 8085 para Metro.
Se mudar de rede, consulte ipconfig e execute novamente esses comandos.
Não usar localhost/127.0.0.1 como endereço do PC no celular.

### Configuração para os computadores da equipe

- Ajuste os caminhos dos comandos para o checkout, Java e Maven de cada integrante.
- Sem `EXPO_PUBLIC_API_URL`, no Expo Go em LAN o app usa o host anunciado pelo
  Metro e a porta 8086. Isso pressupõe backend e Metro no mesmo computador.
  A porta do Metro (8081/8082) não muda a porta da API. Nenhum IP Wi-Fi fica fixo
  no código. Mantenha computador e celular na mesma rede acessível.
- Para backend em outro computador ou porta, defina `EXPO_PUBLIC_API_URL` com a
  URL completa antes de iniciar Expo, como no exemplo acima. Alternativamente,
  configure essa variável em `front/.env.local` (arquivo local, não versionar).
  A variável do PowerShell prevalece sobre o arquivo; revise valores antigos em
  ambos. Para testar o fallback, remova apenas essa definição do arquivo e use
  `Remove-Item Env:EXPO_PUBLIC_API_URL -ErrorAction SilentlyContinue` no terminal.
  Preserve as demais variáveis, inclusive Geoapify.
- Reinicie Expo com `--clear` e reabra o projeto após mudar a configuração.
  Se Metro anunciar uma interface incorreta (VPN/adaptador virtual), defina
  `REACT_NATIVE_PACKAGER_HOSTNAME` com o IPv4 atual do **computador do frontend**.
  Revise também essa variável ao mudar de rede. Um túnel do Metro não expõe a API:
  nesse caso, configure explicitamente uma URL do backend acessível pelo aparelho.
- Sem host do Metro, o fallback Android é `10.0.2.2:8086` (emulador Android padrão)
  e iOS é `localhost:8086` (simulador). Não são endereços do PC em celulares físicos.
  No navegador, o host padrão é o da página, sempre com porta 8086.
- `EXPO_PUBLIC_API_URL` é pública no bundle; contém somente endereço, nunca
  senhas, tokens ou outras credenciais. O fallback não garante que o backend
  esteja iniciado nem remove bloqueios de rede/firewall.

## Validar Android e iPhone

1. Abrir `http://<IPv4-atual-do-backend>:8086/usuarios/me` no navegador do celular. Sem cookie,
   HTTP 401 é esperado e demonstra resposta do backend; timeout indica acesso
   de rede ainda indisponível. Se funcionar no PC e não no celular, investigar
   mesma rede, isolamento de clientes, VPN e firewall, sem desativá-los cegamente.
2. Abrir QR novo no Expo Go e entrar com conta válida. Conferir dados da conta.
3. Sair, usar visitante e confirmar agenda local preservada, sem mistura de dados.
4. Testar erro de senha e rede desconectada: mensagens devem ser diferentes.
5. Alternar todas as abas, conferir pino em Farmácias sempre com o mesmo desenho.

Arquivos desta correção: front/src/components/TabBar.tsx, front/tests/tab-bar.cjs,
front/src/services/config.ts, front/src/services/api.ts, front/src/app/login.tsx,
front/tests/mobile-regressoes.cjs, front/tests/login-errors.cjs e este relatório.
Alterações anteriores Geoapify e demais arquivos locais preservadas. Sem commit,
push, pull, reset, merge ou troca de branch.
