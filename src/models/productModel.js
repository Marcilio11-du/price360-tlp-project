const db = require('../config/db');

const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || 'Produto';
const CATEGORY_TABLE = process.env.DB_CATEGORY_TABLE || 'Categoria';

const baseSelectColumns = `
  p.id,
  p.nome,
  p.marca,
  p.data_validade,
  p.descricao,
  p.id_categoria,
  p.created_at,
  p.updated_at,
  p.deleted_at,
  p.restored_at,
  c.nome AS categoria_nome
`;

const parseSearchFilters = (filters = {}) => {
  const clauses = [];
  const params = [];

  if (filters.nome) {
    clauses.push('p.nome LIKE ?');
    params.push(`%${filters.nome}%`);
  }

  if (filters.palavraChave) {
    clauses.push('(p.nome LIKE ? OR p.marca LIKE ? OR p.descricao LIKE ?)');
    params.push(`%${filters.palavraChave}%`, `%${filters.palavraChave}%`, `%${filters.palavraChave}%`);
  }

  if (filters.q) {
    clauses.push('(p.nome LIKE ? OR p.marca LIKE ? OR p.descricao LIKE ? OR c.nome LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  if (filters.categoriaId) {
    clauses.push('p.id_categoria = ?');
    params.push(filters.categoriaId);
  }

  if (filters.categoriaNome) {
    clauses.push('c.nome LIKE ?');
    params.push(`%${filters.categoriaNome}%`);
  }

  return { clauses, params };
};

const findAllActives = async (filters = {}) => {
  const { clauses, params } = parseSearchFilters(filters);
  const where = ['p.deleted_at IS NULL', ...clauses].join(' AND ');

  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${PRODUCT_TABLE} p
    INNER JOIN ${CATEGORY_TABLE} c ON c.id = p.id_categoria
    WHERE ${where}
    ORDER BY p.nome ASC
  `;

  const [rows] = await db.execute(sql, params);
  return rows;
};

const findAll = async (filters = {}) => {
  const { clauses, params } = parseSearchFilters(filters);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${PRODUCT_TABLE} p
    INNER JOIN ${CATEGORY_TABLE} c ON c.id = p.id_categoria
    ${where}
    ORDER BY p.nome ASC
  `;

  const [rows] = await db.execute(sql, params);
  return rows;
};

const findAllDeleted = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${PRODUCT_TABLE} p
    INNER JOIN ${CATEGORY_TABLE} c ON c.id = p.id_categoria
    WHERE p.deleted_at IS NOT NULL
    ORDER BY p.nome ASC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const findById = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${PRODUCT_TABLE} p
    INNER JOIN ${CATEGORY_TABLE} c ON c.id = p.id_categoria
    WHERE p.id = ?
      AND p.deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const findByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${PRODUCT_TABLE} p
    INNER JOIN ${CATEGORY_TABLE} c ON c.id = p.id_categoria
    WHERE p.id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const categoryExists = async (categoryId) => {
  const sql = `
    SELECT id
    FROM ${CATEGORY_TABLE}
    WHERE id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [categoryId]);
  return Boolean(rows[0]);
};

const create = async (payload) => {
  const sql = `
    INSERT INTO ${PRODUCT_TABLE}
      (nome, marca, data_validade, descricao, id_categoria)
    VALUES
      (?, ?, ?, ?, ?)
  `;

  const params = [
    payload.nome,
    payload.marca,
    payload.data_validade || null,
    payload.descricao || null,
    payload.id_categoria
  ];

  const [result] = await db.execute(sql, params);
  return result.insertId;
};

const update = async (id, payload) => {
  const allowedFields = ['nome', 'marca', 'data_validade', 'descricao', 'id_categoria'];
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
    UPDATE ${PRODUCT_TABLE}
    SET ${updates.join(', ')}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

const softDelete = async (id) => {
  const sql = `
    UPDATE ${PRODUCT_TABLE}
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
    UPDATE ${PRODUCT_TABLE}
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
  const sql = `DELETE FROM ${PRODUCT_TABLE} WHERE id = ?`;
  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

module.exports = {
  findAllActives,
  findAll,
  findAllDeleted,
  findById,
  findByIdIncludingDeleted,
  categoryExists,
  create,
  update,
  softDelete,
  restore,
  hardDelete
};
