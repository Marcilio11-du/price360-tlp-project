const db = require('../config/db');

const SHOPPING_LIST_TABLE = process.env.DB_SHOPPING_LIST_TABLE || 'Lista_compras';
const USER_TABLE = process.env.DB_USER_TABLE || 'Utilizador';

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

const updateShoppingList = async (id, data) => {
  const allowedFields = ['nome', 'descricao', 'id_cliente'];
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

  updates.push('updated_at = NOW()');
  params.push(id);

  const sql = `
    UPDATE ${SHOPPING_LIST_TABLE}
    SET ${updates.join(', ')}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

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
  hardDeleteShoppingList
};
