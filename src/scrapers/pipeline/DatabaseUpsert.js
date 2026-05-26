/**
 * @file DatabaseUpsert.js
 * @description Lógica de UPSERT para a tabela Produto_Loja.
 *
 * Schema real de Produto_Loja:
 *   id, id_produto, id_loja, quantidade, preco,
 *   link (adicionado por migration), imagem (adicionado por migration),
 *   moeda (adicionado por migration), data_atualizacao (adicionado por migration)
 *
 * Schema real de Produto:
 *   id, nome, marca, data_validade, descricao, id_categoria (NOT NULL)
 *
 * Fluxo:
 *   1. Resolver (ou criar) Categoria "Tecnologia"
 *   2. Resolver (ou criar) Produto pelo nome
 *   3. Resolver Loja pelo código
 *   4. UPSERT em Produto_Loja
 */

const db = require('../../config/db');

// Cache em memória para evitar queries repetidas na mesma execução
const _cache = {
  categorias: {},   // nome → id
  lojas: {},        // codigo → id
  produtos: {},     // nome → id
};

class DatabaseUpsert {

  // ─── Helpers de resolução ─────────────────────────────────────────────────

  /**
   * Obtém (ou cria) uma categoria pelo nome.
   * @param {string} nome
   * @returns {Promise<number>} id da categoria
   */
  static async resolveCategoria(nome = 'Tecnologia') {
    if (_cache.categorias[nome]) return _cache.categorias[nome];

    const [rows] = await db.query(
      'SELECT id FROM Categoria WHERE nome = ? LIMIT 1', [nome]
    );

    if (rows.length > 0) {
      _cache.categorias[nome] = rows[0].id;
      return rows[0].id;
    }

    // Criar categoria se não existir
    const [result] = await db.query(
      'INSERT INTO Categoria (nome, description) VALUES (?, ?)',
      [nome, `Categoria criada automaticamente pelo scraper`]
    );
    _cache.categorias[nome] = result.insertId;
    return result.insertId;
  }

  /**
   * Obtém id da loja pelo código.
   * @param {string} codigo  ex: 'ncr'
   * @returns {Promise<number>}
   */
  static async resolveLoja(codigo) {
    if (_cache.lojas[codigo]) return _cache.lojas[codigo];

    const [rows] = await db.query(
      'SELECT id FROM Loja WHERE codigo = ? LIMIT 1', [codigo]
    );

    if (rows.length === 0) {
      throw new Error(`Loja com código "${codigo}" não encontrada. Corre o script SQL de setup.`);
    }

    _cache.lojas[codigo] = rows[0].id;
    return rows[0].id;
  }

  /**
   * Obtém (ou cria) um produto pelo nome.
   * @param {string} nome
   * @param {number} idCategoria
   * @returns {Promise<number>} id do produto
   */
  static async resolveProduto(nome, idCategoria) {
    if (_cache.produtos[nome]) return _cache.produtos[nome];

    const [rows] = await db.query(
      'SELECT id FROM Produto WHERE nome = ? LIMIT 1', [nome]
    );

    if (rows.length > 0) {
      _cache.produtos[nome] = rows[0].id;
      return rows[0].id;
    }

    // Extrair marca do nome (primeiras 2 palavras)
    const marca = nome.split(' ').slice(0, 2).join(' ');

    const [result] = await db.query(
      `INSERT INTO Produto (nome, marca, descricao, id_categoria)
       VALUES (?, ?, ?, ?)`,
      [nome, marca, nome, idCategoria]
    );
    _cache.produtos[nome] = result.insertId;
    return result.insertId;
  }

  // ─── Upsert principal ────────────────────────────────────────────────────

  /**
   * Insere ou actualiza a relação Produto_Loja.
   * @param {object} produtoLoja
   *   { name, price, storeCode, url?, image?, currency?, categoria? }
   * @returns {Promise<object>} { action, success, ... }
   */
  static async upsertProdutoLoja(produtoLoja) {
    const {
      name,
      price,
      storeCode,
      url    = null,
      image  = null,
      currency = 'AKZ',
      categoria = 'Tecnologia',
    } = produtoLoja;

    if (!name || !price || !storeCode) {
      throw new Error('Campos obrigatórios em falta: name, price, storeCode');
    }

    const precoNumerico = typeof price === 'number'
      ? price
      : parseFloat(String(price).replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0;

    if (precoNumerico <= 0) {
      return {
        action: 'skip',
        success: false,
        error: `Preço inválido (${price}) para produto "${name}"`,
        produto: name,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // 1. Resolver dependências
      const idCategoria = await this.resolveCategoria(categoria);
      const idProduto   = await this.resolveProduto(name, idCategoria);
      const idLoja      = await this.resolveLoja(storeCode);

      // 2. Verificar se relação já existe
      const [existing] = await db.query(
        'SELECT id FROM Produto_Loja WHERE id_produto = ? AND id_loja = ? LIMIT 1',
        [idProduto, idLoja]
      );

      let action;
      let idProdutoLoja;

      if (existing.length === 0) {
        // INSERT
        const [ins] = await db.query(
          `INSERT INTO Produto_Loja
             (id_produto, id_loja, preco, quantidade, link, imagem, moeda, data_atualizacao)
           VALUES (?, ?, ?, 0, ?, ?, ?, NOW())`,
          [idProduto, idLoja, precoNumerico, url, image, currency]
        );
        action = 'insert';
        idProdutoLoja = ins.insertId;
      } else {
        // UPDATE — só actualiza preço, link, imagem e timestamp
        idProdutoLoja = existing[0].id;
        await db.query(
          `UPDATE Produto_Loja
              SET preco = ?, link = ?, imagem = ?, moeda = ?, data_atualizacao = NOW()
            WHERE id = ?`,
          [precoNumerico, url, image, currency, idProdutoLoja]
        );
        action = 'update';
      }

      return {
        action,
        success: true,
        data: { id_produto_loja: idProdutoLoja, id_produto: idProduto, id_loja: idLoja },
        produto: { id: idProduto, nome: name },
        preco: precoNumerico,
        moeda: currency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        action: 'error',
        success: false,
        error: error.message,
        produto: name,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Upsert em batch.
   * @param {Array} produtos
   * @returns {Promise<object>} stats
   */
  static async upsertBatch(produtos) {
    const stats = {
      total: produtos.length,
      inserts: 0,
      updates: 0,
      skips: 0,
      errors: 0,
      results: [],
      startTime: new Date(),
      endTime: null,
      duration: 0,
    };

    for (const produto of produtos) {
      const resultado = await this.upsertProdutoLoja(produto).catch(err => ({
        action: 'error',
        success: false,
        error: err.message,
        produto: produto.name,
      }));

      stats.results.push(resultado);
      if (resultado.action === 'insert') stats.inserts++;
      else if (resultado.action === 'update') stats.updates++;
      else if (resultado.action === 'skip')  stats.skips++;
      else stats.errors++;
    }

    stats.endTime = new Date();
    stats.duration = stats.endTime - stats.startTime;
    return stats;
  }

  /**
   * Remove registos com data_atualizacao mais antiga que X dias.
   * @param {number} diasAntigos
   */
  static async cleanOldData(diasAntigos = 30) {
    try {
      const [result] = await db.query(
        `DELETE FROM Produto_Loja
          WHERE data_atualizacao IS NOT NULL
            AND data_atualizacao < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [diasAntigos]
      );
      return { success: true, affectedRows: result.affectedRows, diasAntigos, timestamp: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error.message, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Estatísticas da tabela.
   */
  static async getStats() {
    try {
      const [stats] = await db.query(`
        SELECT
          COUNT(DISTINCT id_produto) AS total_produtos,
          COUNT(DISTINCT id_loja)    AS total_lojas,
          COUNT(*)                   AS total_registros,
          MIN(data_atualizacao)      AS primeira_atualizacao,
          MAX(data_atualizacao)      AS ultima_atualizacao,
          AVG(preco)                 AS preco_medio,
          MIN(preco)                 AS preco_minimo,
          MAX(preco)                 AS preco_maximo
        FROM Produto_Loja
      `);
      return { success: true, data: stats[0] || {}, timestamp: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /** Limpa cache em memória (útil para testes). */
  static clearCache() {
    Object.keys(_cache).forEach(k => { _cache[k] = {}; });
  }
}

module.exports = DatabaseUpsert;