# SyncMed — validação final de 19/11/2026

Branch preservada: `ajuste/syncmed-android-ios`. Sem pull, merge, commit, push ou
alteração no PostgreSQL. Artefatos preexistentes em `target/` foram preservados e
não foram adicionados ao staging. Nenhuma dependência ou SDK foi atualizado.

## Correções e resultados

| Área | Resultado |
| --- | --- |
| Sem conta | Agenda visitante em SQLite separado; cadastro, edição, exclusão, confirmações e agendamentos sem chamadas obrigatórias ao backend. Entrar não transfere dados. |
| Explicação ao visitante | Tela inicial informa armazenamento no aparelho, ausência de sincronização automática e risco de perda ao desinstalar/trocar de dispositivo. Link Entrar com contraste melhorado. |
| Farmácias | Timeout de 11 s por servidor e limite geral de 25 s; tentativas sequenciais após timeout, rede, 408/5xx, JSON inválido ou resposta parcial. Cancelamento do usuário é preservado. Sem consultas simultâneas na mesma instância. |
| Limites do provedor | Cache de 5 min, reaproveitamento ao reduzir o raio, intervalo de 15 s e pausa de 30 s para 429/406. Não contornar esses códigos com outra requisição imediata. |
| Mapa e lista | Pontos de interesse do mapa-base ocultos em Apple/Google Maps; marcadores apenas de farmácias; lista ordenada por distância sem o antigo corte de cinco resultados. |
| Alarme | Revisados fila/versão por sessão, cancelamento, adiamento e confirmação idempotente. Proteção já implementada para ausência de módulos nativos mantém o som da notificação como alternativa. |
| Calendário/lint | Removida atualização de estado desnecessária no efeito inicial. Configurado o global CommonJS dos testes, sem desabilitar regras de produção. |
| Exclusão de conta | O serviço já bloqueava contas com perfis/medicamentos, mas o controller não o chamava. Restaurada essa chamada antes de excluir, mantendo a verificação de vínculos legados. Nenhum teste foi alterado para encobrir falha. |

## Testes executados

- Frontend: `node --test scripts/alarmes.test.cjs tests/*.cjs` — **14 aprovados**.
- Farmácias: cobertura adicional de JSON inválido, resposta parcial, 408/5xx, timeout
  individual, limite geral, cancelamento durante fallback, pausa 406/429 e requisição
  sobreposta; teste específico reexecutado após a última alteração.
- Persistência: arquivo SQLite de teste fechado/reaberto; dados e confirmação preservados;
  chamadas HTTP de visitante ausentes; sessão antiga bloqueada ao entrar. Testes A/B
  verificam isolamento entre contas. Não equivalem a teste físico de encerramento do app.
- TypeScript: `tsc --noEmit` aprovado.
- Lint: `eslint .` aprovado sem erros ou avisos após ajustes.
- Metro: bundles iOS e Android gerados com HTTP 200 (7.763.160 e 7.857.149 bytes,
  respectivamente). Isso valida o empacotamento JavaScript, não a execução nativa.
- Java: **69 aprovados, 0 falhas, 0 erros**, inclusive o teste antes vermelho de exclusão.
  Maven 3.9.16/JDK 21, perfil `test`, H2. Cópia de fontes e relatório em
  `node_modules/.cache/syncmed-final-20261119/`; não houve uso do banco real.
- Consulta real Overpass, coordenada pública do centro de Fortaleza: timeout. Não foram
  mostrados resultados fictícios nem afirmada disponibilidade do serviço.

## Pendências e limites reais

**Farmácias ainda não tem validação real bem-sucedida nesta conexão.** O tratamento de
falhas está testado, mas não há garantia de disponibilidade dos servidores públicos.
PC e celulares utilizam a mesma internet móvel; a causa externa não foi isolada.
Testar uma rede independente. Se persistir, será necessário avaliar outro provedor
ou hospedagem; não foram introduzidos serviços pagos, chaves ou novos fornecedores.

Android/iOS físicos: não foram executados testes pelo agente. Som, vibração, recebimento
em segundo plano/bloqueado e aparência final precisam do roteiro abaixo. Gerar bundle
nunca substitui testar o aparelho.

No iOS bloqueado, o aviso é uma notificação do sistema; tocar abre o aplicativo.
Não há tela React Native automática sobre o bloqueio, Critical Alerts ou som contínuo
do app em segundo plano. Volume, silencioso, Foco e permissões afetam o aviso.
No Android, canais, bateria e permissão de alarmes exatos podem afetar a entrega.

Expo Go permite testar o fluxo e notificações locais, mas não o som personalizado
embutido no binário. Expo Go 58.0.5 tem um problema conhecido de reload no iOS com
`ExpoAsset`; fechar completamente e reabrir é um contorno. Para recursos nativos,
usar uma development build compatível com o projeto.

O modo visitante funciona offline **depois de carregar o app**. Para testar abertura
sem Metro, usar build preview/release com bundle incorporado. Uma development build
que depende do Metro não basta para comprovar esse cenário.

Em novo início, o app oferece a agenda local sem restaurar automaticamente cookies.
Para abrir novamente a agenda de uma conta, usar o login opcional. Os bancos das contas
continuam separados e preservados. Não há exportação ou migração automática entre agendas.

## Checklist físico — repetir em Android e iPhone

1. Fechar completamente o Expo Go e abrir o projeto; escolher Continuar sem conta.
2. Criar medicamento; editar horário/dosagem; fechar e reabrir; conferir persistência.
3. Com app carregado, desligar internet e cadastrar/editar/confirmar; conferir histórico local.
4. Agendar NOTIFICAÇÃO e ALARME para horários próximos; verificar nome/dose, modal,
   áudio e vibração em primeiro plano; confirmar e adiar; verificar ausência de duplicação.
5. Repetir com app em segundo plano e tela bloqueada; tocar no aviso. Negar permissões
   e conferir mensagem; reativar e conferir reagendamento. Excluir medicamento e conferir
   que seu aviso não dispara. Reabrir para verificar restauração dos próximos horários.
6. Com conexão, entrar na conta A e depois B; verificar agendas separadas. Sair e voltar
   como visitante; seus dados devem permanecer. Não usar contas reais para testar exclusão.
7. Farmácias: autorizar/negar localização; verificar mapa, raios, lista, seleção e rota.
   Repetir em rede independente; distinguir ausência de resultados de falha do servidor.
8. Perfil: conferir Voltar no iPhone e retorno nativo no Android; navegar pelas abas.

Para **development build**, seguir `CORRECOES-ANDROID-IOS.md`: instalar expo-dev-client
em uma etapa própria, configurar assinatura e gerar novo binário contendo os plugins
e o WAV. Android local: `npx expo run:android --device`; iOS requer macOS/Xcode ou EAS
com assinatura Apple. Depois executar `npx expo start --dev-client` com a API da rede.
Para **abertura offline**, gerar preview/release, instalar e testar sem Metro/internet.
Esses builds não foram gerados nesta revisão.

## Arquivos e commits propostos

Inventário de fontes/testes pendentes de revisão, incluindo alterações locais anteriores:

1. **`feat: permite agenda local sem conta`** — `front/src/contexts/AuthContext.tsx`,
   `services/sessaoLocal.ts`, `services/lembretes.ts`, `services/ocorrencias.ts`,
   `app/index.tsx`, `app/login.tsx`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`,
   `app/(tabs)/Lembretes.tsx`, `components/MenuConta.tsx`, `tests/guest-offline.cjs`,
   `tests/local-session.cjs`, `tests/sync-recovery.cjs`, `docs/MODO-SEM-CONTA.md`.
2. **`fix: limita consultas e recupera falhas de farmacias`** —
   `front/src/services/farmacias.ts`, `app/(tabs)/Farmacias.tsx`,
   `components/farmacias/MapaFarmacias.tsx`, `front/tests/farmacias.cjs`.
3. **`fix: preserva aviso quando audio nativo esta indisponivel`** —
   `front/src/services/alertaPrimeiroPlano.ts`, `front/tests/mobile-regressoes.cjs`.
4. **`fix: bloqueia exclusao de conta com dados vinculados`** —
   `back/BackEndAlarme/src/main/java/br/edu/uninassau/alarme/controller/UsuarioController.java`.
5. **`fix: ajusta calendario e verificacao de lint`** —
   `front/src/components/Calendario.tsx`, `front/eslint.config.js` e remoção dos comentários
   redundantes de globals nos dois testes citados acima, se ainda não incluída nos commits.
6. **`docs: registra validacao final Android e iOS`** — este relatório.

Revisar por arquivo/hunk. Não usar `git add .`: há `.class` e outros arquivos de `target/`
preexistentes. Não incluir backups, logs, cache de testes ou credenciais. Nenhum commit
ou envio à master foi realizado.
