/**
 * @module shoppingListModel
 * @description Modelo de acesso à base de dados para a tabela `Lista_compras`.
 * Cada lista pertence a um utilizador (`id_cliente`) e pode conter uma
 * descrição opcional. Todas as queries fazem JOIN com a tabela `Utilizador`
 * para devolver o nome do cliente sem necessitar de uma chamada adicional.
 */

const db = require("../config/db");

/** Nome da tabela de listas de compras. */
const SHOPPING_LIST_TABLE =
  process.env.DB_SHOPPING_LIST_TABLE || "Lista_compras";
/** Nome da tabela de utilizadores, usada nos JOINs para enriquecer os resultados. */
const USER_TABLE = process.env.DB_USER_TABLE || "Utilizador";

/**
 * Colunas seleccionadas em todas as queries de leitura.
 * Inclui `cliente_p_nome` e `cliente_u_nome` via JOIN com `Utilizador`,
 * permitindo identificar o dono da lista directamente na resposta da API.
 */
const baseSelectColumns = `
  sl.id,
  sl.nome,
  sl.descricao,
  sl.id_cliente,
  u.p_nome AS cliente_p_nome,
  u.u_nome AS cliente_u_nome,
  sl.created_at,
  sl.updated_at,
  sl.deleted_at,
  sl.restored_at
`;

// --- Leitura ---

/**
 * Devolve todas as listas de compras (activas e removidas).
 * O JOIN com `Utilizador` garante que o nome do cliente é sempre incluído.
 *
 * @returns {Promise<Array>} Lista completa de listas de compras.
 */
const getAllShoppingLists = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${SHOPPING_LIST_TABLE} sl
    INNER JOIN ${USER_TABLE} u ON u.id = sl.id_cliente
    ORDER BY sl.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve apenas as listas de compras activas (sem soft delete).
 *
 * @returns {Promise<Array>} Listas com `deleted_at IS NULL`.
 */
const getAllActiveShoppingLists = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${SHOPPING_LIST_TABLE} sl
    INNER JOIN ${USER_TABLE} u ON u.id = sl.id_cliente
    WHERE sl.deleted_at IS NULL
    ORDER BY sl.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve apenas as listas de compras marcadas como removidas.
 *
 * @returns {Promise<Array>} Listas com `deleted_at IS NOT NULL`.
 */
const getAllDeletedShoppingLists = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${SHOPPING_LIST_TABLE} sl
    INNER JOIN ${USER_TABLE} u ON u.id = sl.id_cliente
    WHERE sl.deleted_at IS NOT NULL
    ORDER BY sl.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Procura uma lista de compras activa pelo ID.
 *
 * @param {number} id - ID da lista.
 * @returns {Promise<Object|null>} Lista encontrada ou `null`.
 */
const getShoppingListById = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${SHOPPING_LIST_TABLE} sl
    INNER JOIN ${USER_TABLE} u ON u.id = sl.id_cliente
    WHERE sl.id = ?
      AND sl.deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Procura uma lista de compras pelo ID, independentemente do estado de remoção.
 * Usado após operações de escrita para devolver o estado mais recente.
 *
 * @param {number} id - ID da lista.
 * @returns {Promise<Object|null>} Lista encontrada ou `null`.
 */
const getShoppingListByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${SHOPPING_LIST_TABLE} sl
    INNER JOIN ${USER_TABLE} u ON u.id = sl.id_cliente
    WHERE sl.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Devolve todas as listas de compras activas de um determinado cliente.
 *
 * @param {number} clientId - ID do utilizador/cliente.
 * @returns {Promise<Array>} Listas activas do cliente, ordenadas por ID descendente.
 */
const getShoppingListsByClientId = async (clientId) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${SHOPPING_LIST_TABLE} sl
    INNER JOIN ${USER_TABLE} u ON u.id = sl.id_cliente
    WHERE sl.id_cliente = ?
      AND sl.deleted_at IS NULL
    ORDER BY sl.id DESC
  `;

  const [rows] = await db.execute(sql, [clientId]);
  return rows;
};

// --- Escrita ---

/**
 * Insere uma nova lista de compras na base de dados.
 *
 * @param {Object} param0             - Dados da lista.
 * @param {string} param0.nome        - Nome da lista.
 * @param {string} [param0.descricao] - Descrição opcional (guardada como NULL se omitida).
 * @param {number} param0.id_cliente  - ID do utilizador dono da lista.
 * @returns {Promise<number>} ID do registo criado.
 */
const createShoppingList = async ({ nome, descricao, id_cliente }) => {
  const sql = `
    INSERT INTO ${SHOPPING_LIST_TABLE}
      (nome, descricao, id_cliente)
    VALUES
      (?, ?, ?)
  `;

  const [result] = await db.execute(sql, [nome, descricao || null, id_cliente]);
  return result.insertId;
};

/**
 * Actualiza os campos fornecidos de uma lista de compras activa.
 * Apenas campos presentes em `allowedFields` são processados.
 *
 * @param {number} id   - ID da lista a actualizar.
 * @param {Object} data - Campos a actualizar (`nome`, `descricao`, `id_cliente`).
 * @returns {Promise<number>} Número de linhas afectadas.
 */
const updateShoppingList = async (id, data) => {
  const allowedFields = ["nome", "descricao", "id_cliente"];
  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updates.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (updates.length === 0) {
    return 0;
  }

  updates.push("updated_at = NOW()");
  params.push(id);

  const sql = `
    UPDATE ${SHOPPING_LIST_TABLE}
    SET ${updates.join(", ")}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

/**
 * Remove logicamente uma lista de compras (soft delete). Operação reversível.
 *
 * @param {number} id - ID da lista.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
const softDeleteShoppingList = async (id) => {
  const sql = `
    UPDATE ${SHOPPING_LIST_TABLE}
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
 * Restaura uma lista de compras previamente removida com soft delete.
 *
 * @param {number} id - ID da lista.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
const restoreShoppingList = async (id) => {
  const sql = `
    UPDATE ${SHOPPING_LIST_TABLE}
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
 * Remove permanentemente uma lista de compras da base de dados. Irreversível.
 *
 * @param {number} id - ID da lista.
 * @returns {Promise<number>} Número de linhas eliminadas.
 */
const hardDeleteShoppingList = async (id) => {
  const sql = `DELETE FROM ${SHOPPING_LIST_TABLE} WHERE id = ?`;
  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

module.exports = {
  getAllShoppingLists,
  getAllActiveShoppingLists,
  getAllDeletedShoppingLists,
  getShoppingListById,
  getShoppingListByIdIncludingDeleted,
  getShoppingListsByClientId,
  createShoppingList,
  updateShoppingList,
  softDeleteShoppingList,
  restoreShoppingList,
  hardDeleteShoppingList,
};
