# Farmácias Próximas — SyncMed

## Uso

Entre na conta e abra **Perfil → Farmácias Próximas → Usar minha localização**. O raio inicial é de 5 km, com opções de 2 e 10 km. A lista é ordenada pela distância em linha reta. Selecionar um item destaca seu marcador e volta ao mapa. “Como chegar” abre Apple Maps no iPhone ou um link de rotas do Google Maps no Android, com o destino real; se nenhum aplicativo assumir o link, o navegador pode abri-lo.

## Implementação

- `src/app/Farmacias.tsx`: tela, filtros, estados e coordenação de buscas.
- `src/components/farmacias/MapaFarmacias.tsx`: mapa nativo, marcadores, seleção e raio.
- `src/components/farmacias/MapaFarmacias.web.tsx`: aviso no navegador; a lista continua disponível, mas o mapa interativo é exclusivo de iOS/Android nesta versão.
- `src/components/farmacias/ItemFarmacia.tsx`: item acessível e ação de navegação.
- `src/services/farmacias.ts`: consulta Overpass, validação, distância Haversine, ordenação, timeout, cache e limitação de consultas.
- `src/services/localizacao.ts`: permissão em primeiro plano e leitura pontual do GPS.
- `src/services/rotasFarmacias.ts`: links de destino e tratamento de falha.
- `src/app/_layout.tsx`: rota protegida pela autenticação existente.
- `src/app/(tabs)/Perfil.tsx`: acesso à funcionalidade, preservando a barra de três abas.
- `app.json`, `package.json`, `package-lock.json`: configuração e dependências.
- `tests/farmacias.cjs`: testes com dados explicitamente sintéticos, sem acesso a GPS ou rede.

Dependências adicionadas conforme `expo/bundledNativeModules.json` do Expo 58.0.22 instalado:

| Dependência | Versão declarada | Finalidade |
|---|---|---|
| expo-location | ~58.0.20 | Permissão e leitura pontual da posição |
| react-native-maps | 1.29.11 | Mapa nativo compatível com Expo Go |

Reutiliza o botão existente e as cores claras do aplicativo. Não havia tema escuro implementado nessas telas; o mapa pode seguir o sistema, enquanto a interface mantém o padrão existente.

## Dados, privacidade e disponibilidade

A consulta é enviada por POST para `https://overpass-api.de/api/interpreter`, sem cookies ou credenciais da conta. Busca nós, vias e relações com `amenity=pharmacy` ou `healthcare=pharmacy`. Centros de polígonos são usados como aproximação; os resultados são novamente filtrados pelo raio no cliente. Endereços e nomes ausentes são identificados como não informados, sem geocodificação adicional. OSM pode conter duplicações entre representações distintas de um estabelecimento; IDs repetidos são eliminados.

O usuário inicia a busca após ler a explicação. A permissão solicitada é apenas de primeiro plano; não há assinatura contínua de localização nem permissão em segundo plano. “Atualizar busca e localização” lê novamente a posição. Trocar o raio reutiliza a última posição. A posição é enviada somente ao serviço de busca e usada no mapa nativo; ao abrir rotas, somente o destino é incluído no link.

O cache de resultados dura até cinco minutos e pertence à tela; é descartado ao sair dela. Nada é gravado no SQLite, PostgreSQL ou backend. Não há logs de coordenadas. A consulta tem timeout de 25 segundos, no máximo uma requisição ativa por tela e intervalo mínimo de 15 segundos entre consultas sem cache. Respostas 429/406 impõem pausa de 30 segundos. Não há repetição automática ou envio silencioso a servidores alternativos.

O servidor público não oferece garantia de disponibilidade. A implementação é adequada a uma demonstração acadêmica de baixo volume; antes de ampliar o uso, revisar limites agregados da aplicação e considerar um servidor próprio ou provedor contratado. As farmácias listadas não garantem horário de funcionamento, estoque ou cobertura completa da região.

Dados atribuídos a **© colaboradores do OpenStreetMap**, com link para a licença ODbL. O mapa base é fornecido pelo provedor nativo, mantendo sua atribuição própria; não são baixados tiles públicos do OSM.

Fontes consultadas:

- https://docs.expo.dev/versions/latest/sdk/map-view/
- https://docs.expo.dev/versions/latest/sdk/location/
- https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances
- https://www.openstreetmap.org/copyright

## Testar no iPhone

1. Use Expo Go compatível com SDK 58 e instale as dependências em `front` com `npm install`.
2. Inicie a API e mantenha a configuração de rede existente do login acessível pelo telefone.
3. Em `front`, execute `npx expo start`; computador e telefone devem conseguir se comunicar na rede.
4. Leia o QR code com a câmera do iPhone e abra no Expo Go.
5. Faça login, abra Perfil → Farmácias Próximas e solicite a busca.
6. Permita a localização durante o uso. No Expo Go, a permissão pertence ao aplicativo Expo Go; o texto personalizado de `app.json` se aplica ao build próprio.
7. Confira mapa, posição, lista real, filtros, seleção e destino no Apple Maps.
8. Negue a permissão nas configurações e teste novamente. Teste também GPS desativado, modo avião, retorno à tela e logout.

O mesmo roteiro vale para Android, conferindo o destino no Google Maps. Nenhuma chave é exigida para esta demonstração no Expo Go ou para Overpass. Um APK/build próprio Android com mapa Google exige configuração de chave Maps SDK for Android, com restrições por aplicativo/certificado e revisão dos requisitos do Google; essa configuração não foi adicionada.

## Validação

- Passaram: `node tests/farmacias.cjs`, `node tests/auth-session.cjs`, `node tests/local-session.cjs`, `node tests/sync-recovery.cjs`.
- Passaram: TypeScript (`tsc --noEmit`, após regenerar tipos do Expo Router) e ESLint nos novos arquivos da funcionalidade.
- Metro iniciou em modo offline na porta 8083 e gerou os tipos da nova rota; o processo de verificação foi encerrado depois.
- `expo-doctor`: 19/20 verificações aprovadas. Dependências preexistentes desatualizadas: expo, expo-constants, expo-linking, expo-notifications, expo-router, expo-splash-screen e react-native-safe-area-context. Não foi feita atualização geral para evitar ampliar o escopo.
- Consulta externa com coordenadas públicas fixas do centro de Fortaleza: o endpoint principal respondeu 406 e, com identificação do app, 502 por capacidade esgotada. Uma instância alternativa testada excedeu 30 segundos; não foi incluída como fallback. Portanto, a chegada de resultados reais não foi validada neste ambiente.
- Testes de GPS real, permissão do sistema, renderização nativa e abertura efetiva de aplicativos de mapas precisam ser executados no telefone; testes automatizados dos serviços não substituem essa verificação.

Nenhuma entidade, tabela, dado do PostgreSQL ou código do backend foi alterado por esta funcionalidade. Alterações que já estavam no repositório foram preservadas. Não foram feitos commit, push ou troca de branch.
