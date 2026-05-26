# 🕷️ Sistema de Scrapers - Price360

Pipeline automatizado para coleta e atualização de preços de lojas de e-commerce em Angola.

## 📋 Arquitetura

```
src/scrapers/
├── base/
│   ├── BaseScraper.js       # Classe abstrata para todos os scrapers
│   └── ScraperConfig.js     # Configuração centralizada de lojas
├── stores/
│   ├── NcrScraper.js        # Implementação NCR Angola
│   ├── BuitandaScraper.js   # Implementação Buitanda
│   ├── MultiTekScraper.js   # Implementação MultiTek
│   └── ItecScraper.js       # Implementação iTec
├── pipeline/
│   ├── ScraperPipeline.js   # Orquestra execução de scrapers
│   ├── DatabaseUpsert.js    # Lógica de insert/update em BD
│   └── Logger.js            # Sistema estruturado de logs
├── scheduler.js             # Agendador com node-cron
└── index.js                 # Ponto de entrada
```

## 🚀 Funcionalidades

### 1. **Scrapers Extensíveis**
- Classe base `BaseScraper` com métodos utilitários comuns
- Cada loja tem sua própria implementação
- Suporte a retry automático com backoff

### 2. **Pipeline Automatizado**
- Executa múltiplos scrapers em paralelo (limite configurável)
- Busca produtos em vários termos simultaneamente
- Faz upsert automático em `Produto_Loja`

### 3. **Agendamento Automático**
- **03:00 AM**: Execução principal do pipeline
- **02:00 AM (Domingos)**: Limpeza de logs antigos
- **02:00 AM (1º do mês)**: Limpeza de dados obsoletos

### 4. **Sistema de Logs Estruturado**
- Logs em arquivo com timestamp (um por dia)
- Output colorido no console
- Estrutura JSON para análise

## ⚙️ Configuração

### Ativar/Desativar Scheduler
No `.env`:
```bash
ENABLE_SCRAPERS=true    # Ativa o scheduler
ENABLE_SCRAPERS=false   # Desativa o scheduler (desenvolvimento)
```

### Adicionar Nova Loja

1. **Criar Scraper** (`src/scrapers/stores/NovaLojasScraper.js`):
```javascript
const BaseScraper = require('../base/BaseScraper');

class NovaLojasScraper extends BaseScraper {
  constructor() {
    super(
      'Nome da Loja',
      'codigo_loja',
      'https://www.loja.com',
      { /* headers customizados */ }
    );
  }

  async searchProduct(query) {
    // Implementar lógica específica
    return [{
      name: 'Produto',
      price: 1000,
      url: 'https://...',
      image: 'https://...',
      storeCode: 'codigo_loja'
    }];
  }
}

module.exports = NovaLojasScraper;
```

2. **Registar em `ScraperConfig.js`**:
```javascript
const NovaLojasScraper = require('../stores/NovaLojasScraper');

const SCRAPER_CONFIG = {
  // ... outras lojas ...
  novasloja: {
    nome: 'Nova Loja',
    codigo: 'novasloja',
    url: 'https://www.loja.com',
    scraperClass: NovaLojasScraper,
    ativo: true,
    categoria_principal: 'Tecnologia',
    categorias: ['Laptops', 'Telemóveis'],
    // ... rest da config ...
  }
};
```

## 📊 Estrutura de Dados

### Produto retornado por Scraper
```javascript
{
  store: 'NCR Angola',
  storeCode: 'ncr',
  name: 'Laptop Dell XPS 13',
  price: 1500000,              // Em número (sem formatação)
  priceFormatted: '1.500.000', // String formatada
  currency: 'AKZ',
  url: 'https://...',
  image: 'https://...',
  source: 'VTEX API',
  fetchedAt: '2026-05-26T03:00:00Z'
}
```

### Resultado de Upsert
```javascript
{
  action: 'insert' | 'update' | 'error',
  success: boolean,
  data: {
    id_produto_loja: number,
    id_produto: number,
    id_loja: number
  },
  produto: { id: number, nome: string },
  preco: number,
  moeda: string,
  timestamp: ISO8601
}
```

## 📡 Estatísticas do Pipeline

```javascript
{
  startTime: Date,
  endTime: Date,
  totalDuration: number,        // Milissegundos
  processed: number,             // Lojas processadas
  failed: number,                // Lojas com erro
  totalInserts: number,
  totalUpdates: number,
  totalErrors: number,
  scrapers: {
    'ncr': { success, upsertStats, ... },
    // ... outras lojas ...
  }
}
```

## 🔧 Uso Manual

### Executar Pipeline Manualmente
```javascript
const { getScheduler } = require('./scrapers/scheduler');

const scheduler = getScheduler();
const stats = await scheduler.executeNow(['iPhone', 'Laptop']);
console.log(stats);
```

### Obter Estatísticas de BD
```javascript
const { DatabaseUpsert } = require('./scrapers');

const stats = await DatabaseUpsert.getStats();
// {
//   total_produtos: 150,
//   total_lojas: 4,
//   total_registros: 240,
//   preco_medio: 500000,
//   ...
// }
```

### Limpeza de Dados Antigos
```javascript
const { DatabaseUpsert } = require('./scrapers');

// Remove registros com mais de 30 dias sem atualização
await DatabaseUpsert.cleanOldData(30);
```

## 📝 Logs

Logs guardados em `./logs/scrapers/` com nome:
```
scraper_2026-05-26.log
scraper_2026-05-27.log
```

Cada linha é um JSON estruturado:
```json
{
  "timestamp": "2026-05-26T03:00:15.123Z",
  "level": "INFO",
  "message": "[NCR Angola] Busca completa",
  "query": "Laptop",
  "totalFound": 45
}
```

## ⚠️ Tratamento de Erros

- **Retry automático**: 3 tentativas com backoff crescente
- **Validação de produtos**: Só inserem produtos com nome, preço válido
- **Logs detalhados**: Cada erro é registado com stack trace
- **Graceful degradation**: Falha de 1 loja não afeta outras

## 🔐 Segurança

- User-Agent customizado para evitar bloqueios
- Timeout de 35 segundos por requisição
- Rate limiting com delays entre buscas (500ms)
- Limite de 1000 produtos por scraper por execução

## 📈 Próximas Melhorias

- [ ] Implementação completa de Buitanda, MultiTek, iTec
- [ ] Suporte a Kero, Shoprite, Jumbo
- [ ] Scraping de avaliações e disponibilidade
- [ ] Webhook para notificações de mudanças de preço
- [ ] Dashboard de monitoramento
- [ ] Histórico de preços (evolução temporal)

## 🚦 Status Atual

- ✅ Arquitetura base implementada
- ✅ NCR Angola funcional (VTEX API)
- ✅ Pipeline e scheduler funcionais
- ⏳ Buitanda, MultiTek, iTec em progresso
- ⏳ Dashboard de monitoramento pendente

---

**Mantido por**: Marcilio (2026)
