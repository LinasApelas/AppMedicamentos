# Geoapify integrada — 21/11/2026

Substitui o estado de preparação descrito em GEOAPIFY-AVALIACAO.md.

## Resultado

Geoapify Places é a fonte principal. Categoria:
commercial.health_and_beauty.pharmacy. Consulta pela posição atual do GPS,
filter=circle:longitude,latitude,metros e bias=proximity:longitude,latitude.
Raios 2/5/10 km; distância recalculada localmente, ordenação e deduplicação por
place_id. IDs geoapify:place_id identificam a fonte. Nome/endereço ausentes são
informados, não inventados. Lista e mapa recebem o mesmo conjunto de Farmacia.

O usuário confirmou uma consulta HTTP com 10 farmácias reais em Fortaleza,
incluindo Drogasil, Extrafarma e Pague Menos. Nesta execução, o script local foi
invocado, mas a chave não estava acessível: nenhuma consulta real adicional foi
enviada. Não confundimos o resultado informado pelo usuário com teste do agente.
Não existe localização de Fortaleza fixada no aplicativo.

## Políticas implementadas

- Timeout total Geoapify de 15 s, incluindo leitura JSON e paginação.
- Páginas sequenciais de 100 resultados, até cinco páginas. Se todas forem cheias,
  pede raio menor; não salva círculo truncado. O limite limita consumo, não garante
  que todas as farmácias de uma área densa possam ser exibidas de uma vez.
- Bloqueio de requisições simultâneas, intervalo de 15 s entre buscas de rede.
- Rede/timeout/5xx/408/JSON inválido podem usar Overpass, com limite próprio de
  25 s. Espera total pode chegar a aproximadamente 40 s. Cancelar interrompe ambos.
- 401/403 informa configuração; 429 respeita Retry-After e pausa mínima de 30 s.
  Esses erros não acionam Overpass para ocultar chave inválida ou contornar quota.
  Resposta vazia válida não aciona fallback.
- Cache SQLite preservado, 5 min fresco e até 24 h para recuperação com aviso.
  Nova chave geoapify-overpass-v2 evita que cache legado aparente validação Geoapify.
  Banco de medicamentos intocado. Sem login/backend para buscar ou ler cache.
- Atribuição Powered by Geoapify com link, OpenStreetMap/ODbL e fonte dos registros
  junto ao mapa, inclusive para registros em cache. Sem busca externa Google Maps.
- Nenhum log de chave, URL de consulta ou coordenadas precisas.

## Iniciar no PowerShell

Na pasta front, se GEOAPIFY_API_KEY já estiver definida no mesmo terminal:

```powershell
Set-Location 'C:\Users\junio\Documents\AppMedicamentos\AppMedicamentos\front'
$env:EXPO_PUBLIC_GEOAPIFY_API_KEY = $env:GEOAPIFY_API_KEY
node scripts/testar-geoapify.cjs
if ($LASTEXITCODE -eq 0) { npx expo start --go --lan --clear }
```

Se a chave não estiver no ambiente, digite-a sem exibi-la nem inseri-la literalmente
no histórico de comandos:

```powershell
Set-Location 'C:\Users\junio\Documents\AppMedicamentos\AppMedicamentos\front'
$env:EXPO_PUBLIC_GEOAPIFY_API_KEY = [System.Net.NetworkCredential]::new('', (Read-Host 'Chave Geoapify' -AsSecureString)).Password
node scripts/testar-geoapify.cjs
if ($LASTEXITCODE -eq 0) { npx expo start --go --lan --clear }
```

Alternativa: preencher EXPO_PUBLIC_GEOAPIFY_API_KEY em front/.env.local (ignorado
pelo Git), preservando outras variáveis. O script lê .env.local; Expo também.
GEOAPIFY_API_KEY sozinha não é incluída no app: é necessário EXPO_PUBLIC_ para
Metro. Reiniciar Metro após configurar. Abra o QR novo e deixe esse terminal aberto.
Se houver vários Metros, use o QR da instância iniciada nesse terminal.

## Segurança e distribuição

Integração direta destinada a testes de desenvolvimento. EXPO_PUBLIC_ é pública
no bundle, APK e ferramentas de rede; não constitui segredo mesmo fora do Git.
Não distribuir o preview/APK com chave pessoal. A configuração eas.json existente
não foi alterada. Para versão distribuída, usar proxy que guarde a credencial,
valide categoria/raio, limite requisições e faça cache. O proxy pode atender
visitantes sem exigir conta, mas precisa de proteção contra abuso. Não foi criado
proxy nem alterado Spring Boot/PostgreSQL.

Usar chave separada, acompanhar consumo e revogar em caso de abuso. Restrições web
de origem/referrer/CORS não protegem uma chave dentro de um cliente nativo. Plano
gratuito documentado: 3.000 créditos/dia; Places cobra por blocos de 20 resultados.
Páginas maiores consomem mais créditos. Respeitar também a quota agregada de todos
os aparelhos no projeto. Não foi contratada assinatura.

## Teste físico obrigatório — Android e iPhone

Validação automatizada executada: TypeScript sem emissão e ESLint completos
aprovados; 26 testes frontend aprovados, zero falhas. Incluem consulta simulada,
paginação, normalização, raios, fallback, autenticação/quota, cancelamento, timeout,
cache, marcadores/seleção e regressões existentes. Não substituem entrega real
dos dados Geoapify nem renderização em aparelhos físicos.

1. Abrir Expo Go pelo QR atual. Em Sobre a busca, conferir Geoapify 21/11.
2. Permitir localização e buscar 2 km. Conferir Fonte: Geoapify, nomes reais e
   mesmos estabelecimentos na lista e marcadores. Não comparar quantidades de
   cidades/coordenadas diferentes com as 10 farmácias do teste em Fortaleza.
3. Selecionar cartão e marcador, conferir centralização, endereço e distância.
4. Repetir 5/10 km respeitando intervalo. Conferir ausência de itens fora do raio.
5. Sair/voltar e reabrir; conferir cache. Após 5 min, testar sem internet com cache
   prévio e conferir aviso antigo. Sem cache, esperar erro, não falso resultado vazio.
6. Negar localização, sair durante busca e tentar novamente. Validar fonte Overpass
   quando houver fallback. Não provocar carga deliberada para testar quota real.
7. Repetir como visitante, sem login. Nenhuma função exige autenticação do SyncMed.

## Arquivos desta integração

- front/src/services/geoapifyFarmacias.ts (novo)
- front/src/services/cacheFarmacias.ts
- front/src/services/consultaFarmacias.ts
- front/src/app/(tabs)/Farmacias.tsx
- front/.env.geoapify.example (sem chave)
- front/tests/geoapify-integracao.cjs (novo)
- este relatório

Fontes oficiais:
https://apidocs.geoapify.com/docs/places/
https://www.geoapify.com/pricing/
https://myprojects.geoapify.com/help/api-keys/
