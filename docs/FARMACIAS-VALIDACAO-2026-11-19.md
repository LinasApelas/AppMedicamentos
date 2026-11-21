# Farmácias — Android e iOS, 19/11/2026

## Diagnóstico real

Consultas POST form-urlencoded ao endpoint interpreter, com a consulta usada pelo
app: nwr amenity=pharmacy ou healthcare=pharmacy, centro público de Fortaleza
(-3.7319, -38.5267), raio 2 km, timeout Overpass 8 s e HTTP 11 s.

| Provedor | Resultado nesta rodada |
| --- | --- |
| overpass-api.de | HTTP 502 em 1,5 s; resposta informa trabalhadores ocupados e fila cheia |
| Private.coffee | HTTP 200 em 6,1 s, 32 elementos; exemplos: Extrafarma 482168663 e Pague Menos 482168667 |
| VK Maps (maps.mail.ru) | HTTP 504 em 2,1 s |

Uma segunda consulta usando diretamente o serviço TypeScript atualizado, incluindo
normalização, expirou nos dois servidores. Não houve validação física em celular.
O resultado de 32 elementos é da primeira resposta real do provedor, não comprova
32 marcadores renderizados no app. A disponibilidade continua intermitente.
O 502 confirma sobrecarga no servidor principal; a causa dos demais timeouts não
foi isolada entre rede e provedor. O problema é compartilhado pelos dois sistemas.

## Alterações restritas a farmácias

- Private.coffee primeiro, overpass-api.de como fallback sequencial. O último
  servidor que respondeu corretamente ganha prioridade na próxima consulta da
  instância da tela. Sem novo servidor cuja consulta falhou ser incluído.
- Preservados timeout individual 11 s, limite global 25 s, cache 5 min,
  cancelamento, pausa 406/429 e bloqueio de requisições simultâneas.
- Pausa de 30 s também após esgotar as tentativas, evitando insistência imediata.
- Erro de rede não é convertido em lista vazia. Somente resposta válida com
  elements vazio significa que não há farmácias mapeadas no raio.
- Google Maps disponível durante espera, erro ou resultado vazio, inclusive sem
  localização autorizada; cancela a busca integrada ao abrir. URL HTTPS universal
  com query codificada, sem chave. Sem coordenadas, pesquisa “perto de mim”.
  O raio do SyncMed não limita os resultados externos. Falha ao abrir gera aviso.
- Mapa, localização e componentes de marcadores preservados.

Arquivos: front/src/services/farmacias.ts, front/src/services/rotasFarmacias.ts,
front/src/app/(tabs)/Farmacias.tsx e front/tests/farmacias.cjs.

## Alternativas e limites

Private.coffee permite uso público sem cadastro; kumi.systems é o mesmo operador,
não redundância independente. VK Maps é público, mas retornou 504 neste teste e
não foi incorporado. Instâncias regionais que não cobrem Brasil não servem.
Google Maps URLs não exige API paga/chave e abre app ou navegador, mas não fornece
dados para preencher o mapa interno. Nenhum serviço público gratuito garante
disponibilidade. Hospedagem própria/infraestrutura de dados exigiria outro escopo;
backend e PostgreSQL não foram modificados.

Referências consultadas:
- https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances
- https://overpass.private.coffee/
- https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
- https://developers.google.com/maps/documentation/urls/get-started

## Validação

TypeScript sem emissão e ESLint completos: aprovados. Suíte frontend: 14 testes
aprovados, zero falhas. Cobertura ampliada para HTTP 502/504, preferência pelo
servidor bem-sucedido, indisponibilidade total com pausa, resposta vazia válida,
URLs Google Maps em iOS/Android/web com e sem coordenadas e erro de abertura.
Mantidos testes de timeout, cancelamento, JSON inválido, resposta parcial e raio.

Nos dois aparelhos, ainda verificar:
1. Reabrir o projeto atualizado, autorizar localização e buscar em 2 km.
2. Confirmar nomes reais, marcadores e lista; mudar o raio e conferir distâncias.
3. Durante espera/erro, abrir Google Maps; conferir pesquisa próxima do local.
4. No iPhone sem Google Maps instalado, confirmar abertura no Safari; no Android,
   testar o app instalado e, se disponível, o fluxo pelo navegador.
5. Sem internet, conferir erro e ausência de falsa mensagem “nenhuma farmácia”.
6. Negar localização e testar busca externa; repetir busca integrada em rede
   independente do hotspot para ajudar a isolar falhas de conectividade.

Não considerar resolvido até farmácias reais aparecerem em ambos os aparelhos.
Sem commit, push, troca de branch ou alterações em outras funcionalidades.
