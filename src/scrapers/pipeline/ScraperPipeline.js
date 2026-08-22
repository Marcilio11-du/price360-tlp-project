/**
 * @file ScraperPipeline.js
 * @description Orquestra a execução de scrapers e atualização de dados.
 * Executa scrapers em paralelo, faz upsert em BD, e registra logs.
 */

const { getActiveScrapers, instantiateScraper } = require('../base/ScraperConfig');
const DatabaseUpsert = require('./DatabaseUpsert');
const logger = require('./Logger');

class ScraperPipeline {
  constructor(options = {}) {
    this.parallelLimit = options.parallelLimit || 2; // Max 2 scrapers simultâneos
    this.batchSize = options.batchSize || 50;
    this.maxProductsPerScraper = options.maxProductsPerScraper || 1000;
  }

  /**
   * Executa o pipeline completo de scrapers.
   * @param {Array<string>} termosBusca - Termos para buscar (ex: ['Laptop', 'iPhone', 'iPad'])
   * @returns {Promise<object>} Estatísticas gerais
   */
  async execute(termosBusca = []) {
    const startTime = new Date();
    const stats = {
      startTime,
      endTime: null,
      totalDuration: 0,
      processed: 0,
      failed: 0,
      totalInserts: 0,
      totalUpdates: 0,
      totalErrors: 0,
      scrapers: {}
    };

    try {
      logger.info('[START] Iniciando pipeline de scrapers', {
        termos_busca: termosBusca,
        lojas_ativas: getActiveScrapers().length
      });

      const activeScrapers = getActiveScrapers();

      if (activeScrapers.length === 0) {
        logger.warn('Nenhum scraper ativo disponível');
        return stats;
      }

      // Se não tiver termos, usar termos padrão
      if (termosBusca.length === 0) {
        termosBusca = this.getDefaultSearchTerms();
      }

      // Executar scrapers em paralelo com limite
      const resultados = await this.executeScrapersParallel(activeScrapers, termosBusca);

      // Processar resultados
      for (const config of activeScrapers) {
        const resultado = resultados[config.codigo];
        
        if (resultado?.success) {
          stats.processed++;
          const upsertStats = resultado.upsertStats;
          stats.totalInserts += upsertStats.inserts;
          stats.totalUpdates += upsertStats.updates;
          stats.totalErrors += upsertStats.errors;
          stats.scrapers[config.codigo] = resultado;

          logger.logScraperSuccess(config.nome, upsertStats);
        } else {
          stats.failed++;
          logger.logScraperError(config.nome, resultado?.error || new Error('Erro desconhecido'));
        }
      }

      // Estatísticas finais
      stats.endTime = new Date();
      stats.totalDuration = stats.endTime - startTime;

      logger.logPipelineComplete(stats);

      return stats;
    } catch (error) {
      logger.error('Erro crítico no pipeline', { erro: error.message });
      throw error;
    }
  }

  /**
   * Executa múltiplos scrapers em paralelo com limite de concorrência.
   * @param {Array} activeScrapers - Scrapers activos
   * @param {Array} termosBusca - Termos para buscar
   * @returns {Promise<object>} Resultados por código de scraper
   */
  async executeScrapersParallel(activeScrapers, termosBusca) {
    const resultados = {};

    // Criar filas de execução respeitando parallelLimit
    for (let i = 0; i < activeScrapers.length; i += this.parallelLimit) {
      const batch = activeScrapers.slice(i, i + this.parallelLimit);
      const promises = batch.map(config => 
        this.executeSingleScraper(config, termosBusca).then(result => ({
          ...result,
          codigo: config.codigo
        }))
      );

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          resultados[result.value.codigo] = result.value;
        } else {
          console.error('Erro em execução de scraper:', result.reason);
        }
      });

      // Pequena pausa entre batches para não sobrecarregar
      if (i + this.parallelLimit < activeScrapers.length) {
        await this.delay(1000);
      }
    }

    return resultados;
  }

  /**
   * Executa um scraper individual com todos os termos de busca.
   * @param {object} config - Config do scraper
   * @param {Array} termosBusca - Termos para buscar
   * @returns {Promise<object>} Resultado da execução
   */
  async executeSingleScraper(config, termosBusca) {
    try {
      const scraper = instantiateScraper(config.codigo);
      if (!scraper) {
        throw new Error(`Não foi possível instanciar scraper para ${config.codigo}`);
      }

      logger.info(`Iniciando ${config.nome}`, { 
        termos: termosBusca.length,
        lojas_restantes: getActiveScrapers().length
      });

      const produtosColetados = [];
      let errosCount = 0;
      const termosSemResultados = [];
      const MAX_TERMOS_VAZIOS_SEGUIDOS = 4;

      // Buscar cada termo
      for (const termo of termosBusca) {
        try {
          const produtos = await scraper.searchProduct(termo);

          if (Array.isArray(produtos)) {
            if (produtos.length === 0) {
              termosSemResultados.push(termo);
              // Circuit breaker: se os primeiros termos não devolvem nada
              // (ex.: site bloqueado por Cloudflare), abortar tentativas restantes.
              if (
                produtosColetados.length === 0 &&
                termosSemResultados.length >= MAX_TERMOS_VAZIOS_SEGUIDOS
              ) {
                logger.warn(
                  `${config.nome}: ${termosSemResultados.length} termos seguidos sem resultados — a saltar termos restantes (loja provavelmente bloqueada ou sem catálogo compatível).`,
                  { termos_testados: termosSemResultados }
                );
                break;
              }
            }
            produtosColetados.push(...produtos.slice(0, this.maxProductsPerScraper));
          }

          // Pequena pausa entre buscas
          await this.delay(500);
        } catch (error) {
          errosCount++;
          logger.warn(`Erro ao buscar "${termo}" em ${config.nome}`, { erro: error.message });
        }
      }

      // Deduplicar produtos repetidos (mesmo produto sai em vários termos)
      const unicos = new Map();
      for (const p of produtosColetados) {
        const chave = `${p.storeCode || ''}::${(p.name || '').toLowerCase()}`;
        if (!unicos.has(chave)) unicos.set(chave, p);
      }
      const finais = [...unicos.values()];

      logger.info(`${config.nome}: extração concluída`, {
        termos_com_resultados: termosBusca.length - termosSemResultados.length,
        termos_vazios: termosSemResultados,
        produtos_unicos: finais.length,
      });

      // Fazer upsert em batch
      const upsertStats = await DatabaseUpsert.upsertBatch(finais);

      return {
        success: true,
        scraper: config.codigo,
        produtosColetados: finais.length,
        errosExtracao: errosCount,
        upsertStats
      };
    } catch (error) {
      return {
        success: false,
        scraper: config.codigo,
        error: error.message
      };
    }
  }

  /**
   * Termos de busca padrão para produtos de tecnologia.
   * @returns {Array} Termos
   */
  getDefaultSearchTerms() {
    return [
      'Laptop',
      'iPhone',
      'Samsung Galaxy',
      'iPad',
      'Tablet',
      'Monitor',
      'Teclado',
      'Mouse',
      'Headset',
      'SSD',
      'RAM',
      'Processador',
      'Placa de Vídeo',
      'Webcam',
      'Smartwatch',
      'Carregador',
      'Cabo USB',
      'Arroz',
      'Feijão',
      'Óleo de Palma',
      'Banana',
      'Leite',
      'Coca-Cola',
      'Água Mineral',
      'Açúcar'
    ];
  }

  /**
   * Utilitário para delay.
   * @param {number} ms - Milissegundos
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executa limpeza de dados antigos.
   * @param {number} diasAntigos - Remover dados com mais de X dias
   * @returns {Promise<object>} Resultado da limpeza
   */
  async cleanOldData(diasAntigos = 30) {
    logger.info('Iniciando limpeza de dados antigos', { dias: diasAntigos });
    const result = await DatabaseUpsert.cleanOldData(diasAntigos);
    
    if (result.success) {
      logger.info('Limpeza concluída', { 
        registros_removidos: result.affectedRows,
        dias_retidos: diasAntigos
      });
    } else {
      logger.error('Erro na limpeza', { erro: result.error });
    }

    return result;
  }

  /**
   * Obtém estatísticas do banco de dados.
   * @returns {Promise<object>} Estatísticas
   */
  async getStats() {
    return DatabaseUpsert.getStats();
  }
}

module.exports = ScraperPipeline;
