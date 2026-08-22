const db = require('../config/db');
const NcrScraper = require('../scrapers/stores/NcrScraper');
const DatabaseUpsert = require('../scrapers/pipeline/DatabaseUpsert');

const DEFAULT_SEARCH_TERMS = [
  'Laptop',
  'Notebook',
  'iPhone',
  'Samsung Galaxy',
  'Tablet',
  'Monitor',
  'Teclado',
  'Mouse',
  'Headset',
  'Webcam',
  'SSD',
  'Cabo USB',
  'Smartwatch',
  'Carregador',
  'Impressora',
  'Projetor',
  'Router',
  'Processador',
  'Placa de Vídeo',
  'Cadeira Gamer',
  'Telemóvel',
  'Geladeira',
  'TV',
  'Arroz',
  'Feijão',
  'Leite',
  'Óleo de Palma',
  'Banana',
  'Tomate'
];

const normalizeProduct = (item) => {
  if (!item) return null;

  const name = item.name || item.productName || item.title;
  if (!name || !String(name).trim()) return null;

  const imageCandidate =
    item.image ||
    item.images?.[0]?.imageUrl ||
    item.items?.[0]?.images?.[0]?.imageUrl ||
    null;

  const seller = item.items?.[0]?.sellers?.[0] || item.seller || {};
  const commercialOffer = seller.commertialOffer || seller.commercialOffer || {};
  const price = Number(item.price ?? commercialOffer.Price ?? 0);
  const quantity = Number(item.quantidade ?? item.stock ?? commercialOffer.AvailableQuantity ?? 1);

  if (!Number.isFinite(price) || price <= 0) return null;

  return {
    name: String(name).trim(),
    price,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    stock: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    currency: item.currency || 'AKZ',
    category: item.category || item.categoria || 'Tecnologia',
    categoria: item.category || item.categoria || 'Tecnologia',
    url: item.url || item.link || null,
    image: imageCandidate || null,
    storeCode: item.storeCode || 'ncr',
    store: item.store || 'NCR Angola'
  };
};

async function getCurrentProductCount() {
  // Catálogo vendável = ofertas em Produto_Loja (produtos sem oferta não
  // aparecem no site; a listagem usa INNER JOIN).
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM Produto_Loja WHERE deleted_at IS NULL');
  return Number(rows[0]?.total || 0);
}

async function ensureRealCatalogBootstrap({
  minProducts = 120,
  maxProducts = 200,
  searchTerms = DEFAULT_SEARCH_TERMS,
  limitPerSearch = 18
} = {}) {
  const current = await getCurrentProductCount();
  if (current >= minProducts) {
    return {
      bootstrapped: false,
      current,
      minProducts,
      reason: 'catalog already has enough products'
    };
  }

  const scraper = new NcrScraper();
  const seen = new Set();
  const collected = [];

  for (const term of searchTerms) {
    try {
      const results = await scraper.searchProduct(term);
      for (const item of results) {
        const product = normalizeProduct({ ...item, storeCode: 'ncr', store: 'NCR Angola' });
        if (!product) continue;

        const key = product.name.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        collected.push(product);

        if (collected.length >= maxProducts) {
          break;
        }
      }

      if (collected.length >= maxProducts) {
        break;
      }
    } catch (error) {
      console.warn(`Bootstrap real catalog: erro ao buscar "${term}"`, error.message || error);
    }
  }

  if (!collected.length) {
    return {
      bootstrapped: false,
      current,
      collected: 0,
      reason: 'no real catalog entries were collected from NCR'
    };
  }

  const stats = await DatabaseUpsert.upsertBatch(collected.slice(0, maxProducts));
  const finalCount = await getCurrentProductCount();

  return {
    bootstrapped: true,
    current,
    inserted: stats.inserts + stats.updates + stats.skips,
    finalCount,
    collected: collected.length,
    stats
  };
}

module.exports = {
  DEFAULT_SEARCH_TERMS,
  ensureRealCatalogBootstrap
};
