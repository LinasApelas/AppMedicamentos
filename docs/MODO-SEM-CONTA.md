# Uso local sem conta — 19/11/2026

O login deixou de ser requisito para abrir a agenda. A tela inicial e a tela de login
oferecem **Continuar sem conta**. No menu da agenda, **Entrar ou criar conta** permanece
disponível como opção.

## Dados e acesso

- Visitante usa `medicamentos_visitante.db`, armazenado por expo-sqlite no aparelho.
- Cada conta mantém seu banco anterior `medicamentos_usuario_<id>.db`.
- O identificador local 0 representa somente a agenda visitante, nunca autenticação
  no backend. As rotas privadas da API continuam exigindo usuário autenticado.
- Cadastro, edição, exclusão, agendamento e confirmação funcionam localmente no modo
  visitante. As rotinas de sincronização retornam sem chamadas HTTP nesse modo.
- Entrar não importa nem envia os dados de visitante. São agendas separadas; sair
  permite voltar à agenda visitante, que permanece no aparelho.
- Um novo início do aplicativo abre o acesso local sem consultar o servidor nem
  restaurar automaticamente cookies antigos. Para acessar novamente os dados de
  uma conta após encerrar o aplicativo, use o login opcional. Os arquivos das contas
  existentes não foram apagados ou convertidos em dados de visitante.
- A versão da sessão invalida operações antigas ao entrar, sair ou trocar de conta.
  O provedor SQLite é remontado e os alarmes são reconciliados com a agenda atual.
- Desinstalar o app ou apagar seus dados pode remover a agenda local. Não foi criada
  exportação, backup em nuvem ou transferência automática entre visitante e conta.

## Limites

Farmácias dependem de localização e serviços externos. Login/cadastro e sincronização
de contas dependem do backend. O modo sem conta não contorna permissões do sistema para
notificações, som ou alarmes exatos.

No Expo Go, carregar o JavaScript do projeto pode exigir acesso ao Metro. Para validar
inicialização totalmente offline, sem computador nem servidor Metro, é necessário um
binário instalado que inclua o bundle do aplicativo. Persistência local e ausência de
requisições da agenda visitante foram testadas automaticamente; os testes físicos abaixo
ainda devem ser realizados.

## Verificação

`node --test scripts/alarmes.test.cjs tests/*.cjs`: 14 testes aprovados.
TypeScript e ESLint dos arquivos de produção alterados aprovados. Bundles iOS e Android
gerados pelo Metro com HTTP 200 e com o banco de visitante presente.
O novo `tests/guest-offline.cjs` usa SQLite em arquivo temporário, reabre o banco,
verifica edição/confirmacão/exclusão, agendamento com identificador visitante, ausência
de chamadas HTTP e bloqueio de sincronização de uma sessão visitante após entrar.
Os testes existentes de autenticação, isolamento A/B e recuperação de sincronização passaram.

Roteiro Android/iOS:

1. Abrir sem conta com backend desligado; cadastrar e editar medicamento.
2. Autorizar notificações e conferir o aviso na hora programada.
3. Confirmar/adiar; fechar e abrir novamente; conferir dados e histórico.
4. Excluir um lembrete e conferir remoção de seus avisos.
5. Entrar numa conta com conexão: sua agenda deve ser separada da visitante.
6. Sair e voltar sem conta: a agenda local deve permanecer intacta.

Nenhuma alteração no PostgreSQL, na autenticação do backend ou nas dependências.
Sem commit, push ou troca de branch.
