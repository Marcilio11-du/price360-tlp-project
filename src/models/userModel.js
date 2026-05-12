/**
 * @module userModel
 * @description Modelo de acesso à base de dados para a tabela `Utilizador`.
 * Fornece funções CRUD completas, incluindo soft delete (marcação lógica com
 * `deleted_at`) e hard delete (remoção física do registo).
 */

const db = require("../config/db");

/** Nome da tabela, configurável via variável de ambiente. */
const USER_TABLE = process.env.DB_USER_TABLE || "Utilizador";

/**
 * Colunas seleccionadas em todas as queries de leitura.
 * Centralizado aqui para garantir consistência entre funções e facilitar
 * futuras alterações ao schema sem ter de editar cada query individualmente.
 */
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

// --- Leitura ---

/**
 * Devolve todos os utilizadores (activos e removidos).
 * Útil para listagens administrativas que precisam de visibilidade total.
 *
 * @returns {Promise<Array>} Lista completa de utilizadores.
 */
const getAllUsers = async () => {
  const sql = `
    SELECT ${baseSelectColumns}
    FROM ${USER_TABLE}
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

/**
 * Devolve apenas os utilizadores activos (sem soft delete).
 *
 * @returns {Promise<Array>} Lista de utilizadores com `deleted_at IS NULL`.
 */
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

/**
 * Devolve apenas os utilizadores marcados como removidos (soft deleted).
 *
 * @returns {Promise<Array>} Lista de utilizadores com `deleted_at IS NOT NULL`.
 */
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

/**
 * Procura um utilizador activo pelo seu ID.
 *
 * @param {number} id - ID do utilizador.
 * @returns {Promise<Object|null>} Utilizador encontrado ou `null` se não existir / estiver removido.
 */
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

/**
 * Procura um utilizador pelo ID, incluindo os marcados como removidos.
 * Usado após operações de escrita (create, update, restore) para devolver
 * o estado mais recente do registo independentemente do seu estado de remoção.
 *
 * @param {number} id - ID do utilizador.
 * @returns {Promise<Object|null>} Utilizador encontrado ou `null`.
 */
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

/**
 * Procura um utilizador pelo email (inclui removidos).
 * Utilizado na criação para verificar unicidade global do email.
 *
 * @param {string} email - Endereço de email a pesquisar.
 * @returns {Promise<Object|null>} Registo com `id` e `email`, ou `null`.
 */
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

/**
 * Verifica se o email já está a ser usado por *outro* utilizador.
 * A cláusula `id <> ?` exclui o próprio registo a ser actualizado, evitando
 * um falso positivo de duplicação quando o utilizador mantém o mesmo email.
 *
 * @param {string} email - Email a verificar.
 * @param {number} id    - ID do utilizador a excluir da pesquisa.
 * @returns {Promise<Object|null>} Registo conflituoso ou `null` se o email estiver disponível.
 */
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

// --- Escrita ---

/**
 * Insere um novo utilizador na tabela.
 *
 * @param {Object} userData              - Dados do utilizador a criar.
 * @param {string} userData.p_nome       - Primeiro nome.
 * @param {string} userData.u_nome       - Último nome.
 * @param {string} userData.rua          - Morada (rua).
 * @param {string} userData.municipio    - Município.
 * @param {string} userData.email        - Endereço de email (único).
 * @param {string} userData.data_nascimento - Data de nascimento.
 * @param {string} userData.palavra_passe - Hash bcrypt da palavra-passe.
 * @param {string} userData.genero       - Género normalizado.
 * @param {string} userData.role         - Papel do utilizador (`user` ou `admin`).
 * @returns {Promise<number>} ID do registo recém-criado.
 */
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
    userData.role,
  ];

  const [result] = await db.execute(sql, params);
  return result.insertId;
};

/**
 * Actualiza os campos fornecidos de um utilizador activo.
 * Apenas os campos presentes em `allowedFields` são aceites; quaisquer
 * outros campos no payload são silenciosamente ignorados.
 *
 * @param {number} id       - ID do utilizador a actualizar.
 * @param {Object} userData - Objecto com os campos a actualizar.
 * @returns {Promise<number>} Número de linhas afectadas (0 se nenhum campo válido foi enviado).
 */
const updateUser = async (id, userData) => {
  const allowedFields = [
    "p_nome",
    "u_nome",
    "rua",
    "municipio",
    "email",
    "data_nascimento",
    "palavra_passe",
    "genero",
    "role",
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

  updates.push("updated_at = NOW()");

  params.push(id);

  const sql = `
    UPDATE ${USER_TABLE}
    SET ${updates.join(", ")}
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(sql, params);
  return result.affectedRows;
};

/**
 * Realiza o soft delete de um utilizador, marcando `deleted_at` com a data/hora actual.
 * O registo permanece na base de dados e pode ser restaurado com `restoreUser`.
 * Contrariamente ao hard delete, esta operação é reversível.
 *
 * @param {number} id      - ID do utilizador a remover logicamente.
 * @param {number} actorId - ID do actor que executa a operação (reservado para auditoria futura).
 * @returns {Promise<number>} Número de linhas afectadas (0 se o utilizador já estava removido).
 */
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

/**
 * Restaura um utilizador previamente removido com soft delete,
 * limpando `deleted_at` e registando `restored_at`.
 *
 * @param {number} id      - ID do utilizador a restaurar.
 * @param {number} actorId - ID do actor que executa a operação (reservado para auditoria futura).
 * @returns {Promise<number>} Número de linhas afectadas (0 se o utilizador já estava activo).
 */
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

/**
 * Remove permanentemente um utilizador da base de dados (hard delete).
 * Esta operação é **irreversível** — use apenas quando necessário (ex: RGPD).
 * Para remoção reversível, utilize `softDeleteUser`.
 *
 * @param {number} id - ID do utilizador a eliminar fisicamente.
 * @returns {Promise<number>} Número de linhas eliminadas.
 */
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
  hardDeleteUser,
};
