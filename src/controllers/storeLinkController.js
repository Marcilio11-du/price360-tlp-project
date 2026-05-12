const db = require('../config/db');
const storeLinkModel = require('../models/storeLinkModel');

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

const getStoreLinks = async (_req, res) => {
  try {
    const rows = await storeLinkModel.findAllActives();
    return sendSuccess(res, 200, rows, 'Links de loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar links de loja:', error);
    return sendError(res, 500, 'Falha interna ao listar links de loja.');
  }
};

const getAllStoreLinks = async (_req, res) => {
  try {
    const rows = await storeLinkModel.findAll();
    return sendSuccess(res, 200, rows, 'Todos os registos de link de loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar todos os registos de link de loja:', error);
    return sendError(res, 500, 'Falha interna ao listar todos os registos.');
  }
};

const getDeletedStoreLinks = async (_req, res) => {
  try {
    const rows = await storeLinkModel.findAllDeleted();
    return sendSuccess(res, 200, rows, 'Registos removidos listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar registos removidos de link de loja:', error);
    return sendError(res, 500, 'Falha interna ao listar registos removidos.');
  }
};

const getStoreLinkById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await storeLinkModel.findById(id);

    if (!row) {
      return sendError(res, 404, 'Registo Link_Loja nao encontrado.');
    }

    return sendSuccess(res, 200, row, 'Registo Link_Loja encontrado com sucesso.');
  } catch (error) {
    console.error('Erro ao obter registo Link_Loja por id:', error);
    return sendError(res, 500, 'Falha interna ao obter registo Link_Loja.');
  }
};

const getStoreLinksByStore = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);

    const [storeRows] = await db.execute(
      `SELECT id FROM ${STORE_TABLE} WHERE id = ? LIMIT 1`,
      [storeId]
    );
    if (!storeRows[0]) {
      return sendError(res, 404, 'Loja nao encontrada.');
    }

    const rows = await storeLinkModel.findByStoreId(storeId);
    return sendSuccess(res, 200, rows, 'Links da loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar links por loja:', error);
    return sendError(res, 500, 'Falha interna ao listar links por loja.');
  }
};

const createStoreLink = async (req, res) => {
  try {
    const payload = req.body;

    const lojaAtiva = await storeExists(payload.id_loja);
    if (!lojaAtiva) {
      return sendError(res, 404, 'Loja informada nao existe ou esta inativa.');
    }

    const duplicated = await storeLinkModel.findActiveByLink(payload.link);
    if (duplicated) {
      return sendError(res, 409, 'Ja existe um registo ativo com este link.');
    }

    const createdId = await storeLinkModel.create(payload);
    const created = await storeLinkModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(res, 201, created, 'Registo Link_Loja criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar registo Link_Loja:', error);
    return sendError(res, 500, 'Falha interna ao criar registo Link_Loja.');
  }
};

const updateStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await storeLinkModel.findById(id);
    if (!existing) {
      return sendError(res, 404, 'Registo Link_Loja nao encontrado.');
    }

    if (payload.id_loja !== undefined) {
      const lojaAtiva = await storeExists(payload.id_loja);
      if (!lojaAtiva) {
        return sendError(res, 404, 'Loja informada nao existe ou esta inativa.');
      }
    }

    if (payload.link !== undefined) {
      const duplicated = await storeLinkModel.findActiveByLink(payload.link, id);
      if (duplicated) {
        return sendError(res, 409, 'Ja existe um registo ativo com este link.');
      }
    }

    const affectedRows = await storeLinkModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(res, 400, 'Nenhum campo valido foi enviado para atualizacao.');
    }

    const updated = await storeLinkModel.findByIdIncludingDeleted(id);
    return sendSuccess(res, 200, updated, 'Registo Link_Loja atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar registo Link_Loja:', error);
    return sendError(res, 500, 'Falha interna ao atualizar registo Link_Loja.');
  }
};

const softDeleteStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeLinkModel.findById(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Link_Loja nao encontrado.');
    }

    await storeLinkModel.softDelete(id);
    const deleted = await storeLinkModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, deleted, 'Registo Link_Loja removido com sucesso (soft delete).');
  } catch (error) {
    console.error('Erro ao remover registo Link_Loja:', error);
    return sendError(res, 500, 'Falha interna ao remover registo Link_Loja.');
  }
};

const restoreStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeLinkModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Link_Loja nao encontrado.');
    }

    if (!existing.deleted_at) {
      return sendError(res, 409, 'Registo Link_Loja ja se encontra ativo.');
    }

    const duplicated = await storeLinkModel.findActiveByLink(existing.link, id);
    if (duplicated) {
      return sendError(res, 409, 'Nao foi possivel restaurar: ja existe registo ativo com este link.');
    }

    await storeLinkModel.restore(id);
    const restored = await storeLinkModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, restored, 'Registo Link_Loja restaurado com sucesso.');
  } catch (error) {
    console.error('Erro ao restaurar registo Link_Loja:', error);
    return sendError(res, 500, 'Falha interna ao restaurar registo Link_Loja.');
  }
};

const hardDeleteStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeLinkModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Link_Loja nao encontrado.');
    }

    await storeLinkModel.hardDelete(id);
    return sendSuccess(res, 200, existing, 'Registo Link_Loja removido permanentemente com sucesso.');
  } catch (error) {
    console.error('Erro ao remover permanentemente registo Link_Loja:', error);
    return sendError(res, 500, 'Falha interna ao remover permanentemente registo Link_Loja.');
  }
};

module.exports = {
  getStoreLinks,
  getAllStoreLinks,
  getDeletedStoreLinks,
  getStoreLinkById,
  getStoreLinksByStore,
  createStoreLink,
  updateStoreLink,
  softDeleteStoreLink,
  restoreStoreLink,
  hardDeleteStoreLink
};
