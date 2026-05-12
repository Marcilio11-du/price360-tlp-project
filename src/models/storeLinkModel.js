const db = require('../config/db');

const TABLE = process.env.DB_STORE_LINK_TABLE || 'Link_Loja';
const STORE_TABLE = process.env.DB_STORE_TABLE || 'Loja';

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

const findActiveByLink = async (link, ignoreId = null) => {
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

  const params = hasIgnoreId ? [link, ignoreId] : [link];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

const create = async (payload) => {
  const sql = `
    INSERT INTO ${TABLE}
      (link, id_loja)
    VALUES
      (?, ?)
  `;

  const [result] = await db.execute(sql, [
    payload.link,
    payload.id_loja
  ]);

  return result.insertId;
};

const update = async (id, payload) => {
  const allowedFields = ['link', 'id_loja'];
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
  findActiveByLink,
  create,
  update,
  softDelete,
  restore,
  hardDelete
};
