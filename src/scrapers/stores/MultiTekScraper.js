/**
 * @file MultiTekScraper.js
 * @description Scraper para MultiTek Angola.
 * Site WooCommerce — usa axios + cheerio (Puppeteer não disponível em produção).
 * Portado do scraper externo em scraper/scraping/scrapers/multitek.js.
 */

const BaseScraper = require('../base/BaseScraper');
const cheerio    = require('cheerio');

class MultiTekScraper extends BaseScraper {
  constructor() {
    super(
      'MultiTek',
      'multitek',
      'https://www.multitek.ao',
      {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8',
        'Cache-Control': 'no-cache',
      }
    );
  }

  /**
   * Busca produtos na MultiTek (WooCommerce) via axios + cheerio.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchProduct(query) {
    if (!query?.trim()) { this.log('warn', 'Query vazia'); return []; }

    const url = `${this.storeUrl}/?s=${encodeURIComponent(query)}&post_type=product`;
    this.log('info', `Buscando: "${query}"`, { url });

    try {
      const html = await this.fetchWithRetry(url, { responseType: 'text' });
      // axios com responseType: 'text' retorna string directamente
      const htmlStr = typeof html === 'string' ? html : JSON.stringify(html);
      const $       = cheerio.load(htmlStr);
      const products = [];

      // Selectores WooCommerce/Woodmart comuns
      $('div.type-product, div.product-grid-item, .product-layout').each((_, el) => {
        const $p    = $(el);
        const $link = $p.find([
          'h3.product-title a',
          'h2.product-title a',
          '.product-title a',
          '.wd-entities-title a',
        ].join(', ')).first();

        const name = $link.text().trim();
        const productUrl = $link.attr('href') || '';

        if (!name || name.length < 3) return;

        // Preço WooCommerce
        let priceText = $p.find('.woocommerce-Price-amount bdi').first().text().trim()
                     || $p.find('.price').first().text().trim();
        priceText = priceText.replace(/Kz/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        const price = parseFloat(priceText) || 0;

        const image = $p.find('.product-image img, .wp-post-image').first().attr('src')
                   || $p.find('img.hover-slider-init').attr('src')
                   || null;

        if (this.isValidProduct({ name, price })) {
          products.push({
            store:     this.storeName,
            storeCode: this.storeCode,
            name,
            price,
            priceFormatted: this.formatPrice(price),
            currency: 'AKZ',
            url:      productUrl,
            image,
            source:   'HTML/cheerio (WooCommerce)',
            fetchedAt: new Date().toISOString(),
          });
        }
      });

      this.log('info', `Busca completa`, { query, total: products.length });
      return products;
    } catch (error) {
      this.log('error', 'Erro na busca', { query, error: error.message });
      return [];
    }
  }
}

module.exports = MultiTekScraper;