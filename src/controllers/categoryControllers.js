const categoryModel = require("../models/categoryModels");

// ---------------------------------------------------------------------------
// Helpers de resposta
// ---------------------------------------------------------------------------

/**
 * Envia uma resposta de sucesso padronizada.
 * @param {import('express').Response} res - Objeto de resposta Express.
 * @param {number} statusCode - Código HTTP de sucesso.
 * @param {*} data - Dados a incluir na resposta.
 * @param {string} message - Mensagem descritiva.
 */
const sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    status: "success",
    data,
    message,
  });
};

/**
 * Envia uma resposta de erro padronizada.
 * @param {import('express').Response} res - Objeto de resposta Express.
 * @param {number} statusCode - Código HTTP de erro.
 * @param {string} message - Mensagem de erro.
 * @param {*} [details=null] - Detalhes adicionais opcionais.
 */
const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    status: "error",
    data: null,
    message,
    details,
  });
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Lista todas as categorias ativas (deleted_at IS NULL).
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
const getCategories = async (_req, res) => {
  try {
    const rows = await categoryModel.findAllActives();
    return sendSuccess(
      res,
      200,
      rows,
      "Categorias ativas listadas com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar categorias ativas:", error);
    return sendError(res, 500, "Falha interna ao listar categorias ativas.");
  }
};

/**
 * Lista todas as categorias, incluindo as eliminadas.
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
const getAllCategories = async (_req, res) => {
  try {
    const rows = await categoryModel.findAll();
    return sendSuccess(
      res,
      200,
      rows,
      "Todas as categorias listadas com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar todas as categorias:", error);
    return sendError(res, 500, "Falha interna ao listar todas as categorias.");
  }
};

/**
 * Lista apenas as categorias eliminadas (deleted_at IS NOT NULL).
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
const getDeletedCategories = async (_req, res) => {
  try {
    const rows = await categoryModel.findAllDeleted();
    return sendSuccess(
      res,
      200,
      rows,
      "Categorias removidas listadas com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar categorias removidas:", error);
    return sendError(res, 500, "Falha interna ao listar categorias removidas.");
  }
};

/**
 * Devolve uma categoria ativa pelo seu id.
 * @param {import('express').Request} req - Espera req.params.id (inteiro positivo, já validado).
 * @param {import('express').Response} res
 */
const getCategoryById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await categoryModel.findById(id);

    if (!row) {
      return sendError(res, 404, "Categoria nao encontrada.");
    }

    return sendSuccess(res, 200, row, "Categoria encontrada com sucesso.");
  } catch (error) {
    console.error("Erro ao obter categoria por id:", error);
    return sendError(res, 500, "Falha interna ao obter categoria.");
  }
};

/**
 * Cria uma nova categoria.
 * Verifica unicidade do nome antes de inserir.
 * @param {import('express').Request} req - Espera req.body com { nome, descricao? }.
 * @param {import('express').Response} res
 */
const createCategory = async (req, res) => {
  try {
    const payload = req.body;

    // Verificar duplicação de nome entre as categorias ativas
    const duplicated = await categoryModel.findActiveByName(payload.nome);
    if (duplicated) {
      return sendError(
        res,
        409,
        "Ja existe uma categoria ativa com este nome.",
      );
    }

    const createdId = await categoryModel.create(payload);
    const created = await categoryModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(res, 201, created, "Categoria criada com sucesso.");
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return sendError(res, 500, "Falha interna ao criar categoria.");
  }
};

/**
 * Atualiza os campos fornecidos de uma categoria ativa.
 * Verifica unicidade do nome caso este seja alterado.
 * @param {import('express').Request} req - Espera req.params.id e req.body com campos a atualizar.
 * @param {import('express').Response} res
 */
const updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    // Verificar se a categoria existe e está ativa
    const existing = await categoryModel.findById(id);
    if (!existing) {
      return sendError(res, 404, "Categoria nao encontrada.");
    }

    // Se o nome for alterado, verificar unicidade (excluindo o próprio registo)
    if (payload.nome !== undefined) {
      const duplicated = await categoryModel.findActiveByName(payload.nome, id);
      if (duplicated) {
        return sendError(
          res,
          409,
          "Ja existe uma categoria ativa com este nome.",
        );
      }
    }

    const affectedRows = await categoryModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(
        res,
        400,
        "Nenhum campo valido foi enviado para atualizacao.",
      );
    }

    const updated = await categoryModel.findByIdIncludingDeleted(id);
    return sendSuccess(res, 200, updated, "Categoria atualizada com sucesso.");
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return sendError(res, 500, "Falha interna ao atualizar categoria.");
  }
};

/**
 * Elimina uma categoria ativa (soft delete), preenchendo deleted_at.
 * @param {import('express').Request} req - Espera req.params.id.
 * @param {import('express').Response} res
 */
const softDeleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await categoryModel.findById(id);

    if (!existing) {
      return sendError(res, 404, "Categoria nao encontrada.");
    }

    await categoryModel.softDelete(id);
    const deleted = await categoryModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      deleted,
      "Categoria removida com sucesso (soft delete).",
    );
  } catch (error) {
    console.error("Erro ao remover categoria:", error);
    return sendError(res, 500, "Falha interna ao remover categoria.");
  }
};

/**
 * Restaura uma categoria previamente eliminada, limpando deleted_at.
 * Verifica se não existe outra categoria ativa com o mesmo nome antes de restaurar.
 * @param {import('express').Request} req - Espera req.params.id.
 * @param {import('express').Response} res
 */
const restoreCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await categoryModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, "Categoria nao encontrada.");
    }

    // Se deleted_at for null, a categoria já está ativa
    if (!existing.deleted_at) {
      return sendError(res, 409, "Categoria ja se encontra ativa.");
    }

    // Garantir que não existe outra categoria ativa com o mesmo nome
    const duplicated = await categoryModel.findActiveByName(existing.nome, id);
    if (duplicated) {
      return sendError(
        res,
        409,
        "Nao foi possivel restaurar: ja existe categoria ativa com este nome.",
      );
    }

    await categoryModel.restore(id);
    const restored = await categoryModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, restored, "Categoria restaurada com sucesso.");
  } catch (error) {
    console.error("Erro ao restaurar categoria:", error);
    return sendError(res, 500, "Falha interna ao restaurar categoria.");
  }
};

/**
 * Remove permanentemente uma categoria da base de dados (hard delete).
 * Devolve o registo anterior à remoção no campo data.
 * @param {import('express').Request} req - Espera req.params.id.
 * @param {import('express').Response} res
 */
const hardDeleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await categoryModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, "Categoria nao encontrada.");
    }

    await categoryModel.hardDelete(id);
    return sendSuccess(
      res,
      200,
      existing,
      "Categoria removida permanentemente com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao remover permanentemente categoria:", error);
    return sendError(
      res,
      500,
      "Falha interna ao remover permanentemente categoria.",
    );
  }
};

module.exports = {
  getCategories,
  getAllCategories,
  getDeletedCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  hardDeleteCategory,
};
