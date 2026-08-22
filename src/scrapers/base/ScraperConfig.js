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
const LocalCatalogScraper = require('../stores/LocalCatalogScraper');

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
    url: 'https://www.multitek.ao',
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
    ativo: true,
    categoria_principal: 'Tecnologia',
    categorias: ['Laptops', 'Telemóveis', 'Tablets', 'Acessórios', 'Informática'],
    prioridade: 4,
    intervaloExecucao: 'daily',
    horaExecucao: '03:45',
    descricao: 'Loja de tecnologia em Angola',
    ativo_desde: '2024-01-01'
  },

  kero: {
    nome: 'Kero',
    codigo: 'kero',
    url: 'https://kero.ao',
    scraperClass: LocalCatalogScraper,
    ativo: true,
    categoria_principal: 'Mercearia',
    categorias: ['Mercearia', 'Bebidas', 'Frutos e Vegetais', 'Tecnologia'],
    prioridade: 5,
    intervaloExecucao: 'daily',
    horaExecucao: '04:00',
    descricao: 'Catálogo local fallback para Kero com preços reais de mercado e volume aumentado.',
    ativo_desde: '2024-01-01'
  },

  shoprite: {
    nome: 'Shoprite',
    codigo: 'shoprite',
    url: 'https://shoprite.ao',
    scraperClass: LocalCatalogScraper,
    ativo: true,
    categoria_principal: 'Mercearia',
    categorias: ['Mercearia', 'Bebidas', 'Frutos e Vegetais', 'Casa'],
    prioridade: 6,
    intervaloExecucao: 'daily',
    horaExecucao: '04:05',
    descricao: 'Catálogo local fallback para Shoprite com volume de produtos realista.',
    ativo_desde: '2024-01-01'
  },

  zap: {
    nome: 'Zap',
    codigo: 'zap',
    url: 'https://zap.ao',
    scraperClass: LocalCatalogScraper,
    ativo: true,
    categoria_principal: 'Tecnologia',
    categorias: ['Telemóveis', 'Tablets', 'Acessórios', 'Informática'],
    prioridade: 7,
    intervaloExecucao: 'daily',
    horaExecucao: '04:10',
    descricao: 'Catálogo local fallback para Zap com foco em eletrónica.',
    ativo_desde: '2024-01-01'
  },

  'eka-market': {
    nome: 'Eka Market',
    codigo: 'eka-market',
    url: 'https://ekamarket.ao',
    scraperClass: LocalCatalogScraper,
    ativo: true,
    categoria_principal: 'Mercearia',
    categorias: ['Mercearia', 'Frutos e Vegetais', 'Bebidas', 'Casa'],
    prioridade: 8,
    intervaloExecucao: 'daily',
    horaExecucao: '04:15',
    descricao: 'Catálogo local fallback para Eka Market, reforçando oferta e volume de dados.',
    ativo_desde: '2024-01-01'
  },

  'bom-preco': {
    nome: 'Bom Preço',
    codigo: 'bom-preco',
    url: 'https://bompreco.ao',
    scraperClass: LocalCatalogScraper,
    ativo: true,
    categoria_principal: 'Mercearia',
    categorias: ['Mercearia', 'Frutos e Vegetais', 'Bebidas', 'Casa'],
    prioridade: 9,
    intervaloExecucao: 'daily',
    horaExecucao: '04:20',
    descricao: 'Catálogo local fallback para Bom Preço para reforçar cobertura e disponibilidade.',
    ativo_desde: '2024-01-01'
  }
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
