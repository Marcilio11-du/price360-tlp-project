const db = require('../config/db');
const storePhoneModel = require('../models/storePhoneModel');

const STORE_TABLE = process.env.DB_STORE_TABLE || 'Loja';

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

const storeExists = async (storeId) => {
  const [rows] = await db.execute(
    `SELECT id FROM ${STORE_TABLE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [storeId]
  );
  return Boolean(rows[0]);
};

const getStorePhones = async (_req, res) => {
  try {
    const rows = await storePhoneModel.findAllActives();
    return sendSuccess(res, 200, rows, 'Telefones de loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar telefones de loja:', error);
    return sendError(res, 500, 'Falha interna ao listar telefones de loja.');
  }
};

const getAllStorePhones = async (_req, res) => {
  try {
    const rows = await storePhoneModel.findAll();
    return sendSuccess(res, 200, rows, 'Todos os registos de telefone de loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar todos os registos de telefone de loja:', error);
    return sendError(res, 500, 'Falha interna ao listar todos os registos.');
  }
};

const getDeletedStorePhones = async (_req, res) => {
  try {
    const rows = await storePhoneModel.findAllDeleted();
    return sendSuccess(res, 200, rows, 'Registos removidos listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar registos removidos de telefone de loja:', error);
    return sendError(res, 500, 'Falha interna ao listar registos removidos.');
  }
};

const getStorePhoneById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await storePhoneModel.findById(id);

    if (!row) {
      return sendError(res, 404, 'Registo Telefone_Loja nao encontrado.');
    }

    return sendSuccess(res, 200, row, 'Registo Telefone_Loja encontrado com sucesso.');
  } catch (error) {
    console.error('Erro ao obter registo Telefone_Loja por id:', error);
    return sendError(res, 500, 'Falha interna ao obter registo Telefone_Loja.');
  }
};

const getStorePhonesByStore = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);

    const [storeRows] = await db.execute(
      `SELECT id FROM ${STORE_TABLE} WHERE id = ? LIMIT 1`,
      [storeId]
    );
    if (!storeRows[0]) {
      return sendError(res, 404, 'Loja nao encontrada.');
    }

    const rows = await storePhoneModel.findByStoreId(storeId);
    return sendSuccess(res, 200, rows, 'Telefones da loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar telefones por loja:', error);
    return sendError(res, 500, 'Falha interna ao listar telefones por loja.');
  }
};

const createStorePhone = async (req, res) => {
  try {
    const payload = req.body;

    const lojaAtiva = await storeExists(payload.id_loja);
    if (!lojaAtiva) {
      return sendError(res, 404, 'Loja informada nao existe ou esta inativa.');
    }

    const duplicated = await storePhoneModel.findActiveByPhone(payload.n_telefone);
    if (duplicated) {
      return sendError(res, 409, 'Ja existe um registo ativo com este numero de telefone.');
    }

    const createdId = await storePhoneModel.create(payload);
    const created = await storePhoneModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(res, 201, created, 'Registo Telefone_Loja criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar registo Telefone_Loja:', error);
    return sendError(res, 500, 'Falha interna ao criar registo Telefone_Loja.');
  }
};

const updateStorePhone = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await storePhoneModel.findById(id);
    if (!existing) {
      return sendError(res, 404, 'Registo Telefone_Loja nao encontrado.');
    }

    if (payload.id_loja !== undefined) {
      const lojaAtiva = await storeExists(payload.id_loja);
      if (!lojaAtiva) {
        return sendError(res, 404, 'Loja informada nao existe ou esta inativa.');
      }
    }

    if (payload.n_telefone !== undefined) {
      const duplicated = await storePhoneModel.findActiveByPhone(payload.n_telefone, id);
      if (duplicated) {
        return sendError(res, 409, 'Ja existe um registo ativo com este numero de telefone.');
      }
    }

    const affectedRows = await storePhoneModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(res, 400, 'Nenhum campo valido foi enviado para atualizacao.');
    }

    const updated = await storePhoneModel.findByIdIncludingDeleted(id);
    return sendSuccess(res, 200, updated, 'Registo Telefone_Loja atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar registo Telefone_Loja:', error);
    return sendError(res, 500, 'Falha interna ao atualizar registo Telefone_Loja.');
  }
};

const softDeleteStorePhone = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storePhoneModel.findById(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Telefone_Loja nao encontrado.');
    }

    await storePhoneModel.softDelete(id);
    const deleted = await storePhoneModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, deleted, 'Registo Telefone_Loja removido com sucesso (soft delete).');
  } catch (error) {
    console.error('Erro ao remover registo Telefone_Loja:', error);
    return sendError(res, 500, 'Falha interna ao remover registo Telefone_Loja.');
  }
};

const restoreStorePhone = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storePhoneModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Telefone_Loja nao encontrado.');
    }

    if (!existing.deleted_at) {
      return sendError(res, 409, 'Registo Telefone_Loja ja se encontra ativo.');
    }

    const duplicated = await storePhoneModel.findActiveByPhone(existing.n_telefone, id);
    if (duplicated) {
      return sendError(res, 409, 'Nao foi possivel restaurar: ja existe registo ativo com este numero de telefone.');
    }

    await storePhoneModel.restore(id);
    const restored = await storePhoneModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, restored, 'Registo Telefone_Loja restaurado com sucesso.');
  } catch (error) {
    console.error('Erro ao restaurar registo Telefone_Loja:', error);
    return sendError(res, 500, 'Falha interna ao restaurar registo Telefone_Loja.');
  }
};

const hardDeleteStorePhone = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storePhoneModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Telefone_Loja nao encontrado.');
    }

    await storePhoneModel.hardDelete(id);
    return sendSuccess(res, 200, existing, 'Registo Telefone_Loja removido permanentemente com sucesso.');
  } catch (error) {
    console.error('Erro ao remover permanentemente registo Telefone_Loja:', error);
    return sendError(res, 500, 'Falha interna ao remover permanentemente registo Telefone_Loja.');
  }
};

module.exports = {
  getStorePhones,
  getAllStorePhones,
  getDeletedStorePhones,
  getStorePhoneById,
  getStorePhonesByStore,
  createStorePhone,
  updateStorePhone,
  softDeleteStorePhone,
  restoreStorePhone,
  hardDeleteStorePhone
};
