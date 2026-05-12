const shoppingListModel = require('../models/shoppingListModel');
const userModel = require('../models/userModel');

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

const getShoppingLists = async (_req, res) => {
  try {
    const lists = await shoppingListModel.getAllActiveShoppingLists();
    return sendSuccess(res, 200, lists, 'Listas de compras ativas listadas com sucesso.');
  } catch (error) {
    console.error('Erro ao listar listas de compras:', error);
    return sendError(res, 500, 'Falha interna ao listar listas de compras.');
  }
};

const getAllShoppingLists = async (_req, res) => {
  try {
    const lists = await shoppingListModel.getAllShoppingLists();
    return sendSuccess(res, 200, lists, 'Todas as listas de compras listadas com sucesso.');
  } catch (error) {
    console.error('Erro ao listar todas as listas de compras:', error);
    return sendError(res, 500, 'Falha interna ao listar todas as listas de compras.');
  }
};

const getDeletedShoppingLists = async (_req, res) => {
  try {
    const lists = await shoppingListModel.getAllDeletedShoppingLists();
    return sendSuccess(res, 200, lists, 'Listas de compras removidas listadas com sucesso.');
  } catch (error) {
    console.error('Erro ao listar listas de compras removidas:', error);
    return sendError(res, 500, 'Falha interna ao listar listas de compras removidas.');
  }
};

const getShoppingListById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const list = await shoppingListModel.getShoppingListById(id);

    if (!list) {
      return sendError(res, 404, 'Lista de compras nao encontrada.');
    }

    return sendSuccess(res, 200, list, 'Lista de compras encontrada com sucesso.');
  } catch (error) {
    console.error('Erro ao obter lista de compras por id:', error);
    return sendError(res, 500, 'Falha interna ao obter lista de compras.');
  }
};

const getShoppingListsByClient = async (req, res) => {
  try {
    const clientId = Number(req.params.clientId);

    const client = await userModel.getUserById(clientId);
    if (!client) {
      return sendError(res, 404, 'Cliente nao encontrado.');
    }

    const lists = await shoppingListModel.getShoppingListsByClientId(clientId);
    return sendSuccess(res, 200, lists, 'Listas de compras do cliente listadas com sucesso.');
  } catch (error) {
    console.error('Erro ao listar listas de compras por cliente:', error);
    return sendError(res, 500, 'Falha interna ao listar listas de compras por cliente.');
  }
};

const createShoppingList = async (req, res) => {
  try {
    const payload = req.body;

    const client = await userModel.getUserById(payload.id_cliente);
    if (!client) {
      return sendError(res, 404, 'Cliente informado nao existe ou esta inativo.');
    }

    const createdId = await shoppingListModel.createShoppingList({
      nome: payload.nome,
      descricao: payload.descricao,
      id_cliente: payload.id_cliente
    });

    const created = await shoppingListModel.getShoppingListByIdIncludingDeleted(createdId);
    return sendSuccess(res, 201, created, 'Lista de compras criada com sucesso.');
  } catch (error) {
    console.error('Erro ao criar lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao criar lista de compras.');
  }
};

const updateShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await shoppingListModel.getShoppingListById(id);
    if (!existing) {
      return sendError(res, 404, 'Lista de compras nao encontrada.');
    }

    if (payload.id_cliente !== undefined) {
      const client = await userModel.getUserById(payload.id_cliente);
      if (!client) {
        return sendError(res, 404, 'Cliente informado nao existe ou esta inativo.');
      }
    }

    const affectedRows = await shoppingListModel.updateShoppingList(id, payload);
    if (affectedRows === 0) {
      return sendError(res, 400, 'Nenhum campo valido foi enviado para atualizacao.');
    }

    const updated = await shoppingListModel.getShoppingListByIdIncludingDeleted(id);
    return sendSuccess(res, 200, updated, 'Lista de compras atualizada com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao atualizar lista de compras.');
  }
};

const deleteShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await shoppingListModel.getShoppingListById(id);
    if (!existing) {
      return sendError(res, 404, 'Lista de compras nao encontrada.');
    }

    await shoppingListModel.softDeleteShoppingList(id);
    const deleted = await shoppingListModel.getShoppingListByIdIncludingDeleted(id);
    return sendSuccess(res, 200, deleted, 'Lista de compras removida com sucesso (soft delete).');
  } catch (error) {
    console.error('Erro ao remover lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao remover lista de compras.');
  }
};

const restoreShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await shoppingListModel.getShoppingListByIdIncludingDeleted(id);
    if (!existing) {
      return sendError(res, 404, 'Lista de compras nao encontrada.');
    }

    if (!existing.deleted_at) {
      return sendError(res, 409, 'Lista de compras ja se encontra ativa.');
    }

    await shoppingListModel.restoreShoppingList(id);
    const restored = await shoppingListModel.getShoppingListByIdIncludingDeleted(id);
    return sendSuccess(res, 200, restored, 'Lista de compras restaurada com sucesso.');
  } catch (error) {
    console.error('Erro ao restaurar lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao restaurar lista de compras.');
  }
};

const hardDeleteShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await shoppingListModel.getShoppingListByIdIncludingDeleted(id);
    if (!existing) {
      return sendError(res, 404, 'Lista de compras nao encontrada.');
    }

    await shoppingListModel.hardDeleteShoppingList(id);
    return sendSuccess(res, 200, existing, 'Lista de compras removida permanentemente com sucesso.');
  } catch (error) {
    console.error('Erro ao remover permanentemente lista de compras:', error);
    return sendError(res, 500, 'Falha interna ao remover permanentemente lista de compras.');
  }
};

module.exports = {
  getShoppingLists,
  getAllShoppingLists,
  getDeletedShoppingLists,
  getShoppingListById,
  getShoppingListsByClient,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  restoreShoppingList,
  hardDeleteShoppingList
};
