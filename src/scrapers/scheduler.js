/**
 * @file scheduler.js
 * @description Agendador de execução diária de scrapers com node-cron.
 * Executa automaticamente às 03:00 AM todos os dias.
 */

const cron = require('node-cron');
const ScraperPipeline = require('./pipeline/ScraperPipeline');
const logger = require('./pipeline/Logger');
const PriceAlertChecker = require('./pipeline/PriceAlertChecker');
const db = require('../config/db');

// Se a BD tiver menos produtos que isto no arranque, dispara uma
// execução inicial para popular (experiência de primeiro `npm run dev`).
const MIN_PRODUCTS_ON_BOOT = Number(process.env.SCRAPER_MIN_PRODUCTS_ON_BOOT || 60);

class ScraperScheduler {
  constructor() {
    this.pipeline = new ScraperPipeline({
      parallelLimit: 2,
      batchSize: 50,
      maxProductsPerScraper: 1000
    });
    this.scheduledJobs = [];
    this.lastExecutionTime = null;
    this.lastExecutionStats = null;
    this.isRunning = false;
    this.runStartedAt = null;
  }

  /**
   * Inicia o agendador com múltiplas tarefas.
   */
  start() {
    logger.info('A iniciar ScraperScheduler');

    try {
    // Tarefa 1: Pipeline principal - Diariamente às 03:00 AM
    const mainJob = cron.schedule('0 3 * * *', () => {
      logger.info('⏰ Disparando execução agendada do pipeline');
      this.executeMainPipeline();
    });
    this.scheduledJobs.push({ name: 'Main Pipeline', job: mainJob });

    // Tarefa 2: Limpeza de logs antigos - Semanalmente (domingo às 02:00 AM)
    const cleanLogsJob = cron.schedule('0 2 * * 0', () => {
      logger.info('[LIMPEZA] A disparar limpeza de logs antigos');
      logger.cleanOldLogs(30); // Mantém últimos 30 dias
    });
    this.scheduledJobs.push({ name: 'Clean Old Logs', job: cleanLogsJob });

    // Tarefa 3: Limpeza de dados antigos - Mensalmente (1º dia às 02:00 AM)
    const cleanDataJob = cron.schedule('0 2 1 * *', () => {
      logger.info('[LIMPEZA] A disparar limpeza de dados antigos');
      this.executeDataCleanup();
    });
    this.scheduledJobs.push({ name: 'Clean Old Data', job: cleanDataJob });

    logger.info('[OK] ScraperScheduler iniciado com sucesso', {
      jobs_agendadas: this.scheduledJobs.length,
      tarefas: this.scheduledJobs.map(j => j.name)
    });
    } catch (err) {
      logger.error('Falha ao inicializar scheduler', { erro: err.message });
    }
  }

  /**
   * Executa o pipeline principal.
   */
  async executeMainPipeline() {
    if (this.isRunning) {
      logger.warn('Pipeline já em execução — execução ignorada.');
      return null;
    }
    this.isRunning = true;
    this.runStartedAt = new Date();
    this.lastExecutionTime = new Date();

    try {
      logger.info('[RUN] A iniciar execucao do pipeline...');

      const stats = await this.pipeline.execute([
        'Laptop', 'iPhone', 'Samsung Galaxy', 'iPad', 'Monitor',
        'Teclado', 'Mouse', 'Headset', 'Tablet', 'Smartwatch',
        'Arroz', 'Leite', 'Óleo', 'Coca-Cola', 'Água Mineral'
      ]);

      this.lastExecutionStats = stats;

      await PriceAlertChecker.checkAndNotify();

      logger.logPipelineComplete(stats);

      // Notificar sobre status
      this.notifyExecutionComplete(stats);
      return stats;
    } catch (error) {
      logger.error('[ERROR] Erro crítico na execução do pipeline', {
        erro: error.message,
        stack: error.stack?.split('\n').slice(0, 2).join(' | ')
      });
      return null;
    } finally {
      this.isRunning = false;
      this.runStartedAt = null;
    }
  }

  /**
   * Dispara o pipeline de forma ASSÍNCRONA (fire-and-forget).
   * Ideal para produção: um cron externo (cron-job.org, GitHub Actions, etc.)
   * ou o próprio agendador interno chama este método sem bloquear a resposta HTTP.
   * @returns {{ iniciado: boolean, motivo?: string }}
   */
  triggerAsync() {
    if (this.isRunning) {
      return { iniciado: false, motivo: 'Já existe uma execução em curso.' };
    }
    // Executa em background; erros são tratados dentro de executeMainPipeline
    setImmediate(() => { this.executeMainPipeline(); });
    return { iniciado: true };
  }

  /**
   * Executa limpeza de dados.
   */
  async executeDataCleanup() {
    try {
      const result = await this.pipeline.cleanOldData(30);
      logger.info('[OK] Limpeza de dados concluída', result);
    } catch (error) {
      logger.error('[ERROR] Erro na limpeza de dados', { erro: error.message });
    }
  }

  /**
   * Notificação de conclusão de execução (pode ser expandida para email, etc).
   * @param {object} stats - Estatísticas da execução
   */
  notifyExecutionComplete(stats) {
    const mensagem = `
╔════════════════════════════════════════════╗
║  PIPELINE DE SCRAPERS - RELATÓRIO         ║
╚════════════════════════════════════════════╝

RESUMO DA EXECUÇÃO:
  [OK] Lojas Processadas: ${stats.processed}
  [ERROR] Lojas com Erro: ${stats.failed}
  
Dados Actualizados:
  Produtos Inseridos: ${stats.totalInserts}
  [UPDATE] Produtos Atualizados: ${stats.totalUpdates}
  [WARN] Erros: ${stats.totalErrors}

Tempo Total: ${stats.totalDuration}ms (${(stats.totalDuration / 1000).toFixed(2)}s)

Horário: ${stats.endTime?.toLocaleString('pt-PT')}
════════════════════════════════════════════
    `;

    logger.info(mensagem);
  }

  /**
   * Para todas as tarefas agendadas.
   */
  stop() {
    this.scheduledJobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`[PAUSA] Job parado: ${name}`);
    });
    this.scheduledJobs = [];
    logger.info('[OK] Todas as tarefas foram paradas');
  }

  /**
   * Verifica se o catálogo VENDÁVEL (ofertas Produto_Loja) está vazio e,
   * se estiver, dispara o pipeline em segundo plano. Contar apenas Produto
   * não chega: podem existir produtos órfãos sem nenhuma oferta, que nunca
   * aparecem no site (listagem usa INNER JOIN em Produto_Loja).
   */
  bootstrapIfEmpty() {
    setImmediate(async () => {
      try {
        const [rows] = await db.query(
          'SELECT COUNT(*) AS total FROM Produto_Loja WHERE deleted_at IS NULL'
        );
        const total = Number(rows?.[0]?.total || 0);

        const [produtos] = await db.query(
          'SELECT COUNT(*) AS total FROM Produto WHERE deleted_at IS NULL'
        );
        const totalProdutos = Number(produtos?.[0]?.total || 0);

        if (total < MIN_PRODUCTS_ON_BOOT) {
          logger.info(`Catálogo com ${total} oferta(s) (${totalProdutos} produto(s)) — execução inicial para popular (pode levar alguns minutos).`);
          this.triggerAsync();
        } else {
          logger.info(`[OK] BD já tem ${total} ofertas — execução inicial desnecessária.`);
        }
      } catch (error) {
        logger.warn('Não foi possível verificar o catálogo no arranque:', { erro: error.message });
      }
    });
  }

  /**
   * Retorna status atual do scheduler.
   */
  getStatus() {
    return {
      ativo: this.scheduledJobs.length > 0,
      jobsAgendadas: this.scheduledJobs.length,
      emExecucao: this.isRunning,
      inicioExecucaoActual: this.runStartedAt,
      ultimaExecucao: this.lastExecutionTime,
      ultimasEstatisticas: this.lastExecutionStats
    };
  }

  /**
   * Executa o pipeline manualmente (útil para testes).
   * @param {Array} termos - Termos de busca (opcional)
   */
  async executeNow(termos = null) {
    logger.info('[RUN] Execução manual do pipeline disparada pelo utilizador');
    return this.pipeline.execute(termos || this.pipeline.getDefaultSearchTerms());
  }
}

// Singleton
let scheduler = null;

/**
 * Inicia o scheduler globalmente.
 */
function initScheduler() {
  if (scheduler) {
    logger.warn('Scheduler já foi iniciado');
    return scheduler;
  }

  scheduler = new ScraperScheduler();
  scheduler.start();
  scheduler.bootstrapIfEmpty();
  return scheduler;
}

/**
 * Obtém instância do scheduler.
 */
function getScheduler() {
  return scheduler;
}

module.exports = {
  ScraperScheduler,
  initScheduler,
  getScheduler
};
