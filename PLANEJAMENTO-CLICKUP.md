# AppMedicamentos — planejamento do projeto

Objetivo: finalizar e validar um aplicativo de lembretes de medicamentos, com cadastro de usuário, agenda, notificações e sincronização com a API.

Base consultada: projeto Expo/React Native, API Java, serviços de agenda, alarmes e persistência SQLite. A existência de código não comprova que a funcionalidade foi validada.

## Organização no ClickUp

- Projeto/pasta: **AppMedicamentos — Alarme de Medicamentos**.
- Listas: **Backlog** e **Sprint 01 — Validação do fluxo principal**.
- Visualizações: Lista e Quadro (Kanban), agrupado por status.
- Status: **A fazer → Em andamento → Em revisão → Concluído**.
- Bloqueios: registrar o motivo e a dependência na tarefa; manter o status real.
- Responsáveis provisórios: Produto, Front-end, Back-end e QA. Substituir cada função por um integrante real antes da entrega.
- Todas as tarefas abaixo começam em **A fazer**; não foi auditada a conclusão delas.

## Tarefas e subtarefas

Cada item separado por ponto e vírgula na coluna de subtarefas deve ser criado como uma subtarefa real da tarefa correspondente.

| ID | Tarefa | Subtarefas | Responsável sugerido | Prioridade | Aceite | Planejamento |
|---|---|---|---|---|---|---|
| 01 | Definir escopo e critérios do MVP | Listar fluxos essenciais; registrar critérios de aceite | Produto | Alta | Escopo e critérios registrados e revisados | Sprint 01 |
| 02 | Validar execução do aplicativo e da API | Configurar ambiente local; executar app e API; registrar instruções | Back-end | Alta | App acessa a API no ambiente de demonstração | Sprint 01 |
| 03 | Validar cadastro de usuário | Testar campos obrigatórios; testar usuário duplicado; conferir resposta da API | Back-end | Alta | Cadastro válido funciona e entradas inválidas mostram erro claro | Backlog |
| 04 | Validar login e encerramento de sessão | Testar credenciais válidas e inválidas; validar logout; verificar troca de usuário | Front-end | Alta | Login e logout funcionam sem manter dados de outra sessão na tela | Backlog |
| 05 | Finalizar recuperação de senha | Verificar envio e validação de código; tratar código expirado; testar nova senha | Back-end | Alta | Fluxo completo validado sem permitir reutilização de código | Backlog |
| 06 | Validar edição de perfil | Conferir formulário; testar atualização na API; verificar persistência após reabrir | Front-end | Normal | Alterações válidas persistem e erros são apresentados | Backlog |
| 07 | Validar cadastro de lembretes | Validar nome e horário; validar intervalo e duração; salvar no SQLite | Front-end | Alta | Lembrete válido é salvo e reaparece após reiniciar | Sprint 01 |
| 08 | Validar cálculo da agenda | Testar início do tratamento; testar virada de dia; testar término do período | Front-end | Alta | Horários respeitam início, intervalo e duração cadastrados | Sprint 01 |
| 09 | Validar calendário e listagem diária | Selecionar datas; conferir horários; tratar dia sem lembretes | Front-end | Normal | Cada data mostra apenas os horários previstos para aquele dia | Sprint 01 |
| 10 | Validar permissão e disparo de notificações | Tratar permissão negada; testar canal Android; testar disparo em dispositivo | Front-end | Urgente | Notificação chega no horário do cenário de teste e recusa é tratada | Sprint 01 |
| 11 | Validar edição e exclusão de lembretes | Editar horários; cancelar alarmes antigos; excluir e conferir persistência | Front-end | Alta | Não ficam alarmes obsoletos após edição ou exclusão | Sprint 01 |
| 12 | Validar funcionamento sem internet | Cadastrar offline; reabrir aplicativo; identificar pendências de sincronização | Front-end | Alta | Dados locais permanecem disponíveis sem conexão | Backlog |
| 13 | Validar sincronização e recuperação de falhas | Testar API indisponível; testar ID removido no servidor; verificar duplicações | Back-end | Alta | Retentativas preservam dados e não duplicam cadastros no cenário testado | Backlog |
| 14 | Revisar proteção dos dados por usuário | Verificar autorização na API; testar isolamento local; revisar limpeza de sessão | Back-end | Urgente | Uma conta não consegue consultar ou alterar dados de outra | Backlog |
| 15 | Validar tratamento e histórico | Conferir relacionamento das entidades; validar registro de eventos; testar consulta | Back-end | Normal | Histórico e tratamento retornam os registros esperados | Backlog |
| 16 | Revisar acessibilidade e mensagens | Conferir contraste e tamanho do texto; revisar rótulos; padronizar erros e estados vazios | Front-end | Normal | Fluxos principais apresentam rótulos legíveis e feedback compreensível | Backlog |
| 17 | Executar teste integrado do fluxo principal | Cadastrar lembrete; conferir agenda e notificação; registrar evidências e defeitos | QA | Alta | Cenário principal passa no dispositivo e defeitos bloqueantes estão resolvidos | Sprint 01 |
| 18 | Preparar documentação e demonstração | Atualizar instruções de execução; preparar roteiro; revisar quadro e link de entrega | Produto | Normal | Outro integrante consegue executar o projeto e apresentar o planejamento | Sprint 01 |

## Sprint atual proposta

**Sprint 01 — Validação do fluxo principal**  
**Período:** 04/11/2026 a 17/11/2026.  
**Meta:** demonstrar cadastro de lembrete, agenda e notificação em dispositivo, com edição e exclusão coerentes.

Escopo: tarefas **01, 02, 07, 08, 09, 10, 11, 17 e 18**. Datas e capacidade são propostas; ajustar à disponibilidade real da equipe.

Sequência: 01 e 02 preparam o trabalho; 07 precede 08; 08 alimenta 09 e 10; 11 depende do cadastro e dos alarmes; 17 verifica o conjunto; 18 consolida a entrega. O teste integrado usa uma conta de teste existente; se login ou cadastro impedirem o cenário, repriorizar 03/04.

Critério de conclusão: subtarefas verificadas, critérios de aceite atendidos, evidência anexada e revisão por outro integrante quando disponível. A revisão de isolamento da tarefa 14 é condição para uso com dados reais, mesmo estando fora do escopo inicial de demonstração.

## Roteiro de apresentação rápida

1. **Projeto (20 s):** “Nosso projeto é o AppMedicamentos, um aplicativo para organizar lembretes de medicamentos e avisar o usuário nos horários cadastrados.”
2. **Backlog (40 s):** mostrar as 18 tarefas, subtarefas, responsáveis e prioridades.
3. **Kanban (30 s):** explicar o fluxo A fazer, Em andamento, Em revisão e Concluído. Mover apenas tarefas cujo progresso seja real.
4. **Sprint (40 s):** apresentar a meta, período e as nove tarefas selecionadas para validar o fluxo principal.
5. **Demonstração (50 s):** cadastrar um lembrete de teste, conferir a agenda e mostrar a notificação quando validada em dispositivo.
6. **Entrega (10 s):** abrir o link do projeto e confirmar que o avaliador tem o acesso necessário.

## Checklist de entrega

- [ ] Projeto criado no ClickUp.
- [ ] 18 tarefas cadastradas.
- [ ] Subtarefas criadas como itens filhos.
- [ ] Integrantes reais atribuídos como responsáveis.
- [ ] Prioridades configuradas.
- [ ] Quadro Kanban configurado com os quatro status.
- [ ] Sprint criada com período, meta e tarefas.
- [ ] Link do projeto conferido para apresentação.

Este arquivo é o planejamento local; os itens do checklist só devem ser marcados após confirmação no ClickUp.
