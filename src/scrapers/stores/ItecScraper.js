/**
 * @file ItecScraper.js
 * @description Scraper para iTec Angola. Tenta primeiro a Store API do
 * WooCommerce (wp-json); se indisponível, cai para parsing HTML da pesquisa.
 */

const WooCommerceRestScraper = require('../base/WooCommerceRestScraper');
const cheerio = require('cheerio');

class ItecScraper extends WooCommerceRestScraper {
  constructor() {
    super(
      'iTec',
      'itec',
      'https://www.itec.co.ao',
      {
        'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8',
      }
    );
  }

  /**
   * Fallback: scraping HTML da página de resultados (tema WooCommerce clássico).
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchProductHtml(query) {
    const url = `${this.storeUrl}/?s=${encodeURIComponent(query)}&post_type=product`;
    this.log('info', `Fallback HTML: "${query}"`, { url });

    try {
      const html = await this.fetchWithRetry(url, { responseType: 'text' });
      const htmlStr = typeof html === 'string' ? html : '';
      if (!htmlStr) return [];

      // Cloudflare interstitial?
      if (/Just a moment|challenge-platform/i.test(htmlStr)) {
        this.log('warn', 'Página devolvida é challenge Cloudflare — sem dados', { query });
        return [];
      }

      const $ = cheerio.load(htmlStr);
      const products = [];

      $('li.product, div.type-product, .product-grid-item').each((_, el) => {
        const $p = $(el);
        const $link = $p.find('.woocommerce-loop-product__title').length
          ? $p.find('a').first()
          : $p.find('.product-title a, h2 a, h3 a').first();

        const name = ($p.find('.woocommerce-loop-product__title').text().trim()
          || $link.text().trim());
        const productUrl = $link.attr('href') || '';

        if (!name || name.length < 3 || !productUrl) return;

        let priceText = $p.find('.woocommerce-Price-amount bdi').first().text().trim()
          || $p.find('.price').first().text().trim()
          || '';

        const price = this.normalizePrice(priceText.replace(/[^\d.,]/g, ''));

        const image = $p.find('img').first().attr('src') || null;

        products.push({
          store: this.storeName,
          storeCode: this.storeCode,
          name,
          price,
          priceFormatted: this.formatPrice(price),
          currency: 'AKZ',
          url: productUrl,
          image,
          source: 'HTML/cheerio',
          fetchedAt: new Date().toISOString(),
        });
      });

      return products.filter((p) => this.isValidProduct(p));
    } catch (error) {
      const blockReason = this.detectBlock(error);
      if (blockReason) {
        this.log('warn', 'Acesso bloqueado no fallback HTML', { motivo: blockReason });
      } else {
        this.log('error', 'Erro no fallback HTML', { error: error.message });
      }
      return [];
    }
  }

  async searchProduct(query) {
    if (!query?.trim()) { this.log('warn', 'Query vazia'); return []; }

    // 1) Tentar Store API REST
    const viaApi = await super.searchProduct(query);
    if (viaApi.length > 0) return viaApi;

    // 2) Fallback HTML
    return this.searchProductHtml(query);
  }
}

module.exports = ItecScraper;
