# PRICE360 — RELATÓRIO RESUMIDO

## O que é Price360?

**Price360** é uma plataforma que permite comparar preços de produtos entre múltiplas lojas em Angola. Utilizadores pesquisam um produto e veem instantaneamente os preços em todas as lojas participantes, permitindo encontrar a melhor oferta.

## Problemática e Motivação

- **Problema**: Mercado fragmentado em Angola; consumidores não conseguem comparar preços facilmente
- **Solução**: Plataforma centralizada que agrega dados de múltiplas lojas
- **Benefício**: Transparência, economia de tempo, poupança de dinheiro

## Arquitetura (3 Camadas)

```
Frontend (Vanilla JS SPA)  →  Backend (Express API)  →  MySQL Database
   ↓ Requisições HTTP     ↓ Processa lógica        ↓ Armazena dados
   ↓ Renderiza UI         ↓ Autentica              ↓ Índices otimizados
```

## Banco de Dados - Tabelas Principais

| Tabela | Propósito |
|--------|-----------|
| **Utilizador** | Contas de utilizadores com passwords encriptadas |
| **Produto** | Produtos (nome, marca, categoria) |
| **Loja** | Lojas/superfícies comerciais |
| **Produto_Loja** |  **Central** - Liga produtos a lojas com preços |
| **Shopping_List** | Listas de compras do utilizador |

A tabela **Produto_Loja** é crucial: permite o MESMO produto estar em múltiplas lojas com preços diferentes.

## Componentes Principais

### 1. Frontend (SPA - Single Page Application)
- Roteamento hash-based (`#/produtos`, `#/lista`)
- Componentes reutilizáveis (ProductCard, Navbar, Modal)
- Responsivo (desktop, tablet, móvel)
- Animações ao scroll

### 2. Backend (API REST)
```
GET  /api/v1/products/search?q=arroz      → Pesquisa produtos
GET  /api/v1/products/:id                 → Detalhes + preços em lojas
POST /api/v1/auth/login                   → Autenticação com JWT
GET  /api/v1/user/lists                   → Listas do utilizador
POST /api/v1/user/lists/:id/items         → Adiciona produto à lista
```

### 3. Sistema de Scrapers (Automático)
- **Node-cron**: Agenda execução automaticamente (3:00 AM diariamente)
- **NcrScraper**: Coleta preços da NCR via API VTEX
- **DatabaseUpsert**: Insere/atualiza preços em Produto_Loja
- Logs estruturados de sucesso/erro

## Fluxo de Dados (Exemplo: Pesquisa)

```
Utilizador digita "Arroz"
    ↓
Frontend: router.navigate('/produtos?q=Arroz')
    ↓
API GET /products/search?q=Arroz
    ↓
Backend valida token JWT
    ↓
Model: SELECT * FROM Produto WHERE nome LIKE '%Arroz%'
    ↓
Para cada produto: SELECT * FROM Produto_Loja (busca preços em lojas)
    ↓
Retorna JSON com produtos + preços
    ↓
Frontend renderiza cards dinamicamente
    ↓
Utilizador vê: "3 tipos de arroz com preços em diferentes lojas"
```

## Autenticação e Segurança

| Aspeto | Implementação |
|--------|---------------|
| **Passwords** | Encriptadas com bcryptjs (hash irreversível) |
| **Autenticação** | JWT (token stateless com expiração) |
| **Autorização** | Middlewares verificam role (user/admin) |
| **Validação** | Input sanitization (evita SQL injection) |
| **HTTPS** | Recomendado em produção |

## Funcionalidades Principais

1. ✅ **Pesquisa e Filtro**: Nome, categoria, preço
2. ✅ **Comparação de Preços**: Mesmo produto em múltiplas lojas
3. ✅ **Listas de Compras**: Guardar produtos para comparar depois
4. ✅ **Autenticação**: Login/Registo seguro
5. ✅ **Dashboard Admin**: Estatísticas e gestão
6. ✅ **Atualização Automática**: Scrapers atualizam preços via agendamento

## Tecnologias Utilizadas

**Backend**: Node.js, Express, MySQL2, bcryptjs, JWT, axios, node-cron
**Frontend**: HTML5, CSS3, Vanilla JavaScript, Fetch API, LocalStorage
**Segurança**: JWT, bcryptjs, CORS, validação de entrada

---

## 20 QUESTÕES DE DEFESA

### Arquitetura
**Q1**: Por que 3 camadas em vez de monolítico?
**R**: Separação de responsabilidades, melhor testabilidade e escalabilidade.

**Q2**: Como escala quando crescer o número de utilizadores?
**R**: Pool de ligações MySQL, índices otimizados, SPA renderiza no cliente, scrapers executam off-peak.

**Q3**: Diferença entre soft delete e hard delete?
**R**: Soft delete marca como deletado (deleted_at != NULL) permitindo recuperação. Hard delete remove fisicamente.

### Base de Dados
**Q4**: Por que Produto_Loja é crítica?
**R**: Permite MESMO produto em múltiplas lojas com preços diferentes, respondendo "qual é o melhor preço?" sem duplicar dados.

**Q5**: Como evita duplicatas?
**R**: UNIQUE constraints e em scrapers valida por nome; se existe, atualiza em Produto_Loja.

**Q6**: Consistência com múltiplos scrapers simultâneos?
**R**: Transações MySQL e índices UNIQUE previnem condições de corrida.

### Scrapers
**Q7**: Como lida com bloqueios de scrapers (rate limiting)?
**R**: User-Agent customizado, delays entre requisições (500ms), timeout 35s, retry com backoff.

**Q8**: Se scraper falha?
**R**: Logger registra erro, pipeline continua com próximas lojas, admin notificado via dashboard.

**Q9**: Preços sempre atualizados sem prejudicar performance?
**R**: Scrapers executam fora de pico (3:00 AM), queries otimizadas com índices.

### Autenticação
**Q10**: Por que JWT em vez de sessões?
**R**: Stateless, escalável para múltiplos servidores, seguro com HTTPS e JWT_SECRET forte.

**Q11**: Se token JWT é interceptado?
**R**: Usar HTTPS encripta tráfego, tokens têm expiração curta, implementar refresh tokens.

**Q12**: Como validar acesso às próprias listas?
**R**: Middleware verifica req.user.id contra id_utilizador da lista na BD, recusa se não coincidir (403).

### Frontend
**Q13**: Por que Vanilla JavaScript em vez de React?
**R**: Sem dependências (mais leve), sem build step, educacional, suficiente para projeto médio.

**Q14**: Como roteamento hash funciona sem recarregar página?
**R**: Evento hashchange detecta mudança de URL, JavaScript renderiza página correspondente.

**Q15**: Renderizar 10.000 produtos sem congelar?
**R**: Paginação (50/página), virtualização (scroll infinito), Web Workers para processar off-thread.

### Segurança
**Q16**: Como protege dados sensíveis?
**R**: Passwords encriptadas (bcryptjs), JWT verificado, input sanitization, HTTPS em produção.

**Q17**: Como evita SQL Injection?
**R**: Nunca concatena strings; sempre parameterized queries: `db.execute("... WHERE nome = ?", [nome])`.

**Q18**: Se BD hackeada, quais dados em risco?
**R**: Passwords seguras (bcrypt), emails/nomes em risco, preços baixo risco. Mitigar: encriptação BD, backups, logs.

### Negócio
**Q19**: Como monetiza?
**R**: Comissão de afiliado (compras via link), publicidade das lojas, premium (notificações), B2B (dados de preços).

**Q20**: Maior desafio técnico?
**R**: Manter preços atualizados e precisos de múltiplas lojas: scrapers confiáveis, mudanças de estrutura HTML, volume de dados vs performance BD.

---

## Conclusão

**Price360** demonstra conhecimentos em:
✅ Arquitetura de Software (3 camadas)
✅ Backend (API REST, JWT, validação)
✅ Banco de Dados (modelagem relacional, otimização)
✅ Frontend (SPA, responsividade, componentes)
✅ Segurança (encriptação, autorização)
✅ Automação (scrapers, agendamento)
✅ DevOps (variáveis de ambiente, logs)

**Pronto para produção** (com pequenas melhorias implementadas).

