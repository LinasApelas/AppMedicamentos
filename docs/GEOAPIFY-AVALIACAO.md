# Geoapify Places — avaliação de 21/11/2026

## Estado

Documentação oficial consultada. Não há chave Geoapify no ambiente nem nos arquivos
.env encontrados na raiz/front. O script de teste foi executado e parou antes da
rede por falta da chave. **Nenhuma consulta real à Geoapify foi realizada.**
O aplicativo continua com a implementação anterior: nenhuma troca de fonte,
mudança no mapa, cache, alarmes, notificações, modo visitante ou backend.

Validação executada: TypeScript e ESLint completos aprovados; 21 testes frontend
aprovados, zero falhas. Os testes novos usam fixtures e verificam parâmetros,
ausência de chave sem requisição, resposta vazia, erros HTTP e omissão da chave
nos diagnósticos. Não comprovam acesso ou qualidade dos dados reais da Geoapify.

Preparados front/.env.geoapify.example, scripts/testar-geoapify.cjs e
tests/geoapify-probe.cjs. O script é uma prova isolada, não a integração do aplicativo.
Não importa dados de demonstração nem envia fixtures para a rede. Sem commit/push.

## Obter e configurar a chave

1. Acesse https://myprojects.geoapify.com/ e crie sua conta.
2. Crie um projeto SyncMed-testes e abra API Keys; o painel cria a primeira chave.
3. Escolha o plano gratuito para avaliação e acompanhe créditos/uso no painel.
4. No arquivo front/.env.local, acrescente a linha abaixo com sua chave real:

   GEOAPIFY_API_KEY=

   Preencha depois do sinal de igual. Não cole a chave no chat, no código-fonte ou
   no arquivo de exemplo. Se .env.local já existir, preserve as outras variáveis.
   O Git ignora .env.local; isso foi verificado. Não use git add -f nesse arquivo.
5. Em um terminal PowerShell, execute:

   Set-Location 'C:\Users\junio\Documents\AppMedicamentos\AppMedicamentos\front'
   node scripts/testar-geoapify.cjs

Sem argumentos, o teste consulta uma região pública de Fortaleza, raio 2000 m.
Não usa essa cidade como localização do usuário no app. Opcionalmente:
node scripts/testar-geoapify.cjs LATITUDE LONGITUDE RAIO_EM_METROS
Use ponto decimal e valores reais; não compartilhe coordenadas pessoais nos logs.

O teste faz uma única consulta limitada a 20 resultados, com timeout de 15 s e sem
retry automático. Não imprime URL, chave, coordenadas nem corpo bruto dos erros.
Saída: status, quantidade de registros válidos, até três nomes e duração. Uma
resposta vazia não aprova a integração. Se chegar ao limite de 20, a amostra pode
estar truncada; não significa que só existem 20 farmácias na área.

## Requisição documentada

GET https://api.geoapify.com/v2/places
- categories=commercial.health_and_beauty.pharmacy
- filter=circle:LONGITUDE,LATITUDE,RAIO_EM_METROS
- bias=proximity:LONGITUDE,LATITUDE
- limit=20
- apiKey obtida da variável de ambiente

O filtro limita a área; bias apenas ordena por proximidade. A categoria pedida é
válida. Esta avaliação usa essa categoria exata, corrigindo a sugestão genérica
healthcare.pharmacy no relatório anterior. O teste verifica FeatureCollection,
geometria Point, coordenadas válidas, place_id e categoria no registro.

## Integração após resposta real aprovada

Manter react-native-maps e os componentes atuais; não instalar MapLibre nem trocar
o mapa-base. A API de estabelecimentos usa HTTP/GeoJSON e não exige biblioteca
nativa nova. Normalizar para Farmacia:
- id: prefixo geoapify: mais properties.place_id;
- nome: properties.name, com indicação honesta se ausente;
- endereco: properties.formatted ou campos de endereço disponíveis;
- longitude/latitude: geometry.coordinates[0]/[1];
- distancia: cálculo local em metros, filtrado novamente pelo raio solicitado.

Deduplicar por place_id, manter ordenação, seleção e cancelamento. Planejar paginação
limitada usando limit/offset; não salvar amostra truncada como cobertura completa
do círculo no cache. Identificar a fonte no cache/chave de versão para não misturar
Overpass e Geoapify como se a nova fonte tivesse sido validada. Preservar TTL de
5 min e recuperação de até 24 h com aviso. Geoapify documenta permissão de cache
dos resultados Places; preservar licença/atribuição dos dados.

Geoapify será principal somente após consulta real satisfatória. 401/403 devem
indicar configuração/acesso; 429 deve respeitar Retry-After e quota, sem contornar
limites. Erros não equivalem a resultado vazio. Atribuição visível junto ao mapa
e lista: link Powered by Geoapify e © OpenStreetMap contributors, inclusive cache.
Não exibir atribuição de uma fonte que ainda não está em uso na tela atual.

## Chave pública, limites e segurança

GEOAPIFY_API_KEY é usada apenas pelo script Node. Se for escolhida integração
direta no Expo, a configuração será EXPO_PUBLIC_GEOAPIFY_API_KEY. Variáveis com
esse prefixo são incorporadas ao bundle/APK e podem ser extraídas; .env.local fora
do Git não torna a chave secreta no aplicativo. Apenas configurar essa variável
agora NÃO ativa Geoapify; a integração ainda está condicionada ao teste real.

A documentação da Geoapify para React Native informa que restrições por IP,
referrer, origin e CORS não se aplicam como proteção de apps nativos. Não prometer
restrição por pacote Android ou bundle iOS sem suporte confirmado do provedor.
Para protótipo, usar chave separada, acompanhar utilização e quotas e revogar em
caso de abuso. Chaves de um mesmo projeto compartilham quota. Para produção com
proteção de credencial, proxy próprio com segredo no servidor, cache, limitação
de requisições e validação de raio; pode atender visitantes sem login, mas precisa
de proteção contra abuso. Não foi criado proxy nem alterado Spring Boot.

Plano Free consultado: 3000 créditos/dia; Places custa 1 crédito por 20 resultados.
Não confundir créditos com consultas. Paginação e limite maior consomem mais;
acompanhar painel e política vigente. Atribuição Geoapify é obrigatória no plano
gratuito, além da fonte OSM. Nenhum plano pago contratado.

## Segunda opção

NextGIS oferece Overpass por conta/chave pessoal. Vantagem: reutiliza consulta e
normalização Overpass existentes. Limitações: outra dependência de operador/rede,
chave/quotas/termos a verificar e mesma discussão de segredo em app nativo.
Não há evidência de superioridade de disponibilidade sem uma consulta real; não
foi integrada ou testada. Não criar conta nem inventar uma chave.

## Roteiro Android/iPhone após integração

1. Validar consulta real no script e guardar apenas resumo sem chave/coordenadas.
2. Integrar/normalizar resultados e atribuição; executar regressões automatizadas.
3. Reiniciar Metro com cache limpo e abrir QR atual em ambos os aparelhos.
4. Autorizar localização; buscar 2/5/10 km; conferir farmácias reais da região,
   nomes, endereços, distâncias, lista e mesmos marcadores. Tocar em ambos.
5. Testar visitante sem login; fechar/reabrir; cache com aviso e rede desligada.
6. Testar permissão negada, cancelamento, 429 e indisponibilidade sem falso vazio.

Não declarar resolvido até consulta real, integração e testes físicos concluídos.

Fontes oficiais:
- https://apidocs.geoapify.com/docs/places/
- https://myprojects.geoapify.com/help/api-keys/
- https://www.geoapify.com/pricing/
- https://www.geoapify.com/tutorial/maplibre-react-native-geoapify-map-tiles/
- https://nextgis.com/blog/nextgis-overpass-api-server/
