# Price360 - Sistema de Comparação de Preços 

O **Price360** é uma plataforma desenvolvida para ajudar os consumidores em Angola a comparar preços de produtos básicos em diferentes superfícies comerciais, promovendo a poupança e a transparência de mercado.

## Tecnologias Utilizadas
- **Backend:** Node.js com Express
- **Database:** MySQL
- **Frontend:** Vanilla JavaScript, HTML5 e CSS3 (Arquitetura baseada em Web Components)
- **Gestão:** GitHub Projects & Workflow Semântico

## Estrutura do Projeto
- `src/models`: Abstração da base de dados e Queries SQL.
- `src/controllers`: Lógica de negócio e gestão de respostas HTTP.
- `src/routes`: Definição dos endpoints da API.
- `src/config`: Configurações de infraestrutura e base de dados.

## Como Iniciar
1. Clone o repositório: `git clone [url]`
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env` com as suas credenciais locais do MySQL.
4. Execute o script DDL (disponível na documentação) para criar as tabelas.
5. Inicie o servidor: `npm run dev`

## Workflow de Contribuição
1. Escolha uma **Issue** no Project Board.
2. Realize commits semânticos (ex: `feat:`, `fix:`, `docs:`).
3. Abra um **Pull Request** para a branch `main`.
4. Aguarde o **Code Review** do Project Manager.