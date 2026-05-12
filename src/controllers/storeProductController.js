const storeProductModel = require('../models/storeProductModel');

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

const validateDependencies = async (payload) => {
  if (payload.id_produto !== undefined) {
    const productExists = await storeProductModel.productExists(payload.id_produto);
    if (!productExists) {
      return 'Produto informado nao existe ou esta inativo.';
    }
  }

  if (payload.id_loja !== undefined) {
    const storeExists = await storeProductModel.storeExists(payload.id_loja);
    if (!storeExists) {
      return 'Loja informada nao existe ou esta inativa.';
    }
  }

  return null;
};

const getStoreProducts = async (_req, res) => {
  try {
    const rows = await storeProductModel.findAllActives();
    return sendSuccess(res, 200, rows, 'Produtos por loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar produtos por loja:', error);
    return sendError(res, 500, 'Falha interna ao listar produtos por loja.');
  }
};

const getAllStoreProducts = async (_req, res) => {
  try {
    const rows = await storeProductModel.findAll();
    return sendSuccess(res, 200, rows, 'Todos os registos de produto por loja listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar todos os registos de produto por loja:', error);
    return sendError(res, 500, 'Falha interna ao listar todos os registos.');
  }
};

const getDeletedStoreProducts = async (_req, res) => {
  try {
    const rows = await storeProductModel.findAllDeleted();
    return sendSuccess(res, 200, rows, 'Registos removidos listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar registos removidos de produto por loja:', error);
    return sendError(res, 500, 'Falha interna ao listar registos removidos.');
  }
};

const getStoreProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await storeProductModel.findById(id);

    if (!row) {
      return sendError(res, 404, 'Registo Produto_Loja nao encontrado.');
    }

    return sendSuccess(res, 200, row, 'Registo Produto_Loja encontrado com sucesso.');
  } catch (error) {
    console.error('Erro ao obter registo Produto_Loja por id:', error);
    return sendError(res, 500, 'Falha interna ao obter registo Produto_Loja.');
  }
};

const createStoreProduct = async (req, res) => {
  try {
    const payload = req.body;

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    const duplicated = await storeProductModel.findActiveByProductAndStore(
      payload.id_produto,
      payload.id_loja
    );
    if (duplicated) {
      return sendError(res, 409, 'Ja existe um registo ativo para este produto nesta loja.');
    }

    const createdId = await storeProductModel.create(payload);
    const created = await storeProductModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(res, 201, created, 'Registo Produto_Loja criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar registo Produto_Loja:', error);
    return sendError(res, 500, 'Falha interna ao criar registo Produto_Loja.');
  }
};

const updateStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await storeProductModel.findById(id);
    if (!existing) {
      return sendError(res, 404, 'Registo Produto_Loja nao encontrado.');
    }

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    const nextProductId = payload.id_produto !== undefined ? payload.id_produto : existing.id_produto;
    const nextStoreId = payload.id_loja !== undefined ? payload.id_loja : existing.id_loja;

    const duplicated = await storeProductModel.findActiveByProductAndStore(
      nextProductId,
      nextStoreId,
      id
    );
    if (duplicated) {
      return sendError(res, 409, 'Ja existe um registo ativo para este produto nesta loja.');
    }

    const affectedRows = await storeProductModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(res, 400, 'Nenhum campo valido foi enviado para atualizacao.');
    }

    const updated = await storeProductModel.findByIdIncludingDeleted(id);
    return sendSuccess(res, 200, updated, 'Registo Produto_Loja atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar registo Produto_Loja:', error);
    return sendError(res, 500, 'Falha interna ao atualizar registo Produto_Loja.');
  }
};

const softDeleteStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeProductModel.findById(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Produto_Loja nao encontrado.');
    }

    await storeProductModel.softDelete(id);
    const deleted = await storeProductModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, deleted, 'Registo Produto_Loja removido com sucesso (soft delete).');
  } catch (error) {
    console.error('Erro ao remover registo Produto_Loja:', error);
    return sendError(res, 500, 'Falha interna ao remover registo Produto_Loja.');
  }
};

const restoreStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeProductModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Produto_Loja nao encontrado.');
    }

    if (!existing.deleted_at) {
      return sendError(res, 409, 'Registo Produto_Loja ja se encontra ativo.');
    }

    const duplicated = await storeProductModel.findActiveByProductAndStore(
      existing.id_produto,
      existing.id_loja,
      id
    );
    if (duplicated) {
      return sendError(res, 409, 'Nao foi possivel restaurar: ja existe registo ativo para este produto nesta loja.');
    }

    await storeProductModel.restore(id);
    const restored = await storeProductModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, restored, 'Registo Produto_Loja restaurado com sucesso.');
  } catch (error) {
    console.error('Erro ao restaurar registo Produto_Loja:', error);
    return sendError(res, 500, 'Falha interna ao restaurar registo Produto_Loja.');
  }
};

const hardDeleteStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeProductModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Produto_Loja nao encontrado.');
    }

    await storeProductModel.hardDelete(id);
    return sendSuccess(res, 200, existing, 'Registo Produto_Loja removido permanentemente com sucesso.');
  } catch (error) {
    console.error('Erro ao remover permanentemente registo Produto_Loja:', error);
    return sendError(res, 500, 'Falha interna ao remover permanentemente registo Produto_Loja.');
  }
};

module.exports = {
  getStoreProducts,
  getAllStoreProducts,
  getDeletedStoreProducts,
  getStoreProductById,
  createStoreProduct,
  updateStoreProduct,
  softDeleteStoreProduct,
  restoreStoreProduct,
  hardDeleteStoreProduct
};
