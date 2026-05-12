const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const getActorIdFromRequest = (req) => {
  const rawActorId = req.header('x-actor-id');
  if (!rawActorId) return null;

  const actorId = Number(rawActorId);
  if (!Number.isInteger(actorId) || actorId <= 0) return null;

  return actorId;
};

const sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
    message
  });
};

const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    status: 'error',
    data: null,
    message,
    details
  });
};

const getUsers = async (_req, res) => {
  try {
    const users = await userModel.getAllActiveUsers();
    return sendSuccess(res, 200, users, 'Utilizadores ativos listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    return sendError(res, 500, 'Falha interna ao listar utilizadores.');
  }
};

const getAllUsers = async (_req, res) => {
  try {
    const users = await userModel.getAllUsers();
    return sendSuccess(res, 200, users, 'Todos os utilizadores listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar todos os utilizadores:', error);
    return sendError(res, 500, 'Falha interna ao listar todos os utilizadores.');
  }
};

const getDeletedUsers = async (_req, res) => {
  try {
    const users = await userModel.getAllDeletedUsers();
    return sendSuccess(res, 200, users, 'Utilizadores removidos listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar utilizadores removidos:', error);
    return sendError(res, 500, 'Falha interna ao listar utilizadores removidos.');
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await userModel.getUserById(userId);

    if (!user) {
      return sendError(res, 404, 'Utilizador nao encontrado.');
    }

    return sendSuccess(res, 200, user, 'Utilizador encontrado com sucesso.');
  } catch (error) {
    console.error('Erro ao obter utilizador por id:', error);
    return sendError(res, 500, 'Falha interna ao obter utilizador.');
  }
};

const createUser = async (req, res) => {
  try {
    const payload = req.body;
    // actorId header ignored because audit user-id columns were removed

    const existing = await userModel.getUserByEmail(payload.email);
    if (existing) {
      return sendError(res, 409, 'Ja existe um utilizador com este email.');
    }

    // Passwords are always persisted as hashes, never in plain text.
    const hashedPassword = await bcrypt.hash(payload.palavra_passe, SALT_ROUNDS);

    const userId = await userModel.createUser({
      ...payload,
      palavra_passe: hashedPassword,
      role: payload.role || 'user'
    });

    const createdUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(res, 201, createdUser, 'Utilizador criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    return sendError(res, 500, 'Falha interna ao criar utilizador.');
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const payload = { ...req.body };
    // actorId header ignored because audit user-id columns were removed

    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return sendError(res, 404, 'Utilizador nao encontrado.');
    }

    if (payload.email) {
      const emailInUse = await userModel.getUserByEmailExcludingId(payload.email, userId);
      if (emailInUse) {
        return sendError(res, 409, 'Email ja esta a ser usado por outro utilizador.');
      }
    }

    if (payload.palavra_passe) {
      payload.palavra_passe = await bcrypt.hash(payload.palavra_passe, SALT_ROUNDS);
    }

    // nothing to add here; timestamps are handled by DB

    const affectedRows = await userModel.updateUser(userId, payload);
    if (affectedRows === 0) {
      return sendError(res, 400, 'Nenhum campo valido foi enviado para atualizacao.');
    }

    const updatedUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(res, 200, updatedUser, 'Utilizador atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    return sendError(res, 500, 'Falha interna ao atualizar utilizador.');
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return sendError(res, 404, 'Utilizador nao encontrado.');
    }

    await userModel.softDeleteUser(userId);
    const deletedUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(res, 200, deletedUser, 'Utilizador removido com sucesso (soft delete).');
  } catch (error) {
    console.error('Erro ao remover utilizador:', error);
    return sendError(res, 500, 'Falha interna ao remover utilizador.');
  }
};

const restoreUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const existingUser = await userModel.getUserByIdIncludingDeleted(userId);
    if (!existingUser) {
      return sendError(res, 404, 'Utilizador nao encontrado.');
    }

    if (!existingUser.deleted_at) {
      return sendError(res, 409, 'Utilizador ja se encontra ativo.');
    }

    await userModel.restoreUser(userId);
    const restoredUser = await userModel.getUserByIdIncludingDeleted(userId);
    return sendSuccess(res, 200, restoredUser, 'Utilizador restaurado com sucesso.');
  } catch (error) {
    console.error('Erro ao restaurar utilizador:', error);
    return sendError(res, 500, 'Falha interna ao restaurar utilizador.');
  }
};

const hardDeleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const existingUser = await userModel.getUserByIdIncludingDeleted(userId);
    if (!existingUser) {
      return sendError(res, 404, 'Utilizador nao encontrado.');
    }

    await userModel.hardDeleteUser(userId);
    return sendSuccess(res, 200, existingUser, 'Utilizador removido permanentemente com sucesso.');
  } catch (error) {
    console.error('Erro ao remover permanentemente utilizador:', error);
    return sendError(res, 500, 'Falha interna ao remover permanentemente utilizador.');
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
  hardDeleteUser
};
