/**
 * @file BuitandaScraper.js
 * @description Scraper para Buitanda via API JSON oficial (api-production.buitanda.com).
 * A loja é um frontend Next.js; os dados vêm da API REST interna descoberta via Chrome headless.
 */

const BaseScraper = require('../base/BaseScraper');

const BUITANDA_API = 'https://api-production.buitanda.com/api';

class BuitandaScraper extends BaseScraper {
  constructor() {
    super(
      'Buitanda',
      'buitanda',
      'https://www.buitanda.com',
      {
        'Accept': 'application/json',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8',
      }
    );
  }

  /**
   * Busca produtos na API da Buitanda.
   * GET /api/products?search={query}&limit=N
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchProduct(query) {
    if (!query?.trim()) { this.log('warn', 'Query vazia'); return []; }

    const url = `${BUITANDA_API}/products?search=${encodeURIComponent(query)}&limit=40&page=1`;
    this.log('info', `Buscando: "${query}"`, { url });

    try {
      const data = await this.fetchWithRetry(url);

      const items = data?.data?.data;
      if (!Array.isArray(items)) {
        this.log('warn', 'Resposta inesperada da API Buitanda', { tipo: typeof items });
        return [];
      }

      const products = [];
      const seen = new Set();

      for (const p of items) {
        try {
          const name = String(p.name || '').trim();
          const slug = p.slug || p.SEOUrl;
          if (!name || name.length < 3 || !slug) continue;

          const productUrl = `${this.storeUrl}/product/${slug}`;

          // Evitar duplicados por URL
          if (seen.has(productUrl)) continue;
          seen.add(productUrl);

          // Preço: variante default → finalPrice (com imposto e desconto aplicados)
          const variant = Array.isArray(p.ProductVariant)
            ? (p.ProductVariant.find(v => v.isDefault) || p.ProductVariant[0])
            : null;

          const rawPrice = variant?.finalPrice
            ?? variant?.priceWithTaxWithDiscount
            ?? variant?.priceWithTaxWithoutDiscount
            ?? null;
          const price = this.normalizePrice(rawPrice);

          const quantity = Number(variant?.quantity ?? 0);
          if (quantity <= 0) continue; // esgotado

          const image = p.mainImage || variant?.images?.[0]?.url || null;
          const categoria = p.productCategories?.[0]?.name || null;

          const productData = {
            store: this.storeName,
            storeCode: this.storeCode,
            name,
            price,
            priceFormatted: this.formatPrice(price),
            currency: 'AKZ',
            url: productUrl,
            image,
            categoria,
            quantidade: quantity,
            source: 'Buitanda API',
            fetchedAt: new Date().toISOString(),
          };

          if (this.isValidProduct(productData)) {
            products.push(productData);
          }
        } catch (err) {
          this.log('warn', 'Erro ao processar produto', { erro: err.message });
        }
      }

      this.log('info', 'Busca completa', { query, total: products.length });
      return products;
    } catch (error) {
      this.log('error', 'Erro na busca', { query, error: error.message });
      return [];
    }
  }
}

module.exports = BuitandaScraper;
