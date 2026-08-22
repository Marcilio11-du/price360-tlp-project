/**
 * @file WooCommerceRestScraper.js
 * @description Classe base para lojas WooCommerce usando a Store API pública
 * (/wp-json/wc/store/v1/products). Evita parsing frágil de HTML e devolve JSON
 * estruturado com preços, stock e imagens.
 *
 * Se a loja estiver atrás de Cloudflare challenge, o erro é reportado de forma
 * clara para diagnóstico no pipeline.
 */

const BaseScraper = require('./BaseScraper');

class WooCommerceRestScraper extends BaseScraper {
  /**
   * @param {string} storeName
   * @param {string} storeCode
   * @param {string} storeUrl  URL raiz da loja WordPress
   * @param {object} headers   Headers extra
   */
  constructor(storeName, storeCode, storeUrl, headers = {}) {
    super(storeName, storeCode, storeUrl, {
      'Accept': 'application/json',
      ...headers,
    });
  }

  /**
   * Detecta respostas de bloqueio (Cloudflare/WAF) para logs accionáveis.
   * @param {Error} error
   * @returns {string|null} Descrição do bloqueio ou null
   */
  detectBlock(error) {
    const status = error?.response?.status;
    const body = typeof error?.response?.data === 'string' ? error.response.data : '';
    if (status === 403 || status === 503 || /just a moment|cf-browser-verification|challenge/i.test(body)) {
      return 'Cloudflare/WAF bloqueou o pedido (403/503). O site só é acessível a partir de redes não sinalizadas — considerar execução a partir de IP residencial/Angolano ou proxy.';
    }
    return null;
  }

  /**
   * Converte preço da Store API (inteiro em unidades menores) para número.
   * @param {object} prices  Bloco prices do produto
   * @returns {number}
   */
  parseApiPrice(prices) {
    if (!prices) return 0;
    const raw = parseInt(prices.price ?? prices.regular_price ?? '0', 10);
    const minor = Number.isFinite(parseInt(prices.currency_minor_unit, 10))
      ? parseInt(prices.currency_minor_unit, 10)
      : 2;
    return raw / Math.pow(10, minor);
  }

  async searchProduct(query) {
    if (!query?.trim()) { this.log('warn', 'Query vazia'); return []; }

    const url = `${this.storeUrl}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=40`;
    this.log('info', `Buscando (WooCommerce REST): "${query}"`, { url });

    try {
      const data = await this.fetchWithRetry(url);

      if (!Array.isArray(data)) {
        this.log('warn', 'Resposta inesperada da Store API', { tipo: typeof data });
        return [];
      }

      const products = [];

      for (const p of data) {
        try {
          const name = String(p.name || '').trim();
          if (!name || name.length < 3) continue;

          // Ignorar produtos variáveis sem preço ou fora de stock
          if (p.is_in_stock === false) continue;

          const price = this.parseApiPrice(p.prices);
          const image = p.images?.[0]?.src || null;
          const categoria = p.categories?.[0]?.name || null;
          const quantity = Number(p.stock_quantity ?? 0);

          products.push({
            store: this.storeName,
            storeCode: this.storeCode,
            name,
            price,
            priceFormatted: this.formatPrice(price),
            currency: p.prices?.currency_code || 'AOZ',
            url: p.permalink || this.storeUrl,
            image,
            categoria,
            quantidade: quantity > 0 ? quantity : 1,
            source: 'WooCommerce REST',
            fetchedAt: new Date().toISOString(),
          });
        } catch (err) {
          this.log('warn', 'Erro ao processar produto', { erro: err.message });
        }
      }

      this.log('info', 'Busca completa', { query, total: products.length });
      return products.filter((p) => this.isValidProduct(p));
    } catch (error) {
      const blockReason = this.detectBlock(error);
      if (blockReason) {
        this.log('warn', 'Acesso bloqueado', { query, motivo: blockReason });
      } else {
        this.log('error', 'Erro na busca', { query, error: error.message });
      }
      return [];
    }
  }
}

module.exports = WooCommerceRestScraper;
