# Xé Preço - Sistema de Comparação de Preços

O **Xé Preço** é uma plataforma desenvolvida para ajudar os consumidores em Angola a comparar preços de produtos em diferentes superfícies comerciais, promovendo a poupança e a transparência de mercado. O nome da base de dados continua `price360_db` para evitar que ambientes locais existentes quebrem.

## Tecnologias Utilizadas
- **Backend:** Node.js + Express
- **Database:** MySQL
- **Frontend:** Vanilla JavaScript, HTML5 e CSS3
- **Scraping:** clientes HTTP com retry e fallback local para manter o catálogo funcional

## Estrutura do Projeto
- `src/models`: abstração da base de dados e queries SQL
- `src/controllers`: lógica de negócio e respostas HTTP
- `src/routes`: definição dos endpoints da API
- `src/config`: configuração da base de dados e schema
- `src/scrapers`: integração com lojas reais e fallback local
- `frontend/`: SPA (HTML, CSS e JavaScript do cliente)

## Pré-requisitos
- Node.js 18+ recommended
- MySQL 8+
- Git
- Acesso a uma base MySQL local para o projeto

## Como rodar localmente
1. Clone o repositório.
2. Abra a pasta do projeto.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Crie o ficheiro `.env` a partir do exemplo:
   ```bash
   cp .env.exemple .env
   ```
5. Ajuste as variáveis no `.env` com os dados do teu ambiente local. O mínimo necessário é:
   ```env
   DB_HOST=localhost
   DB_USER=seu_utilizador
   DB_PASS=sua_password
   DB_NAME=price360_db
   DB_PORT=3306
   PORT=3000
   JWT_SECRET=troque_este_valor_por_um_seguro
   ENABLE_SCRAPERS=true
   ```
6. Crie a base de dados MySQL (se ainda não existir):
   ```sql
   CREATE DATABASE price360_db;
   ```
7. Inicialize o schema do projeto com o arranque da API. A app faz a criação das tabelas automaticamente.
8. Inicie o servidor:
   ```bash
   npm run dev
   ```
   ou em produção:
   ```bash
   npm start
   ```
9. A API fica disponível em `http://localhost:3000`.

## Dicas de execução
- Para desenvolver sem agendamentos automáticos de scraping, use:
  ```bash
  ENABLE_SCRAPERS=false npm run dev
  ```
- Para popular e reforçar o catálogo real da NCR no arranque, a aplicação tenta fazer bootstrap automático com dados reais se o catálogo estiver abaixo do limiar mínimo.
- O projeto usa `price360_db` como nome da base por compatibilidade com o ambiente atual.

## Workflow de contribuição
1. Crie uma branch de feature antes de alterar código.
2. Use commits semânticos (`feat:`, `fix:`, `docs:`).
3. Abra um Pull Request para a branch `main`.
4. Faça review antes de fazer merge.

## Observações importantes para o ambiente partilhado
- O ficheiro `.env` é local e não deve ser enviado para o repositório central.
- O projeto foi deixado em modo funcional para execução local e partilhada. Se alguém de um ambiente diferente for usar, deve copiar `.env.exemple` para `.env` e ajustar apenas as credenciais locais.
- A aplicação também tenta manter o catálogo funcional mesmo quando um scraper externo falha, recorrendo a fallback local e a produtos reais da NCR quando disponíveis.
