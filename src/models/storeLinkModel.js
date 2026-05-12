/**
 * @module storeLinkModel
 * @description Modelo de acesso à tabela `Link_Loja`.
 * Gere os links (URLs) associados a lojas, com suporte a soft delete
 * (campo `deleted_at`) e restauro (campo `restored_at`).
 * As queries de leitura incluem um INNER JOIN com a tabela `Loja` para
 * enriquecer os resultados com o nome da loja.
 */

const db = require("../config/db");

const TABLE = process.env.DB_STORE_LINK_TABLE || "Link_Loja";
const STORE_TABLE = process.env.DB_STORE_TABLE || "Loja";

// --- Colunas base para todas as queries de leitura ---
const baseSelectColumns = `
  ll.id,
  ll.link,
  ll.id_loja,
  l.nome AS loja_nome,
  ll.created_at,
  ll.updated_at,
  ll.deleted_at,
  ll.restored_at
`;

// --- Funções de leitura ---

/**
 * Devolve todos os registos de link ativos (sem soft delete).
 * @returns {Promise<Array>} Lista de links de loja ativos.
 */
const findAllActives = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} ll
    INNER JOIN ${STORE_TABLE} l ON l.id = ll.id_loja
    WHERE ll.deleted_at IS NULL
    ORDER BY ll.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve todos os registos de link, incluindo os eliminados.
 * @returns {Promise<Array>} Lista completa de links de loja.
 */
const findAll = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} ll
    INNER JOIN ${STORE_TABLE} l ON l.id = ll.id_loja
    ORDER BY ll.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve apenas os registos marcados como eliminados (soft delete).
 * @returns {Promise<Array>} Lista de links de loja eliminados.
 */
const findAllDeleted = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} ll
    INNER JOIN ${STORE_TABLE} l ON l.id = ll.id_loja
    WHERE ll.deleted_at IS NOT NULL
    ORDER BY ll.id DESC
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
    FROM ${TABLE} ll
    INNER JOIN ${STORE_TABLE} l ON l.id = ll.id_loja
    WHERE ll.id = ?
      AND ll.deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Devolve um registo pelo ID, independentemente de estar eliminado.
 * @param {number} id - ID do registo.
 * @returns {Promise<Object|null>} Registo encontrado ou null.
 */
const findByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} ll
    INNER JOIN ${STORE_TABLE} l ON l.id = ll.id_loja
    WHERE ll.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Devolve todos os links ativos de uma loja específica.
 * @param {number} storeId - ID da loja.
 * @returns {Promise<Array>} Links associados à loja.
 */
const findByStoreId = async (storeId) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} ll
    INNER JOIN ${STORE_TABLE} l ON l.id = ll.id_loja
    WHERE ll.id_loja = ?
      AND ll.deleted_at IS NULL
    ORDER BY ll.id DESC
  `;

  const [rows] = await db.execute(sql, [storeId]);
  return rows;
};

/**
 * Verifica se já existe um registo ativo com o link (URL) indicado.
 * O parâmetro opcional `ignoreId` permite excluir um registo específico da
 * pesquisa, usado em atualizações e restauros para evitar falsos duplicados.
 * @param {string} link             - URL a verificar.
 * @param {number|null} [ignoreId=null] - ID do registo a ignorar na pesquisa.
 * @returns {Promise<Object|null>} Registo duplicado ou null.
 */
const findActiveByLink = async (link, ignoreId = null) => {
  // Determina se há um ID a excluir da pesquisa (inteiro positivo válido)
  const hasIgnoreId = Number.isInteger(ignoreId) && ignoreId > 0;
  const sql = hasIgnoreId
    ? `
      SELECT id
      FROM ${TABLE}
      WHERE link = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM ${TABLE}
      WHERE link = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  // Inclui ou exclui o ignoreId nos parâmetros conforme a query selecionada
  const params = hasIgnoreId ? [link, ignoreId] : [link];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

// --- Funções de escrita ---

/**
 * Insere um novo link de loja.
 * @param {Object} payload       - Dados do link.
 * @param {string} payload.link  - URL da loja.
 * @param {number} payload.id_loja - ID da loja associada.
 * @returns {Promise<number>} ID do novo registo inserido.
 */
const create = async (payload) => {
  const sql = `
    INSERT INTO ${TABLE}
      (link, id_loja)
    VALUES
      (?, ?)
  `;

  const [result] = await db.execute(sql, [payload.link, payload.id_loja]);

  return result.insertId;
};

/**
 * Atualiza os campos permitidos de um registo de link ativo.
 * @param {number} id      - ID do registo a atualizar.
 * @param {Object} payload - Campos a atualizar (link e/ou id_loja).
 * @returns {Promise<number>} Número de linhas afetadas.
 */
const update = async (id, payload) => {
  const allowedFields = ["link", "id_loja"];
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
  findByStoreId,
  findActiveByLink,
  create,
  update,
  softDelete,
  restore,
  hardDelete,
};
