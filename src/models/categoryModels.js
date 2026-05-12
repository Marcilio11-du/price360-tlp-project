const db = require("../config/db");

const TABLE = process.env.DB_CATEGORY_TABLE || "Categoria";

// Colunas base retornadas em todas as queries.
// O campo DB chama-se "description" (razões históricas), mas é exposto
// pela API como "descricao" através do alias SQL.
const baseSelectColumns = `
  id,
  nome,
  description AS descricao,
  created_at,
  updated_at,
  deleted_at
`;

// ---------------------------------------------------------------------------
// Queries de leitura
// ---------------------------------------------------------------------------

/**
 * Devolve todas as categorias ativas (deleted_at IS NULL), ordenadas por nome.
 * @returns {Promise<Array>} Lista de categorias ativas.
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
 * Devolve todas as categorias (ativas e eliminadas), ordenadas por nome.
 * @returns {Promise<Array>} Lista completa de categorias.
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
 * Devolve apenas as categorias eliminadas (deleted_at IS NOT NULL), ordenadas por nome.
 * @returns {Promise<Array>} Lista de categorias eliminadas.
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
 * Encontra uma categoria ativa pelo seu id.
 * @param {number} id - Identificador da categoria.
 * @returns {Promise<Object|null>} Registo da categoria ou null se não encontrado/eliminado.
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
 * Encontra uma categoria pelo seu id, incluindo as eliminadas.
 * @param {number} id - Identificador da categoria.
 * @returns {Promise<Object|null>} Registo da categoria ou null se não encontrado.
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
 * Verifica a unicidade do nome entre as categorias ativas.
 * Permite excluir um id específico (útil em atualizações para ignorar o próprio registo).
 * @param {string} nome - Nome a verificar.
 * @param {number|null} [ignoreId=null] - Id a ignorar na verificação.
 * @returns {Promise<Object|null>} Registo existente com o mesmo nome ou null se disponível.
 */
const findActiveByName = async (nome, ignoreId = null) => {
  const hasIgnoreId = Number.isInteger(ignoreId) && ignoreId > 0;

  const sql = hasIgnoreId
    ? `
      SELECT id
      FROM ${TABLE}
      WHERE nome = ?
        AND deleted_at IS NULL
        AND id <> ?
      LIMIT 1
    `
    : `
      SELECT id
      FROM ${TABLE}
      WHERE nome = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

  const params = hasIgnoreId ? [nome, ignoreId] : [nome];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

// ---------------------------------------------------------------------------
// Queries de escrita
// ---------------------------------------------------------------------------

/**
 * Insere uma nova categoria na base de dados.
 * @param {Object} payload - Dados da categoria.
 * @param {string} payload.nome - Nome da categoria.
 * @param {string|null} payload.descricao - Descrição da categoria (campo DB: description).
 * @returns {Promise<number>} Id do registo criado.
 */
const create = async ({ nome, descricao }) => {
  const sql = `
    INSERT INTO ${TABLE}
      (nome, description)
    VALUES
      (?, ?)
  `;

  const [result] = await db.execute(sql, [nome, descricao ?? null]);
  return result.insertId;
};

/**
 * Atualiza os campos fornecidos de uma categoria ativa.
 * Utiliza fieldMap para traduzir os nomes de campo da API para as colunas DB:
 *   - "nome"     → coluna "nome"
 *   - "descricao" → coluna "description"
 * @param {number} id - Identificador da categoria a atualizar.
 * @param {Object} payload - Campos a atualizar (nomes da API).
 * @returns {Promise<number>} Número de linhas afetadas (0 se nenhum campo válido foi enviado).
 */
const update = async (id, payload) => {
  // Mapeamento de campo API → coluna DB
  const fieldMap = { nome: "nome", descricao: "description" };

  const updates = [];
  const params = [];

  for (const [apiField, dbColumn] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(payload, apiField)) {
      updates.push(`${dbColumn} = ?`);
      params.push(payload[apiField]);
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
 * Marca uma categoria como eliminada (soft delete), apenas se estiver ativa.
 * @param {number} id - Identificador da categoria.
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
 * Restaura uma categoria eliminada, limpando deleted_at.
 * A tabela Categoria não possui coluna restored_at.
 * @param {number} id - Identificador da categoria.
 * @returns {Promise<number>} Número de linhas afetadas.
 */
const restore = async (id) => {
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
 * Remove permanentemente uma categoria da base de dados (hard delete).
 * @param {number} id - Identificador da categoria.
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
  findActiveByName,
  create,
  update,
  softDelete,
  restore,
  hardDelete,
};
