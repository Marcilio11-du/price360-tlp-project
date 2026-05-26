/**
 * @file ScraperConfig.js
 * @description Configuração centralizadade todas as lojas e seus scrapers.
 * Permite fácil adição de novos scrapers e configuração de parâmetros.
 */

/**
 * Configuração de scrapers por loja.
 * Estrutura:
 * {
 *   codigo: {
 *     nome: 'Nome da Loja',
 *     scraperClass: Class,
 *     ativo: boolean,
 *     categorias: ['cat1', 'cat2'],  // Categorias que a loja vende
 *     intervaloExecucao: 'daily'      // Frequência de atualização
 *   }
 * }
 */

const NcrScraper = require('../stores/NcrScraper');
const BuitandaScraper = require('../stores/BuitandaScraper');
const MultiTekScraper = require('../stores/MultiTekScraper');
const ItecScraper = require('../stores/ItecScraper');

const SCRAPER_CONFIG = {
  ncr: {
    nome: 'NCR Angola',
    codigo: 'ncr',
    url: 'https://www.ncrangola.com',
    scraperClass: NcrScraper,
    ativo: true,
    categoria_principal: 'Tecnologia',
    categorias: ['Laptops', 'Telemóveis', 'Tablets', 'Acessórios', 'Informática'],
    prioridade: 1,
    intervaloExecucao: 'daily', // diário
    horaExecucao: '03:00', // 03:00 AM
    descricao: 'Maior e-commerce de tecnologia em Angola (VTEX API)',
    ativo_desde: '2024-01-01'
  },

  buitanda: {
    nome: 'Buitanda',
    codigo: 'buitanda',
    url: 'https://www.buitanda.com',
    scraperClass: BuitandaScraper,
    ativo: true,
    categoria_principal: 'Tecnologia',
    categorias: ['Laptops', 'Telemóveis', 'Tablets', 'Acessórios'],
    prioridade: 2,
    intervaloExecucao: 'daily',
    horaExecucao: '03:15',
    descricao: 'Plataforma de e-commerce com foco em eletrônicos',
    ativo_desde: '2024-01-01'
  },

  multitek: {
    nome: 'MultiTek',
    codigo: 'multitek',
    url: 'https://www.multitek.co.ao',
    scraperClass: MultiTekScraper,
    ativo: true,
    categoria_principal: 'Tecnologia',
    categorias: ['Laptops', 'Telemóveis', 'Informática'],
    prioridade: 3,
    intervaloExecucao: 'daily',
    horaExecucao: '03:30',
    descricao: 'Distribuidor de tecnologia em Angola',
    ativo_desde: '2024-01-01'
  },

  itec: {
    nome: 'iTec',
    codigo: 'itec',
    url: 'https://www.itec.co.ao',
    scraperClass: ItecScraper,
    ativo: false, // Desactivado enquanto testa
    categoria_principal: 'Tecnologia',
    categorias: ['Laptops', 'Telemóveis'],
    prioridade: 4,
    intervaloExecucao: 'daily',
    horaExecucao: '03:45',
    descricao: 'Loja de tecnologia em Angola',
    ativo_desde: '2024-01-01'
  }

  // Espaço reservado para futuras lojas:
  // kero: { ... },
  // shoprite: { ... },
  // jumbo: { ... },
  // etc...
};

/**
 * Obtém scraper por código.
 * @param {string} codigo - Código da loja
 * @returns {object} Config da loja ou null
 */
function getScraperConfig(codigo) {
  return SCRAPER_CONFIG[codigo.toLowerCase()] || null;
}

/**
 * Lista todos os scrapers activos.
 * @returns {Array} Configs das lojas activas
 */
function getActiveScrapers() {
  return Object.values(SCRAPER_CONFIG)
    .filter(config => config.ativo)
    .sort((a, b) => a.prioridade - b.prioridade);
}

/**
 * Lista todos os códigos de lojas.
 * @returns {Array} Códigos das lojas
 */
function getAllStoreCodes() {
  return Object.keys(SCRAPER_CONFIG);
}

/**
 * Instancia um scraper baseado na config.
 * @param {string} codigo - Código da loja
 * @returns {BaseScraper|null} Instância do scraper
 */
function instantiateScraper(codigo) {
  const config = getScraperConfig(codigo);
  if (!config || !config.ativo) return null;

  const { nome, scraperClass, url } = config;
  return new scraperClass(nome, codigo, url);
}

module.exports = {
  SCRAPER_CONFIG,
  getScraperConfig,
  getActiveScrapers,
  getAllStoreCodes,
  instantiateScraper
};
