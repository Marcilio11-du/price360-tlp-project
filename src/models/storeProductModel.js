/**
 * @module storeProductModel
 * @description Modelo de acesso à base de dados para a tabela `Produto_Loja`.
 * Representa a associação entre um produto e uma loja, incluindo preço e quantidade.
 * Suporta soft delete e hard delete, com verificação de duplicação activa
 * que evita ter dois registos activos para o mesmo par (produto, loja).
 */

const db = require("../config/db");

/** Nome da tabela de associação produto-loja. */
const STORE_PRODUCT_TABLE =
  process.env.DB_STORE_PRODUCT_TABLE || "Produto_Loja";
/** Nome da tabela de produtos, usada nos JOINs. */
const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || "Produto";
/** Nome da tabela de lojas, usada nos JOINs. */
const STORE_TABLE = process.env.DB_STORE_TABLE || "Loja";

/**
 * Colunas seleccionadas em todas as queries de leitura.
 * Inclui `produto_nome` e `loja_nome` via JOIN para enriquecer a resposta
 * sem necessitar de chamadas adicionais à API.
 */
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

// --- Leitura ---

/**
 * Devolve todos os registos activos de produto-loja,
 * ordenados por preço ascendente (mais barato primeiro) e depois por ID.
 *
 * @returns {Promise<Array>} Lista de registos activos.
 */
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

/**
 * Devolve todos os registos (activos e removidos).
 * Destinado a uso administrativo.
 *
 * @returns {Promise<Array>} Lista completa de registos.
 */
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

/**
 * Devolve apenas os registos marcados como removidos (soft deleted).
 *
 * @returns {Promise<Array>} Lista de registos com `deleted_at IS NOT NULL`.
 */
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

/**
 * Procura um registo activo pelo ID.
 *
 * @param {number} id - ID do registo `Produto_Loja`.
 * @returns {Promise<Object|null>} Registo encontrado ou `null`.
 */
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

/**
 * Procura um registo pelo ID, independentemente do estado de remoção.
 * Usado após operações de escrita para devolver o estado actualizado.
 *
 * @param {number} id - ID do registo.
 * @returns {Promise<Object|null>} Registo encontrado ou `null`.
 */
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

/**
 * Verifica se um produto activo existe.
 * Usada antes de criar ou actualizar um registo para garantir
 * integridade referencial ao nível da aplicação.
 *
 * @param {number} productId - ID do produto.
 * @returns {Promise<boolean>} `true` se o produto existir e estiver activo.
 */
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

/**
 * Verifica se uma loja activa existe.
 *
 * @param {number} storeId - ID da loja.
 * @returns {Promise<boolean>} `true` se a loja existir e estiver activa.
 */
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

/**
 * Verifica se já existe um registo activo para o par (produto, loja).
 *
 * O parâmetro opcional `ignoreId` exclui um ID específico da pesquisa,
 * o que é necessário em dois cenários para evitar falsos positivos:
 *  1. **Update**: o registo que está a ser editado não deve colidir consigo
 *     próprio quando o par (produto, loja) se mantém igual.
 *  2. **Restore**: um registo em processo de restauro não deve ser considerado
 *     como duplicado de si mesmo.
 *
 * @param {number}      productId - ID do produto.
 * @param {number}      storeId   - ID da loja.
 * @param {number|null} [ignoreId=null] - ID do registo a excluir da verificação.
 * @returns {Promise<Object|null>} Registo duplicado encontrado, ou `null` se não houver conflito.
 */
const findActiveByProductAndStore = async (
  productId,
  storeId,
  ignoreId = null,
) => {
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

  const params = hasIgnoreId
    ? [productId, storeId, ignoreId]
    : [productId, storeId];
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

// --- Escrita ---

/**
 * Insere um novo registo de produto-loja.
 *
 * @param {Object} payload             - Dados do registo.
 * @param {number} payload.id_produto  - ID do produto.
 * @param {number} payload.id_loja     - ID da loja.
 * @param {number} payload.quantidade  - Quantidade disponível.
 * @param {number} payload.preco       - Preço do produto nesta loja.
 * @returns {Promise<number>} ID do registo criado.
 */
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
    payload.preco,
  ]);

  return result.insertId;
};

/**
 * Actualiza os campos fornecidos de um registo activo de produto-loja.
 * Apenas campos presentes em `allowedFields` são processados.
 *
 * @param {number} id      - ID do registo a actualizar.
 * @param {Object} payload - Campos a actualizar.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
const update = async (id, payload) => {
  const allowedFields = ["id_produto", "id_loja", "quantidade", "preco"];
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

  updates.push("updated_at = NOW()");
  params.push(id);

  const sql = `
    UPDATE ${STORE_PRODUCT_TABLE}
    SET ${updates.join(", ")}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

/**
 * Remove logicamente um registo de produto-loja. Operação reversível.
 *
 * @param {number} id - ID do registo.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
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

/**
 * Restaura um registo previamente removido com soft delete.
 *
 * @param {number} id - ID do registo.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
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

/**
 * Remove permanentemente um registo da base de dados. Irreversível.
 *
 * @param {number} id - ID do registo.
 * @returns {Promise<number>} Número de linhas eliminadas.
 */
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
  hardDelete,
};
