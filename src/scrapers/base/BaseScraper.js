/**
 * @file BaseScraper.js
 * @description Classe abstrata para todos os scrapers de lojas.
 * Define interface padrão e métodos utilitários comuns.
 */

const axios = require('axios');

class BaseScraper {
  /**
   * Construtor da classe base.
   * @param {string} storeName - Nome da loja (ex: "NCR Angola")
   * @param {string} storeCode - Código único da loja (ex: "ncr")
   * @param {string} storeUrl - URL base da loja
   * @param {object} headers - Headers HTTP customizados
   */
  constructor(storeName, storeCode, storeUrl, headers = {}) {
    this.storeName = storeName;
    this.storeCode = storeCode;
    this.storeUrl = storeUrl;
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      ...headers
    };
    this.timeout = 35000; // 35 segundos
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 segundos entre tentativas
  }

  /**
   * Método abstrato que deve ser implementado por cada scraper.
   * @param {string} query - Termo de busca
   * @returns {Promise<Array>} Array de produtos encontrados
   */
  async searchProduct(query) {
    throw new Error(`searchProduct() não implementado em ${this.constructor.name}`);
  }

  /**
   * Faz uma requisição HTTP com retry automático.
   * @param {string} url - URL da requisição
   * @param {object} options - Opções adicionais (método, data, etc)
   * @returns {Promise<object>} Resposta do servidor
   */
  async fetchWithRetry(url, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          headers: this.headers,
          timeout: this.timeout,
          ...options
        });
        return response.data;
      } catch (error) {
        lastError = error;
        console.warn(
          `[${this.storeName}] Tentativa ${attempt}/${this.maxRetries} falhou: ${error.message}`
        );

        // Se for última tentativa, não aguardar
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt); // Delay crescente
        }
      }
    }

    throw new Error(
      `[${this.storeName}] Falha após ${this.maxRetries} tentativas: ${lastError.message}`
    );
  }

  /**
   * Utilitário para aguardar um período.
   * @param {number} ms - Milissegundos
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normaliza um preço para número (remove caracteres especiais).
   * @param {string|number} price - Preço em qualquer formato
   * @returns {number} Preço como número
   */
  normalizePrice(price) {
    if (typeof price === 'number') return price;
    if (!price) return 0;

    // Remove espaços, pontos de separador de milhares, e converte vírgula em ponto
    const normalized = String(price)
      .trim()
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    return parseFloat(normalized) || 0;
  }

  /**
   * Formata um preço para string com 2 casas decimais.
   * @param {number} price - Preço como número
   * @returns {string} Preço formatado
   */
  formatPrice(price) {
    return Number(price).toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Extrai número de uma string (ex: "Avaliação: 4.5 de 5" → 4.5).
   * @param {string} text - Texto contendo número
   * @param {number} defaultValue - Valor padrão se não encontrar
   * @returns {number} Número encontrado ou padrão
   */
  extractNumber(text, defaultValue = 0) {
    if (!text) return defaultValue;
    const match = String(text).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : defaultValue;
  }

  /**
   * Validação básica de produto.
   * @param {object} product - Objeto produto
   * @returns {boolean} True se válido
   */
  isValidProduct(product) {
    return (
      product &&
      typeof product === 'object' &&
      product.name &&
      String(product.name).trim().length > 0 &&
      typeof product.price === 'number' &&
      product.price > 0
    );
  }

  /**
   * Log estruturado com timestamp.
   * @param {string} level - Nível (info, warn, error)
   * @param {string} message - Mensagem
   * @param {object} metadata - Dados adicionais
   */
  log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      store: this.storeName,
      level,
      message,
      ...metadata
    };

    if (level === 'error') {
      console.error(`[${timestamp}] [${this.storeName}] ❌ ${message}`, metadata);
    } else if (level === 'warn') {
      console.warn(`[${timestamp}] [${this.storeName}] ⚠️  ${message}`, metadata);
    } else {
      console.log(`[${timestamp}] [${this.storeName}] ℹ️  ${message}`, metadata);
    }

    return logEntry;
  }
}

module.exports = BaseScraper;
