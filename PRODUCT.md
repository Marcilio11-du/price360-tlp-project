# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Consumidores em Angola (grande maioria em Luanda) que querem saber onde um
produto está mais barato **antes** de sair de casa ou fechar a compra.
Situação típica: precisa de um produto, pesquisa o nome no Xé Preço, compara
preços reais entre lojas e segue o link direto para a loja mais barata.

## Product Purpose

Comparador de preços multi-loja em tempo real para o mercado angolano.
Existe para promover poupança e transparência de mercado: tornar visível a
dispersão de preços entre superfícies comerciais. Sucesso = o utilizador toma
uma decisão de compra informada em segundos e poupa dinheiro na compra real.

## Positioning

Ainda não existe uma vantagem única confirmada (assumido pelo próprio autor).
A proposta actual é a **combinação**: preços reais recolhidos automaticamente
das lojas locais + deep-links diretos para a página do produto na loja +
foco Angola de ponta a ponta (Kz, lojas de Luanda, produtos locais).
Decisão aberta: encontrar/fortalecer o diferencial único.

## Operating Context

- Dados obtidos por **scraping automático** das lojas (pipeline agendado,
  incl. execução diária às 03:00 e bootstrap quando o catálogo está vazio).
- Lojas activas no pipeline: NCR Angola e Buitanda (com produtos). MultiTek e
  iTec estão configuradas mas bloqueadas por Cloudflare a partir desta rede —
  podem funcionar de IP angolano.
- Preços em Kwanza (AOA, formato pt-AO). Copy em português.
- Projeto desenvolvido por estudantes (curso técnico); ambiente de execução
  actual é local (`npm run dev`).

## Capabilities and Constraints

- Pesquisa global com sugestões ao vivo; listagem/filtros por categoria;
  página de detalhe com ofertas por loja e deep-link "Ver na loja";
  listas de compras com optimização por loja; alertas de preço;
  autenticação com verificação de email; dashboard de administração com
  controlo manual do scraping.
- Constraint técnica: scraping depende da estrutura/bloqueios de cada loja;
  disponibilidade de dados varia (produtos/ofertas oscilam entre execuções).
- Sem app nativa; web responsivo apenas.
- Indecidido: modelo de negócio, contas de loja parceira, área de cobertura
  para além de Luanda.

## Brand Commitments

Nenhum compromisso declarado como vinculativo. O nome "Xé Preço", o monograma
"X" e a paleta azul/laranja estão em uso mas podem mudar.

## Evidence on Hand

- Catálogo real: ≈454 produtos e 4 lojas configuradas na base de dados local
  (`price360_db`); os números variam com o scraping — nunca apresentar como
  fixos nem inflacionar.
- Screenshots/demonstrações locais; sem testemunhos, utilizadores reais,
  press ou métricas de adopção — **não fabricar** nenhum destes.

## Product Principles

1. **Preço verdadeiro acima de tudo** — só dados reais das lojas; qualquer
   número inventado ou decorativo é falha grave.
2. **Da dúvida à decisão em segundos** — pesquisa → comparação → loja com o
   mínimo de atrito possível.
3. **Confiança por transparência** — mostrar sempre loja, preço actual e
   proveniência dos dados; admitir indisponibilidade em vez de disfarçar.
4. **Angola primeiro** — moeda, lojas, produtos e linguagem do mercado local
   antes de generalizações internacionais.
5. **A poupança é a métrica** — cada funcionalidade deve ajudar o utilizador
   a gastar menos (ou a decidir mais depressa).
