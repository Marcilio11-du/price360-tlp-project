const db = require('../config/db');

const USER_TABLE = process.env.DB_USER_TABLE || 'Utilizador';

const baseSelectColumns = `
  id,
  p_nome,
  u_nome,
  rua,
  municipio,
  email,
  data_nascimento,
  palavra_passe,
  genero,
  role,
  created_at,
  updated_at,
  deleted_at,
  restored_at
`;

const getAllUsers = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${USER_TABLE}
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const getAllActiveUsers = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${USER_TABLE}
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const getAllDeletedUsers = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${USER_TABLE}
    WHERE deleted_at IS NOT NULL
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

const getUserById = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${USER_TABLE}
    WHERE id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const getUserByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${USER_TABLE}
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

const getUserByEmail = async (email) => {
  const sql = `
    SELECT id, email
    FROM ${USER_TABLE}
    WHERE email = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [email]);
  return rows[0] || null;
};

const getUserByEmailExcludingId = async (email, id) => {
  const sql = `
    SELECT id, email
    FROM ${USER_TABLE}
    WHERE email = ? AND id <> ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [email, id]);
  return rows[0] || null;
};

const createUser = async (userData) => {
  const sql = `
    INSERT INTO ${USER_TABLE}
      (
        p_nome,
        u_nome,
        rua,
        municipio,
        email,
        data_nascimento,
        palavra_passe,
        genero,
        role
      )
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    userData.p_nome,
    userData.u_nome,
    userData.rua,
    userData.municipio,
    userData.email,
    userData.data_nascimento,
    userData.palavra_passe,
    userData.genero,
    userData.role
  ];

  const [result] = await db.execute(sql, params);
  return result.insertId;
};

const updateUser = async (id, userData) => {
  const allowedFields = [
    'p_nome',
    'u_nome',
    'rua',
    'municipio',
    'email',
    'data_nascimento',
    'palavra_passe',
    'genero',
    'role'
  ];

  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(userData, field)) {
      updates.push(`${field} = ?`);
      params.push(userData[field]);
    }
  }

  if (updates.length === 0) {
    return 0;
  }

  updates.push('updated_at = NOW()');

  params.push(id);

  const sql = `
    UPDATE ${USER_TABLE}
    SET ${updates.join(', ')}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

const softDeleteUser = async (id, actorId) => {
  const sql = `
    UPDATE ${USER_TABLE}
    SET
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

const restoreUser = async (id, actorId) => {
  const sql = `
    UPDATE ${USER_TABLE}
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

const hardDeleteUser = async (id) => {
  const sql = `DELETE FROM ${USER_TABLE} WHERE id = ?`;
  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

module.exports = {
  getAllUsers,
  getAllActiveUsers,
  getAllDeletedUsers,
  getUserById,
  getUserByIdIncludingDeleted,
  getUserByEmail,
  getUserByEmailExcludingId,
  createUser,
  updateUser,
  softDeleteUser,
  restoreUser,
  hardDeleteUser
};
