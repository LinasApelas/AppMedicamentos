# Integração local de Alarmes e Farmácias — 18/11/2026

Conflito em front/app.json resolvido reunindo expo-location e expo-notifications.
Preservados expo-router, expo-splash-screen, expo-sqlite, ícones, splash, configurações
iOS/Android, package Android e SCHEDULE_EXACT_ALARM. Não há plugins duplicados nem
marcadores de conflito. A configuração de localização mantém os três recursos de
segundo plano/serviço desabilitados e a mensagem em português solicitada.

A aba Farmacias e o MenuConta permanecem no layout de abas; AlarmeMedicamento continua
montado dentro do banco SQLite por conta. A rota Perfil continua protegida no layout raiz,
assim como a filtragem das notificações por usuário. Todos os arquivos de alarmes pedidos
foram encontrados, incluindo o WAV com cabeçalho RIFF/WAVE válido.

## Alterações desta etapa

- front/app.json: resolução do conflito; marcado como resolvido com git add.
- front/tests/local-session.cjs: mock de expo-constants, granted na resposta de permissão
  e identificador syncmed:1: compatível com o serviço atual. Mantidas as verificações de
  isolamento e cancelamento concorrente no logout.
- Este relatório.

As dependências de localização/mapas estavam declaradas no lockfile, mas ausentes no
node_modules. Instaladas com npm ci --ignore-scripts --no-audit --no-fund; nenhuma mudança
em package.json ou package-lock.json nesta etapa. O lockfile define Expo 58.0.22,
expo-location 58.0.20, expo-notifications 58.1.7 e react-native-maps 1.29.11. As versões
foram conferidas contra bundledNativeModules.json do SDK instalado e são compatíveis.

## Verificações executadas

- JSON, ausência de marcadores, unicidade dos plugins, permissão e existência do som: OK.
- Expo config --type prebuild --json: OK, cinco plugins resolvidos. Não gerou projeto nativo.
- TypeScript, tsc --noEmit: OK.
- node --test scripts/alarmes.test.cjs tests/farmacias.cjs tests/auth-session.cjs
  tests/local-session.cjs tests/sync-recovery.cjs: 9 testes aprovados, zero falhas.
- git diff --name-only --diff-filter=U: vazio, sem conflitos pendentes.
- git diff --cached --check: OK.
- Nenhum arquivo .class ou de target está no staging. Não foi necessário retirar artefatos.
- Stash fb4af2109b512e3bfee517495a2c6356471f9ff5 preservado; sem reaplicação ou remoção.
- Master mantida. Sem commit, pull ou push; sem acesso ao PostgreSQL.

Testes físicos de GPS, mapa, som, notificações e alarme em segundo plano não foram
executados. Nenhuma build Android/iOS foi compilada nesta etapa. A validação é de
configuração, tipos, integração do código e testes automatizados com simulações.

## Preparados para commit (17 arquivos)

- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/controller/HistoricoController.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/controller/MedicamentoController.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/entity/Historico.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/entity/Medicamento.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/repository/HistoricoRepository.java`
- `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/security/AcessoConta.java`
- `back/BackEndAlarme/src/test/java/br/edu/uninassau/alarme/controller/SessionIsolationIntegrationTest.java`
- `front/app.json`
- `front/package.json`
- `front/src/app/(tabs)/Adicionar.tsx`
- `front/src/app/(tabs)/Lembretes.tsx`
- `front/src/app/(tabs)/_layout.tsx`
- `front/src/app/_layout.tsx`
- `front/src/services/agenda.ts`
- `front/src/services/alarmes.ts`
- `front/src/services/api.ts`
- `front/src/services/lembretes.ts`

## Ainda fora do staging

A correção de front/tests/local-session.cjs e os arquivos novos abaixo não foram adicionados
automaticamente. Antes de um futuro commit completo, revisar e incluir os fontes, som,
testes, documentação e migração necessários; somente o conteúdo atualmente staged não
inclui todos os arquivos dos alarmes. O .class gerado deve permanecer fora do commit.

- `back/BackEndAlarme/docs/migrations/2026-11-17-niveis-aviso.sql`
- `back/BackEndAlarme/target/classes/br/edu/uninassau/alarme/controller/HistoricoController$Confirmacao.class` — gerado, não incluir
- `docs/INTEGRACAO-ALARMES-FARMACIAS.md`
- `docs/LEMBRETES-NIVEIS-AVISO.md`
- `front/assets/sounds/syncmed-alarme.wav`
- `front/scripts/alarmes.test.cjs`
- `front/src/components/AlarmeMedicamento.tsx`
- `front/src/services/ocorrencias.ts`
