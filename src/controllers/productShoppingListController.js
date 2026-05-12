const db = require('../config/db');
const productShoppingListModel = require('../models/productShoppingListModel');

const LIST_TABLE = process.env.DB_SHOPPING_LIST_TABLE || 'Lista_compras';
const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || 'Produto';

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
  if (payload.id_lista !== undefined) {
    const [rows] = await db.execute(
      `SELECT id FROM ${LIST_TABLE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [payload.id_lista]
    );
    if (!rows[0]) {
      return 'Lista de compras informada nao existe ou esta inativa.';
    }
  }

  if (payload.id_produto !== undefined) {
    const [rows] = await db.execute(
      `SELECT id FROM ${PRODUCT_TABLE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [payload.id_produto]
    );
    if (!rows[0]) {
      return 'Produto informado nao existe ou esta inativo.';
    }
  }

  return null;
};

const getProductShoppingLists = async (_req, res) => {
  try {
    const rows = await productShoppingListModel.findAllActives();
    return sendSuccess(res, 200, rows, 'Produtos de lista de compras listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar produtos de lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao listar produtos de lista de compras.');
  }
};

const getAllProductShoppingLists = async (_req, res) => {
  try {
    const rows = await productShoppingListModel.findAll();
    return sendSuccess(res, 200, rows, 'Todos os registos de produto de lista de compras listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar todos os registos de produto de lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao listar todos os registos.');
  }
};

const getDeletedProductShoppingLists = async (_req, res) => {
  try {
    const rows = await productShoppingListModel.findAllDeleted();
    return sendSuccess(res, 200, rows, 'Registos removidos listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar registos removidos de produto de lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao listar registos removidos.');
  }
};

const getProductShoppingListById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await productShoppingListModel.findById(id);

    if (!row) {
      return sendError(res, 404, 'Registo Lista_compras_Produto nao encontrado.');
    }

    return sendSuccess(res, 200, row, 'Registo Lista_compras_Produto encontrado com sucesso.');
  } catch (error) {
    console.error('Erro ao obter registo Lista_compras_Produto por id:', error);
    return sendError(res, 500, 'Falha interna ao obter registo Lista_compras_Produto.');
  }
};

const getProductShoppingListsByList = async (req, res) => {
  try {
    const listId = Number(req.params.listId);

    const [listRows] = await db.execute(
      `SELECT id FROM ${LIST_TABLE} WHERE id = ? LIMIT 1`,
      [listId]
    );
    if (!listRows[0]) {
      return sendError(res, 404, 'Lista de compras nao encontrada.');
    }

    const rows = await productShoppingListModel.findByShoppingListId(listId);
    return sendSuccess(res, 200, rows, 'Produtos da lista de compras listados com sucesso.');
  } catch (error) {
    console.error('Erro ao listar produtos por lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao listar produtos por lista de compras.');
  }
};

const getProductShoppingListsByProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const [productRows] = await db.execute(
      `SELECT id FROM ${PRODUCT_TABLE} WHERE id = ? LIMIT 1`,
      [productId]
    );
    if (!productRows[0]) {
      return sendError(res, 404, 'Produto nao encontrado.');
    }

    const rows = await productShoppingListModel.findByProductId(productId);
    return sendSuccess(res, 200, rows, 'Listas de compras do produto listadas com sucesso.');
  } catch (error) {
    console.error('Erro ao listar listas de compras por produto:', error);
    return sendError(res, 500, 'Falha interna ao listar listas de compras por produto.');
  }
};

const createProductShoppingList = async (req, res) => {
  try {
    const payload = req.body;

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    const duplicated = await productShoppingListModel.findActiveByListAndProduct(
      payload.id_lista,
      payload.id_produto
    );
    if (duplicated) {
      return sendError(res, 409, 'Ja existe um registo ativo para este produto nesta lista de compras.');
    }

    const createdId = await productShoppingListModel.create(payload);
    const created = await productShoppingListModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(res, 201, created, 'Registo Lista_compras_Produto criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar registo Lista_compras_Produto:', error);
    return sendError(res, 500, 'Falha interna ao criar registo Lista_compras_Produto.');
  }
};

const updateProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await productShoppingListModel.findById(id);
    if (!existing) {
      return sendError(res, 404, 'Registo Lista_compras_Produto nao encontrado.');
    }

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    const nextListId = payload.id_lista !== undefined ? payload.id_lista : existing.id_lista;
    const nextProductId = payload.id_produto !== undefined ? payload.id_produto : existing.id_produto;

    const duplicated = await productShoppingListModel.findActiveByListAndProduct(
      nextListId,
      nextProductId,
      id
    );
    if (duplicated) {
      return sendError(res, 409, 'Ja existe um registo ativo para este produto nesta lista de compras.');
    }

    const affectedRows = await productShoppingListModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(res, 400, 'Nenhum campo valido foi enviado para atualizacao.');
    }

    const updated = await productShoppingListModel.findByIdIncludingDeleted(id);
    return sendSuccess(res, 200, updated, 'Registo Lista_compras_Produto atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar registo Lista_compras_Produto:', error);
    return sendError(res, 500, 'Falha interna ao atualizar registo Lista_compras_Produto.');
  }
};

const softDeleteProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await productShoppingListModel.findById(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Lista_compras_Produto nao encontrado.');
    }

    await productShoppingListModel.softDelete(id);
    const deleted = await productShoppingListModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, deleted, 'Registo Lista_compras_Produto removido com sucesso (soft delete).');
  } catch (error) {
    console.error('Erro ao remover registo Lista_compras_Produto:', error);
    return sendError(res, 500, 'Falha interna ao remover registo Lista_compras_Produto.');
  }
};

const restoreProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await productShoppingListModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Lista_compras_Produto nao encontrado.');
    }

    if (!existing.deleted_at) {
      return sendError(res, 409, 'Registo Lista_compras_Produto ja se encontra ativo.');
    }

    const duplicated = await productShoppingListModel.findActiveByListAndProduct(
      existing.id_lista,
      existing.id_produto,
      id
    );
    if (duplicated) {
      return sendError(res, 409, 'Nao foi possivel restaurar: ja existe registo ativo para este produto nesta lista de compras.');
    }

    await productShoppingListModel.restore(id);
    const restored = await productShoppingListModel.findByIdIncludingDeleted(id);

    return sendSuccess(res, 200, restored, 'Registo Lista_compras_Produto restaurado com sucesso.');
  } catch (error) {
    console.error('Erro ao restaurar registo Lista_compras_Produto:', error);
    return sendError(res, 500, 'Falha interna ao restaurar registo Lista_compras_Produto.');
  }
};

const hardDeleteProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await productShoppingListModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, 'Registo Lista_compras_Produto nao encontrado.');
    }

    await productShoppingListModel.hardDelete(id);
    return sendSuccess(res, 200, existing, 'Registo Lista_compras_Produto removido permanentemente com sucesso.');
  } catch (error) {
    console.error('Erro ao remover permanentemente registo Lista_compras_Produto:', error);
    return sendError(res, 500, 'Falha interna ao remover permanentemente registo Lista_compras_Produto.');
  }
};

module.exports = {
  getProductShoppingLists,
  getAllProductShoppingLists,
  getDeletedProductShoppingLists,
  getProductShoppingListById,
  getProductShoppingListsByList,
  getProductShoppingListsByProduct,
  createProductShoppingList,
  updateProductShoppingList,
  softDeleteProductShoppingList,
  restoreProductShoppingList,
  hardDeleteProductShoppingList
};
