/**
 * @module storeLinkController
 * @description Controlador para a tabela `Link_Loja`.
 * Expõe handlers CRUD completos para gestão de URLs de lojas,
 * com suporte a soft delete, restauro e remoção permanente.
 * A unicidade do link entre registos ativos é verificada antes
 * de qualquer operação de criação, atualização ou restauro.
 */

const db = require("../config/db");
const storeLinkModel = require("../models/storeLinkModel");

const STORE_TABLE = process.env.DB_STORE_TABLE || "Loja";

// --- Helpers de resposta ---

/**
 * Envia uma resposta de sucesso normalizada.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {*} data
 * @param {string} message
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
 * Envia uma resposta de erro normalizada.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} [details=null]
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

// --- Helper de existência ---

/**
 * Verifica se uma loja existe e está ativa na base de dados.
 * Usado antes de criar ou atualizar um link para garantir que
 * a FK `id_loja` aponta para uma loja válida (não eliminada).
 * @param {number} storeId - ID da loja a verificar.
 * @returns {Promise<boolean>} true se existir e estiver ativa, false caso contrário.
 */
const storeExists = async (storeId) => {
  const [rows] = await db.execute(
    `SELECT id FROM ${STORE_TABLE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [storeId],
  );
  return Boolean(rows[0]);
};

// --- Handlers de leitura ---

/**
 * @route GET /api/v1/store-links
 * @description Lista todos os links de loja ativos.
 */
const getStoreLinks = async (_req, res) => {
  try {
    const rows = await storeLinkModel.findAllActives();
    return sendSuccess(res, 200, rows, "Links de loja listados com sucesso.");
  } catch (error) {
    console.error("Erro ao listar links de loja:", error);
    return sendError(res, 500, "Falha interna ao listar links de loja.");
  }
};

/**
 * @route GET /api/v1/store-links/all
 * @description Lista todos os links de loja, incluindo os eliminados.
 */
const getAllStoreLinks = async (_req, res) => {
  try {
    const rows = await storeLinkModel.findAll();
    return sendSuccess(
      res,
      200,
      rows,
      "Todos os registos de link de loja listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar todos os registos de link de loja:", error);
    return sendError(res, 500, "Falha interna ao listar todos os registos.");
  }
};

/**
 * @route GET /api/v1/store-links/deleted
 * @description Lista apenas os links de loja marcados como eliminados.
 */
const getDeletedStoreLinks = async (_req, res) => {
  try {
    const rows = await storeLinkModel.findAllDeleted();
    return sendSuccess(
      res,
      200,
      rows,
      "Registos removidos listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar registos removidos de link de loja:", error);
    return sendError(res, 500, "Falha interna ao listar registos removidos.");
  }
};

/**
 * @route GET /api/v1/store-links/:id
 * @description Devolve um registo de link ativo pelo seu ID.
 */
const getStoreLinkById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await storeLinkModel.findById(id);

    if (!row) {
      return sendError(res, 404, "Registo Link_Loja nao encontrado.");
    }

    return sendSuccess(
      res,
      200,
      row,
      "Registo Link_Loja encontrado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao obter registo Link_Loja por id:", error);
    return sendError(res, 500, "Falha interna ao obter registo Link_Loja.");
  }
};

/**
 * @route GET /api/v1/store-links/store/:storeId
 * @description Lista todos os links ativos de uma loja específica.
 * Devolve 404 se a loja não existir (incluindo eliminadas).
 */
const getStoreLinksByStore = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);

    const [storeRows] = await db.execute(
      `SELECT id FROM ${STORE_TABLE} WHERE id = ? LIMIT 1`,
      [storeId],
    );
    if (!storeRows[0]) {
      return sendError(res, 404, "Loja nao encontrada.");
    }

    const rows = await storeLinkModel.findByStoreId(storeId);
    return sendSuccess(res, 200, rows, "Links da loja listados com sucesso.");
  } catch (error) {
    console.error("Erro ao listar links por loja:", error);
    return sendError(res, 500, "Falha interna ao listar links por loja.");
  }
};

// --- Handlers de escrita ---

/**
 * @route POST /api/v1/store-links
 * @description Cria um novo registo de link de loja.
 * Verifica que a loja existe e está ativa, e que o link
 * não está duplicado entre registos ativos.
 */
const createStoreLink = async (req, res) => {
  try {
    const payload = req.body;

    const lojaAtiva = await storeExists(payload.id_loja);
    if (!lojaAtiva) {
      return sendError(res, 404, "Loja informada nao existe ou esta inativa.");
    }

    const duplicated = await storeLinkModel.findActiveByLink(payload.link);
    if (duplicated) {
      return sendError(res, 409, "Ja existe um registo ativo com este link.");
    }

    const createdId = await storeLinkModel.create(payload);
    const created = await storeLinkModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(
      res,
      201,
      created,
      "Registo Link_Loja criado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao criar registo Link_Loja:", error);
    return sendError(res, 500, "Falha interna ao criar registo Link_Loja.");
  }
};

/**
 * @route PUT /api/v1/store-links/:id
 * @description Atualiza um registo de link de loja ativo.
 * Verifica duplicado do link com `ignoreId` para excluir o próprio
 * registo da comparação de unicidade.
 */
const updateStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await storeLinkModel.findById(id);
    if (!existing) {
      return sendError(res, 404, "Registo Link_Loja nao encontrado.");
    }

    if (payload.id_loja !== undefined) {
      const lojaAtiva = await storeExists(payload.id_loja);
      if (!lojaAtiva) {
        return sendError(
          res,
          404,
          "Loja informada nao existe ou esta inativa.",
        );
      }
    }

    if (payload.link !== undefined) {
      const duplicated = await storeLinkModel.findActiveByLink(
        payload.link,
        id,
      );
      if (duplicated) {
        return sendError(res, 409, "Ja existe um registo ativo com este link.");
      }
    }

    const affectedRows = await storeLinkModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(
        res,
        400,
        "Nenhum campo valido foi enviado para atualizacao.",
      );
    }

    const updated = await storeLinkModel.findByIdIncludingDeleted(id);
    return sendSuccess(
      res,
      200,
      updated,
      "Registo Link_Loja atualizado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao atualizar registo Link_Loja:", error);
    return sendError(res, 500, "Falha interna ao atualizar registo Link_Loja.");
  }
};

/**
 * @route DELETE /api/v1/store-links/:id
 * @description Realiza a remoção lógica (soft delete) de um registo ativo.
 */
const softDeleteStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeLinkModel.findById(id);

    if (!existing) {
      return sendError(res, 404, "Registo Link_Loja nao encontrado.");
    }

    await storeLinkModel.softDelete(id);
    const deleted = await storeLinkModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      deleted,
      "Registo Link_Loja removido com sucesso (soft delete).",
    );
  } catch (error) {
    console.error("Erro ao remover registo Link_Loja:", error);
    return sendError(res, 500, "Falha interna ao remover registo Link_Loja.");
  }
};

/**
 * @route PATCH /api/v1/store-links/:id/restore
 * @description Restaura um link previamente eliminado.
 * Verifica se o link já existe noutro registo ativo antes de permitir o restauro.
 */
const restoreStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeLinkModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, "Registo Link_Loja nao encontrado.");
    }

    if (!existing.deleted_at) {
      return sendError(res, 409, "Registo Link_Loja ja se encontra ativo.");
    }

    const duplicated = await storeLinkModel.findActiveByLink(existing.link, id);
    if (duplicated) {
      return sendError(
        res,
        409,
        "Nao foi possivel restaurar: ja existe registo ativo com este link.",
      );
    }

    await storeLinkModel.restore(id);
    const restored = await storeLinkModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      restored,
      "Registo Link_Loja restaurado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao restaurar registo Link_Loja:", error);
    return sendError(res, 500, "Falha interna ao restaurar registo Link_Loja.");
  }
};

/**
 * @route DELETE /api/v1/store-links/:id/hard
 * @description Remove permanentemente um registo de link da base de dados.
 */
const hardDeleteStoreLink = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeLinkModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, "Registo Link_Loja nao encontrado.");
    }

    await storeLinkModel.hardDelete(id);
    return sendSuccess(
      res,
      200,
      existing,
      "Registo Link_Loja removido permanentemente com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao remover permanentemente registo Link_Loja:", error);
    return sendError(
      res,
      500,
      "Falha interna ao remover permanentemente registo Link_Loja.",
    );
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
  hardDeleteStoreLink,
};
