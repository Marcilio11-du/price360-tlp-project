const db = require('../config/db');

const STORE_PRODUCT_TABLE = process.env.DB_STORE_PRODUCT_TABLE || 'Produto_Loja';
const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || 'Produto';
const STORE_TABLE = process.env.DB_STORE_TABLE || 'Loja';

const baseSelectColumns = `
  sp.id,
  sp.id_produto,
  p.nome AS produto_nome,
  sp.id_loja,
  l.nome AS loja_nome,
  sp.quantidade,
  sp.preco,
  sp.created_at,
  sp.updated_at,
  sp.deleted_at,
  sp.restored_at
`;

const findAllActives = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${STORE_PRODUCT_TABLE} sp
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = sp.id_produto
    INNER JOIN ${STORE_TABLE} l ON l.id = sp.id_loja
    WHERE sp.deleted_at IS NULL
    ORDER BY sp.preco ASC, sp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findAll = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${STORE_PRODUCT_TABLE} sp
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = sp.id_produto
    INNER JOIN ${STORE_TABLE} l ON l.id = sp.id_loja
    ORDER BY sp.preco ASC, sp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findAllDeleted = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${STORE_PRODUCT_TABLE} sp
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = sp.id_produto
    INNER JOIN ${STORE_TABLE} l ON l.id = sp.id_loja
    WHERE sp.deleted_at IS NOT NULL
    ORDER BY sp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findById = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${STORE_PRODUCT_TABLE} sp
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = sp.id_produto
    INNER JOIN ${STORE_TABLE} l ON l.id = sp.id_loja
    WHERE sp.id = ?
      AND sp.deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const findByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${STORE_PRODUCT_TABLE} sp
    INNER JOIN ${PRODUCT_TABLE} p ON p.id = sp.id_produto
    INNER JOIN ${STORE_TABLE} l ON l.id = sp.id_loja
    WHERE sp.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const productExists = async (productId) => {
  const sql = `
    SELECT id
    FROM ${PRODUCT_TABLE}
    WHERE id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [productId]);
  return Boolean(rows[0]);
};

const storeExists = async (storeId) => {
  const sql = `
    SELECT id
    FROM ${STORE_TABLE}
    WHERE id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [storeId]);
  return Boolean(rows[0]);
};

const findActiveByProductAndStore = async (productId, storeId, ignoreId = null) => {
  const hasIgnoreId = Number.isInteger(ignoreId) && ignoreId > 0;
  const sql = hasIgnoreId
    ? `
      SELECT id
      FROM ${STORE_PRODUCT_TABLE}
      WHERE id_produto = ?
        AND id_loja = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM ${STORE_PRODUCT_TABLE}
      WHERE id_produto = ?
        AND id_loja = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  const params = hasIgnoreId ? [productId, storeId, ignoreId] : [productId, storeId];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

const create = async (payload) => {
  const sql = `
    INSERT INTO ${STORE_PRODUCT_TABLE}
      (id_produto, id_loja, quantidade, preco)
    VALUES
      (?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    payload.id_produto,
    payload.id_loja,
    payload.quantidade,
    payload.preco
  ]);

  return result.insertId;
};

const update = async (id, payload) => {
  const allowedFields = ['id_produto', 'id_loja', 'quantidade', 'preco'];
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
    UPDATE ${STORE_PRODUCT_TABLE}
    SET ${updates.join(', ')}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

const softDelete = async (id) => {
  const sql = `
    UPDATE ${STORE_PRODUCT_TABLE}
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
    UPDATE ${STORE_PRODUCT_TABLE}
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
  const sql = `DELETE FROM ${STORE_PRODUCT_TABLE} WHERE id = ?`;
  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

module.exports = {
  findAllActives,
  findAll,
  findAllDeleted,
  findById,
  findByIdIncludingDeleted,
  productExists,
  storeExists,
  findActiveByProductAndStore,
  create,
  update,
  softDelete,
  restore,
  hardDelete
};
