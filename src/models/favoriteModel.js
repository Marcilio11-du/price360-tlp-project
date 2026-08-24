/**
 * @module favoriteModel
 * @description Operações sobre a tabela `Favorito` (produtos guardados
 * pelo utilizador). Um favorito referencia (utilizador, produto) e guarda
 * o preço mínimo no momento em que foi adicionado.
 */

const db = require("../config/db");

const TABLE = process.env.DB_FAVORITE_TABLE || "Favorito";

/**
 * Adiciona um produto aos favoritos do utilizador.
 * Se já existir, não faz nada (idempotente).
 *
 * @param {Object} param0
 * @param {number} param0.id_utilizador
 * @param {number} param0.id_produto
 * @param {number|null} [param0.preco_no_momento]
 * @returns {Promise<'created'|'exists'>}
 */
const addFavorite = async ({ id_utilizador, id_produto, preco_no_momento = null }) => {
  const sql = `
    INSERT INTO ${TABLE} (id_utilizador, id_produto, preco_no_momento)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE id_utilizador = id_utilizador
  `;
  const [result] = await db.execute(sql, [id_utilizador, id_produto, preco_no_momento]);
  return result.affectedRows > 0 ? "created" : "exists";
};

/**
 * Lista os favoritos de um utilizador com resumo do produto
 * (preço mínimo actual e total de lojas), mais recente primeiro.
 *
 * @param {number} idUtilizador
 * @returns {Promise<Array>}
 */
const findByUser = async (idUtilizador) => {
  const sql = `
    SELECT f.id,
      f.id_produto,
      p.nome,
      p.marca,
      p.descricao,
      c.id AS id_categoria,
      c.nome AS categoria_nome,
      f.preco_no_momento,
      f.created_at AS favoritado_em,
      MIN(pl.preco) AS preco_min,
      COUNT(DISTINCT pl.id_loja) AS total_lojas,
      MAX(CASE WHEN pl.imagem IS NOT NULL AND TRIM(pl.imagem) <> '' THEN pl.imagem END) AS imagem
    FROM ${TABLE} f
    INNER JOIN Produto p   ON p.id = f.id_produto AND p.deleted_at IS NULL
    INNER JOIN Categoria c ON c.id = p.id_categoria
    LEFT JOIN Produto_Loja pl ON pl.id_produto = p.id AND pl.deleted_at IS NULL
    WHERE f.id_utilizador = ?
    GROUP BY f.id, f.id_produto, p.nome, p.marca, p.descricao, c.id, c.nome,
             f.preco_no_momento, f.created_at
    ORDER BY f.created_at DESC
  `;
  const [rows] = await db.execute(sql, [idUtilizador]);
  return rows.map((row) => ({
    ...row,
    preco_min: row.preco_min != null ? Number(row.preco_min) : null,
    preco_no_momento: row.preco_no_momento != null ? Number(row.preco_no_momento) : null,
    total_lojas: Number(row.total_lojas),
    imagem: row.imagem || null,
  }));
};

/**
 * Devolve os ids de produtos favoritados por um utilizador.
 *
 * @param {number} idUtilizador
 * @returns {Promise<number[]>}
 */
const findFavoriteProductIds = async (idUtilizador) => {
  const sql = `SELECT id_produto FROM ${TABLE} WHERE id_utilizador = ?`;
  const [rows] = await db.execute(sql, [idUtilizador]);
  return rows.map((r) => r.id_produto);
};

/**
 * Remove um favorito (utilizador + produto).
 *
 * @param {number} idUtilizador
 * @param {number} idProduto
 * @returns {Promise<boolean>} true se removeu alguma linha.
 */
const removeFavorite = async (idUtilizador, idProduto) => {
  const sql = `DELETE FROM ${TABLE} WHERE id_utilizador = ? AND id_produto = ?`;
  const [result] = await db.execute(sql, [idUtilizador, idProduto]);
  return result.affectedRows > 0;
};

/**
 * Favoritos cujo preço mínimo actual ficou ABAIXO do preço guardado
 * no momento do favourito — geram notificações de "queda de preço".
 *
 * @param {number} idUtilizador
 * @returns {Promise<Array>}
 */
const findPriceDrops = async (idUtilizador) => {
  const sql = `
    SELECT f.id_produto, f.preco_no_momento, f.created_at AS favoritado_em,
      p.nome,
      MIN(pl.preco) AS preco_min_actual
    FROM ${TABLE} f
    INNER JOIN Produto p ON p.id = f.id_produto AND p.deleted_at IS NULL
    INNER JOIN Produto_Loja pl ON pl.id_produto = f.id_produto AND pl.deleted_at IS NULL
    WHERE f.id_utilizador = ? AND f.preco_no_momento IS NOT NULL
    GROUP BY f.id_produto, f.preco_no_momento, f.created_at, p.nome
    HAVING preco_min_actual < f.preco_no_momento
  `;
  const [rows] = await db.execute(sql, [idUtilizador]);
  return rows.map((row) => ({
    ...row,
    preco_no_momento: Number(row.preco_no_momento),
    preco_min_actual: Number(row.preco_min_actual),
  }));
};

module.exports = { addFavorite, findByUser, findFavoriteProductIds, removeFavorite, findPriceDrops };
