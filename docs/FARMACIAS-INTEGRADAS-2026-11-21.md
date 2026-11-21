# Farmácias integradas — revisão de 21/11/2026

## Resultado e evidência

A interface e a recuperação por cache foram corrigidas, mas **não há confirmação
de disponibilidade estável da fonte nem de resultados reais nos aparelhos**.
Consulta real POST aos dois endpoints interpreter, com amenity=pharmacy ou
healthcare=pharmacy, raio 2 km em uma região pública de Fortaleza:

- Private.coffee: timeout em 11.052 ms.
- overpass-api.de: timeout em 11.004 ms.

Não houve resposta com estabelecimentos nesta execução. Não foram injetados dados
de Fortaleza no aplicativo nem usados resultados fictícios. Coordenadas precisas
não são registradas em logs. A rede/provedor ainda não foi isolada como causa de
cada timeout; os HTTP 502/429/406 das revisões anteriores já demonstraram também
sobrecarga e limitação externas. Não há evidência de que o problema seja exclusivo
do Android, dos marcadores ou do filtro de raio.

## Mudanças

- Removidos botão, mensagens e funções de busca externa Google Maps.
- Tocar no cartão seleciona a farmácia no mapa e retorna ao topo. Selecionar um
  marcador destaca o cartão correspondente. Uma ação separada de rota para o
  estabelecimento selecionado foi preservada; ela não executa busca de farmácias.
- Mapa nativo/GPS/abas preservados. Lista e marcadores recebem os mesmos resultados.
- Mantida a consulta Overpass POST form-urlencoded, dois operadores independentes,
  fallback sequencial por falha, timeout de 11 s por servidor e 25 s global.
- 406/429 interrompem a consulta: pausa mínima de 30 s, respeitando Retry-After
  maior, sem tentar contornar o limite no segundo servidor. Contagem restante
  exibida ao tentar novamente. Cancelamento não vira resultado vazio.
- Cache persistente separado: syncmed-farmacias-cache.db, no máximo seis respostas.
  Respostas de até 5 min são reutilizadas. Em falha, resultados positivos com menos
  de 24 h podem ser exibidos com data, aviso de desatualização e motivo da falha.
  Após esse prazo não são usados. Registros vencidos são filtrados em memória e
  descartados do conjunto gravado na próxima resposta bem-sucedida.
- Reutilização somente quando o círculo salvo cobre todo o novo círculo. Distância
  recalculada pela posição atual e filtro de raio aplicado novamente. Sem aproveitar
  outra cidade ou apresentar cache de raio menor como consulta completa de raio maior.
- Cache vazio antigo não prova ausência quando o servidor falha. O cache exige
  uma consulta bem-sucedida anterior; não resolve a primeira busca sem conexão.
- Deduplicação por identificador OSM, ordenação por distância e descarte de
  coordenadas inválidas preservados. Objetos OSM diferentes representando o mesmo
  comércio ainda podem exigir correção na fonte; não fundimos filiais pelo nome.
- Cache e controle de consultas permanecem ao sair/voltar da aba. A tela informa
  que resultados e região consultada são armazenados no aparelho. Nenhuma leitura
  ou alteração no SQLite de medicamentos.

Erros de GPS/permissão, conexão, HTTP de indisponibilidade, limite e resultado vazio
permanecem distintos. Uma falha fetch não prova sozinha ausência de internet: pode
ser DNS, rede ou provedor; a mensagem não afirma inexistência de farmácias.
Cache de estabelecimentos não transforma os mapas-base em mapas offline.

## Fontes e alternativa viável

Fonte ativa: OpenStreetMap via Private.coffee e overpass-api.de, com atribuição
ODbL mantida. Não há garantia de disponibilidade nos endpoints públicos gratuitos.
Adicionar kumi.systems não cria redundância: é o mesmo operador Private.coffee.
VK Maps já falhou anteriormente; não foi acrescentado como suposta solução.

Alternativa de menor mudança: uma conta/chave NextGIS Overpass, com consulta e
normalização atuais, validar uma consulta real e só então promovê-la a principal.
O operador oferece acesso por conta e chave pessoal. Não foi criada conta nem
obtida chave, portanto essa alternativa não foi integrada nem testada.
Uma chave pessoal não deve ser tratada como segredo protegido dentro de um app
mobile. Sua distribuição/restrições precisam ser avaliadas antes da integração.

Outra opção: Geoapify Places, com consulta por categoria healthcare.pharmacy,
filtro circular e resposta GeoJSON. Exige chave, adaptação, atribuição, limites e
validação. O plano gratuito anuncia 3.000 créditos/dia (não necessariamente 3.000
buscas: custo cresce com resultados). Não foi integrado ou contratado.
Para disponibilidade controlada sem dependência de consultas públicas, hospedar
uma instância própria ou índice geográfico de extratos OSM é viável, mas exige
infraestrutura, atualizações e custos operacionais fora deste frontend.

Referências consultadas:
- https://wiki.openstreetmap.org/wiki/Overpass_API
- https://nextgis.com/blog/nextgis-overpass-api-server/
- https://apidocs.geoapify.com/docs/places/
- https://www.geoapify.com/pricing/

## Testes e aparelhos

TypeScript sem emissão e ESLint completos aprovados. **19 testes frontend
aprovados, zero falhas.** Cobertura de 406/429/502/503/504, Retry-After, fallback,
timeouts, cancelamento, concorrência, duplicação por ID, normalização, raios,
permissões, resultado vazio e cache. Teste do cache usa SQLite temporário real,
fecha/reabre o arquivo e verifica validade, região, falha e vazio antigo.
Teste de componentes verifica coordenadas/nomes dos marcadores e callbacks de
seleção; mocks de Android/iOS não comprovam renderização nativa em aparelho.

Em Android e iPhone:
1. Iniciar em front: npx expo start --go --lan --clear; abrir QR atual na mesma rede.
2. Fechar/reabrir Expo Go; conferir Sobre a busca, revisão 21/11, sem busca externa.
3. Permitir localização. Buscar 2 km e conferir nomes reais na lista e marcadores.
4. Tocar no cartão: permanecer no app e centralizar o mapa. Tocar no marcador:
   destacar a farmácia correspondente. Alterar raio e conferir distância.
5. Após uma resposta bem-sucedida, sair/voltar e reabrir: conferir aviso de cache.
   Após 5 min, sem conexão, conferir cache antigo com aviso; sem cache, esperar erro.
6. Negar localização, cancelar saindo da aba e tentar novamente respeitando pausa.
7. Se falhar, repetir em rede independente. Registrar mensagem/horário/revisão,
   sem compartilhar coordenadas precisas. Não desinstalar para limpar cache:
   isso poderia remover também medicamentos locais.

## Arquivos desta execução

- front/src/services/farmacias.ts
- front/src/services/rotasFarmacias.ts
- front/src/services/cacheFarmacias.ts (novo)
- front/src/services/consultaFarmacias.ts (novo)
- front/src/app/(tabs)/Farmacias.tsx
- front/src/components/farmacias/ItemFarmacia.tsx
- front/tests/farmacias.cjs
- front/tests/farmacias-cache.cjs (novo)
- este relatório

Correções anteriores de alarmes/notificações e eas.json preservados. Sem mudanças
no backend/PostgreSQL, commit, push, troca de branch ou inclusão de target/.
