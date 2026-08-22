#!/usr/bin/env node

/**
 * @module seed-database
 * @description Regista na base de dados APENAS as lojas reais suportadas
 * pelo pipeline de scraping, com os seus sites oficiais.
 *
 * NÃO insere produtos nem preços — esses dados são obtidos exclusivamente
 * pelos scrapers (NCR via API VTEX, Buitanda via API REST, MultiTek e iTec
 * via WooCommerce/HTML).
 *
 * Uso: node src/sql/seed-database.js
 */

require('dotenv').config();
const db = require('../config/db');

// Lojas reais, verificadas e acessíveis (ver src/scrapers/base/ScraperConfig.js)
const LOJAS_REAIS = [
  { codigo: 'ncr',      nome: 'NCR Angola', url: 'https://www.ncrangola.com' },
  { codigo: 'buitanda', nome: 'Buitanda',   url: 'https://www.buitanda.com' },
  { codigo: 'multitek', nome: 'MultiTek',   url: 'https://www.multitek.ao' },
  { codigo: 'itec',     nome: 'iTec',       url: 'https://www.itec.co.ao' },
];

const seedDatabase = async () => {
  try {
    console.log('\n=== Registo de lojas reais (sem dados mocados) ===\n');

    for (const loja of LOJAS_REAIS) {
      await db.query(
        "INSERT INTO Loja (codigo, nome, municipio, endereco) VALUES (?, ?, 'Luanda', 'Luanda, Angola') ON DUPLICATE KEY UPDATE nome = VALUES(nome)",
        [loja.codigo, loja.nome]
      );

      const [rows] = await db.query('SELECT id FROM Loja WHERE codigo = ? LIMIT 1', [loja.codigo]);
      const idLoja = rows[0].id;

      if (loja.url) {
        await db.query(
          'INSERT INTO Link_Loja (link, id_loja) VALUES (?, ?)',
          [loja.url, idLoja]
        );
      }

      console.log(`✓ ${loja.nome} (${loja.codigo}) → id ${idLoja}`);
    }

    const [lojaCount] = await db.query('SELECT COUNT(*) as total FROM Loja');
    console.log(`\n📌 Total de lojas na BD: ${lojaCount[0].total}`);
    console.log('ℹ️  Produtos e preços serão populados pelo pipeline de scraping (npm run dev arranca o scheduler; diariamente às 03:00).\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Erro ao registar lojas:', error.message);
    process.exit(1);
  }
};

seedDatabase();
