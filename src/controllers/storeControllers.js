const storeModel = require("../models/storeModels");

/** Resposta de sucesso normalizada. */
const sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    status: "success",
    data,
    message,
  });
};

/** Resposta de erro normalizada. */
const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    status: "error",
    data: null,
    message,
    details,
  });
};

/**
 * GET /stores
 * Lista todas as lojas activas (deleted_at IS NULL).
 */
const getStores = async (_req, res) => {
  try {
    const rows = await storeModel.findAllActives();
    return sendSuccess(res, 200, rows, "Lojas ativas listadas com sucesso.");
  } catch (error) {
    console.error("Erro ao listar lojas ativas:", error);
    return sendError(res, 500, "Falha interna ao listar lojas ativas.");
  }
};

/**
 * GET /stores/all
 * Lista todas as lojas (activas e eliminadas).
 */
const getAllStores = async (_req, res) => {
  try {
    const rows = await storeModel.findAll();
    return sendSuccess(res, 200, rows, "Todas as lojas listadas com sucesso.");
  } catch (error) {
    console.error("Erro ao listar todas as lojas:", error);
    return sendError(res, 500, "Falha interna ao listar todas as lojas.");
  }
};

/**
 * GET /stores/deleted
 * Lista todas as lojas eliminadas (deleted_at IS NOT NULL).
 */
const getDeletedStores = async (_req, res) => {
  try {
    const rows = await storeModel.findAllDeleted();
    return sendSuccess(res, 200, rows, "Lojas removidas listadas com sucesso.");
  } catch (error) {
    console.error("Erro ao listar lojas removidas:", error);
    return sendError(res, 500, "Falha interna ao listar lojas removidas.");
  }
};

/**
 * GET /stores/:id
 * Devolve uma loja activa pelo seu id.
 * Responde 404 se não existir ou estiver eliminada.
 */
const getStoreById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await storeModel.findById(id);

    if (!row) {
      return sendError(res, 404, "Loja nao encontrada.");
    }

    return sendSuccess(res, 200, row, "Loja encontrada com sucesso.");
  } catch (error) {
    console.error("Erro ao obter loja por id:", error);
    return sendError(res, 500, "Falha interna ao obter loja.");
  }
};

/**
 * POST /stores
 * Cria uma nova loja.
 * Verifica unicidade do NIF antes de inserir.
 */
const createStore = async (req, res) => {
  try {
    const payload = req.body;

    // Verificar duplicidade do NIF antes de criar
    const duplicated = await storeModel.findActiveByNif(payload.nif);
    if (duplicated) {
      return sendError(res, 409, "Ja existe uma loja ativa com este NIF.");
    }

    const createdId = await storeModel.create(payload);
    const created = await storeModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(res, 201, created, "Loja criada com sucesso.");
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    return sendError(res, 500, "Falha interna ao criar loja.");
  }
};

/**
 * PUT /stores/:id
 * Actualiza os campos de uma loja activa.
 * Verifica unicidade do NIF (excluindo o próprio registo) quando fornecido.
 */
const updateStore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    // Verificar se a loja existe e está activa
    const existing = await storeModel.findById(id);
    if (!existing) {
      return sendError(res, 404, "Loja nao encontrada.");
    }

    // Se o NIF for enviado, verificar duplicidade (excluindo o próprio registo)
    if (payload.nif !== undefined) {
      const duplicated = await storeModel.findActiveByNif(payload.nif, id);
      if (duplicated) {
        return sendError(res, 409, "Ja existe uma loja ativa com este NIF.");
      }
    }

    const affectedRows = await storeModel.update(id, payload);

    // O modelo devolve 0 quando nenhum campo válido foi enviado
    if (affectedRows === 0) {
      return sendError(
        res,
        400,
        "Nenhum campo valido foi enviado para atualizacao.",
      );
    }

    const updated = await storeModel.findByIdIncludingDeleted(id);
    return sendSuccess(res, 200, updated, "Loja atualizada com sucesso.");
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);
    return sendError(res, 500, "Falha interna ao atualizar loja.");
  }
};

/**
 * DELETE /stores/:id
 * Soft delete de uma loja activa.
 * Preenche deleted_at sem remover o registo da base de dados.
 */
const softDeleteStore = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await storeModel.findById(id);
    if (!existing) {
      return sendError(res, 404, "Loja nao encontrada.");
    }

    await storeModel.softDelete(id);
    const deleted = await storeModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      deleted,
      "Loja removida com sucesso (soft delete).",
    );
  } catch (error) {
    console.error("Erro ao remover loja:", error);
    return sendError(res, 500, "Falha interna ao remover loja.");
  }
};

/**
 * PATCH /stores/:id/restore
 * Restaura uma loja eliminada, limpando deleted_at.
 * Verifica unicidade do NIF antes de restaurar.
 */
const restoreStore = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await storeModel.findByIdIncludingDeleted(id);
    if (!existing) {
      return sendError(res, 404, "Loja nao encontrada.");
    }

    // A loja já está activa — não há nada a restaurar
    if (!existing.deleted_at) {
      return sendError(res, 409, "Loja ja se encontra ativa.");
    }

    // Garantir que o NIF não entra em conflito com outra loja activa
    const duplicated = await storeModel.findActiveByNif(existing.nif, id);
    if (duplicated) {
      return sendError(
        res,
        409,
        "Nao foi possivel restaurar: ja existe loja ativa com este NIF.",
      );
    }

    await storeModel.restore(id);
    const restored = await storeModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, restored, "Loja restaurada com sucesso.");
  } catch (error) {
    console.error("Erro ao restaurar loja:", error);
    return sendError(res, 500, "Falha interna ao restaurar loja.");
  }
};

/**
 * DELETE /stores/:id/hard
 * Elimina permanentemente uma loja da base de dados.
 * Devolve o registo anterior como confirmação.
 */
const hardDeleteStore = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await storeModel.findByIdIncludingDeleted(id);
    if (!existing) {
      return sendError(res, 404, "Loja nao encontrada.");
    }

    await storeModel.hardDelete(id);

    // Devolve o registo anterior como evidência da eliminação
    return sendSuccess(
      res,
      200,
      existing,
      "Loja removida permanentemente com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao remover permanentemente loja:", error);
    return sendError(
      res,
      500,
      "Falha interna ao remover permanentemente loja.",
    );
  }
};

module.exports = {
  getStores,
  getAllStores,
  getDeletedStores,
  getStoreById,
  createStore,
  updateStore,
  softDeleteStore,
  restoreStore,
  hardDeleteStore,
};
