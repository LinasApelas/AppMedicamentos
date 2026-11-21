# Revisão Android — 19/11/2026

Ambiente físico informado: Expo Go 58.0.5. Modelo, Android e estado do app durante
a falha ainda não informados. Nenhuma execução física pelo agente foi realizada.

## Diagnóstico e alterações

- Notificação: nome/dosagem já existiam no corpo, após uma frase longa. Android
  agora recebe nome no título e dosagem no início do corpo. Truncamento é uma
  hipótese, não diagnóstico confirmado do aparelho. Expandir com tela desbloqueada
  distingue conteúdo recolhido de privacidade. Não alteramos visibilidade nem
  configurações de bloqueio. Revisão Android v3 faz a reconciliação substituir
  agendamentos antigos; texto/revisão iOS preservados.
- ALARME: SQLite salva e lê nivelAviso/dosagem em Adicionar e agenda; não foi
  identificada perda de nível. Canal existente HIGH, som e vibração preservados,
  sem recriar canal para contornar escolhas do usuário. O handler silenciava o
  aviso nativo quando a tela de alarme estava pronta, antes de saber se o áudio
  tocaria. Android agora mantém o aviso nativo; pode haver um toque nativo junto
  ao áudio da tela. iOS mantém o comportamento anterior.
- Permissão exata: após agendar, verifica getExactAlarmPermissionsAsync. Negação
  mantém avisos aproximados e apresenta orientação na agenda, sem falsa garantia
  de pontualidade e sem abrir configurações automaticamente. Falha da API nativa
  também é informada. Canal, volume, DND e bateria ainda dependem do aparelho.
- Visitante: sessão local 0, SQLite e agendamento local; não depende do backend.
- Farmácias: consulta real de 2 km no centro público de Fortaleza retornou 429
  (Private.coffee) e 406 (principal). Não prosseguir com mais tentativas durante
  pausa. Isso indica recusa/limitação externa, não falha de marcador. Sem dados
  da API não há farmácias para mostrar. Preservadas alterações de fallback e
  Google Maps; revisão 19/11-B em Sobre a busca permite verificar código carregado.
  A abertura real do mapa/lista no aparelho continua pendente.

## Repetir nos dois aparelhos

1. No terminal do projeto front: `npx expo start --go --lan --clear`.
   Fechar totalmente o Expo Go e reabrir o QR atual, na mesma rede. Não desinstalar:
   isso pode apagar dados locais. Em Farmácias, tocar no ícone de informação e
   confirmar “revisão 19/11-B”. O agente não confirmou a versão no aparelho.
2. Abrir Lembretes para reconciliar agendamentos. Como visitante, criar dois
   medicamentos de teste com nomes diferentes e dosagens; um NOTIFICACAO e outro
   ALARME, alguns minutos à frente. Testar após desligar a internet com app carregado.
3. Na notificação Android desbloqueada, conferir nome no título e dosagem no corpo;
   expandir. Bloquear e conferir respeito à configuração de ocultar conteúdo.
4. Testar ALARME aberto (modal/áudio/vibração), segundo plano e bloqueado
   (notificação do sistema). Confirmar/adiar, reabrir e conferir histórico e ausência
   de duplicatas. Não esperar tela React automática sobre bloqueio ou áudio JS
   contínuo com app encerrado. Volume/silencioso/DND podem impedir som.
5. Se houver aviso de horário aproximado: Android > acesso especial > Alarmes e
   lembretes, permitir para o aplicativo em teste e reabrir agenda. Inspecionar
   também canal Alarmes de medicamentos, som, vibração e bateria. Não alteramos
   esses ajustes. Forçar parada pode impedir entrega até reabrir.
6. Farmácias: esperar pausa, buscar 2 km, conferir nomes/lista/marcadores; testar
   Google Maps durante espera, após erro e sem localização. Repetir em rede
   independente. Só declarar resolvido quando resultados reais aparecerem.
7. No iPhone repetir recebimento, texto, modal, confirmação/adiamento e farmácias.

## APK com recursos incorporados

Configurado front/eas.json, perfil preview, distribuição interna e buildType apk.
Não é development client: é APK de teste com bundle incorporado, adequado para
abertura offline e WAV nativo. Não instala expo-dev-client nem muda dependências.
App.json já declara SCHEDULE_EXACT_ALARM e plugin do WAV.

Quando desejar gerar, em front: `npx eas-cli build --platform android --profile preview`.
Exige conta/configuração EAS e assinatura; a primeira execução pode propor vincular
projeto/credenciais. Nenhum comando de build remoto, publicação ou instalação foi
executado nesta revisão. Revisar essas propostas antes de aceitar. Instalar somente
por ação do usuário. Dados do Expo Go não são transferidos ao APK.

Expo Go usa som padrão do sistema nas notificações; APK inclui syncmed-alarme.wav.
Em segundo plano o agendamento/aviso usa o sistema operacional, não JavaScript.
O som nativo é de notificação, não um serviço de sirene contínua até confirmar.

Referências: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
e https://developer.android.com/reference/android/app/NotificationChannel

## Arquivos desta revisão

Validação executada: TypeScript sem emissão e ESLint completos aprovados;
17 testes frontend aprovados, zero falhas, incluindo payload/canais Android,
permissão exata negada, preservação iOS, handler, visitante offline e farmácias.
Testes usam mocks de notificações: entrega, áudio e privacidade reais seguem pendentes.

front/src/services/alarmes.ts; front/src/app/_layout.tsx;
front/src/app/(tabs)/Lembretes.tsx; front/src/app/(tabs)/Farmacias.tsx;
front/scripts/alarmes.test.cjs; front/tests/notification-handler.cjs;
front/eas.json; este relatório. Alterações anteriores preservadas.
Sem backend, PostgreSQL, commit, push ou troca de branch.
