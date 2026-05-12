# Price360 — Frontend

SPA pura em HTML/CSS/JS (sem frameworks, sem dependências).

## Estrutura

```
frontend/
├── index.html              ← Entry point da SPA
├── assets/
│   ├── logo.png            ← ⚠️ Coloca aqui o logo do projeto
│   └── product-placeholder.png  ← ⚠️ Imagem de fallback para produtos
├── css/                    ← 15 ficheiros CSS (design system + componentes + páginas)
└── js/
    ├── app.js              ← Entry point JS (regista rotas, monta navbar)
    ├── router.js           ← Router hash-based
    ├── api.js              ← Cliente HTTP (fetch wrapper com JWT automático)
    ├── auth.js             ← Gestão de autenticação (localStorage)
    ├── utils.js            ← Utilitários (formatPrice, debounce, etc.)
    ├── animations.js       ← Intersection Observer (scroll animations)
    ├── components/         ← Componentes reutilizáveis
    │   ├── Navbar.js
    │   ├── Footer.js
    │   ├── ProductCard.js
    │   ├── CategoryCard.js
    │   ├── Toast.js
    │   ├── Modal.js
    │   └── Loader.js
    └── pages/              ← Páginas da SPA
        ├── HomePage.js
        ├── ProductsPage.js
        ├── LoginPage.js
        ├── RegisterPage.js
        ├── ShoppingListPage.js
        └── AdminDashboardPage.js
```

## Como executar

> ⚠️ **Necessita de um servidor HTTP** — não abre directamente via `file://` por causa dos ES6 modules.

### Opção 1 — Com o backend já em execução (recomendado)

```bash
# Na raiz do projecto (price360-tlp-project/)
npm run dev   # inicia o backend em http://localhost:3000

# Noutra janela de terminal, dentro de frontend/
npx serve .   # ou python3 -m http.server 8080
```

Abre: **http://localhost:8080**

### Opção 2 — VS Code Live Server
- Clica com o botão direito em `frontend/index.html`
- "Open with Live Server"

## Assets necessários

Coloca os seguintes ficheiros em `frontend/assets/`:

| Ficheiro | Descrição |
|---|---|
| `logo.png` | Logo do Price360 (fornecido no protótipo) |
| `product-placeholder.png` | Imagem de fallback para produtos sem imagem |

Para imagens de produtos específicas, cria `assets/products/{id_produto}.jpg`.

## Rotas disponíveis

| URL | Página | Auth |
|---|---|---|
| `#/` | Home (hero + categorias + produtos em destaque) | Pública |
| `#/produtos` | Listagem de produtos por preço | Pública |
| `#/produtos?q=banana` | Pesquisa de produtos | Pública |
| `#/produtos?categoria=1` | Filtro por categoria | Pública |
| `#/login` | Login com JWT | Pública |
| `#/cadastro` | Registo de utilizador | Pública |
| `#/lista` | Listas de compras do utilizador | 🔐 Auth |
| `#/admin` | Dashboard do administrador | 🔐 Admin |

## Variável de ambiente

O frontend aponta por defeito para `http://localhost:3000/api/v1`.  
Para alterar, edita `js/api.js`:
```js
const API_BASE = 'http://localhost:3000/api/v1';
```

## Animações

Todos os elementos com a classe `animate-scroll` surgem de baixo para cima ao entrar no viewport (Intersection Observer API). O stagger é automático com base no `nth-child`.
