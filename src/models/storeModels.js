const db = require("../config/db");

const TABLE = process.env.DB_STORE_TABLE || "Loja";

/** Colunas base seleccionadas em todas as queries (sem JOIN — tabela simples). */
const baseSelectColumns = `
  id,
  nif,
  nome,
  endereco,
  municipio,
  email,
  created_at,
  updated_at,
  deleted_at
`;

/**
 * Devolve todas as lojas activas (deleted_at IS NULL), ordenadas por nome ASC.
 *
 * @returns {Promise<Array>} Lista de registos activos.
 */
const findAllActives = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE}
    WHERE deleted_at IS NULL
    ORDER BY nome ASC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve todas as lojas (activas e eliminadas), ordenadas por nome ASC.
 *
 * @returns {Promise<Array>} Lista completa de registos.
 */
const findAll = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE}
    ORDER BY nome ASC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve todas as lojas eliminadas (deleted_at IS NOT NULL), ordenadas por nome ASC.
 *
 * @returns {Promise<Array>} Lista de registos eliminados.
 */
const findAllDeleted = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE}
    WHERE deleted_at IS NOT NULL
    ORDER BY nome ASC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve uma loja activa pelo seu id.
 * Apenas considera registos com deleted_at IS NULL.
 *
 * @param {number} id - Identificador da loja.
 * @returns {Promise<Object|null>} Registo encontrado ou null.
 */
const findById = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE}
    WHERE id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Devolve uma loja pelo seu id, independentemente de estar eliminada.
 *
 * @param {number} id - Identificador da loja.
 * @returns {Promise<Object|null>} Registo encontrado ou null.
 */
const findByIdIncludingDeleted = async (id) => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${TABLE}
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);
  return rows[0] || null;
};

/**
 * Verifica se já existe uma loja activa com o NIF indicado.
 * Quando ignoreId é fornecido, exclui esse registo da pesquisa (útil no update).
 *
 * @param {string}      nif       - NIF a verificar.
 * @param {number|null} ignoreId  - id a ignorar na pesquisa (opcional).
 * @returns {Promise<Object|null>} Registo duplicado ou null.
 */
const findActiveByNif = async (nif, ignoreId = null) => {
  // Só aplica a exclusão por id quando ignoreId é um inteiro positivo válido
  const hasIgnoreId = Number.isInteger(ignoreId) && ignoreId > 0;

  const sql = hasIgnoreId
    ? `
      SELECT id
      FROM ${TABLE}
      WHERE nif = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM ${TABLE}
      WHERE nif = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  const params = hasIgnoreId ? [nif, ignoreId] : [nif];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

/**
 * Cria uma nova loja e devolve o id do registo inserido.
 *
 * @param {Object} payload
 * @param {string} payload.nif       - NIF da loja (9 dígitos).
 * @param {string} payload.nome      - Nome da loja.
 * @param {string} payload.endereco  - Endereço da loja.
 * @param {string} payload.municipio - Município da loja.
 * @param {string} payload.email     - E-mail de contacto.
 * @returns {Promise<number>} insertId do registo criado.
 */
const create = async ({ nif, nome, endereco, municipio, email }) => {
  const sql = `
    INSERT INTO ${TABLE}
      (nif, nome, endereco, municipio, email, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await db.execute(sql, [
    nif,
    nome,
    endereco,
    municipio,
    email,
  ]);
  return result.insertId;
};

/**
 * Actualiza os campos permitidos de uma loja activa.
 * Campos aceites: nif, nome, endereco, municipio, email.
 * Ignora silenciosamente quaisquer outros campos presentes no payload.
 *
 * @param {number} id      - Identificador da loja a actualizar.
 * @param {Object} payload - Campos a actualizar (parcial ou total).
 * @returns {Promise<number>} Número de linhas afectadas (0 se nenhum campo válido).
 */
const update = async (id, payload) => {
  const allowedFields = ["nif", "nome", "endereco", "municipio", "email"];
  const updates = [];
  const params = [];

  // Constrói dinamicamente apenas os campos presentes no payload
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updates.push(`${field} = ?`);
      params.push(payload[field]);
    }
  }

  // Nenhum campo válido enviado — devolve 0 sem executar query
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
 * Marca uma loja activa como eliminada (soft delete).
 * Só actua se deleted_at IS NULL.
 *
 * @param {number} id - Identificador da loja.
 * @returns {Promise<number>} Número de linhas afectadas.
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
 * Restaura uma loja eliminada, limpando deleted_at.
 * Nota: a tabela Loja NÃO possui a coluna restored_at, por isso não é actualizada.
 * Só actua se deleted_at IS NOT NULL.
 *
 * @param {number} id - Identificador da loja.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
const restore = async (id) => {
  // Sem restored_at — não existe nesta tabela; apenas limpa deleted_at
  const sql = `
    UPDATE ${TABLE}
    SET
      deleted_at = NULL,
      updated_at = NOW()
    WHERE id = ?
      AND deleted_at IS NOT NULL
  `;

  const [result] = await db.execute(sql, [id]);
  return result.affectedRows;
};

/**
 * Elimina permanentemente uma loja da base de dados (hard delete).
 *
 * @param {number} id - Identificador da loja.
 * @returns {Promise<number>} Número de linhas afectadas.
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
  findActiveByNif,
  create,
  update,
  softDelete,
  restore,
  hardDelete,
};
