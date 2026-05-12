const db = require('../config/db');

const TABLE = process.env.DB_PRODUCT_SHOPPING_LIST_TABLE || 'Lista_compras_Produto';
const LIST_TABLE = process.env.DB_SHOPPING_LIST_TABLE || 'Lista_compras';
const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || 'Produto';

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

const findActiveByListAndProduct = async (listId, productId, ignoreId = null) => {
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

  const params = hasIgnoreId ? [listId, productId, ignoreId] : [listId, productId];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

const create = async (payload) => {
  const sql = `
    INSERT INTO ${TABLE}
      (id_lista, id_produto)
    VALUES
      (?, ?)
  `;

  const [result] = await db.execute(sql, [
    payload.id_lista,
    payload.id_produto
  ]);

  return result.insertId;
};

const update = async (id, payload) => {
  const allowedFields = ['id_lista', 'id_produto'];
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

  updates.push('updated_at = NOW()');
  params.push(id);

  const sql = `
    UPDATE ${TABLE}
    SET ${updates.join(', ')}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

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
  hardDelete
};
