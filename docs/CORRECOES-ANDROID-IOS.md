# SyncMed — revisão Android/iOS (18/11/2026)

## Estado e diagnóstico

Trabalho mantido na branch existente `ajuste/syncmed-android-ios`, após o checkpoint
`e7560097`. Nenhum commit, push, stash ou migração foi executado nesta revisão.
As alterações preexistentes em `target/` foram preservadas; não devem entrar nos commits.

| Problema | Causa e correção |
| --- | --- |
| ALARME semelhante à notificação no iPhone | O modal existente não reproduzia áudio próprio. Agora usa `expo-audio` com o WAV existente, em loop enquanto visível em primeiro plano, e vibração inicial. Confirmar, adiar, dispensar, sair da tela ou colocar em segundo plano interrompe o áudio. |
| Som duplicado em primeiro plano | O handler silencia o som da notificação ALARME quando a tela personalizada está montada e o aplicativo ativo. A notificação normal mantém o comportamento anterior. |
| Acesso ao alarme em segundo plano | Categoria `syncmed-alarme`, com ação “Ver medicamento”, abre o aplicativo. A ocorrência e a conta continuam sendo validadas antes de mostrar o modal. A revisão dos agendamentos mudou para atualizar notificações existentes. |
| “O serviço de farmácia está indisponível” | Essa mensagem vinha de resposta HTTP não bem-sucedida do Overpass; não comprova falha do mapa. Adicionado um segundo servidor para HTTP 5xx ou erro de rede, com o mesmo limite total de 25 segundos. HTTP 429/406 continua respeitando a pausa de 30 segundos. Não há garantia de disponibilidade dos servidores públicos. |
| Região inicial do mapa | A animação aguarda `onMapReady`. iOS conserva Apple Maps; Android conserva Google Maps. |
| Perfil exibe `(tabs)` | Configurado `headerBackTitle: 'Voltar'` no cabeçalho nativo, sem outro cabeçalho. |
| SQL inválido em `nivel_aviso` | Removido DEFAULT de `columnDefinition`; tamanho fica em `@Column(length=20)` e default em `@ColumnDefault`. Teste gera o ALTER usando o dialeto PostgreSQL e verifica que DEFAULT não aparece junto ao tipo. |
| Confirmação não alcança a API física | Corrigida URL relativa para o endpoint absoluto de históricos configurado. Nenhum IP fixo foi acrescentado ao código. |

O áudio instalado é `expo-audio` 58.0.12, dentro do intervalo `~58.0.11` indicado
pelo Expo 58.0.22 instalado. `expo-notifications` instalado: 58.1.7. Não houve upgrade
de SDK. O plugin de áudio desabilita gravação, permissão de microfone e reprodução
em segundo plano. Se o módulo nativo não estiver disponível, o modal informa a falha
de som e conserva suas ações.

## Banco: alteração preparada, não aplicada

Inspeção somente de metadados no PostgreSQL local, com sessão read-only:

| Coluna/índice | Encontrado |
| --- | --- |
| `medicamento.nivel_aviso` | varchar(20), NOT NULL, default NOTIFICACAO |
| `medicamento.dosagem` | varchar(255), nullable |
| `historico.medicamento_id` | bigint, nullable |
| `historico.ocorrencia` | varchar(200), nullable |
| `(medicamento_id, ocorrencia)` | índice único existente |
| `historico.tratamento_id` | bigint, **NOT NULL**, incompatível com históricos de lembretes sem tratamento |

O plano mínimo é remover somente o NOT NULL de `historico.tratamento_id`, preservando
registros, chaves e índices. Script revisável:
`back/BackEndAlarme/docs/migrations/2026-11-18-historico-tratamento-opcional.sql`.
Usa transação e `lock_timeout` de 5 segundos. A migração anterior de 17/11 foi preservada.

Antes de aplicar: obter autorização, fazer backup com `pg_dump -Fc -U <usuario> -d
AppAlarme -f <arquivo.dump>` e verificar o arquivo com `pg_restore --list <arquivo.dump>`.
Usar os parâmetros de conexão locais, sem incluir senha no comando. Depois da aprovação,
executar o SQL com `psql -v ON_ERROR_STOP=1 -U <usuario> -d AppAlarme -f <script.sql>`.
Validar a coluna como nullable e confirmar uma ocorrência de lembrete e outra de tratamento.
Não restaurar NOT NULL sem antes avaliar registros com tratamento nulo.

O Spring Boot não foi iniciado contra o PostgreSQL real: `ddl-auto=update` poderia alterar
o esquema automaticamente. Inicialização em H2 e geração de SQL PostgreSQL foram testadas.
A inicialização contra o banco real e a confirmação completa permanecem pendentes desse plano.

## Validação automatizada

- Frontend: `node --test scripts/alarmes.test.cjs tests/*.cjs` — **12 aprovados**.
  Abrange agendamento, duplicação, adiamento, confirmação offline, isolamento de contas,
  logout, recuperação da sincronização, áudio, URL da API e busca de farmácias.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` — aprovado.
- `npx expo lint`: falha preexistente em `Calendario.tsx` por setState síncrono em efeito
  e aviso de dependência do efeito. O ESLint em toda a pasta também aponta `__dirname`
  nos testes CommonJS preexistentes. Esses arquivos não relacionados não foram reformulados.
  ESLint direcionado aos arquivos de produção alterados e ao novo teste passou.
- Expo: configuração nativa introspectada; sem permissão de microfone nem background audio
  no Info.plist gerado. Sons e permissões de localização permanecem configurados.
  Configuração dinâmica de mapas verificada com e sem chave de teste, preservando plugins.
- Java: **69 testes, 68 aprovados, uma falha**, em cópia isolada com perfil `test`/H2.
  `NivelAvisoSchemaTest` e integração HTTP de cookie passaram.
- Falha: `SessionIsolationIntegrationTest.exclusaoDeContaComVinculosRetornaConflitoEPreservaDados`
  espera 409 e recebe 200. Repetida com o mapeamento anterior de `Medicamento` em outra cópia,
  com o mesmo resultado. A política de exclusão de conta não foi alterada nesta tarefa.
- Nenhum teste físico de Android/iPhone foi realizado. Os testes de áudio e rede usam mocks;
  não demonstram reprodução nativa ou disponibilidade atual do Overpass.

## Como testar no aparelho

Na pasta `front`, com computador e telefone na mesma rede, definir antes de iniciar o Metro:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.184:8085"
npx expo start --clear
```

Esse endereço é somente o exemplo da rede informada. Confirmar o IP atual e o backend na
porta 8085; localhost no telefone aponta para o próprio telefone. O firewall deve permitir
a conexão local. Em produção, configurar o endereço HTTPS do ambiente.

Expo Go permite verificar navegação, mapa e o áudio em primeiro plano se sua versão incluir
o módulo compatível. **Som personalizado de notificação exige novo binário nativo** contendo
o WAV configurado no plugin. Atualização JavaScript ou reinício do Metro não adiciona esse
arquivo a um binário antigo. No Expo Go, a notificação usa o som padrão.

Para uma development build, instalar `npx expo install expo-dev-client` e reconstruir.
Essa dependência e a configuração EAS não foram adicionadas nesta revisão.

- Android local: configurar SDK/ADB, habilitar depuração USB, conectar o aparelho e executar
  `npx expo run:android --device`. Fornecer `GOOGLE_MAPS_ANDROID_API_KEY` no ambiente de build,
  com Maps SDK for Android habilitado e restrições para o pacote
  `com.claudemir_junior.AppMedicamentos` e certificado de assinatura usado. A configuração
  dinâmica adiciona o plugin de mapas somente quando essa variável existe.
- iOS local: em macOS com Xcode e assinatura configurada, definir um `ios.bundleIdentifier`
  único para o projeto e executar `npx expo run:ios --device`.
- iPhone a partir do Windows: usar EAS Build com conta Apple/assinatura. Executar
  `npx eas-cli@latest build:configure`, configurar perfil `development` com
  `developmentClient: true` e `distribution: "internal"`, registrar o aparelho com
  `npx eas-cli@latest device:create`, então `npx eas-cli@latest build --platform ios --profile development`.
  Instalar pelo link resultante. Não foi criado build, credencial ou registro de aparelho.
- Após instalar o binário: definir a variável da API e executar
  `npx expo start --dev-client --clear`. Recompilar sempre que plugins, sons ou módulos nativos mudarem.

## Roteiro manual — executar em Android e iPhone

| Cenário | Resultado a verificar |
| --- | --- |
| NOTIFICACAO, app aberto | Nome/dosagem e aviso normal, sem modal de alarme |
| ALARME, app aberto | Modal, WAV contínuo e vibração inicial; apenas um áudio por vez |
| Confirmar / adiar / dispensar | Som para; confirmar uma vez; adiar cinco minutos sem duplicar próximos horários; dispensar não registra tomada |
| Colocar em segundo plano com modal aberto | Áudio do app para; ao voltar, a ocorrência ainda pendente pode retomar |
| Novo aviso em segundo plano ou bloqueado | Notificação nativa; som conforme permissões/configuração; tocar em “Ver medicamento” abre a ocorrência correta |
| Silencioso, volume baixo, Foco/Não Perturbe | Respeitar as configurações do sistema; não prometer alerta crítico |
| Permissão de notificação negada | Mensagem compreensível e ausência de agendamentos indevidos |
| Editar/excluir, logout/login A/B | Não duplicar nem mostrar ocorrência antiga/de outra conta |
| Sem internet: confirmar, depois reconectar | Registro local preservado e sincronização posterior sem duplicação, após ajuste do banco |
| Localização negada/desativada | Orientação clara e tentativa posterior possível |
| Farmácias: raios 2, 5 e 10 km | Posição, mapa, marcadores reais, lista, distância e rota |
| Sem rede / servidor falha / sem resultados | Estados distintos; mapa não é confundido com disponibilidade da busca; não inventar resultados |
| Perfil | iPhone mostra “Voltar”; retorno nativo Android permanece funcional |

iOS não permite que este código abra uma tela React Native automaticamente sobre o bloqueio.
Não há Critical Alerts nem áudio contínuo em segundo plano. Android também depende das
permissões de notificação, canais, autorização de alarmes exatos e configurações de bateria.
Não foi acrescentada atividade full-screen. O áudio de primeiro plano respeita o silencioso
do iPhone (`playsInSilentMode: false`).

## Arquivos e proposta de commits

1. Checkpoint: já existente, `e7560097`; não duplicado nesta tarefa.
2. `fix: diferencia alarme em primeiro plano e corrige confirmação`:
   `front/package.json`, `package-lock.json`, `app.json`, `src/services/alertaPrimeiroPlano.ts`,
   `alarmes.ts`, `api.ts`, `src/components/AlarmeMedicamento.tsx`, `src/app/(tabs)/Adicionar.tsx`,
   hunk do handler de `src/app/_layout.tsx`, `scripts/alarmes.test.cjs`,
   `tests/local-session.cjs`, `tests/mobile-regressoes.cjs`.
3. `fix: recupera busca de farmácias e prepara mapa nativo`:
   `front/app.config.js`, `src/services/farmacias.ts`, `src/app/(tabs)/Farmacias.tsx`,
   `src/components/farmacias/MapaFarmacias.tsx`, `tests/farmacias.cjs`.
4. `fix: exibe Voltar no Perfil`: somente o hunk de Perfil em `front/src/app/_layout.tsx`.
   Usar seleção de hunks (`git add -p`) para separá-lo do handler.
5. `fix: separa default do tipo SQL de nivel_aviso`: entidade `Medicamento.java`,
   teste `repository/NivelAvisoSchemaTest.java` e novo SQL de 18/11; revisar separadamente
   o script preexistente de 17/11 antes de incluí-lo.
6. `docs: registra validação Android e iOS`: este arquivo e atualização do guia de lembretes.

Não usar `git add .`: existem artefatos compilados preexistentes em `target/`.
Nada foi colocado no staging por esta revisão.

Referências: [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/),
[Expo Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/),
[MapView](https://docs.expo.dev/versions/latest/sdk/map-view/),
[Development builds](https://docs.expo.dev/develop/development-builds/introduction/),
[Hibernate ColumnDefault](https://docs.hibernate.org/orm/7.1/javadocs/org/hibernate/annotations/ColumnDefault.html).
