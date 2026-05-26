/**
 * @file scheduler.js
 * @description Agendador de execução diária de scrapers com node-cron.
 * Executa automaticamente às 03:00 AM todos os dias.
 */

const cron = require('node-cron');
const ScraperPipeline = require('./pipeline/ScraperPipeline');
const logger = require('./pipeline/Logger');

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
  }

  /**
   * Inicia o agendador com múltiplas tarefas.
   */
  start() {
    logger.info('🕐 Iniciando ScraperScheduler');

    try {
    // Tarefa 1: Pipeline principal - Diariamente às 03:00 AM
    const mainJob = cron.schedule('0 3 * * *', () => {
      logger.info('⏰ Disparando execução agendada do pipeline');
      this.executeMainPipeline();
    });
    this.scheduledJobs.push({ name: 'Main Pipeline', job: mainJob });

    // Tarefa 2: Limpeza de logs antigos - Semanalmente (domingo às 02:00 AM)
    const cleanLogsJob = cron.schedule('0 2 * * 0', () => {
      logger.info('🧹 Disparando limpeza de logs antigos');
      logger.cleanOldLogs(30); // Mantém últimos 30 dias
    });
    this.scheduledJobs.push({ name: 'Clean Old Logs', job: cleanLogsJob });

    // Tarefa 3: Limpeza de dados antigos - Mensalmente (1º dia às 02:00 AM)
    const cleanDataJob = cron.schedule('0 2 1 * *', () => {
      logger.info('🗑️ Disparando limpeza de dados antigos');
      this.executeDataCleanup();
    });
    this.scheduledJobs.push({ name: 'Clean Old Data', job: cleanDataJob });

    logger.info('✅ ScraperScheduler iniciado com sucesso', {
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
    this.lastExecutionTime = new Date();
    
    try {
      logger.info('▶️ Iniciando execução do pipeline...');
      
      const stats = await this.pipeline.execute([
        'Laptop', 'iPhone', 'Samsung Galaxy', 'iPad', 'Monitor',
        'Teclado', 'Mouse', 'Headset', 'Tablet', 'Smartwatch'
      ]);

      this.lastExecutionStats = stats;

      logger.logPipelineComplete(stats);

      // Notificar sobre status
      this.notifyExecutionComplete(stats);
    } catch (error) {
      logger.error('❌ Erro crítico na execução do pipeline', {
        erro: error.message,
        stack: error.stack?.split('\n').slice(0, 2).join(' | ')
      });
    }
  }

  /**
   * Executa limpeza de dados.
   */
  async executeDataCleanup() {
    try {
      const result = await this.pipeline.cleanOldData(30);
      logger.info('✅ Limpeza de dados concluída', result);
    } catch (error) {
      logger.error('❌ Erro na limpeza de dados', { erro: error.message });
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

📊 Resumo da Execução:
  ✅ Lojas Processadas: ${stats.processed}
  ❌ Lojas com Erro: ${stats.failed}
  
📈 Dados Atualizados:
  ➕ Produtos Inseridos: ${stats.totalInserts}
  🔄 Produtos Atualizados: ${stats.totalUpdates}
  ⚠️  Erros: ${stats.totalErrors}

⏱️  Tempo Total: ${stats.totalDuration}ms (${(stats.totalDuration / 1000).toFixed(2)}s)

🕐 Horário: ${stats.endTime?.toLocaleString('pt-PT')}
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
      logger.info(`⏸️ Job parado: ${name}`);
    });
    this.scheduledJobs = [];
    logger.info('✅ Todas as tarefas foram paradas');
  }

  /**
   * Retorna status atual do scheduler.
   */
  getStatus() {
    return {
      ativo: this.scheduledJobs.length > 0,
      jobsAgendadas: this.scheduledJobs.length,
      ultimaExecucao: this.lastExecutionTime,
      ultimasEstatisticas: this.lastExecutionStats
    };
  }

  /**
   * Executa o pipeline manualmente (útil para testes).
   * @param {Array} termos - Termos de busca (opcional)
   */
  async executeNow(termos = null) {
    logger.info('▶️ Execução manual do pipeline disparada pelo utilizador');
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