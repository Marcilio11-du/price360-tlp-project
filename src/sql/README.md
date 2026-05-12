# Database Seed Scripts

Este diretório contém scripts para popular a base de dados com dados de teste para o projeto Price360.

## Conteúdo

- **seed-data.sql** — Ficheiro SQL com inserts de dados (categorias, lojas, produtos, preços)
- **seed-database.js** — Script Node.js que executa o seed automáticamente

## Como Usar

### Opção 1: Usar o Script Node.js (Recomendado)

```bash
npm run seed
```

Este comando irá:
1. Inserir 5 categorias (Mercearia, Frutos e Vegetais, Telemóveis, Laptops, Bebidas)
2. Inserir 5 lojas (Kero, Shoprite, Zap, Eka Market, Bom Preço)
3. Inserir 12 produtos de diferentes categorias
4. Inserir 36 preços (produto_loja) — cada produto está disponível em 2-3 lojas com preços diferentes
5. Inserir contactos (telefones e links) das lojas

### Opção 2: Executar o SQL Diretamente

```bash
mysql -u root -p price360_db < src/sql/seed-data.sql
```

## Dados Inseridos

### Categorias (5)
- Mercearia
- Frutos e Vegetais
- Telemóveis
- Laptops
- Bebidas

### Lojas (5)
- **Kero** — +244 222 123 456 — https://kero.ao
- **Shoprite** — +244 923 456 789 — https://shoprite.ao
- **Zap** — +244 912 345 678 — https://zap.ao
- **Eka Market** — +244 921 654 321 — https://ekamarket.ao
- **Bom Preço** — +244 930 111 222 — https://bompreco.ao

### Produtos (12)

#### Mercearia (4 produtos)
1. **Arroz Tipo A - 5kg** — Disponível em Kero (4500 Kz), Shoprite (4700 Kz), Zap (4650 Kz)
2. **Feijão Preto - 1kg** — Disponível em Kero (1200 Kz), Shoprite (1250 Kz), Eka Market (1150 Kz)
3. **Óleo de Palma - 1L** — Disponível em Kero (800 Kz), Bom Preço (750 Kz), Zap (820 Kz)
4. **Açúcar - 1kg** — Disponível em Kero (600 Kz), Shoprite (650 Kz), Bom Preço (580 Kz)
5. **Sal Fino - 500g** — Disponível em Kero (200 Kz), Eka Market (180 Kz), Bom Preço (210 Kz)

#### Frutos e Vegetais (2 produtos)
6. **Banana - Kg** — Disponível em Kero (300 Kz), Shoprite (320 Kz), Eka Market (310 Kz)
7. **Alface - Unidade** — Disponível em Kero (350 Kz), Zap (360 Kz), Bom Preço (340 Kz)

#### Telemóveis (2 produtos)
8. **Samsung Galaxy A12 - 64GB** — Disponível em Shoprite (95000 Kz), Zap (97500 Kz), Eka Market (94000 Kz)
9. **iPhone 12 - 128GB** — Disponível em Shoprite (450000 Kz), Kero (455000 Kz), Bom Preço (445000 Kz)

#### Laptops (1 produto)
10. **Lenovo IdeaPad 3 - 15.6"** — Disponível em Zap (650000 Kz), Shoprite (675000 Kz), Kero (660000 Kz)

#### Bebidas (2 produtos)
11. **Coca-Cola - 2L** — Disponível em Kero (1500 Kz), Shoprite (1550 Kz), Bom Preço (1450 Kz)
12. **Água Mineral - 1.5L** — Disponível em Kero (250 Kz), Zap (260 Kz), Eka Market (240 Kz)

## Comportamento INSERT IGNORE

O script usa `INSERT IGNORE` para evitar erros se os dados já existem. Isso significa que:
- Executar o seed múltiplas vezes não irá duplicar dados
- Dados já existentes serão ignorados silenciosamente

## Totais Após Seed

- 5 Categorias
- 5 Lojas
- 12 Produtos
- 36 Preços (Produto_Loja)
- 5 Telefones de Lojas
- 5 Links de Lojas

## Testes Sugeridos

Agora que a BD tem dados, podes testar:

1. **Comparação de Preços** — Procura "Arroz" e vê os preços em diferentes lojas
2. **Pesquisa Geral** — Usa a barra de pesquisa para encontrar produtos
3. **Filtro por Categoria** — Clica em categorias na home para filtrar
4. **Navegação de Produtos** — Vai para `/produtos` para ver todos

## Troubleshooting

Se vires erros de conexão:

```bash
# Verifica se o servidor está a correr
npm start

# Numa outra janela, executa o seed
npm run seed
```

Se vires erros de schema/tabelas:

```bash
# O script tira proveito de `initDatabase.js` que é executado automaticamente
# Se há problemas, podes recriar as tabelas parando o servidor e deletando a BD:
# (cuidado: isto apaga tudo)
```
