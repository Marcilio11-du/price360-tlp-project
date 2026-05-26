/**
 * @file ItecScraper.js
 * @description Scraper para iTec.
 */

const BaseScraper = require('../base/BaseScraper');

class ItecScraper extends BaseScraper {
  constructor() {
    super(
      'iTec',
      'itec',
      'https://www.itec.co.ao',
      { 'Accept': 'application/json' }
    );
  }

  async searchProduct(query) {
    if (!query || !String(query).trim()) {
      this.log('warn', 'Query vazia recebida');
      return [];
    }

    try {
      // TODO: Implementar lógica específica do iTec
      this.log('info', 'iTec scraper ainda não implementado completamente');
      return [];
    } catch (error) {
      this.log('error', 'Erro na busca de produtos', { query, error: error.message });
      return [];
    }
  }
}

module.exports = ItecScraper;
