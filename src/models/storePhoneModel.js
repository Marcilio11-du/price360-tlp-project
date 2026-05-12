const db = require('../config/db');

const TABLE = process.env.DB_STORE_PHONE_TABLE || 'Telefone_Loja';
const STORE_TABLE = process.env.DB_STORE_TABLE || 'Loja';

const baseSelectColumns = `
  tp.id,
  tp.n_telefone,
  tp.id_loja,
  l.nome AS loja_nome,
  tp.created_at,
  tp.updated_at,
  tp.deleted_at,
  tp.restored_at
`;

const findAllActives = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} tp
    INNER JOIN ${STORE_TABLE} l ON l.id = tp.id_loja
    WHERE tp.deleted_at IS NULL
    ORDER BY tp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findAll = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} tp
    INNER JOIN ${STORE_TABLE} l ON l.id = tp.id_loja
    ORDER BY tp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findAllDeleted = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} tp
    INNER JOIN ${STORE_TABLE} l ON l.id = tp.id_loja
    WHERE tp.deleted_at IS NOT NULL
    ORDER BY tp.id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findById = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} tp
    INNER JOIN ${STORE_TABLE} l ON l.id = tp.id_loja
    WHERE tp.id = ?
      AND tp.deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const findByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} tp
    INNER JOIN ${STORE_TABLE} l ON l.id = tp.id_loja
    WHERE tp.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const findByStoreId = async (storeId) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE} tp
    INNER JOIN ${STORE_TABLE} l ON l.id = tp.id_loja
    WHERE tp.id_loja = ?
      AND tp.deleted_at IS NULL
    ORDER BY tp.id DESC
  `;

  const [rows] = await db.execute(sql, [storeId]);
  return rows;
};

const findActiveByPhone = async (nTelefone, ignoreId = null) => {
  const hasIgnoreId = Number.isInteger(ignoreId) && ignoreId > 0;
  const sql = hasIgnoreId
    ? `
      SELECT id
      FROM ${TABLE}
      WHERE n_telefone = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM ${TABLE}
      WHERE n_telefone = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  const params = hasIgnoreId ? [nTelefone, ignoreId] : [nTelefone];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

const create = async (payload) => {
  const sql = `
    INSERT INTO ${TABLE}
      (n_telefone, id_loja)
    VALUES
      (?, ?)
  `;

  const [result] = await db.execute(sql, [
    payload.n_telefone,
    payload.id_loja
  ]);

  return result.insertId;
};

const update = async (id, payload) => {
  const allowedFields = ['n_telefone', 'id_loja'];
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
  findByStoreId,
  findActiveByPhone,
  create,
  update,
  softDelete,
  restore,
  hardDelete
};
