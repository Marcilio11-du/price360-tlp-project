/**
 * @file NcrScraper.js
 * @description Scraper para NCR Angola (usando API VTEX).
 */

const BaseScraper = require('../base/BaseScraper');

class NcrScraper extends BaseScraper {
  constructor() {
    super(
      'NCR Angola',
      'ncr',
      'https://www.ncrangola.com',
      {
        'Accept': 'application/json'
      }
    );
  }

  /**
   * Busca produtos na API VTEX da NCR.
   * @param {string} query - Termo de busca
   * @returns {Promise<Array>} Produtos encontrados
   */
  async searchProduct(query) {
    if (!query || !String(query).trim()) {
      this.log('warn', 'Query vazia recebida');
      return [];
    }

    try {
      const url = `${this.storeUrl}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
      
      this.log('info', `Buscando: "${query}"`, { url });

      const data = await this.fetchWithRetry(url);

      if (!Array.isArray(data)) {
        this.log('warn', 'Resposta não é um array', { response: typeof data });
        return [];
      }

      const products = [];

      data.forEach(product => {
        try {
          const name = product.productName;
          const productUrl = product.link;
          const item = product.items?.[0];
          const image = item?.images?.[0]?.imageUrl;
          const seller = item?.sellers?.[0];
          const priceValue = seller?.commertialOffer?.Price;

          const productData = {
            store: this.storeName,
            storeCode: this.storeCode,
            name,
            price: this.normalizePrice(priceValue),
            priceFormatted: this.formatPrice(priceValue),
            currency: 'AKZ',
            url: productUrl,
            image,
            source: 'VTEX API',
            fetchedAt: new Date().toISOString()
          };

          if (this.isValidProduct(productData)) {
            products.push(productData);
          }
        } catch (error) {
          this.log('warn', `Erro ao processar produto`, { error: error.message });
        }
      });

      this.log('info', `Busca completa`, {
        query,
        totalFound: products.length,
        valid: products.length
      });

      return products;
    } catch (error) {
      this.log('error', 'Erro na busca de produtos', {
        query,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Busca todos os produtos de uma categoria (para sincronização em massa).
   * @param {number} categoryId - ID da categoria na NCR
   * @returns {Promise<Array>} Produtos da categoria
   */
  async fetchCategory(categoryId) {
    try {
      const url = `${this.storeUrl}/api/catalog_system/pub/products/search?O=OrderByBestDiscountDESC&_from=0&_to=100&fq=C%3A${categoryId}`;
      
      this.log('info', `Buscando categoria`, { categoryId });

      const data = await this.fetchWithRetry(url);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      this.log('error', 'Erro ao buscar categoria', {
        categoryId,
        error: error.message
      });
      return [];
    }
  }
}

module.exports = NcrScraper;
