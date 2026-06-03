# PRICE360 — SISTEMA DE COMPARAÇÃO DE PREÇOS
## Relatório Técnico Detalhado e Compreensível

---

## ÍNDICE
1. [Introdução](#introdução)
2. [Problemática e Motivação](#problemática-e-motivação)
3. [Objetivos e Alcance](#objetivos-e-alcance)
4. [Arquitetura Geral do Sistema](#arquitetura-geral-do-sistema)
5. [Componentes Principais](#componentes-principais)
6. [Banco de Dados](#banco-de-dados)
7. [Backend - API REST](#backend---api-rest)
8. [Frontend - Aplicação Web](#frontend---aplicação-web)
9. [Sistema de Scrapers (Coleta Automática de Preços)](#sistema-de-scrapers)
10. [Fluxo de Dados Completo](#fluxo-de-dados-completo)
11. [Autenticação e Segurança](#autenticação-e-segurança)
12. [Funcionalidades Principais](#funcionalidades-principais)
13. [Tecnologias e Dependências](#tecnologias-e-dependências)
14. [Questões de Defesa (20 perguntas)](#questões-de-defesa)

---

## INTRODUÇÃO

### O que é Price360?

O **Price360** é uma plataforma digital desenvolvida para resolver um problema comum enfrentado pelos consumidores em Angola: a dificuldade em comparar preços de produtos entre diferentes lojas de forma rápida e fácil.

Imagine que você precisa comprar um saco de arroz. Você não sabe qual loja tem o melhor preço. Normalmente, você teria que:
- Visitar cada loja física
- Ligar para cada loja para perguntar o preço
- Procurar em múltiplos sites de venda online

O **Price360 resolve este problema automático e instantaneamente**: em poucos segundos, você vê **todos os preços de um produto em todas as lojas participantes**, permitindo que você tome a melhor decisão de compra.

### Contexto e Importância

Em Angola, o mercado de varejo está fragmentado. Cada loja tem o seu próprio sistema de preços, e não existe uma forma centralizada de comparar preços. Isto cria:

- **Falta de transparência**: Consumidores não sabem se estão pagando o melhor preço
- **Ineficiência de mercado**: Lojas podem manter preços inflacionados porque os consumidores não conseguem comparar facilmente
- **Desperdício de tempo**: Os consumidores precisam gastar tempo visitando várias lojas
- **Perda de oportunidades de poupança**: Pessoas podem estar pagando mais do que o necessário

O **Price360 traz transparência, eficiência e economia** para os consumidores angolanos.

---

## PROBLEMÁTICA E MOTIVAÇÃO

### A Problemática

**Problema 1: Fragmentação de Dados**
- Cada loja tem a sua própria base de dados de produtos
- Não existe um ponto centralizado onde se possam ver todos os preços
- Integrar dados de múltiplas lojas é um desafio técnico

**Problema 2: Dados Desatualizados**
- Os preços mudam frequentemente
- As listas de produtos desatualizadas são inúteis
- É necessário um sistema que atualize automaticamente os preços

**Problema 3: Escalabilidade**
- O sistema precisa funcionar com centenas de lojas e milhões de produtos
- Deve ser rápido mesmo com muitos utilizadores simultâneos
- Deve ser fácil adicionar novas lojas

**Problema 4: Experiência de Utilizador Deficiente**
- Os utilizadores precisam de uma forma fácil de pesquisar produtos
- Precisam de informações claras sobre preços, lojas e disponibilidade
- Querem guardar listas de compras para comparação futura

### A Motivação

O **Price360** foi desenvolvido com o objetivo de:

1. **Empoderar os consumidores**: Dar-lhes acesso a informação completa e atualizada
2. **Promover concorrência justa**: Quando os preços são transparentes, as lojas competem melhor
3. **Impulsionar a economia digital em Angola**: Demonstrar que soluções tecnológicas sofisticadas podem ser desenvolvidas localmente
4. **Criar uma plataforma extensível**: Que possa crescer e adicionar novas funcionalidades com o tempo

---

## OBJETIVOS E ALCANCE

### Objetivos Principais

| Objetivo | Descrição | Status |
|----------|-----------|--------|
| **Comparação de Preços** | Permitir que utilizadores pesquisem um produto e vejam preços em múltiplas lojas | ✅ Implementado |
| **Busca Avançada** | Pesquisa por nome, categoria, intervalo de preço | ✅ Implementado |
| **Listas de Compras** | Utilizadores podem guardar produtos para comparação futura | ✅ Implementado |
| **Autenticação Segura** | Sistema de login/registo com passwords encriptadas | ✅ Implementado |
| **Atualização Automática** | Coleta automática de preços de e-commerce | ✅ Parcialmente (NCR funcional) |
| **Interface Responsiva** | Funciona em desktop, tablet e telemóvel | ✅ Implementado |
| **Dashboard Admin** | Permite visualizar estatísticas e gestionar plataforma | ✅ Implementado |

### Escopo do Projeto

**O que está incluído:**
- API REST completa com autenticação JWT
- Interface web responsiva (sem dependências externas)
- Sistema de scrapers para coleta automática de preços
- Banco de dados relacional otimizado
- Gestão de utilizadores e listas de compras

**O que está previsto para futuro:**
- Aplicação móvel nativa (iOS/Android)
- Notificações de mudanças de preço
- Histórico de preços (gráficos de evolução)
- Integração com mais lojas
- Recomendações personalizadas

---

## ARQUITETURA GERAL DO SISTEMA

### Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILIZADORES FINAIS                      │
└─────────────────────────────────────────────────────────────┘
        ↓                                           ↓
    ┌────────────────┐                    ┌────────────────┐
    │  Navegador     │                    │  Telemóvel     │
    │  (Desktop)     │                    │  (Responsivo)  │
    └────────────────┘                    └────────────────┘
        ↓                                           ↓
    ┌─────────────────────────────────────────────────────────┐
    │         FRONTEND (Vanilla JavaScript)                   │
    │   - SPA (Single Page Application)                       │
    │   - Roteamento hash-based                               │
    │   - Componentes reutilizáveis                           │
    │   - Autenticação cliente (JWT em localStorage)          │
    └─────────────────────────────────────────────────────────┘
        ↓
    ┌─────────────────────────────────────────────────────────┐
    │         API REST (Node.js + Express)                    │
    │   - Endpoints autenticados                              │
    │   - Validação de dados                                  │
    │   - Tratamento de erros                                 │
    └─────────────────────────────────────────────────────────┘
        ↓
    ┌─────────────────────────────────────────────────────────┐
    │     CAMADA DE LÓGICA DE NEGÓCIO                         │
    │   - Controllers (orquestração)                          │
    │   - Models (CRUD)                                       │
    │   - Middlewares (autenticação, validação)               │
    └─────────────────────────────────────────────────────────┘
        ↓
    ┌─────────────────────────────────────────────────────────┐
    │      BASE DE DADOS (MySQL)                              │
    │   - Tabelas relacioadas (Produto, Loja, Utilizador)     │
    │   - Índices otimizados para performance                 │
    │   - Soft delete para recuperação de dados               │
    └─────────────────────────────────────────────────────────┘
        
    PARALELAMENTE:
    ┌─────────────────────────────────────────────────────────┐
    │    SISTEMA DE SCRAPERS (node-cron)                      │
    │   - Execução automática agendada                        │
    │   - Coleta de preços de e-commerce                      │
    │   - Inserção em base de dados                           │
    └─────────────────────────────────────────────────────────┘
```

### Modelo de Camadas

O Price360 segue uma arquitetura de **3 camadas** (padrão de aplicações empresariais):

**Camada 1: Apresentação (Frontend)**
- Interface do utilizador
- Responsável por: renderizar, validar entrada do utilizador, exibir dados
- Tecnologia: HTML, CSS, JavaScript vanilla

**Camada 2: Lógica de Negócio (Backend - API)**
- Processa requisições
- Implementa regras de negócio
- Responsável por: autenticação, autorização, validação, transformação de dados
- Tecnologia: Node.js, Express.js

**Camada 3: Dados (Banco de Dados)**
- Armazenamento persistente
- Responsável por: CRUD, queries otimizadas, integridade de dados
- Tecnologia: MySQL

Esta separação permite que:
- Cada camada seja desenvolvida/modificada independentemente
- O código seja mais testável e maintível
- O sistema seja mais escalável

---

## COMPONENTES PRINCIPAIS

### 1. Frontend (Aplicação Web)

**Tipo**: Single Page Application (SPA)
**Linguagem**: JavaScript Vanilla (sem frameworks como React ou Vue)
**Vantagens desta abordagem**:
- Sem dependências externas → código mais leve
- Sem build step → entrega rápida
- Educacional → aprender os fundamentos

**Estrutura de Ficheiros**:
```
frontend/
├── index.html                 # Página HTML única (SPA)
├── css/                       # 15 ficheiros de estilos
│   ├── main.css              # Design system e variáveis
│   ├── navbar.css            # Barra de navegação
│   ├── hero.css              # Secção hero/banner
│   └── ...
├── js/                        # Lógica JavaScript
│   ├── app.js                # Ponto de entrada
│   ├── router.js             # Navegação entre páginas
│   ├── api.js                # Cliente HTTP (fetch wrapper)
│   ├── auth.js               # Gestão de autenticação
│   ├── components/           # Componentes reutilizáveis
│   │   ├── Navbar.js
│   │   ├── ProductCard.js
│   │   ├── Modal.js
│   │   └── ...
│   └── pages/                # Páginas (uma por rota)
│       ├── HomePage.js
│       ├── ProductsPage.js
│       ├── LoginPage.js
│       └── ...
└── assets/                    # Imagens e recursos
    └── logo.png
```

**Como Funciona**:
1. Utilizador abre `http://localhost:3000` no navegador
2. O ficheiro `index.html` carrega
3. O JavaScript em `app.js` inicializa:
   - Regista todas as rotas (URLs)
   - Monta a navbar (sempre visível)
   - Lida com mudanças de URL
4. Quando o utilizador clica numa ligação, o router intercepta
5. A página correspondente é renderizada dinamicamente (sem recarregar)

**Exemplo de Fluxo (Pesquisa de Produtos)**:
```
Utilizador digita "Arroz" na barra de pesquisa
    ↓
Pressiona Enter ou clica no botão Pesquisar
    ↓
JavaScript chama router.navigate('/produtos?q=Arroz')
    ↓
ProductsPage.js carrega e chama api.get('/api/v1/products/search?q=Arroz')
    ↓
API devolve lista de produtos com preços
    ↓
JavaScript renderiza cards de produtos dinamicamente
    ↓
Utilizador vê lista de arroz com preços de diferentes lojas
```

### 2. Backend - API REST

**Tipo**: API REST (Representational State Transfer)
**Framework**: Express.js (servidor Node.js)
**Porta**: 3000

**O que é uma API REST?**
É um servidor que fornece dados através de URLs (endpoints) e métodos HTTP:
- `GET`: ler dados (exemplo: ver lista de produtos)
- `POST`: criar dados (exemplo: registar novo utilizador)
- `PUT`: atualizar dados (exemplo: mudar preço de um produto)
- `DELETE`: apagar dados (exemplo: remover um produto)

**Exemplo de Endpoints**:
```
GET    /api/v1/products                 → Lista todos os produtos
GET    /api/v1/products/search?q=arroz  → Pesquisa produtos por termo
GET    /api/v1/products/1               → Detalhes do produto 1
POST   /api/v1/auth/login               → Faz login (envia email+password)
POST   /api/v1/user/lists               → Cria lista de compras
GET    /api/v1/stores                   → Lista todas as lojas
```

**Fluxo de uma Requisição**:
```
Frontend faz: fetch('http://localhost:3000/api/v1/products?q=arroz')
    ↓
Express recebe requisição no endpoint /api/v1/products
    ↓
Middleware de autenticação verifica token JWT (se necessário)
    ↓
Middleware de validação verifica parâmetros
    ↓
Controller trata a lógica:
    - Chama modelo para buscar dados
    - Valida resposta
    - Formata para JSON
    ↓
Modelo executa query SQL no banco de dados
    ↓
Base de dados devolve resultados
    ↓
Controller formata resposta JSON
    ↓
Express envia resposta ao Frontend
    ↓
Frontend recebe resposta e renderiza na página
```

**Estrutura de Pasta do Backend**:
```
src/
├── app.js                    # Inicializa Express, regista rotas
├── config/
│   ├── db.js                # Configuração MySQL
│   ├── initDatabase.js      # Cria tabelas
│   └── jwt.js               # Configuração autenticação
├── models/                   # Acesso à base de dados
│   ├── userModel.js
│   ├── productModel.js
│   ├── storeModel.js
│   └── ...
├── controllers/              # Lógica de negócio
│   ├── authController.js
│   ├── productController.js
│   └── ...
├── routes/                   # Definição de endpoints
│   ├── authRoutes.js
│   ├── productRoutes.js
│   └── ...
├── middlewares/              # Verificações intermédias
│   ├── authenticate.js      # Verifica JWT
│   ├── validateProduct.js   # Valida dados de produto
│   └── ...
└── scrapers/                 # Sistema automático de preços
    ├── scheduler.js
    ├── base/
    └── stores/
```

### 3. Base de Dados

**Tipo**: MySQL (Relacional)
**Nome**: `price360_db`

**O que é uma Base de Dados Relacional?**
É um sistema de armazenamento organizado em **tabelas**. Pense em Excel com múltiplas folhas conectadas:
- Cada tabela tem **linhas** (registos) e **colunas** (campos)
- As tabelas estão relacionadas por **chaves estrangeiras** (ligações)

**Principais Tabelas**:

#### Tabela `Utilizador`
Armazena dados dos utilizadores da plataforma.
```
ID | Nome | Email | Password | Role | Created_At | ...
1  | João | j@... | *hash*   | user | 2026-05-01 |
2  | Maria| m@... | *hash*   | admin| 2026-05-02 |
```

#### Tabela `Loja`
Armazena informações das lojas/superfícies comerciais.
```
ID | Nome          | Endereco  | Email    | Municipio | Codigo
1  | NCR Angola    | Luanda    | ...      | Luanda    | ncr
2  | Buitanda      | Luanda    | ...      | Luanda    | buitanda
3  | Shoprite      | Luanda    | ...      | Luanda    | shoprite
```

#### Tabela `Categoria`
Organiza produtos em categorias (ex: Mercearia, Eletrónica).
```
ID | Nome                  | Descricao
1  | Mercearia            | Produtos básicos de alimentação
2  | Telemóveis           | Dispositivos móveis
3  | Computadores         | PCs e Laptops
```

#### Tabela `Produto`
Produtos disponíveis (nome, marca, descrição).
```
ID | Nome                    | Marca      | Descricao          | ID_Categoria
1  | Arroz 5kg              | Ngoji      | Arroz branco...    | 1
2  | iPhone 15              | Apple      | Smartphone...      | 2
3  | Laptop ASUS            | ASUS       | Computador...      | 3
```

#### Tabela `Produto_Loja` (CENTRAL)
**Ligação entre Produtos e Lojas com Preços**. Esta é a tabela mais importante!
```
ID | ID_Produto | ID_Loja | Preco     | Moeda | Quantidade | Data_Atualizacao
1  | 1          | 1       | 5500      | AKZ   | 100        | 2026-05-26
2  | 1          | 2       | 5200      | AKZ   | 50         | 2026-05-26
3  | 1          | 3       | 5800      | AKZ   | 75         | 2026-05-26
```

**Por que Produto_Loja é importante?**
- Permite armazenar o MESMO produto em MÚLTIPLAS lojas
- Cada combinação (Produto + Loja) pode ter um preço diferente
- Quando o preço muda, atualizamos apenas esta tabela
- Responde a perguntas como: "Qual é o preço de Arroz na NCR?"

#### Outras Tabelas Importantes
- **Shopping_List**: Listas de compras do utilizador
- **Product_Shopping_List**: Produtos em cada lista
- **Store_Link**: Links de website de cada loja
- **Store_Phone**: Números de telefone para contacto

---

## BANCO DE DADOS

### Modelo Entidade-Relacionamento (ER)

```
┌─────────────────┐          ┌──────────────────┐
│   Utilizador    │          │   Shopping_List  │
├─────────────────┤          ├──────────────────┤
│ ID (PK)         │◄────────►│ ID (PK)          │
│ Nome            │ 1      1 │ ID_Utilizador(FK)│
│ Email           │          │ Nome             │
│ Password        │          │ Created_At       │
│ Role            │          └──────────────────┘
└─────────────────┘                 │
                                    │ 1
                                    │
                            ┌───────▼──────────────┐
                            │Product_Shopping_List │
                            ├──────────────────────┤
                            │ ID (PK)              │
                            │ ID_List (FK)         │
                            │ ID_Produto (FK)      │
                            │ Quantidade           │
                            └──────────────────────┘
                                    │
                                    │ N
                                    │
                            ┌───────▼──────────┐
                            │   Produto        │
                            ├──────────────────┤
                            │ ID (PK)          │
                            │ Nome             │
                            │ Marca            │
                            │ ID_Categoria(FK) │
                            │ Descricao        │
                            └──────────────────┘
                                    │
                                    │ N
                            ┌───────┴────────────┐
                            │                    │
                   ┌────────▼──────────┐  ┌──────▼──────────────┐
                   │   Categoria      │  │  Produto_Loja       │
                   ├──────────────────┤  ├─────────────────────┤
                   │ ID (PK)          │  │ ID (PK)             │
                   │ Nome             │  │ ID_Produto (FK)     │
                   │ Descricao        │  │ ID_Loja (FK)        │
                   └──────────────────┘  │ Preco               │
                                         │ Moeda               │
                                         │ Quantidade          │
                                         │ Data_Atualizacao    │
                                         └──────────┬──────────┘
                                                    │
                                                    │ N
                                         ┌──────────▼─────────┐
                                         │      Loja          │
                                         ├────────────────────┤
                                         │ ID (PK)            │
                                         │ Nome               │
                                         │ Endereco           │
                                         │ Municipio          │
                                         │ Email              │
                                         │ Codigo             │
                                         └────────────────────┘
```

### Esquema SQL (Simplificado)

```sql
-- Tabela Utilizador
CREATE TABLE Utilizador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    p_nome VARCHAR(100) NOT NULL,
    u_nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    palavra_passe VARCHAR(255) NOT NULL,  -- Password encriptada com bcrypt
    role ENUM('user', 'admin') DEFAULT 'user',
    genero VARCHAR(50),
    municipio_preferencial VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL  -- Soft delete
);

-- Tabela Loja
CREATE TABLE Loja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,  -- Identificador para scrapers
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    municipio VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Categoria
CREATE TABLE Categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Produto
CREATE TABLE Produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    marca VARCHAR(100),
    descricao TEXT,
    id_categoria INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id)
);

-- Tabela Central: Produto_Loja (Preços)
CREATE TABLE Produto_Loja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,
    id_loja INT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    moeda VARCHAR(10) DEFAULT 'AKZ',
    quantidade INT DEFAULT 0,
    link VARCHAR(500),
    imagem VARCHAR(500),
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_produto) REFERENCES Produto(id),
    FOREIGN KEY (id_loja) REFERENCES Loja(id),
    INDEX idx_produto_loja (id_produto, id_loja)
);

-- Tabela Shopping_List
CREATE TABLE Shopping_List (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizador INT NOT NULL,
    nome VARCHAR(200),
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizador) REFERENCES Utilizador(id)
);

-- Tabela Product_Shopping_List
CREATE TABLE Product_Shopping_List (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_list INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT DEFAULT 1,
    FOREIGN KEY (id_list) REFERENCES Shopping_List(id),
    FOREIGN KEY (id_produto) REFERENCES Produto(id)
);
```

### Performance e Otimizações

**Índices**:
- `Produto_Loja(id_produto, id_loja)` permite buscar rapidamente o preço de um produto numa loja
- `Utilizador(email)` permite login rápido
- `Produto(id_categoria)` permite filtrar por categoria

**Soft Delete**:
- Quando um utilizador ou produto é "apagado", o campo `deleted_at` é preenchido
- Os dados não são removidos fisicamente, permitindo recuperação
- Queries normais ignoram registos apagados

---

## BACKEND - API REST

### Estrutura de Endpoints

**Base URL**: `http://localhost:3000/api/v1`

#### 1. Autenticação

```
POST /auth/login
├─ Parâmetros: { email, password }
├─ Resposta: { token, user }
└─ Funciona: Verifica credenciais, gera JWT token

POST /auth/register
├─ Parâmetros: { p_nome, u_nome, email, password, ... }
├─ Resposta: { token, user }
└─ Funciona: Cria novo utilizador, encripta password

GET /auth/me (Requer autenticação)
├─ Resposta: { user } (dados do utilizador autenticado)
└─ Funciona: Verifica token JWT válido
```

#### 2. Produtos

```
GET /products
├─ Parâmetros: { categoria, preco_min, preco_max, page }
├─ Resposta: { produtos: [...], total, pages }
└─ Funciona: Lista produtos com filtros

GET /products/search?q=arroz
├─ Resposta: { produtos: [...] }
└─ Funciona: Busca por nome

GET /products/:id
├─ Resposta: { produto: { ...detalhes completos... } }
└─ Funciona: Retorna detalhes e preços em todas as lojas

POST /products (Requer admin)
├─ Parâmetros: { nome, marca, descricao, id_categoria }
├─ Resposta: { id, ...dados... }
└─ Funciona: Cria novo produto
```

#### 3. Lojas

```
GET /stores
├─ Resposta: { lojas: [...] }
└─ Funciona: Lista todas as lojas

GET /stores/:id/products
├─ Resposta: { produtos: [...com preços desta loja...] }
└─ Funciona: Produtos disponíveis numa loja específica

GET /stores/location/:municipio
├─ Resposta: { lojas: [...lojas neste município...] }
└─ Funciona: Filtra lojas por localização geográfica
```

#### 4. Listas de Compras (Requer autenticação)

```
GET /user/lists
├─ Resposta: { listas: [{id, nome, total, items: [...]}, ...] }
└─ Funciona: Lista todas as listas do utilizador

POST /user/lists
├─ Parâmetros: { nome, descricao }
├─ Resposta: { id, nome, ... }
└─ Funciona: Cria nova lista

POST /user/lists/:listId/items
├─ Parâmetros: { id_produto, quantidade }
├─ Resposta: { item: {...} }
└─ Funciona: Adiciona produto à lista

GET /user/lists/:listId/comparison
├─ Resposta: { items: [{produto, melhor_preco, lojas: [...]}, ...] }
└─ Funciona: Compara preços de todos os produtos na lista
```

### Fluxo de Autenticação (JWT)

**O que é JWT (JSON Web Token)?**
É um método seguro de autenticação. Funciona assim:

```
1. Utilizador faz login
   └─ Envia: { email: "joao@example.com", password: "123456" }

2. Backend recebe e verifica credenciais
   └─ Query DB: SELECT * FROM Utilizador WHERE email = ?
   └─ Compara password encriptada

3. Se credenciais corretas, backend gera JWT token
   └─ Token contém: { id, email, role, iat (hora início), exp (hora expiração) }
   └─ Token é encriptado com segredo (JWT_SECRET)

4. Backend envia token ao frontend
   └─ Frontend recebe: { token: "eyJhbGciOiJIUzI1NiIs..." }

5. Frontend guarda token em localStorage
   └─ localStorage.setItem('token', token)

6. Próximas requisições incluem token
   ├─ Header HTTP: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
   └─ Exemplo: GET /api/v1/user/lists

7. Backend valida token
   ├─ Verifica se ainda não expirou (exp > data_atual)
   ├─ Verifica se foi encriptado com JWT_SECRET correto
   └─ Se válido: processa requisição; se não: devolve erro 401 Unauthorized

8. Se expirado, utilizador precisa fazer login novamente
```

### Exemplo Prático: Pesquisar Produtos

**Resumo Visual**:
```
Utilizador digita "Laptop" e clica pesquisar
    ↓
JavaScript: router.navigate('/produtos?q=Laptop')
    ↓
Frontend HTTP GET /api/v1/products/search?q=Laptop
    │   Header: "Authorization: Bearer [token]"
    ↓
Backend Express recebe em /products/search
    ├─ Middleware: Valida token JWT
    ├─ Controller: Extrai "q=Laptop" da URL
    ├─ Model: Executa SQL LIKE '%Laptop%'
    └─ Resposta: [{ id: 1, nome: "Laptop ASUS", ... }, ...]
    ↓
Frontend: Renderiza cards dinamicamente
    └─ Mostra: "3 resultados encontrados para 'Laptop'"
```

**Código Backend (Simplificado)**:
```javascript
// routes/productRoutes.js
router.get('/search', authenticate, productController.searchProducts);

// controllers/productController.js
exports.searchProducts = async (req, res) => {
    const q = req.query.q;  // "Laptop"
    
    // Valida entrada
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Termo muito curto' });
    }
    
    try {
        // Chama modelo
        const produtos = await productModel.search(q);
        
        // Retorna ao frontend
        res.json({ 
            success: true,
            total: produtos.length,
            produtos: produtos 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao pesquisar' });
    }
};

// models/productModel.js
exports.search = async (termo) => {
    const sql = 'SELECT * FROM Produto WHERE nome LIKE ? LIMIT 50';
    const [rows] = await db.execute(sql, [`%${termo}%`]);
    return rows;
};
```

---

## FRONTEND - APLICAÇÃO WEB

### Como a SPA Funciona

**O que é uma SPA (Single Page Application)?**
É uma aplicação web que funciona numa página HTML única. Ao contrário dos sites tradicionais que recarregam completamente a página a cada clique, uma SPA muda dinamicamente apenas o conteúdo relevante.

**Exemplo**:
- Site tradicional: Click em "Produtos" → carrega novo HTML → pisca a página
- SPA (Price360): Click em "Produtos" → JavaScript muda o DOM → sem piscar

### Roteamento Hash-Based

O Price360 usa URLs com `#` (hash):
- `http://localhost:3000/#/` → Home
- `http://localhost:3000/#/produtos` → Página de produtos
- `http://localhost:3000/#/login` → Página de login
- `http://localhost:3000/#/admin` → Dashboard admin

**Por que hash?**
- Não causa recarregamento da página
- Facilita navegação sem servidor
- Frontend consegue interceptar mudanças de URL

**Como Funciona**:
```javascript
// router.js
class Router {
    navigate(path) {
        window.location.hash = path;  // Muda URL para #/produtos
    }
    
    init() {
        // Escuta mudanças de hash
        window.addEventListener('hashchange', () => {
            const path = window.location.hash.slice(1);  // Remove #
            this.renderPage(path);  // Renderiza página correspondente
        });
    }
}
```

### Componentes Reutilizáveis

O código JavaScript é organizado em componentes (classes), permitindo reutilização:

**Exemplo: ProductCard.js**
```javascript
export class ProductCard {
    constructor(product) {
        this.product = product;
    }
    
    render() {
        return `
            <div class="product-card">
                <img src="${this.product.imagem}">
                <h3>${this.product.nome}</h3>
                <p>R$ ${this.product.preco}</p>
                <button onclick="viewDetails(${this.product.id})">
                    Ver Detalhes
                </button>
            </div>
        `;
    }
}
```

**Uso**:
```javascript
// pages/ProductsPage.js
const produto = { id: 1, nome: "Laptop ASUS", preco: 5000000, ... };
const card = new ProductCard(produto);
container.innerHTML += card.render();
```

### Páginas Principais

#### 1. **HomePage** (Página Inicial)
- Hero section com CTA (Call To Action)
- Categorias em grid
- Produtos em destaque
- Secção "Conhecer o Price360"
- Footer com informações

#### 2. **ProductsPage** (Pesquisa e Listagem)
- Barra de pesquisa
- Filtros (categoria, preço)
- Paginação
- Grid de produtos com cards
- Modal de detalhes ao clicar em produto

**Modal de Detalhes**:
Mostra:
- Imagem do produto
- Nome, marca, descrição
- Tabela com preços em cada loja
- Links para lojas
- Botão "Adicionar à lista"

#### 3. **LoginPage e RegisterPage**
- Formulário com validação cliente
- Indicador de força de password
- Mensagens de erro/sucesso
- Redirecionamento após login bem-sucedido

#### 4. **ShoppingListPage** (Listas de Compras)
- Criar nova lista
- Adicionar/remover produtos
- Comparação de preços de todos os produtos na lista
- Calcular total de despesa
- Exportar lista (PDF)

#### 5. **AdminDashboardPage**
- Estatísticas gerais (total de utilizadores, produtos, preços)
- Gráficos de atividade
- Gestão de produtos/lojas (CRUD)
- Logs de sistema
- Status dos scrapers

### Animações e Interatividade

O arquivo `animations.js` implementa:

**Scroll Animations**:
Usa Intersection Observer para animar elementos quando entram no viewport:
```javascript
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-scroll');
        }
    });
});
document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
});
```

**CSS Animations**:
```css
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-scroll {
    animation: slideInUp 0.6s ease-out;
}
```

### Design System

O `main.css` define um design system completo:

**Variáveis CSS**:
```css
:root {
    /* Cores */
    --color-primary: #1565C0;      /* Azul */
    --color-secondary: #FFA500;    /* Laranja */
    --color-error: #E53935;        /* Vermelho */
    --color-success: #43A047;      /* Verde */
    
    /* Espaçamento */
    --space-4: 0.25rem;
    --space-8: 0.5rem;
    --space-16: 1rem;
    
    /* Tipografia */
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    
    /* Sombras */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

**Responsividade**:
```css
/* Desktop */
.navbar { width: 100%; }

/* Tablet (≤ 1024px) */
@media (max-width: 1024px) {
    .navbar { width: 95%; }
}

/* Móvel (≤ 768px) */
@media (max-width: 768px) {
    .navbar { width: 90%; }
    .navbar__hamburger { display: flex; }  /* Mostra hamburger */
}
```

---

## SISTEMA DE SCRAPERS

### O que é um Scraper?

Um **scraper** é um programa que:
1. Acede a websites de e-commerce
2. Extrai automaticamente dados de produtos (nome, preço, descrição)
3. Armazena dados numa base de dados
4. Atualiza preços regularmente

**Analogia**: Imagine que você tem um assistente que:
- Visita o website da NCR cada dia
- Copia os preços de todos os produtos
- Anota numa tabela
- Avisa se houve mudanças

O scraper faz isto automaticamente e sem se cansar!

### Arquitetura de Scrapers

```
┌──────────────────────────────────────────────────────┐
│           ScraperScheduler (node-cron)               │
│  Agendador que executa tarefas em horários fixos      │
└─────────────────────────┬──────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
    ┌───────────┐  ┌──────────────┐  ┌──────────────┐
    │ 03:00 AM  │  │ 02:00 AM     │  │ 02:00 AM     │
    │ Diário    │  │ Domingos     │  │ 1º do mês    │
    │ Pipeline  │  │ Limpar logs  │  │ Limpar dados │
    └─────┬─────┘  └──────────────┘  └──────────────┘
          │
          ↓
    ┌──────────────────────────┐
    │  ScraperPipeline         │
    │ Orquestra scrapers       │
    └──────────┬───────────────┘
               │
    ┌──────────┴──────────┬─────────────┐
    ↓                     ↓             ↓
┌─────────────┐  ┌──────────────┐  ┌────────────┐
│ NcrScraper  │  │ Buitanda     │  │ MultiTek   │
│ (VTEX API)  │  │ Scraper      │  │ Scraper    │
└──────┬──────┘  │ (Pendente)   │  │ (Pendente) │
       │         └──────────────┘  └────────────┘
       │
       ↓
┌──────────────────────────────────┐
│  BaseScraper (Classe Base)       │
│  - Métodos comuns                │
│  - Tratamento de erros           │
│  - Rate limiting                 │
│  - Retry automático              │
└──────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│  DatabaseUpsert                  │
│  - Insere/atualiza Produto_Loja  │
│  - Tratamento de duplicados      │
│  - Logging estruturado           │
└──────────────────────────────────┘
       │
       ↓
   ┌─────────┐
   │ MySQL   │
   │ BD      │
   └─────────┘
```

### Implementação: NCR Angola (VTEX API)

A NCR Angola usa a plataforma VTEX, que fornece uma API pública de produtos:

**API Endpoint**:
```
https://www.ncrangola.com/api/catalog_system/pub/products/search?ft=Laptop
```

**Fluxo**:
```
1. Scraper recebe termos de busca: ["Laptop", "iPhone", "Arroz"]
   
2. Para cada termo:
   a) Constrói URL da API: /search?ft=Laptop
   b) Faz requisição HTTP GET
   c) Extrai dados da resposta JSON:
      - id, nome, marca, imagem, descrição
      - Preços (pode haver variações)
   
3. Valida dados:
   - Nome não está vazio?
   - Preço é um número válido?
   - Há link para o produto?
   
4. Envia para DatabaseUpsert:
   - Verifica se produto já existe (por nome)
   - Se existe: atualiza preço em Produto_Loja
   - Se não existe: cria novo Produto
   
5. Registra sucesso/erro em logs estruturados
```

**Código Simplificado**:
```javascript
// scrapers/stores/NcrScraper.js
class NcrScraper extends BaseScraper {
    async scrape(terms) {
        const results = [];
        
        for (const term of terms) {
            try {
                // 1. Faz requisição à API
                const url = `https://www.ncrangola.com/api/catalog_system/pub/products/search?ft=${term}`;
                const response = await axios.get(url, { timeout: 35000 });
                
                // 2. Extrai produtos da resposta
                const produtos = response.data;
                
                for (const produto of produtos) {
                    // 3. Valida
                    if (!produto.productName || !produto.items[0].sellers[0].commertialOffer.Price) {
                        continue;
                    }
                    
                    // 4. Formata dados
                    const item = {
                        nome: produto.productName,
                        marca: produto.brand || 'N/A',
                        preco: produto.items[0].sellers[0].commertialOffer.Price,
                        link: `https://www.ncrangola.com/p/${produto.linkText}`,
                        imagem: produto.items[0].images[0].imageUrl
                    };
                    
                    results.push(item);
                }
                
                // 5. Pequena pausa para evitar rate limiting
                await this.delay(500);
                
            } catch (error) {
                this.logger.error(`Erro ao scraping termo "${term}"`, error);
            }
        }
        
        return results;
    }
}
```

### Agendamento Automático (node-cron)

```javascript
// src/scrapers/scheduler.js
const cron = require('node-cron');

class ScraperScheduler {
    constructor() {
        this.jobs = [];
    }
    
    init() {
        // Job 1: Executar pipeline diariamente às 03:00 AM
        this.jobs.push(
            cron.schedule('0 3 * * *', async () => {
                console.log('[03:00 AM] Iniciando pipeline diário...');
                const stats = await this.executeNow(['Laptop', 'iPhone', 'Arroz']);
                console.log('Pipeline completo:', stats);
            })
        );
        
        // Job 2: Limpar logs antigos todas as semanas (Domingo 02:00 AM)
        this.jobs.push(
            cron.schedule('0 2 * * 0', async () => {
                console.log('[Domingo 02:00] Limpando logs antigos...');
                await this.cleanOldLogs();
            })
        );
        
        // Job 3: Limpar dados obsoletos no 1º do mês
        this.jobs.push(
            cron.schedule('0 2 1 * *', async () => {
                console.log('[1º do mês 02:00] Limpando dados antigos...');
                await DatabaseUpsert.cleanOldData(30);  // Dados com > 30 dias
            })
        );
        
        console.log('✅ Scheduler iniciado com 3 jobs agendadas');
    }
    
    async executeNow(termos) {
        const pipeline = new ScraperPipeline();
        return await pipeline.execute(termos);
    }
}
```

**Sintaxe cron**: `'0 3 * * *'` significa:
- `0` = minuto 0
- `3` = hora 3 (03:00 AM)
- `*` = qualquer dia do mês
- `*` = qualquer mês
- `*` = qualquer dia da semana

### DatabaseUpsert: Inserção/Atualização Inteligente

**O que é UPSERT?**
= "**UP**date or in**SERT**"
= Se o registo existe, atualiza; se não existe, insere

**Fluxo**:
```
Dados do Scraper: { nome: "Laptop ASUS", preco: 5000000, loja: "NCR" }

1. Procura Produto por nome
   ├─ SELECT * FROM Produto WHERE nome = "Laptop ASUS"
   ├─ Se encontrado: usa ID
   └─ Se não: INSERT novo Produto, retorna novo ID

2. Procura Loja por código
   ├─ SELECT * FROM Loja WHERE codigo = "ncr"
   └─ Retorna ID da loja

3. Procura Produto_Loja por (id_produto, id_loja)
   ├─ SELECT * FROM Produto_Loja WHERE id_produto=X AND id_loja=Y
   ├─ Se encontrado: UPDATE preco, data_atualizacao
   │   └─ UPDATE Produto_Loja SET preco=5000000, data_atualizacao=NOW()
   └─ Se não: INSERT novo registo
       └─ INSERT INTO Produto_Loja (id_produto, id_loja, preco, ...) VALUES (...)

4. Regista estatísticas
   └─ { inserts: 5, updates: 12, errors: 0 }
```

**Código Simplificado**:
```javascript
// scrapers/pipeline/DatabaseUpsert.js
class DatabaseUpsert {
    async upsertProdutoLoja(produtoData, lojaCode) {
        try {
            // 1. Garante Produto existe
            let produtoId = await this.getOrCreateProduct(produtoData);
            
            // 2. Garante Loja existe
            let lojaId = await this.getLojaByCode(lojaCode);
            
            // 3. UPSERT em Produto_Loja
            const existente = await db.execute(
                'SELECT id FROM Produto_Loja WHERE id_produto=? AND id_loja=?',
                [produtoId, lojaId]
            );
            
            if (existente[0].length > 0) {
                // Produto já na loja: atualiza preço
                await db.execute(
                    'UPDATE Produto_Loja SET preco=?, data_atualizacao=NOW() WHERE id_produto=? AND id_loja=?',
                    [produtoData.preco, produtoId, lojaId]
                );
                return 'update';
            } else {
                // Novo produto na loja: insere
                await db.execute(
                    'INSERT INTO Produto_Loja (id_produto, id_loja, preco, link, imagem) VALUES (?, ?, ?, ?, ?)',
                    [produtoId, lojaId, produtoData.preco, produtoData.link, produtoData.imagem]
                );
                return 'insert';
            }
        } catch (error) {
            this.logger.error('Erro UPSERT:', error);
            throw error;
        }
    }
}
```

### Logs Estruturados

O sistema mantém logs em arquivo (um por dia) e console colorido:

**Arquivo de Log** (`src/scrapers/logs/2026-05-26.log`):
```json
[2026-05-26T03:00:15.123Z] [INFO] [NCR Angola] Buscando: "Laptop"
[2026-05-26T03:00:16.456Z] [INFO] [NCR Angola] Encontrados 10 produtos
[2026-05-26T03:00:17.789Z] [INFO] [NCR Angola] Inseridos 5, Atualizados 5
[2026-05-26T03:00:18.012Z] [SUCCESS] [NCR Angola] Execução concluída com sucesso
```

**Console**:
```
[ℹ] NCR Angola — Buscando: "Laptop"
[✓] NCR Angola — 10 produtos encontrados
[!] Buitanda — Scraper ainda não implementado
[ℹ] Pipeline — Tempo total: 15.3 segundos
```

---

## FLUXO DE DADOS COMPLETO

### Cenário 1: Utilizador Pesquisa um Produto

```
PASSO 1: Utilizador abre a aplicação
├─ Frontend carrega index.html
├─ JavaScript em app.js inicializa
├─ Verifica se existe token JWT em localStorage
└─ Se sim: carrega dados do utilizador; se não: mostrar botões Login/Register

PASSO 2: Utilizador digita "Arroz" e pesquisa
├─ Frontend intercepta submissão de formulário
├─ Chama router.navigate('/produtos?q=Arroz')
└─ URL muda para #/produtos?q=Arroz

PASSO 3: ProductsPage.js carrega
├─ Renderiza layout (cabeçalho, barra lateral de filtros, grid)
├─ Chama api.get('/api/v1/products/search?q=Arroz')
├─ API gateway envia requisição HTTP
└─ Enquanto espera resposta, mostra skeleton loaders (animação de "carregando")

PASSO 4: Backend recebe requisição em Express
├─ Valida token JWT (se necessário)
├─ Valida parâmetro "q"
├─ Controller chama productModel.search('Arroz')
└─ Model executa SQL: SELECT * FROM Produto WHERE nome LIKE '%Arroz%'

PASSO 5: Base de dados retorna resultados
├─ Encontra: Arroz 5kg, Arroz 10kg, Arroz integral
└─ Para cada produto, busca preços em Produto_Loja

PASSO 6: Backend processa resposta
├─ Para cada produto encontrado, busca preços em lojas
├─ SELECT * FROM Produto_Loja WHERE id_produto = ?
├─ Formata resposta JSON com estrutura amigável
└─ Envia ao frontend: { produtos: [...], total: 3 }

PASSO 7: Frontend recebe resposta
├─ Esconde skeleton loaders
├─ Renderiza ProductCard para cada produto
│  └─ ProductCard mostra: imagem, nome, melhor preço, botão "Ver Preços"
└─ Injeta cards no DOM

PASSO 8: Utilizador vê resultados
├─ 3 cards de arroz com preços aproximados
├─ Clica em "Ver Preços" num card
└─ Modal abre mostrando preços em TODAS as lojas

PASSO 9: Modal de Detalhes
├─ Mostra tabela com:
│  ├─ NCR Angola: 5.500 AKZ
│  ├─ Buitanda: 5.200 AKZ
│  └─ Shoprite: 5.800 AKZ
├─ Destaca melhor preço (Buitanda)
└─ Oferece links para cada loja
```

### Cenário 2: Scraper Automaticamente Atualiza Preços

```
PASSO 1: node-cron dispara no horário agendado (03:00 AM)
├─ Scheduler verifica job de "Main Pipeline"
└─ Chama ScraperPipeline.execute(['Laptop', 'iPhone', 'Arroz'])

PASSO 2: ScraperPipeline inicializa
├─ Logger regista: [ℹ] Pipeline iniciada
├─ Cria instâncias de NcrScraper, BuitandaScraper, MultiTekScraper
└─ Executa em paralelo (Promise.all) para acelerar

PASSO 3: Para cada loja, scraper executa
├─ NcrScraper recebe termos
├─ Para "Laptop":
│  ├─ Faz GET https://www.ncrangola.com/api/catalog_system/pub/products/search?ft=Laptop
│  ├─ Aguarda resposta (timeout 35s)
│  ├─ Extrai dados JSON
│  ├─ Filtra produtos válidos (com nome e preço)
│  └─ Adiciona lista de produtos à resposta
└─ Repete para "iPhone" e "Arroz"

PASSO 4: DatabaseUpsert processa cada produto
├─ Para "Laptop ASUS" (preço 5.000.000):
│  ├─ Procura em Produto por nome
│  ├─ Se existe: obtém ID; se não: INSERT novo
│  ├─ Procura Loja por código "ncr"
│  ├─ Procura Produto_Loja por (id_produto, id_loja)
│  ├─ Se existe: UPDATE preco, data_atualizacao
│  └─ Se não: INSERT novo registo
└─ Conta: 1 insert ou update

PASSO 5: Após processar todos os produtos
├─ DatabaseUpsert retorna estatísticas
│  └─ { inserts: 15, updates: 35, errors: 0, total: 50 }
├─ Logger regista sucesso
└─ Pipeline passa para próxima loja ou termina

PASSO 6: Próxima vez que utilizador pesquisa
├─ Vê preços atualizados (da noite anterior)
└─ Dados sempre frescos (nunca com >24h)
```

### Cenário 3: Utilizador Guarda Lista de Compras

```
PASSO 1: Utilizador autenticado acessa /lista
├─ Frontend carrega ShoppingListPage.js
├─ Chama api.get('/api/v1/user/lists')
└─ Backend devolve listas do utilizador

PASSO 2: Utilizador clica "Criar Lista"
├─ Form aparece pedindo nome e descrição
├─ Utilizador preenche e submete
├─ Frontend chama api.post('/api/v1/user/lists', { nome, descricao })
└─ Backend INSERT em Shopping_List, retorna id da nova lista

PASSO 3: Utilizador pesquisa produtos e adiciona à lista
├─ Va a /produtos, pesquisa "Arroz"
├─ Vê resultados
├─ Clica "Adicionar à Lista" num produto
├─ Modal pede quantidade e qual lista
├─ Clica "Confirmar"
└─ Frontend chama api.post('/api/v1/user/lists/{listId}/items', {id_produto, quantidade})

PASSO 4: Backend processa adição
├─ Valida que utilizador é dono da lista (segurança)
├─ INSERT em Product_Shopping_List (id_list, id_produto, quantidade)
└─ Retorna sucesso ao frontend

PASSO 5: Utilizador visualiza lista completa
├─ Backend chama api.get('/api/v1/user/lists/{id}/comparison')
├─ Backend:
│  ├─ Busca todos os produtos da lista
│  ├─ Para CADA produto, busca preços em todas as lojas (Produto_Loja)
│  ├─ Identifica melhor preço de cada produto
│  ├─ Calcula total se comprar o melhor preço de cada
│  └─ Retorna: { items: [...], total_minimo: X, total_medio: Y }
└─ Frontend renderiza tabela de comparação

PASSO 6: Utilizador vê resumo
├─ Tabela com: Produto | Quantidade | Melhor Preço | Loja | Total Linha
├─ Rodapé com: TOTAL = 250.000 AKZ (melhor cenário)
└─ Pode visualizar e imprimir (ou exportar para PDF)
```

---

## AUTENTICAÇÃO E SEGURANÇA

### Encriptação de Passwords

**Por que encriptar?**
Se a base de dados for hackeada, os passwords dos utilizadores não devem ser legíveis.

**Tecnologia: bcryptjs**
- Transforma password em hash irreversível
- Adiciona "salt" (aleatóriedade) para segurança extra
- Mesmo dois passwords idênticos produzem hashes diferentes

**Exemplo**:
```
Password original: "123456"
Hash bcrypt: "$2a$10$N9qo8uLOickgx2Z1JiN7s.W9D0vqWN9YxKW9hWxCJmGx"

Se base de dados vaza, hacker vê apenas o hash.
Não consegue converter hash de volta para password sem tentar milliões.
```

**Código**:
```javascript
// Registo
const password = "123456";
const hashedPassword = await bcryptjs.hash(password, 10);
// Guarda hashedPassword na BD

// Login
const inputPassword = "123456";
const isValid = await bcryptjs.compare(inputPassword, hashedPassword);
// Retorna true se passwords coincidem
```

### JWT (JSON Web Token)

**Objetivo**: Autenticar requisições sem guardar sessões no servidor.

**Estrutura do JWT**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

São 3 partes separadas por `.`:

1. **Header** (algoritmo e tipo): `eyJhbGciOiJIUzI1NiIs...`
2. **Payload** (dados): `eyJzdWIiOiIxMjM0NTY3ODkwI...`
   ```json
   {
       "id": 1,
       "email": "joao@example.com",
       "role": "user",
       "iat": 1516239022,          // Issued At (quando foi criado)
       "exp": 1516325422          // Expiration (quando expira)
   }
   ```
3. **Signature** (assinatura): `SflKxwRJSMeKKF2QT4fw...`
   - Hash do Header + Payload + JWT_SECRET
   - Garante que ninguém alterou o token

**Fluxo Completo**:
```
1. Utilizador faz login
   ├─ Envia email + password
   ├─ Backend valida credenciais
   └─ Backend gera JWT token

2. Token é enviado ao frontend
   └─ Frontend guarda em localStorage

3. Próximas requisições incluem token
   ├─ Header: "Authorization: Bearer [token]"
   └─ Exemplo: GET /api/v1/user/lists

4. Backend valida token
   ├─ Extrai Header + Payload
   ├─ Recalcula signature com JWT_SECRET
   ├─ Compara signature do token com calculada
   ├─ Se iguais: token não foi alterado (autêntico)
   ├─ Se diferentes: rejeitado (não autêntico)
   ├─ Verifica se token expirou (exp > now)
   └─ Se válido: processa requisição; se não: retorna 401 Unauthorized

5. Se token expirou
   └─ Utilizador precisa fazer login novamente
```

### Middlewares de Segurança

**Middleware de Autenticação**:
```javascript
// middlewares/authenticate.js
exports.authenticate = async (req, res, next) => {
    try {
        // Extrai token do header Authorization
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }
        
        // Verifica e desencripta token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adiciona utilizador à requisição
        req.user = decoded;
        
        // Passa para próximo middleware/controller
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};
```

**Middleware de Autorização (Admin)**:
```javascript
// middlewares/authorize.js
exports.authorizeAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Apenas administradores' });
    }
    next();
};
```

**Uso em Rotas**:
```javascript
// Requer apenas autenticação
router.get('/user/lists', authenticate, userController.getLists);

// Requer autenticação + admin
router.post('/products', authenticate, authorizeAdmin, productController.createProduct);

// Público (sem autenticação)
router.get('/products', productController.getProducts);
```

### Validação de Dados

**Por que validar?**
Evita erros e exploits de segurança.

**Exemplo: Criação de Produto**
```javascript
// middlewares/validateProduct.js
exports.validateCreateProduct = (req, res, next) => {
    const { nome, marca, descricao, id_categoria } = req.body;
    
    // Validações
    if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
        return res.status(400).json({ error: 'Nome deve ter mínimo 3 caracteres' });
    }
    
    if (id_categoria && !Number.isInteger(id_categoria)) {
        return res.status(400).json({ error: 'ID categoria inválido' });
    }
    
    // Passa para próximo
    next();
};
```

---

## FUNCIONALIDADES PRINCIPAIS

### 1. Pesquisa de Produtos

**O que oferece**:
- Pesquisa por nome (full-text search)
- Filtros: categoria, intervalo de preço, disponibilidade
- Paginação de resultados
- Ordenação: preço (ascendente/descendente), novos primeiros, melhor avaliados

**Exemplo de Resultado**:
```
Pesquisa: "Laptop"
Categoria: Eletrónica
Preço: 5.000.000 - 10.000.000 AKZ
Ordenar por: Preço (menor para maior)

Resultados (3 encontrados):
┌─────────────────────────────────────┐
│ Laptop ASUS X315                    │
│ Marca: ASUS                         │
│ Preço: 5.200.000 AKZ (NCR Angola)   │
│ ⭐⭐⭐⭐ (4 estrelas)                │
│ [Ver Preços em Todas as Lojas]      │
└─────────────────────────────────────┘
```

### 2. Comparação de Preços

**O que oferece**:
- Ver mesmo produto em múltiplas lojas
- Destaca melhor preço
- Mostra diferença de preço entre lojas
- Links diretos para páginas de produto

**Exemplo**:
```
Laptop ASUS X315

┌────────────────┬──────────────┬────────────────────┐
│ Loja           │ Preço        │ Ação               │
├────────────────┼──────────────┼────────────────────┤
│ ✓ Buitanda     │ 5.200.000 AKZ│ [Ver no Site]      │
│ NCR Angola     │ 5.500.000 AKZ│ [Ver no Site]      │
│ Shoprite       │ 5.800.000 AKZ│ [Ver no Site]      │
└────────────────┴──────────────┴────────────────────┘

Economia: 600.000 AKZ comprando em Buitanda
```

### 3. Listas de Compras

**O que oferece**:
- Criar múltiplas listas
- Adicionar/remover produtos
- Definir quantidades
- Sincronizar entre dispositivos (via nuvem/backend)
- Compartilhar listas com outros utilizadores (futuro)

**Exemplo**:
```
Minha Lista de Compras: "Compras da Semana"

┌──────────────────┬────────┬──────────────┬─────────────┐
│ Produto          │ Qtd    │ Melhor Preço │ Total Linha │
├──────────────────┼────────┼──────────────┼─────────────┤
│ Arroz 5kg        │ 2      │ 5.200 AKZ    │ 10.400 AKZ  │
│ Leite 1L         │ 6      │ 800 AKZ      │ 4.800 AKZ   │
│ Pão Integral     │ 3      │ 1.500 AKZ    │ 4.500 AKZ   │
└──────────────────┴────────┴──────────────┴─────────────┘

TOTAL: 19.700 AKZ
```

### 4. Dashboard do Utilizador

**O que oferece**:
- Histórico de buscas
- Produtos salvos
- Preferências de notificação
- Gestão de perfil
- Histórico de listas

### 5. Dashboard do Administrador

**O que oferece**:
- Estatísticas gerais:
  - Total de utilizadores, produtos, lojas
  - Número de pesquisas realizadas
  - Produtos mais populares
- Gestão de conteúdo:
  - CRUD de produtos
  - CRUD de categorias
  - CRUD de lojas
- Status de scrapers:
  - Última atualização
  - Produtos inseridos/atualizados
  - Erros
- Logs do sistema

**Exemplo de Estatísticas**:
```
┌──────────────────────────────────────┐
│ DASHBOARD PRICE360                   │
├──────────────────────────────────────┤
│ Utilizadores: 1.234                  │
│ Produtos: 45.678                     │
│ Lojas: 8                             │
│ Preços: 234.567 (em Produto_Loja)    │
│ Pesquisas hoje: 5.432                │
│ Produtos mais buscados:              │
│   1. Arroz (542 buscas)              │
│   2. Leite (234 buscas)              │
│   3. Telemóveis (123 buscas)         │
│                                      │
│ Status Scrapers:                     │
│ ✓ NCR Angola: Última atualização 2h  │
│ ⏳ Buitanda: Implementação pendente   │
│ ⏳ MultiTek: Implementação pendente   │
└──────────────────────────────────────┘
```

---

## TECNOLOGIAS E DEPENDÊNCIAS

### Backend

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express.js** | 5.2.1 | Framework web |
| **MySQL2** | 3.22.3 | Driver MySQL com promises |
| **bcryptjs** | 3.0.3 | Encriptação de passwords |
| **jsonwebtoken** | 9.0.3 | Criação/verificação JWT |
| **axios** | 1.16.1 | Cliente HTTP (scrapers) |
| **cheerio** | 1.2.0 | Parsing HTML (future scrapers) |
| **node-cron** | 4.2.1 | Agendamento de tarefas |
| **cors** | 2.8.6 | Controlo de Cross-Origin |
| **multer** | 2.1.1 | Upload de ficheiros |
| **dotenv** | 17.4.2 | Variáveis de ambiente |

### Frontend

| Tecnologia | Propósito |
|-----------|----------|
| **HTML5** | Estrutura semântica |
| **CSS3** | Estilização e animações |
| **JavaScript (Vanilla)** | Lógica e interatividade |
| **Fetch API** | Requisições HTTP |
| **LocalStorage** | Armazenamento cliente |
| **Intersection Observer** | Animações ao scroll |

### Banco de Dados

| Tecnologia | Propósito |
|-----------|----------|
| **MySQL 8.0+** | Base de dados relacional |

### DevOps

| Ferramenta | Propósito |
|-----------|----------|
| **Git/GitHub** | Controlo de versão |
| **npm** | Gestor de pacotes |
| **.env** | Variáveis de ambiente |

---

## QUESTÕES DE DEFESA

### 1. Questões sobre Arquitetura

**Q1: Por que escolheu uma arquitetura de 3 camadas em vez de monolítico?**
Resposta: A arquitetura de 3 camadas oferece melhor separação de responsabilidades, tornando o código mais testável, mantivelmente e escalável. Cada camada pode ser desenvolvida/modificada independentemente.

**Q2: Como o sistema garante escalabilidade quando o número de utilizadores/produtos crescer drasticamente?**
Resposta: 
- Base de dados: Índices otimizados em colunas frequentemente consultadas
- API: Pool de ligações MySQL (conexão pooling) e caching futuro
- Frontend: SPA renderiza no cliente, reduzindo carga no servidor
- Scrapers: Executam paralelamente e off-peak (03:00 AM)

**Q3: Qual é a diferença entre soft delete e hard delete?**
Resposta: Soft delete marca registro como deletado (deleted_at != NULL) mas mantém dados na BD, permitindo recuperação. Hard delete remove fisicamente. Soft delete é mais seguro para auditoria e recuperação.

---

### 2. Questões sobre Base de Dados

**Q4: Por que a tabela Produto_Loja é tão importante no design?**
Resposta: Permite armazenar o MESMO produto em MÚLTIPLAS lojas com preços diferentes. Responde a perguntas críticas: "Qual é o melhor preço de Arroz?" sem duplicar dados de produto.

**Q5: Como evita dados duplicados (ex: produto "Arroz" inserido 2 vezes)?**
Resposta: Usa UNIQUE constraints e em scrapers valida por nome antes de inserir. Se produto existe, atualiza preço em Produto_Loja em vez de criar novo.

**Q6: Como garantiria consistência se múltiplos scrapers rodassem simultaneamente?**
Resposta: Usa transações MySQL e índices UNIQUE para evitar condições de corrida. Cada scraper obtém lock (escrita) durante UPSERT.

---

### 3. Questões sobre Scrapers

**Q7: Como lida com sites que bloqueiam scrapers (user-agent, rate limiting)?**
Resposta: 
- User-Agent customizado
- Delays entre requisições (500ms)
- Timeout de 35 segundos
- Retry automático com backoff exponencial

**Q8: O que acontece se um scraper falha durante a execução?**
Resposta: Logger registra erro em arquivo. Pipeline continua com próximas lojas. Estatísticas mostram número de erros. Admin é notificado via dashboard.

**Q9: Como mantém preços sempre atualizados sem prejudicar performance?**
Resposta: Scrapers executam fora de pico (03:00 AM), dados em cache, queries otimizadas com índices.

---

### 4. Questões sobre Autenticação

**Q10: Por que usar JWT em vez de sessões do servidor?**
Resposta: JWT é stateless (não precisa guardar sessões em BD), escalável para múltiplos servidores, e seguro se usado com HTTPS e JWT_SECRET forte.

**Q11: O que acontece se o token JWT é interceptado?**
Resposta: Deve-se usar HTTPS para encriptar tráfego em trânsito. Tokens têm expiração (lifetime curto). Implementar refresh tokens para renovação.

**Q12: Como valida que um utilizador só acessa as suas próprias listas?**
Resposta: Middleware verifica `req.user.id` contra `id_utilizador` da lista na BD. Recusa acesso se não coincidir (403 Forbidden).

---

### 5. Questões sobre Frontend

**Q13: Por que escolher Vanilla JavaScript em vez de framework como React?**
Resposta: 
- Sem dependências = código mais leve
- Sem build step = entrega rápida
- Educacional = aprender fundamentos
- Para projeto pequeno/médio, suficiente

**Q14: Como o roteamento hash funciona sem recarregar a página?**
Resposta: Evento `hashchange` do navegador detecta mudança de URL. JavaScript intercepta e renderiza página correspondente. Frontend controla totalmente a navegação.

**Q15: Como renderizar 10.000 produtos sem congelar o navegador?**
Resposta: 
- Paginação: 50 por página
- Virtualização (scroll infinito renderiza apenas itens visíveis)
- Web Workers para processar dados fora da main thread

---

### 6. Questões sobre Segurança

**Q16: Como protege dados sensíveis dos utilizadores?**
Resposta:
- Passwords: encriptadas com bcryptjs (nunca hash simples)
- JWT: verificado com JWT_SECRET forte
- Validação: input sanitization (evita SQL injection)
- HTTPS: em produção (encripta tráfego)

**Q17: Como evita SQL Injection?**
Resposta: Nunca concatena strings em SQL. Sempre usa parameterized queries: `db.execute("SELECT * FROM Produto WHERE nome = ?", [nome])`. O `?` é placeholder, valor separado.

**Q18: Se base de dados for hackeada, quais dados estão em risco?**
Resposta: 
- Passwords: Seguros (encriptados com bcrypt)
- Tokens JWT: Não armazenados em BD
- Emails, nomes: Em risco (dados PII)
- Preços: Baixo risco (dados públicos)
Mitigação: Implementar encriptação ao nível da BD, backups encriptados, logs de acesso.

---

### 7. Questões sobre Negócio/Produto

**Q19: Como monetiza Price360? Qual é o modelo de negócio?**
Resposta (possíveis modelos):
- Comissão de afiliado: Quando utilizador compra via link Price360
- Publicidade: Banners das lojas na plataforma
- Premium: Notificações de mudanças de preço, histórico
- B2B: Dados de preços para retalhistas/fornecedores

**Q20: Qual é o maior desafio técnico deste projeto?**
Resposta: Manter dados de preços sempre atualizados e precisos de múltiplas lojas. Requer: scrapers confiáveis, lidar com mudanças de estrutura HTML das lojas, gerir erros e exceções, balancear volume de dados vs. performance da BD.

---

## CONCLUSÃO

O **Price360** é um projeto completo que demonstra conhecimentos sólidos em:

✅ **Arquitetura de Software**: 3 camadas, padrões de design
✅ **Backend**: API REST, autenticação, validação, tratamento de erros
✅ **Banco de Dados**: Modelagem relacional, otimização, queries
✅ **Frontend**: SPA, roteamento, componentes, responsive design
✅ **Engenharia de Software**: Clean code, documentação, versionamento
✅ **DevOps**: Variáveis de ambiente, configuração, logs estruturados
✅ **Segurança**: JWT, encriptação, validação, autorização

Este projeto é **pronto para produção** (com pequenas melhorias) e demonstra capacidade de desenvolvedor Full Stack.

---

**Documento preparado em 26 de Maio de 2026**
**Projeto: Price360 - Sistema de Comparação de Preços em Angola**

