/**
 * @file Logger.js
 * @description Sistema de logs estruturado com arquivo e console.
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.logsPath = path.join(logDir, 'scrapers');
    this.ensureLogDirExists();
  }

  ensureLogDirExists() {
    if (!fs.existsSync(this.logsPath)) {
      fs.mkdirSync(this.logsPath, { recursive: true });
    }
  }

  /**
   * Gera nome do arquivo de log com timestamp.
   * @returns {string} Nome do arquivo
   */
  getLogFilename() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `scraper_${year}-${month}-${day}.log`;
  }

  /**
   * Escreve entrada de log em arquivo.
   * @param {object} logEntry - Entrada estruturada
   */
  writeToFile(logEntry) {
    try {
      const filepath = path.join(this.logsPath, this.getLogFilename());
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(filepath, logLine, 'utf8');
    } catch (error) {
      console.error('[Logger] Erro ao escrever arquivo:', error.message);
    }
  }

  /**
   * Log estruturado.
   * @param {string} level - Nível (info, warn, error, debug)
   * @param {string} message - Mensagem principal
   * @param {object} metadata - Dados adicionais
   */
  log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...metadata
    };

    // Escrever em arquivo
    this.writeToFile(logEntry);

    // Escrever em console
    this.printToConsole(logEntry);

    return logEntry;
  }

  /**
   * Escreve estrutura formatada no console.
   * @param {object} logEntry - Entrada estruturada
   */
  printToConsole(logEntry) {
    const { timestamp, level, message, ...metadata } = logEntry;
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      DEBUG: '\x1b[35m',   // Magenta
      RESET: '\x1b[0m'     // Reset
    };

    const color = colors[level] || colors.INFO;
    const icon = {
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      DEBUG: '🔍'
    }[level] || '•';

    const metadataStr = Object.keys(metadata).length > 0
      ? '\n  ' + JSON.stringify(metadata, null, 2).split('\n').join('\n  ')
      : '';

    console.log(
      `${color}[${timestamp}] [${level}] ${icon} ${message}${metadataStr}${colors.RESET}`
    );
  }

  // Métodos de conveniência
  info(message, metadata) { return this.log('info', message, metadata); }
  warn(message, metadata) { return this.log('warn', message, metadata); }
  error(message, metadata) { return this.log('error', message, metadata); }
  debug(message, metadata) { return this.log('debug', message, metadata); }

  /**
   * Log de sucesso de execução de scraper.
   * @param {string} storeName - Nome da loja
   * @param {object} stats - Estatísticas {inserts, updates, errors, duration}
   */
  logScraperSuccess(storeName, stats) {
    return this.info(`[${storeName}] Execução concluída com sucesso`, {
      inserts: stats.inserts || 0,
      updates: stats.updates || 0,
      errors: stats.errors || 0,
      totalProcessados: stats.total || 0,
      duracao_ms: stats.duration || 0
    });
  }

  /**
   * Log de erro de execução de scraper.
   * @param {string} storeName - Nome da loja
   * @param {Error} error - Erro ocorrido
   * @param {object} context - Contexto adicional
   */
  logScraperError(storeName, error, context = {}) {
    return this.error(`[${storeName}] Falha na execução`, {
      erro: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
      ...context
    });
  }

  /**
   * Log de pipeline completo.
   * @param {object} pipelineStats - Estatísticas gerais
   */
  logPipelineComplete(pipelineStats) {
    return this.info('Pipeline de scrapers completo', {
      lojas_processadas: pipelineStats.processed || 0,
      lojas_com_erro: pipelineStats.failed || 0,
      total_inserts: pipelineStats.totalInserts || 0,
      total_updates: pipelineStats.totalUpdates || 0,
      total_errors: pipelineStats.totalErrors || 0,
      duracao_total_ms: pipelineStats.totalDuration || 0,
      horario_inicio: pipelineStats.startTime?.toISOString(),
      horario_fim: pipelineStats.endTime?.toISOString()
    });
  }

  /**
   * Limpa logs antigos (mantém últimos N dias).
   * @param {number} diasAntigos - Remover logs com mais de X dias
   */
  cleanOldLogs(diasAntigos = 30) {
    try {
      const files = fs.readdirSync(this.logsPath);
      const now = Date.now();
      const maxAge = diasAntigos * 24 * 60 * 60 * 1000;

      let removidos = 0;

      files.forEach(file => {
        if (!file.startsWith('scraper_')) return;
        
        const filepath = path.join(this.logsPath, file);
        const stats = fs.statSync(filepath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filepath);
          removidos++;
        }
      });

      this.info(`Limpeza de logs concluída`, {
        arquivos_removidos: removidos,
        dias_retidos: diasAntigos
      });
    } catch (error) {
      this.error('Erro ao limpar logs antigos', { erro: error.message });
    }
  }
}

// Singleton
const logger = new Logger(process.env.LOG_DIR || './logs');

module.exports = logger;
