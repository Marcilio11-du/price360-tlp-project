/**
 * @file BuitandaScraper.js
 * @description Scraper para Buitanda (HTML scraping com cheerio).
 * Portado do scraper externo em scraper/scraping/scrapers/buitanda.js.
 */

const BaseScraper = require('../base/BaseScraper');
const cheerio    = require('cheerio');
const dns        = require('dns');

// Prioridade IPv4 para mitigar latências de rede locais
dns.setDefaultResultOrder('ipv4first');

class BuitandaScraper extends BaseScraper {
  constructor() {
    super(
      'Buitanda',
      'buitanda',
      'https://www.buitanda.com',
      {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    );
  }

  /**
   * Busca produtos na Buitanda via HTML scraping com cheerio.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchProduct(query) {
    if (!query?.trim()) { this.log('warn', 'Query vazia'); return []; }

    const url = `${this.storeUrl}/search?search=${encodeURIComponent(query)}`;
    this.log('info', `Buscando: "${query}"`, { url });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...this.headers },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const $    = cheerio.load(html);
      const products = [];
      const seen = new Set();

      // Seletor flexível: qualquer âncora com "/product/" no href
      $('a[href*="/product/"]').each((_, el) => {
        const $card = $(el);

        let name = $card.find('h3').text().trim()
                || $card.find('h4').text().trim()
                || $card.find('img').attr('alt')?.trim()
                || '';

        if (!name || name.length < 3) return;

        const href       = $card.attr('href') || '';
        const productUrl = href.startsWith('http') ? href : `${this.storeUrl}${href}`;

        // Evitar duplicados por URL
        if (seen.has(productUrl)) return;
        seen.add(productUrl);

        const image = $card.find('img').first().attr('src') || null;

        // Tentar extrair preço: elemento com "Kz" no texto
        let priceText = '';
        $card.find('*').each((_, node) => {
          const t = $(node).text().trim();
          if (t.includes('Kz') && t.length < 30) { priceText = t; }
        });

        if (!priceText) {
          priceText = $card.find('.font-bold, .text-gray-900').last().text().trim();
        }

        // Ignorar esgotados
        const cardText = $card.text().toLowerCase();
        if (cardText.includes('esgotado') || cardText.includes('indisponível')) return;

        // Limpar e converter preço
        const cleanPrice = priceText.replace(/Kz/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        const price = parseFloat(cleanPrice) || 0;

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
            source:   'HTML/cheerio',
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

module.exports = BuitandaScraper;