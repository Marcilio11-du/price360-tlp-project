/**
 * @module productModel
 * @description Modelo de acesso à base de dados para a tabela `Produto`.
 * Suporta pesquisa dinâmica por múltiplos critérios (RF01 — Pesquisa de produtos)
 * e operações CRUD completas com soft delete e hard delete.
 */

const db = require("../config/db");

/** Nome da tabela de produtos, configurável via variável de ambiente. */
const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || "Produto";
/** Nome da tabela de categorias, usada nos JOINs para enriquecer os resultados. */
const CATEGORY_TABLE = process.env.DB_CATEGORY_TABLE || "Categoria";

/**
 * Colunas seleccionadas em todas as queries de leitura.
 * Inclui `c.nome AS categoria_nome` para que as respostas da API já
 * transportem o nome da categoria sem necessitar de uma segunda query.
 */
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

// --- Construção dinâmica de filtros (RF01) ---

/**
 * Constrói dinamicamente as cláusulas WHERE e os parâmetros correspondentes
 * a partir de um objecto de filtros. Cada filtro presente gera uma cláusula
 * independente que é concatenada com AND nas queries que o utilizam.
 *
 * Filtros suportados:
 * - `nome`        — correspondência parcial no campo `p.nome`.
 * - `palavraChave`— correspondência parcial em `p.nome`, `p.marca` e `p.descricao`.
 * - `q`           — correspondência parcial em `p.nome`, `p.marca`, `p.descricao`
 *                   **e** `c.nome` (pesquisa global, RF01).
 * - `categoriaId` — filtro exacto por ID de categoria.
 * - `categoriaNome`— correspondência parcial no nome da categoria.
 *
 * @param {Object}  filters              - Objecto com os filtros de pesquisa.
 * @param {string}  [filters.nome]       - Nome do produto (parcial).
 * @param {string}  [filters.palavraChave] - Palavra-chave a pesquisar em vários campos.
 * @param {string}  [filters.q]          - Termo de pesquisa global.
 * @param {number}  [filters.categoriaId]  - ID exacto da categoria.
 * @param {string}  [filters.categoriaNome] - Nome parcial da categoria.
 * @returns {{ clauses: string[], params: Array }} Cláusulas SQL e array de parâmetros.
 */
const parseSearchFilters = (filters = {}) => {
  const clauses = [];
  const params = [];

  if (filters.nome) {
    clauses.push("p.nome LIKE ?");
    params.push(`%${filters.nome}%`);
  }

  if (filters.palavraChave) {
    clauses.push("(p.nome LIKE ? OR p.marca LIKE ? OR p.descricao LIKE ?)");
    params.push(
      `%${filters.palavraChave}%`,
      `%${filters.palavraChave}%`,
      `%${filters.palavraChave}%`,
    );
  }

  if (filters.q) {
    clauses.push(
      "(p.nome LIKE ? OR p.marca LIKE ? OR p.descricao LIKE ? OR c.nome LIKE ?)",
    );
    params.push(
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
      `%${filters.q}%`,
    );
  }

  if (filters.categoriaId) {
    clauses.push("p.id_categoria = ?");
    params.push(filters.categoriaId);
  }

  if (filters.categoriaNome) {
    clauses.push("c.nome LIKE ?");
    params.push(`%${filters.categoriaNome}%`);
  }

  return { clauses, params };
};

// --- Leitura ---

/**
 * Devolve todos os produtos activos, com suporte a filtros de pesquisa (RF01).
 * Faz INNER JOIN com `Categoria` para incluir o nome da categoria.
 *
 * @param {Object} [filters={}] - Filtros de pesquisa (ver `parseSearchFilters`).
 * @returns {Promise<Array>} Lista de produtos activos ordenados por nome.
 */
const findAllActives = async (filters = {}) => {
  const { clauses, params } = parseSearchFilters(filters);
  const where = ["p.deleted_at IS NULL", ...clauses].join(" AND ");

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

/**
 * Devolve todos os produtos (activos e removidos), com suporte a filtros.
 * Destinado a uso administrativo.
 *
 * @param {Object} [filters={}] - Filtros de pesquisa (ver `parseSearchFilters`).
 * @returns {Promise<Array>} Lista completa de produtos.
 */
const findAll = async (filters = {}) => {
  const { clauses, params } = parseSearchFilters(filters);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

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

/**
 * Devolve apenas os produtos marcados como removidos (soft deleted).
 *
 * @returns {Promise<Array>} Lista de produtos com `deleted_at IS NOT NULL`.
 */
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

/**
 * Procura um produto activo pelo ID.
 *
 * @param {number} id - ID do produto.
 * @returns {Promise<Object|null>} Produto encontrado ou `null`.
 */
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

/**
 * Procura um produto pelo ID, independentemente do estado de remoção.
 * Usado após operações de escrita para devolver o registo actualizado.
 *
 * @param {number} id - ID do produto.
 * @returns {Promise<Object|null>} Produto encontrado ou `null`.
 */
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

/**
 * Verifica se uma categoria activa existe na base de dados.
 * Usada pelo controller antes de criar ou actualizar um produto,
 * para garantir integridade referencial ao nível da aplicação.
 *
 * @param {number} categoryId - ID da categoria a verificar.
 * @returns {Promise<boolean>} `true` se a categoria existir e estiver activa.
 */
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

// --- Escrita ---

/**
 * Insere um novo produto na tabela.
 *
 * @param {Object}  payload              - Dados do produto.
 * @param {string}  payload.nome         - Nome do produto.
 * @param {string}  payload.marca        - Marca do produto.
 * @param {string}  [payload.data_validade] - Data de validade (opcional).
 * @param {string}  [payload.descricao]  - Descrição (opcional).
 * @param {number}  payload.id_categoria - ID da categoria.
 * @returns {Promise<number>} ID do registo recém-criado.
 */
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
    payload.id_categoria,
  ];

  const [result] = await db.execute(sql, params);
  return result.insertId;
};

/**
 * Actualiza os campos fornecidos de um produto activo.
 * Apenas campos presentes em `allowedFields` são processados.
 *
 * @param {number} id      - ID do produto a actualizar.
 * @param {Object} payload - Campos a actualizar.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
const update = async (id, payload) => {
  const allowedFields = [
    "nome",
    "marca",
    "data_validade",
    "descricao",
    "id_categoria",
  ];
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
    UPDATE ${PRODUCT_TABLE}
    SET ${updates.join(", ")}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

/**
 * Remove logicamente um produto, marcando `deleted_at` com a data/hora actual.
 * Operação reversível através de `restore`.
 *
 * @param {number} id - ID do produto.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
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

/**
 * Restaura um produto previamente removido com soft delete.
 *
 * @param {number} id - ID do produto.
 * @returns {Promise<number>} Número de linhas afectadas.
 */
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

/**
 * Remove permanentemente um produto da base de dados. Irreversível.
 *
 * @param {number} id - ID do produto.
 * @returns {Promise<number>} Número de linhas eliminadas.
 */
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
  hardDelete,
};
