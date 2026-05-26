/**
 * @file index.js
 * @description Ponto de entrada do sistema de scrapers.
 * Exporta toda a funcionalidade para uso em app.js.
 */

const ScraperPipeline = require('./pipeline/ScraperPipeline');
const DatabaseUpsert = require('./pipeline/DatabaseUpsert');
const logger = require('./pipeline/Logger');
const { initScheduler, getScheduler } = require('./scheduler');
const { getScraperConfig, getActiveScrapers, instantiateScraper } = require('./base/ScraperConfig');

module.exports = {
  // Pipeline
  ScraperPipeline,
  
  // Database
  DatabaseUpsert,
  
  // Logger
  logger,
  
  // Scheduler
  initScheduler,
  getScheduler,
  
  // Configuration
  getScraperConfig,
  getActiveScrapers,
  instantiateScraper
};
