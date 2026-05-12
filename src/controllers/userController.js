/**
 * @module userController
 * @description Handlers HTTP para o CRUD completo de utilizadores.
 * Gere a criação, leitura, actualização, soft delete, restore e hard delete
 * de registos da tabela `Utilizador`.
 */

const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

/** Número de rondas de salt para o bcrypt; configurável via variável de ambiente. */
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

// --- Utilitários internos ---

/**
 * Extrai e valida o ID do actor a partir do cabeçalho `x-actor-id`.
 * Retorna `null` se o cabeçalho estiver ausente ou contiver um valor inválido.
 *
 * Nota: as colunas de auditoria por utilizador foram removidas do schema,
 * pelo que o valor devolvido não é actualmente utilizado nos handlers —
 * a leitura do cabeçalho fica preservada para possível reintegração futura.
 *
 * @param {import('express').Request} req - Objecto de pedido Express.
 * @returns {number|null} ID inteiro positivo do actor, ou `null`.
 */
const getActorIdFromRequest = (req) => {
  const rawActorId = req.header("x-actor-id");
  if (!rawActorId) return null;

  const actorId = Number(rawActorId);
  if (!Number.isInteger(actorId) || actorId <= 0) return null;

  return actorId;
};

/**
 * Envia uma resposta JSON de sucesso com estrutura normalizada.
 *
 * @param {import('express').Response} res - Objecto de resposta Express.
 * @param {number} statusCode - Código HTTP a enviar (ex: 200, 201).
 * @param {*}      data       - Dados a incluir no campo `data`.
 * @param {string} message    - Mensagem descritiva do resultado.
 * @returns {import('express').Response}
 */
const sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    status: "success",
    data,
    message,
  });
};

/**
 * Envia uma resposta JSON de erro com estrutura normalizada.
 *
 * @param {import('express').Response} res - Objecto de resposta Express.
 * @param {number}      statusCode - Código HTTP a enviar (ex: 400, 404, 500).
 * @param {string}      message    - Mensagem de erro legível.
 * @param {Array|null}  details    - Lista opcional de detalhes de validação.
 * @returns {import('express').Response}
 */
const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    status: "error",
    data: null,
    message,
    details,
  });
};

// --- Handlers de leitura ---

/**
 * Lista todos os utilizadores activos (sem soft delete).
 *
 * @route  GET /users
 * @param  {import('express').Request}  _req - Não utilizado.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getUsers = async (_req, res) => {
  try {
    const users = await userModel.getAllActiveUsers();
    return sendSuccess(
      res,
      200,
      users,
      "Utilizadores ativos listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar utilizadores:", error);
    return sendError(res, 500, "Falha interna ao listar utilizadores.");
  }
};

/**
 * Lista todos os utilizadores, incluindo os marcados como removidos.
 * Destinado a uso administrativo.
 *
 * @route  GET /users/all
 * @param  {import('express').Request}  _req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getAllUsers = async (_req, res) => {
  try {
    const users = await userModel.getAllUsers();
    return sendSuccess(
      res,
      200,
      users,
      "Todos os utilizadores listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar todos os utilizadores:", error);
    return sendError(
      res,
      500,
      "Falha interna ao listar todos os utilizadores.",
    );
  }
};

/**
 * Lista apenas os utilizadores removidos logicamente (soft deleted).
 *
 * @route  GET /users/deleted
 * @param  {import('express').Request}  _req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getDeletedUsers = async (_req, res) => {
  try {
    const users = await userModel.getAllDeletedUsers();
    return sendSuccess(
      res,
      200,
      users,
      "Utilizadores removidos listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar utilizadores removidos:", error);
    return sendError(
      res,
      500,
      "Falha interna ao listar utilizadores removidos.",
    );
  }
};

/**
 * Devolve um utilizador activo pelo seu ID.
 *
 * @route  GET /users/:id
 * @param  {import('express').Request}  req - `req.params.id` deve ser inteiro positivo.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await userModel.getUserById(userId);

    if (!user) {
      return sendError(res, 404, "Utilizador nao encontrado.");
    }

    return sendSuccess(res, 200, user, "Utilizador encontrado com sucesso.");
  } catch (error) {
    console.error("Erro ao obter utilizador por id:", error);
    return sendError(res, 500, "Falha interna ao obter utilizador.");
  }
};

// --- Handlers de escrita ---

/**
 * Cria um novo utilizador.
 * Verifica unicidade do email e faz hash da palavra-passe antes de persistir.
 *
 * @route  POST /users
 * @param  {import('express').Request}  req - Body validado por `validateCreateUser`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const createUser = async (req, res) => {
  try {
    const payload = req.body;
    // actorId header ignored because audit user-id columns were removed

    const existing = await userModel.getUserByEmail(payload.email);
    if (existing) {
      return sendError(res, 409, "Ja existe um utilizador com este email.");
    }

    // A palavra-passe nunca é guardada em texto simples — é sempre transformada
    // num hash bcrypt com o número de rondas configurado em SALT_ROUNDS.
    const hashedPassword = await bcrypt.hash(
      payload.palavra_passe,
      SALT_ROUNDS,
    );

    const userId = await userModel.createUser({
      ...payload,
      palavra_passe: hashedPassword,
      role: payload.role || "user",
    });

    const createdUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(res, 201, createdUser, "Utilizador criado com sucesso.");
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    return sendError(res, 500, "Falha interna ao criar utilizador.");
  }
};

/**
 * Actualiza os dados de um utilizador activo.
 * Se a palavra-passe for enviada, é novamente convertida em hash antes de persistir.
 * A unicidade do email é verificada excluindo o próprio utilizador da pesquisa.
 *
 * @route  PATCH /users/:id
 * @param  {import('express').Request}  req - `req.params.id` + body validado por `validateUpdateUser`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const payload = { ...req.body };
    // actorId header ignored because audit user-id columns were removed

    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return sendError(res, 404, "Utilizador nao encontrado.");
    }

    if (payload.email) {
      const emailInUse = await userModel.getUserByEmailExcludingId(
        payload.email,
        userId,
      );
      if (emailInUse) {
        return sendError(
          res,
          409,
          "Email ja esta a ser usado por outro utilizador.",
        );
      }
    }

    if (payload.palavra_passe) {
      payload.palavra_passe = await bcrypt.hash(
        payload.palavra_passe,
        SALT_ROUNDS,
      );
    }

    // nothing to add here; timestamps are handled by DB

    const affectedRows = await userModel.updateUser(userId, payload);
    if (affectedRows === 0) {
      return sendError(
        res,
        400,
        "Nenhum campo valido foi enviado para atualizacao.",
      );
    }

    const updatedUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(
      res,
      200,
      updatedUser,
      "Utilizador atualizado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao atualizar utilizador:", error);
    return sendError(res, 500, "Falha interna ao atualizar utilizador.");
  }
};

/**
 * Remove logicamente um utilizador (soft delete), preservando o registo na BD.
 * O utilizador pode ser restaurado posteriormente com `restoreUser`.
 *
 * @route  DELETE /users/:id
 * @param  {import('express').Request}  req - `req.params.id`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return sendError(res, 404, "Utilizador nao encontrado.");
    }

    await userModel.softDeleteUser(userId);
    const deletedUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(
      res,
      200,
      deletedUser,
      "Utilizador removido com sucesso (soft delete).",
    );
  } catch (error) {
    console.error("Erro ao remover utilizador:", error);
    return sendError(res, 500, "Falha interna ao remover utilizador.");
  }
};

/**
 * Restaura um utilizador previamente removido com soft delete.
 * Retorna 409 se o utilizador já estiver activo.
 *
 * @route  PATCH /users/:id/restore
 * @param  {import('express').Request}  req - `req.params.id`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const restoreUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const existingUser = await userModel.getUserByIdIncludingDeleted(userId);
    if (!existingUser) {
      return sendError(res, 404, "Utilizador nao encontrado.");
    }

    if (!existingUser.deleted_at) {
      return sendError(res, 409, "Utilizador ja se encontra ativo.");
    }

    await userModel.restoreUser(userId);
    const restoredUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(
      res,
      200,
      restoredUser,
      "Utilizador restaurado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao restaurar utilizador:", error);
    return sendError(res, 500, "Falha interna ao restaurar utilizador.");
  }
};

/**
 * Remove permanentemente um utilizador da base de dados.
 * Operação irreversível; o registo anterior é devolvido na resposta
 * para possível registo de auditoria pelo cliente.
 *
 * @route  DELETE /users/:id/hard
 * @param  {import('express').Request}  req - `req.params.id`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const hardDeleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const existingUser = await userModel.getUserByIdIncludingDeleted(userId);
    if (!existingUser) {
      return sendError(res, 404, "Utilizador nao encontrado.");
    }

    await userModel.hardDeleteUser(userId);
    return sendSuccess(
      res,
      200,
      existingUser,
      "Utilizador removido permanentemente com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao remover permanentemente utilizador:", error);
    return sendError(
      res,
      500,
      "Falha interna ao remover permanentemente utilizador.",
    );
  }
};

module.exports = {
  getUsers,
  getAllUsers,
  getDeletedUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  hardDeleteUser,
};
