/**
 * @module productShoppingListModel
 * @description Modelo de acesso à tabela `Lista_compras_Produto`, que representa
 * a associação N:N entre listas de compras (`Lista_compras`) e produtos (`Produto`).
 * Todas as queries de leitura incluem um duplo INNER JOIN para enriquecer os
 * resultados com o nome da lista e o nome do produto.
 * Suporta soft delete (campo `deleted_at`) e restauro (campo `restored_at`).
 */

const db = require("../config/db");

const TABLE =
  process.env.DB_PRODUCT_SHOPPING_LIST_TABLE || "Lista_compras_Produto";
const LIST_TABLE = process.env.DB_SHOPPING_LIST_TABLE || "Lista_compras";
const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || "Produto";

// --- Colunas base para todas as queries de leitura ---
// O duplo JOIN com Lista_compras e Produto permite devolver os nomes
// descritivos (lista_nome, produto_nome) sem necessitar de queries adicionais.
const baseSelectColumns = `
  lcp.id,
  lcp.id_lista,
  lc.nome AS lista_nome,
  lcp.id_produto,
  p.nome AS produto_nome,
  lcp.created_at,
  lcp.updated_at,
  lcp.deleted_at,
  lcp.restored_at
`;

// --- Funções de leitura ---

/**
 * Devolve todos os registos ativos (sem soft delete).
 * @returns {Promise<Array>} Lista de associações ativas.
 */
const findAllActives = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} lcp
    INNER JOIN ${LIST_TABLE} lc ON lc.id = lcp.id_lista
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = lcp.id_produto
    WHERE lcp.deleted_at IS NULL
    ORDER BY lcp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve todos os registos, incluindo os eliminados (soft delete).
 * @returns {Promise<Array>} Lista completa de associações.
 */
const findAll = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} lcp
    INNER JOIN ${LIST_TABLE} lc ON lc.id = lcp.id_lista
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = lcp.id_produto
    ORDER BY lcp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve apenas os registos marcados como eliminados (soft delete).
 * @returns {Promise<Array>} Lista de associações eliminadas.
 */
const findAllDeleted = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} lcp
    INNER JOIN ${LIST_TABLE} lc ON lc.id = lcp.id_lista
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = lcp.id_produto
    WHERE lcp.deleted_at IS NOT NULL
    ORDER BY lcp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve um registo ativo pelo seu ID primário.
 * @param {number} id - ID do registo.
 * @returns {Promise<Object|null>} Registo encontrado ou null.
 */
const findById = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} lcp
    INNER JOIN ${LIST_TABLE} lc ON lc.id = lcp.id_lista
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = lcp.id_produto
    WHERE lcp.id = ?
      AND lcp.deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Devolve um registo pelo ID, independentemente de estar eliminado.
 * Útil para confirmar o estado após operações de escrita.
 * @param {number} id - ID do registo.
 * @returns {Promise<Object|null>} Registo encontrado ou null.
 */
const findByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} lcp
    INNER JOIN ${LIST_TABLE} lc ON lc.id = lcp.id_lista
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = lcp.id_produto
    WHERE lcp.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Devolve todos os produtos ativos de uma lista de compras específica.
 * @param {number} listId - ID da lista de compras.
 * @returns {Promise<Array>} Produtos associados à lista.
 */
const findByShoppingListId = async (listId) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} lcp
    INNER JOIN ${LIST_TABLE} lc ON lc.id = lcp.id_lista
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = lcp.id_produto
    WHERE lcp.id_lista = ?
      AND lcp.deleted_at IS NULL
    ORDER BY lcp.id DESC
  `;

  const [rows] = await db.execute(sql, [listId]);
  return rows;
};

/**
 * Devolve todas as listas de compras ativas que contêm um produto específico.
 * @param {number} productId - ID do produto.
 * @returns {Promise<Array>} Listas de compras que contêm o produto.
 */
const findByProductId = async (productId) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} lcp
    INNER JOIN ${LIST_TABLE} lc ON lc.id = lcp.id_lista
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = lcp.id_produto
    WHERE lcp.id_produto = ?
      AND lcp.deleted_at IS NULL
    ORDER BY lcp.id DESC
  `;

  const [rows] = await db.execute(sql, [productId]);
  return rows;
};

/**
 * Verifica se já existe um registo ativo para a combinação (lista, produto).
 * O parâmetro opcional `ignoreId` é utilizado em operações de atualização e
 * restauro para excluir o próprio registo da verificação de unicidade,
 * evitando falsos positivos de duplicação.
 * @param {number} listId    - ID da lista de compras.
 * @param {number} productId - ID do produto.
 * @param {number|null} [ignoreId=null] - ID do registo a ignorar na pesquisa.
 * @returns {Promise<Object|null>} Registo duplicado encontrado ou null.
 */
const findActiveByListAndProduct = async (
  listId,
  productId,
  ignoreId = null,
) => {
  // Determina se há um ID a excluir da pesquisa (inteiro positivo válido)
  const hasIgnoreId = Number.isInteger(ignoreId) && ignoreId > 0;
  const sql = hasIgnoreId
    ? `
      SELECT id
      FROM ${TABLE}
      WHERE id_lista = ?
        AND id_produto = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM ${TABLE}
      WHERE id_lista = ?
        AND id_produto = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  // Inclui ou exclui o ignoreId nos parâmetros conforme a query selecionada
  const params = hasIgnoreId
    ? [listId, productId, ignoreId]
    : [listId, productId];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

// --- Funções de escrita ---

/**
 * Insere uma nova associação lista-produto.
 * @param {Object} payload          - Dados da associação.
 * @param {number} payload.id_lista  - ID da lista de compras.
 * @param {number} payload.id_produto - ID do produto.
 * @returns {Promise<number>} ID do novo registo inserido.
 */
const create = async (payload) => {
  const sql = `
    INSERT INTO ${TABLE}
      (id_lista, id_produto)
    VALUES
      (?, ?)
  `;

  const [result] = await db.execute(sql, [
    payload.id_lista,
    payload.id_produto,
  ]);

  return result.insertId;
};

/**
 * Atualiza os campos permitidos de uma associação ativa.
 * Constrói dinamicamente o SET apenas com os campos presentes no payload.
 * @param {number} id      - ID do registo a atualizar.
 * @param {Object} payload - Campos a atualizar (id_lista e/ou id_produto).
 * @returns {Promise<number>} Número de linhas afetadas (0 se nenhum campo válido).
 */
const update = async (id, payload) => {
  const allowedFields = ["id_lista", "id_produto"];
  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updates.push(`${field} = ?`);
      params.push(payload[field]);
    }
  }

  if (updates.length === 0) {
    return 0;
  }

  updates.push("updated_at = NOW()");
  params.push(id);

  const sql = `
    UPDATE ${TABLE}
    SET ${updates.join(", ")}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

/**
 * Realiza a remoção lógica (soft delete) de um registo ativo.
 * @param {number} id - ID do registo a eliminar.
 * @returns {Promise<number>} Número de linhas afetadas.
 */
const softDelete = async (id) => {
  const sql = `
    UPDATE ${TABLE}
    SET
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

/**
 * Restaura um registo previamente eliminado (reverte o soft delete).
 * @param {number} id - ID do registo a restaurar.
 * @returns {Promise<number>} Número de linhas afetadas.
 */
const restore = async (id) => {
  const sql = `
    UPDATE ${TABLE}
    SET
      deleted_at = NULL,
      restored_at = NOW(),
      updated_at = NOW()
    WHERE id = ?
      AND deleted_at IS NOT NULL
  `;

  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

/**
 * Remove permanentemente um registo da base de dados (hard delete).
 * @param {number} id - ID do registo a remover.
 * @returns {Promise<number>} Número de linhas afetadas.
 */
const hardDelete = async (id) => {
  const sql = `DELETE FROM ${TABLE} WHERE id = ?`;
  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

module.exports = {
  findAllActives,
  findAll,
  findAllDeleted,
  findById,
  findByIdIncludingDeleted,
  findByShoppingListId,
  findByProductId,
  findActiveByListAndProduct,
  create,
  update,
  softDelete,
  restore,
  hardDelete,
};
