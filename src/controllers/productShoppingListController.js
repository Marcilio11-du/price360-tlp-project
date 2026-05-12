/**
 * @module productShoppingListController
 * @description Controlador para a tabela `Lista_compras_Produto` (associação N:N
 * entre listas de compras e produtos). Expõe handlers CRUD completos com suporte
 * a soft delete, restauro e remoção permanente.
 * A unicidade da combinação (lista, produto) é verificada em criação, atualização
 * e restauro antes de qualquer escrita na base de dados.
 */

const db = require("../config/db");
const productShoppingListModel = require("../models/productShoppingListModel");

const LIST_TABLE = process.env.DB_SHOPPING_LIST_TABLE || "Lista_compras";
const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || "Produto";

// --- Helpers de resposta ---

/**
 * Envia uma resposta de sucesso normalizada.
 * @param {import('express').Response} res - Objeto de resposta do Express.
 * @param {number} statusCode - Código HTTP de sucesso.
 * @param {*} data            - Dados a incluir na resposta.
 * @param {string} message    - Mensagem descritiva.
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
 * @param {import('express').Response} res - Objeto de resposta do Express.
 * @param {number} statusCode  - Código HTTP de erro.
 * @param {string} message     - Mensagem de erro.
 * @param {*} [details=null]   - Detalhes adicionais (ex.: erros de validação).
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

// --- Helper de validação de dependências ---

/**
 * Verifica se as entidades referenciadas pelo payload existem e estão ativas.
 * A verificação é feita diretamente na base de dados (sem passar pelo modelo)
 * para garantir consistência de FK antes de qualquer escrita.
 * @param {Object} payload            - Dados a validar.
 * @param {number} [payload.id_lista]  - ID da lista de compras a verificar.
 * @param {number} [payload.id_produto] - ID do produto a verificar.
 * @returns {Promise<string|null>} Mensagem de erro se uma dependência falhar, ou null se tudo válido.
 */
const validateDependencies = async (payload) => {
  if (payload.id_lista !== undefined) {
    const [rows] = await db.execute(
      `SELECT id FROM ${LIST_TABLE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [payload.id_lista],
    );
    if (!rows[0]) {
      return "Lista de compras informada nao existe ou esta inativa.";
    }
  }

  if (payload.id_produto !== undefined) {
    const [rows] = await db.execute(
      `SELECT id FROM ${PRODUCT_TABLE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [payload.id_produto],
    );
    if (!rows[0]) {
      return "Produto informado nao existe ou esta inativo.";
    }
  }

  return null;
};

// --- Handlers de leitura ---

/**
 * @route GET /api/v1/product-shopping-lists
 * @description Lista todas as associações lista-produto ativas.
 */
const getProductShoppingLists = async (_req, res) => {
  try {
    const rows = await productShoppingListModel.findAllActives();
    return sendSuccess(
      res,
      200,
      rows,
      "Produtos de lista de compras listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar produtos de lista de compras:", error);
    return sendError(
      res,
      500,
      "Falha interna ao listar produtos de lista de compras.",
    );
  }
};

/**
 * @route GET /api/v1/product-shopping-lists/all
 * @description Lista todas as associações lista-produto, incluindo as eliminadas.
 */
const getAllProductShoppingLists = async (_req, res) => {
  try {
    const rows = await productShoppingListModel.findAll();
    return sendSuccess(
      res,
      200,
      rows,
      "Todos os registos de produto de lista de compras listados com sucesso.",
    );
  } catch (error) {
    console.error(
      "Erro ao listar todos os registos de produto de lista de compras:",
      error,
    );
    return sendError(res, 500, "Falha interna ao listar todos os registos.");
  }
};

/**
 * @route GET /api/v1/product-shopping-lists/deleted
 * @description Lista apenas as associações marcadas como eliminadas (soft delete).
 */
const getDeletedProductShoppingLists = async (_req, res) => {
  try {
    const rows = await productShoppingListModel.findAllDeleted();
    return sendSuccess(
      res,
      200,
      rows,
      "Registos removidos listados com sucesso.",
    );
  } catch (error) {
    console.error(
      "Erro ao listar registos removidos de produto de lista de compras:",
      error,
    );
    return sendError(res, 500, "Falha interna ao listar registos removidos.");
  }
};

/**
 * @route GET /api/v1/product-shopping-lists/:id
 * @description Devolve uma associação ativa pelo seu ID.
 */
const getProductShoppingListById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await productShoppingListModel.findById(id);

    if (!row) {
      return sendError(
        res,
        404,
        "Registo Lista_compras_Produto nao encontrado.",
      );
    }

    return sendSuccess(
      res,
      200,
      row,
      "Registo Lista_compras_Produto encontrado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao obter registo Lista_compras_Produto por id:", error);
    return sendError(
      res,
      500,
      "Falha interna ao obter registo Lista_compras_Produto.",
    );
  }
};

/**
 * @route GET /api/v1/product-shopping-lists/list/:listId
 * @description Lista todos os produtos ativos de uma lista de compras específica.
 * Devolve 404 se a lista não existir (independentemente do seu estado).
 */
const getProductShoppingListsByList = async (req, res) => {
  try {
    const listId = Number(req.params.listId);

    const [listRows] = await db.execute(
      `SELECT id FROM ${LIST_TABLE} WHERE id = ? LIMIT 1`,
      [listId],
    );
    if (!listRows[0]) {
      return sendError(res, 404, "Lista de compras nao encontrada.");
    }

    const rows = await productShoppingListModel.findByShoppingListId(listId);
    return sendSuccess(
      res,
      200,
      rows,
      "Produtos da lista de compras listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar produtos por lista de compras:", error);
    return sendError(
      res,
      500,
      "Falha interna ao listar produtos por lista de compras.",
    );
  }
};

/**
 * @route GET /api/v1/product-shopping-lists/product/:productId
 * @description Lista todas as listas de compras ativas que contêm um produto específico.
 * Devolve 404 se o produto não existir (independentemente do seu estado).
 */
const getProductShoppingListsByProduct = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const [productRows] = await db.execute(
      `SELECT id FROM ${PRODUCT_TABLE} WHERE id = ? LIMIT 1`,
      [productId],
    );
    if (!productRows[0]) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    const rows = await productShoppingListModel.findByProductId(productId);
    return sendSuccess(
      res,
      200,
      rows,
      "Listas de compras do produto listadas com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar listas de compras por produto:", error);
    return sendError(
      res,
      500,
      "Falha interna ao listar listas de compras por produto.",
    );
  }
};

// --- Handlers de escrita ---

/**
 * @route POST /api/v1/product-shopping-lists
 * @description Cria uma nova associação lista-produto.
 * Verifica primeiro se a lista e o produto existem e estão ativos,
 * e depois garante que a combinação (id_lista, id_produto) ainda não existe
 * em nenhum registo ativo — devolvendo 409 em caso de duplicado.
 */
const createProductShoppingList = async (req, res) => {
  try {
    const payload = req.body;

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    // Garante unicidade da combinação (lista, produto) antes de inserir
    const duplicated =
      await productShoppingListModel.findActiveByListAndProduct(
        payload.id_lista,
        payload.id_produto,
      );
    if (duplicated) {
      return sendError(
        res,
        409,
        "Ja existe um registo ativo para este produto nesta lista de compras.",
      );
    }

    const createdId = await productShoppingListModel.create(payload);
    const created =
      await productShoppingListModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(
      res,
      201,
      created,
      "Registo Lista_compras_Produto criado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao criar registo Lista_compras_Produto:", error);
    return sendError(
      res,
      500,
      "Falha interna ao criar registo Lista_compras_Produto.",
    );
  }
};

/**
 * @route PUT /api/v1/product-shopping-lists/:id
 * @description Atualiza uma associação lista-produto existente e ativa.
 * Calcula os valores finais de (id_lista, id_produto) combinando o payload
 * com os valores atuais do registo, para verificar unicidade com `ignoreId`
 * (exclui o próprio registo da comparação de duplicados).
 */
const updateProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await productShoppingListModel.findById(id);
    if (!existing) {
      return sendError(
        res,
        404,
        "Registo Lista_compras_Produto nao encontrado.",
      );
    }

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    // Resolve os valores finais: usa o valor do payload se fornecido, caso contrário mantém o atual
    const nextListId =
      payload.id_lista !== undefined ? payload.id_lista : existing.id_lista;
    const nextProductId =
      payload.id_produto !== undefined
        ? payload.id_produto
        : existing.id_produto;

    // Passa o id atual como ignoreId para não detetar o próprio registo como duplicado
    const duplicated =
      await productShoppingListModel.findActiveByListAndProduct(
        nextListId,
        nextProductId,
        id,
      );
    if (duplicated) {
      return sendError(
        res,
        409,
        "Ja existe um registo ativo para este produto nesta lista de compras.",
      );
    }

    const affectedRows = await productShoppingListModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(
        res,
        400,
        "Nenhum campo valido foi enviado para atualizacao.",
      );
    }

    const updated = await productShoppingListModel.findByIdIncludingDeleted(id);
    return sendSuccess(
      res,
      200,
      updated,
      "Registo Lista_compras_Produto atualizado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao atualizar registo Lista_compras_Produto:", error);
    return sendError(
      res,
      500,
      "Falha interna ao atualizar registo Lista_compras_Produto.",
    );
  }
};

/**
 * @route DELETE /api/v1/product-shopping-lists/:id
 * @description Realiza a remoção lógica (soft delete) de uma associação ativa.
 */
const softDeleteProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await productShoppingListModel.findById(id);

    if (!existing) {
      return sendError(
        res,
        404,
        "Registo Lista_compras_Produto nao encontrado.",
      );
    }

    await productShoppingListModel.softDelete(id);
    const deleted = await productShoppingListModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      deleted,
      "Registo Lista_compras_Produto removido com sucesso (soft delete).",
    );
  } catch (error) {
    console.error("Erro ao remover registo Lista_compras_Produto:", error);
    return sendError(
      res,
      500,
      "Falha interna ao remover registo Lista_compras_Produto.",
    );
  }
};

/**
 * @route PATCH /api/v1/product-shopping-lists/:id/restore
 * @description Restaura uma associação previamente eliminada.
 * Antes de restaurar, verifica se a combinação (lista, produto) já existe
 * noutro registo ativo — impedindo duplicados após o restauro.
 */
const restoreProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing =
      await productShoppingListModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(
        res,
        404,
        "Registo Lista_compras_Produto nao encontrado.",
      );
    }

    if (!existing.deleted_at) {
      return sendError(
        res,
        409,
        "Registo Lista_compras_Produto ja se encontra ativo.",
      );
    }

    // Usa ignoreId para excluir o próprio registo da verificação de unicidade
    const duplicated =
      await productShoppingListModel.findActiveByListAndProduct(
        existing.id_lista,
        existing.id_produto,
        id,
      );
    if (duplicated) {
      return sendError(
        res,
        409,
        "Nao foi possivel restaurar: ja existe registo ativo para este produto nesta lista de compras.",
      );
    }

    await productShoppingListModel.restore(id);
    const restored =
      await productShoppingListModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      restored,
      "Registo Lista_compras_Produto restaurado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao restaurar registo Lista_compras_Produto:", error);
    return sendError(
      res,
      500,
      "Falha interna ao restaurar registo Lista_compras_Produto.",
    );
  }
};

/**
 * @route DELETE /api/v1/product-shopping-lists/:id/hard
 * @description Remove permanentemente uma associação da base de dados.
 */
const hardDeleteProductShoppingList = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing =
      await productShoppingListModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(
        res,
        404,
        "Registo Lista_compras_Produto nao encontrado.",
      );
    }

    await productShoppingListModel.hardDelete(id);
    return sendSuccess(
      res,
      200,
      existing,
      "Registo Lista_compras_Produto removido permanentemente com sucesso.",
    );
  } catch (error) {
    console.error(
      "Erro ao remover permanentemente registo Lista_compras_Produto:",
      error,
    );
    return sendError(
      res,
      500,
      "Falha interna ao remover permanentemente registo Lista_compras_Produto.",
    );
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
  hardDeleteProductShoppingList,
};
