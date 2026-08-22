# Database Setup

Este diretório contém o registo das **lojas reais** do projecto.

> ⚠️ **Sem dados mocados**: produtos e preços são obtidos exclusivamente pelo
> pipeline de scraping. Nada é inventado aqui.

## Conteúdo

- **seed-database.js** — Regista as lojas reais (NCR, Buitanda, MultiTek, iTec)
  e os seus sites oficiais em `Link_Loja`.
- **create-admin.js** — Cria um utilizador administrador.
- `product_table.sql`, `store_product_table.sql`, `user_table.sql` — Referência
  do schema (o schema real é validado automaticamente pelo `initDatabase.js` no
  arranque do servidor).

## Como Usar

```bash
npm run seed
```

O comando:

1. Insere as 4 lojas reais com código único (`ncr`, `buitanda`, `multitek`, `itec`)
2. Regista os links oficiais das lojas

## De onde vêm os produtos?

O scheduler arranca automaticamente com o servidor (`npm run dev` / `npm start`)
e executa o pipeline diariamente às 03:00. Também pode ser disparado
manualmente/por cron externo:

```bash
# Disparo assíncrono (requer token de admin)
curl -X POST http://localhost:3000/api/v1/admin/scraping/run \
     -H "Authorization: Bearer $TOKEN"

# Estado da execução
curl http://localhost:3000/api/v1/admin/scraping/status \
     -H "Authorization: Bearer $TOKEN"
```
