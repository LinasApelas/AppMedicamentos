# SyncMed — Notificação e Alarme

> Atualização de 18/11/2026: veja [Correções Android/iOS](CORRECOES-ANDROID-IOS.md).
> A revisão acrescenta expo-audio e som contínuo somente em primeiro plano.
> As descrições abaixo sobre ausência de áudio próprio e dependências refletem a entrega anterior.

## Entrega e limites

Implementados dois níveis no cadastro e na edição, dosagem opcional, persistência por conta,
tela de alarme (modal de tela inteira), confirmação, adiamento de cinco minutos e dispensa.
Sem dependências novas. Versões efetivamente instaladas: Expo 58.0.23 e expo-notifications 58.1.8.

Notificação: aviso normal com nome e dosagem; não abre a tela de alarme.
Alarme: canal Android de alta importância, vibração do sistema e som próprio de dois segundos
em build nativa. No Expo Go, usa som padrão. Não há áudio contínuo nem vibração em loop
controlados pelo app; o aviso sonoro termina por si. Dispensar/confirmar remove o aviso apresentado.
O som já iniciado pelo sistema não tem API de interrupção garantida pelo expo-notifications.
Nenhuma opção ignora volume, modo silencioso, Foco/Não Perturbe ou preferências do canal.

A tela AlarmeMedicamento é montada dentro do SQLiteProvider autenticado, sem rota pública.
Em primeiro plano, o listener abre a tela apenas para ALARME da conta atual. Ao tocar no
aviso, inclusive após início a frio, a resposta é lida e validada contra SQLite: conta,
medicamento, versão da programação e estado da ocorrência. Avisos antigos/editados/excluídos
não abrem a tela. Vários alarmes ficam numa fila visual, um de cada vez.
A tela tem cores claras/escuras, rolagem, áreas seguras e botões acessíveis.
O formulário mantém o estilo claro já existente no aplicativo.

## Agendamento e dados

- O sistema operacional agenda datas usando expo-notifications, sem timers JavaScript.
- SQLite continua em medicamentos_usuario_ID.db. Migração aditiva: nivelAviso com padrão
  NOTIFICACAO, dosagem e tabela ocorrencias. O antigo campo dose continua sendo HH:MM.
- Nome, dosagem e nível também são enviados ao catálogo de medicamentos no backend.
  Horários continuam locais, conforme a arquitetura anterior; não há restauração de horários
  em outro aparelho nem sincronização bidirecional de edições entre aparelhos.
- Identificadores incluem conta, ocorrência, horário de disparo e versão dos dados.
  Editar substitui agendamentos antigos; excluir cancela os avisos daquele medicamento.
  Edição descarta adiamentos pendentes daquele lembrete e aplica a nova programação.
- A fila global contém até 60 avisos futuros, renovados na inicialização do banco e ao abrir
  a agenda. Tratamentos longos precisam dessa renovação; não é agendamento ilimitado.
- Adiar mantém a data original da ocorrência, persiste uma nova data de disparo e não mexe
  nos próximos horários regulares. Reconciliação preserva o adiamento.
- Já tomei grava TOMADO uma única vez no SQLite. Depois envia ao histórico existente usando
  POST /historicos/lembretes. Há chave idempotente e bloqueio transacional do medicamento no
  servidor para proteger repetição após perda de resposta. Sem internet, fica pendente;
  ao abrir a agenda, sincronizam-se primeiro medicamentos e depois confirmações.
- Dispensa grava DISPENSADO localmente, sem criar histórico de medicação tomada.
- A lista mostra as últimas dez confirmações locais e o estado de sincronização.
- Mantida a política de sessão existente: logout cancela notificações, preserva SQLite e
  restaura os avisos futuros após login. A autenticação existente também cancela avisos na
  inicialização antes de restaurar a sessão. Reabrir sem conseguir autenticar pode deixar
  a fila cancelada até novo login. Não foi alterada a autenticação para contornar isso.

## Backend e PostgreSQL

O cadastro atual não cria Tratamento; por isso o histórico existente foi estendido para
aceitar uma ocorrência ligada diretamente a um medicamento da conta autenticada.
Os históricos antigos continuam ligados aos tratamentos. GET /historicos retorna ambos;
consumidores devem aceitar tratamento nulo nos registros de lembretes.
AcessoConta ganhou somente a resolução de propriedade desses novos históricos.
Login, cookies e regras de autenticação não foram modificados.

Aplicar, antes de iniciar o backend atualizado em uma base existente:
`back/BackEndAlarme/docs/migrations/2026-11-17-niveis-aviso.sql`.
A migração adiciona campos, permite tratamento_id nulo e cria índice único por medicamento
mais ocorrência. Não exclui tabelas/registros. O PostgreSQL local não foi acessado nem
migrado pelo agente. O projeto já usa ddl-auto=update; não depender dele para retirar a
restrição NOT NULL de uma instalação existente. Revisar/aplicar o SQL explicitamente.

## Expo Go e development build

Expo Go: formulário, SQLite, confirmação, adiamento, notificações locais e tela personalizada
podem ser exercitados se a versão instalada do Expo Go aceitar o SDK 58. Não há som próprio
embutido nele, permissões próprias do SyncMed, AlarmKit ou full-screen intent.

Build nativa: app.json configura expo-notifications e inclui assets/sounds/syncmed-alarme.wav.
Reconstruir o binário após esta mudança. No Android declara SCHEDULE_EXACT_ALARM; a opção
"Permitir horários exatos" aparece somente ao escolher Alarme numa build própria. A
solicitação é explícita pelo botão, não automática no login. Recusar mantém avisos sujeitos
a atraso. O trigger usa delivery=alarmClock para Alarme e bestEffort para Notificação.
O código instalado usa setAlarmClock quando permitido e setAndAllowWhileIdle caso contrário.
A autorização de notificações continua sendo necessária separadamente.

Android: full-screen intents exigem integração nativa de Activity/notificação e
USE_FULL_SCREEN_INTENT, verificando canUseFullScreenIntent no Android moderno. Não foram
adicionados: a tela React Native não abre sobre a tela bloqueada. Reinício depende do
receiver de boot da biblioteca e das políticas do fabricante; fechamento forçado pelas
configurações pode impedir entrega até o app ser aberto. Nenhuma garantia de pontualidade.

iOS: o caminho implementado usa notificações locais do sistema. AlarmKit existe a partir
do iOS/iPadOS 26, exige autorização própria e NSAlarmKitUsageDescription. Suas apresentações
são interfaces nativas/modelos do sistema, não uma tela React Native arbitrária sobre o
bloqueio. Integrá-lo requer módulo Expo nativo em Swift, verificação de disponibilidade,
App Intents para ações e build própria com ferramenta Apple compatível. AlarmKit não foi
implementado nem simulado. Não foram solicitadas permissões críticas ou de AlarmKit.

## Cenários e validação em dispositivo

| Cenário | Caminho implementado | Validação real |
| --- | --- | --- |
| Primeiro plano | Notificação comum; Alarme abre modal | Pendente Android/iPhone |
| Segundo plano | Aviso do sistema; toque abre modal | Pendente Android/iPhone |
| Tela bloqueada | Aviso do sistema; desbloqueio/toque abre app | Pendente Android/iPhone |
| App encerrado | Entrega delegada ao SO; resposta de início a frio | Pendente Android/iPhone |
| Sem internet | Avisos já agendados e confirmação local; envio posterior | Lógica automatizada; aparelho pendente |
| Reinício do celular | Dependente do SO/biblioteca, sem promessa de entrega | Pendente Android/iPhone |

Não foram realizados testes manuais no Expo Go, simulador ou aparelho físico. Os testes com
mock de Notifications não provam entrega, som, vibração, tela bloqueada nem comportamento
após reiniciar. O som é um WAV PCM mono de dois segundos gerado para este projeto.

## Testar no iPhone

1. Aplicar a migração no backend de desenvolvimento e iniciá-lo. Configurar a URL acessível
   ao iPhone conforme front/src/services/config.ts; localhost do telefone não é o computador.
2. Na pasta front, executar `npm start`. Abrir o QR code no Expo Go compatível com SDK 58,
   com computador e iPhone na mesma rede. Entrar numa conta de teste.
3. Criar medicamento de teste para dois minutos à frente, data de hoje, intervalo 8h e
   duração 2 dias. Informar dosagem e escolher Notificação. Autorizar notificações.
4. Manter o app aberto: conferir texto/horário e que não abre a tela de alarme.
5. Criar outro como Alarme para dois minutos à frente. Em primeiro plano, conferir a tela,
   nome, dosagem e horário. Tocar Já tomei duas vezes: deve haver uma confirmação.
6. Repetir com nova ocorrência e Adiar 5 minutos. Reabrir a agenda durante a espera: conferir
   disparo após cinco minutos e preservação dos demais horários.
7. Repetir com Dispensar: não deve aparecer confirmação de medicação tomada.
8. Editar nível/horário antes do disparo e excluir outro lembrete. Conferir ausência do aviso
   antigo; fechar/reabrir e conferir persistência do nível e recorrência.
9. Repetir em segundo plano, bloqueado, encerrado e após reiniciar o telefone, anotando iOS,
   versão do Expo Go/build, Foco, modo silencioso, horário previsto e efetivo. Ao tocar no
   aviso de Alarme, conferir abertura da tela personalizada.
10. Com sessão já aberta, desligar a rede, confirmar e conferir "sincronização pendente".
    Reconectar e abrir a agenda; verificar um único registro em GET /historicos.
11. Sair da conta A e entrar na B: nenhum nome/aviso/histórico de A pode aparecer. Voltar a A
    e conferir restauração dos horários futuros. Testar também permissão negada nos Ajustes.
12. Para ouvir o WAV próprio, instalar uma development build iOS reconstruída com o plugin
    de notificações (assinatura Apple/EAS ou Xcode no macOS). Expo Go continuará com som padrão.
    Repetir a matriz inteira no binário próprio. A build, por si só, não implementa AlarmKit.

No Android, repetir separadamente, incluindo negar/conceder horários exatos e notificações,
restrições de bateria, reinício e encerramento forçado. Não inferir resultado de uma plataforma
pela outra.

## Fontes técnicas consultadas

- Expo SDK 58 Notifications: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
- Android AlarmManager e permissões: https://developer.android.com/develop/background-work/services/alarms
- Android 14, alarmes exatos: https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
- Android 14, full-screen intents: https://developer.android.com/about/versions/14/behavior-changes-14
- Apple AlarmKit: https://developer.apple.com/videos/play/wwdc2025/230/
- Apple autorização: https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSAlarmKitUsageDescription

Também inspecionados Notifications.types.ts, NotificationPermissions.ts, AndroidManifest.xml
e ExpoSchedulingDelegate.kt da versão instalada. Comportamento documentado não equivale a
teste no aparelho.

## Arquivos para revisão

Modificados:

- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/controller/HistoricoController.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/controller/MedicamentoController.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/entity/Historico.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/entity/Medicamento.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/repository/HistoricoRepository.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/security/AcessoConta.java`
- `back/BackEndAlarme/src/test/java/br/edu/uninassau/alarme/controller/SessionIsolationIntegrationTest.java`
- `front/app.json`
- `front/src/app/(tabs)/Adicionar.tsx`
- `front/src/app/(tabs)/Lembretes.tsx`
- `front/src/app/(tabs)/_layout.tsx`
- `front/src/app/_layout.tsx`
- `front/src/services/agenda.ts`
- `front/src/services/alarmes.ts`
- `front/src/services/api.ts`
- `front/src/services/lembretes.ts`

Criados:

- `front/src/components/AlarmeMedicamento.tsx`
- `front/src/services/ocorrencias.ts`
- `front/assets/sounds/syncmed-alarme.wav`
- `front/scripts/alarmes.test.cjs`
- `back/BackEndAlarme/docs/migrations/2026-11-17-niveis-aviso.sql`
- `docs/LEMBRETES-NIVEIS-AVISO.md`

## Testes executados nesta entrega

- `node front/scripts/alarmes.test.cjs` / `node --test front/scripts/alarmes.test.cjs`:
  5 testes passaram, com SQLite real em memória (node:sqlite) e Notifications simulado.
  Cobrem migração preservando registros, níveis/dosagem, edição/exclusão, recorrência,
  reconciliação de adiamento, confirmação idempotente/offline, dispensa, permissão negada,
  invalidação de sessão, limite de 60 e cancelamento/restauração após logout.
- TypeScript: `cd front` e `node node_modules/typescript/bin/tsc --noEmit`: passou.
- ESLint dos arquivos TypeScript/TSX alterados: passou.
- Backend: 65 testes com H2 passaram; mais 1 teste HTTP de sessão/cookies passou em execução
  separada com acesso ao loopback liberado. Total: 66, sem falhas na execução final.
  A primeira tentativa HTTP no sandbox foi impedida por Permission denied: connect.
  O teste novo encontrou e permitiu corrigir a relação bidirecional do histórico na exclusão.
  Validou também nível persistido, confirmação duplicada e tentativa por outra conta.
- Execução Java em cópia isolada do backend, perfil test, Maven offline e JDK 21, com agente
  Byte Buddy carregado na inicialização para evitar autoanexação no ambiente restrito.
  Nenhum teste usou PostgreSQL. Para reproduzir normalmente: `mvnw.cmd test -Dspring.profiles.active=test`.
- `git diff --check`: passou. Branch master mantida; sem pull, push, commits ou mudanças no índice.
  Arquivos compilados que o ambiente regenerou foram repostos ao conteúdo que já estava
  preparado no índice antes da tarefa, preservando as alterações preexistentes da equipe.
- Testes manuais de interface, Android/iPhone, entrega após reboot/encerramento, sons,
  vibração e migração em PostgreSQL: não executados; seguir a matriz e roteiro acima.
