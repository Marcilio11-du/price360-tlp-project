/**
 * @module storeProductController
 * @description Handlers HTTP para o CRUD de registos `Produto_Loja`.
 * Cada registo associa um produto a uma loja com preço e quantidade.
 * A lógica garante que não podem existir dois registos activos para
 * o mesmo par (produto, loja) em simultâneo.
 */

const storeProductModel = require("../models/storeProductModel");

// --- Utilitários internos ---

/**
 * Envia uma resposta JSON de sucesso com estrutura normalizada.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {*}      data
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
 * Envia uma resposta JSON de erro com estrutura normalizada.
 *
 * @param {import('express').Response} res
 * @param {number}     statusCode
 * @param {string}     message
 * @param {Array|null} details
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

/**
 * Verifica se as entidades referenciadas no payload (produto e/ou loja) existem
 * e estão activas antes de realizar operações de criação ou actualização.
 * Retorna uma mensagem de erro descritiva se alguma dependência falhar,
 * ou `null` se todas as dependências forem válidas.
 *
 * @param {Object}  payload              - Dados do pedido.
 * @param {number}  [payload.id_produto] - ID do produto a verificar (opcional).
 * @param {number}  [payload.id_loja]    - ID da loja a verificar (opcional).
 * @returns {Promise<string|null>} Mensagem de erro ou `null` se tudo estiver válido.
 */
const validateDependencies = async (payload) => {
  if (payload.id_produto !== undefined) {
    const productExists = await storeProductModel.productExists(
      payload.id_produto,
    );
    if (!productExists) {
      return "Produto informado nao existe ou esta inativo.";
    }
  }

  if (payload.id_loja !== undefined) {
    const storeExists = await storeProductModel.storeExists(payload.id_loja);
    if (!storeExists) {
      return "Loja informada nao existe ou esta inativa.";
    }
  }

  return null;
};

// --- Handlers de leitura ---

/**
 * Lista todos os registos activos de produto-loja.
 *
 * @route  GET /store-products
 * @param  {import('express').Request}  _req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getStoreProducts = async (_req, res) => {
  try {
    const rows = await storeProductModel.findAllActives();
    return sendSuccess(
      res,
      200,
      rows,
      "Produtos por loja listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar produtos por loja:", error);
    return sendError(res, 500, "Falha interna ao listar produtos por loja.");
  }
};

/**
 * Lista todos os registos (activos e removidos). Destinado a uso administrativo.
 *
 * @route  GET /store-products/all
 * @param  {import('express').Request}  _req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getAllStoreProducts = async (_req, res) => {
  try {
    const rows = await storeProductModel.findAll();
    return sendSuccess(
      res,
      200,
      rows,
      "Todos os registos de produto por loja listados com sucesso.",
    );
  } catch (error) {
    console.error(
      "Erro ao listar todos os registos de produto por loja:",
      error,
    );
    return sendError(res, 500, "Falha interna ao listar todos os registos.");
  }
};

/**
 * Lista apenas os registos marcados como removidos (soft deleted).
 *
 * @route  GET /store-products/deleted
 * @param  {import('express').Request}  _req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getDeletedStoreProducts = async (_req, res) => {
  try {
    const rows = await storeProductModel.findAllDeleted();
    return sendSuccess(
      res,
      200,
      rows,
      "Registos removidos listados com sucesso.",
    );
  } catch (error) {
    console.error(
      "Erro ao listar registos removidos de produto por loja:",
      error,
    );
    return sendError(res, 500, "Falha interna ao listar registos removidos.");
  }
};

/**
 * Devolve um registo activo de produto-loja pelo seu ID.
 *
 * @route  GET /store-products/:id
 * @param  {import('express').Request}  req - `req.params.id` inteiro positivo.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getStoreProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await storeProductModel.findById(id);

    if (!row) {
      return sendError(res, 404, "Registo Produto_Loja nao encontrado.");
    }

    return sendSuccess(
      res,
      200,
      row,
      "Registo Produto_Loja encontrado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao obter registo Produto_Loja por id:", error);
    return sendError(res, 500, "Falha interna ao obter registo Produto_Loja.");
  }
};

// --- Handlers de escrita ---

/**
 * Cria um novo registo de produto-loja.
 * Verifica existência das dependências (produto e loja) e garante que
 * não existe já um registo activo para o mesmo par (produto, loja).
 *
 * @route  POST /store-products
 * @param  {import('express').Request}  req - Body validado pelo middleware.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const createStoreProduct = async (req, res) => {
  try {
    const payload = req.body;

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    const duplicated = await storeProductModel.findActiveByProductAndStore(
      payload.id_produto,
      payload.id_loja,
    );
    if (duplicated) {
      return sendError(
        res,
        409,
        "Ja existe um registo ativo para este produto nesta loja.",
      );
    }

    const createdId = await storeProductModel.create(payload);
    const created = await storeProductModel.findByIdIncludingDeleted(createdId);

    return sendSuccess(
      res,
      201,
      created,
      "Registo Produto_Loja criado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao criar registo Produto_Loja:", error);
    return sendError(res, 500, "Falha interna ao criar registo Produto_Loja.");
  }
};

/**
 * Actualiza um registo activo de produto-loja.
 * Verifica dependências e garante unicidade do par (produto, loja),
 * passando o próprio ID como `ignoreId` para não colidir consigo mesmo.
 *
 * @route  PATCH /store-products/:id
 * @param  {import('express').Request}  req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const updateStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...req.body };

    const existing = await storeProductModel.findById(id);
    if (!existing) {
      return sendError(res, 404, "Registo Produto_Loja nao encontrado.");
    }

    const dependencyError = await validateDependencies(payload);
    if (dependencyError) {
      return sendError(res, 404, dependencyError);
    }

    // Determina os valores finais de produto e loja após o update:
    // usa o valor do payload se foi enviado, senão mantém o valor actual do registo.
    const nextProductId =
      payload.id_produto !== undefined
        ? payload.id_produto
        : existing.id_produto;
    const nextStoreId =
      payload.id_loja !== undefined ? payload.id_loja : existing.id_loja;

    const duplicated = await storeProductModel.findActiveByProductAndStore(
      nextProductId,
      nextStoreId,
      id,
    );
    if (duplicated) {
      return sendError(
        res,
        409,
        "Ja existe um registo ativo para este produto nesta loja.",
      );
    }

    const affectedRows = await storeProductModel.update(id, payload);
    if (affectedRows === 0) {
      return sendError(
        res,
        400,
        "Nenhum campo valido foi enviado para atualizacao.",
      );
    }

    const updated = await storeProductModel.findByIdIncludingDeleted(id);
    return sendSuccess(
      res,
      200,
      updated,
      "Registo Produto_Loja atualizado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao atualizar registo Produto_Loja:", error);
    return sendError(
      res,
      500,
      "Falha interna ao atualizar registo Produto_Loja.",
    );
  }
};

/**
 * Remove logicamente um registo (soft delete). Operação reversível.
 *
 * @route  DELETE /store-products/:id
 * @param  {import('express').Request}  req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const softDeleteStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeProductModel.findById(id);

    if (!existing) {
      return sendError(res, 404, "Registo Produto_Loja nao encontrado.");
    }

    await storeProductModel.softDelete(id);
    const deleted = await storeProductModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      deleted,
      "Registo Produto_Loja removido com sucesso (soft delete).",
    );
  } catch (error) {
    console.error("Erro ao remover registo Produto_Loja:", error);
    return sendError(
      res,
      500,
      "Falha interna ao remover registo Produto_Loja.",
    );
  }
};

/**
 * Restaura um registo previamente removido com soft delete.
 * Antes de restaurar, verifica se já existe outro registo activo para o mesmo
 * par (produto, loja) — passando o próprio ID como `ignoreId` para evitar
 * que o registo seja detectado como conflito de si mesmo durante a verificação.
 *
 * @route  PATCH /store-products/:id/restore
 * @param  {import('express').Request}  req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const restoreStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeProductModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, "Registo Produto_Loja nao encontrado.");
    }

    if (!existing.deleted_at) {
      return sendError(res, 409, "Registo Produto_Loja ja se encontra ativo.");
    }

    const duplicated = await storeProductModel.findActiveByProductAndStore(
      existing.id_produto,
      existing.id_loja,
      id,
    );
    if (duplicated) {
      return sendError(
        res,
        409,
        "Nao foi possivel restaurar: ja existe registo ativo para este produto nesta loja.",
      );
    }

    await storeProductModel.restore(id);
    const restored = await storeProductModel.findByIdIncludingDeleted(id);

    return sendSuccess(
      res,
      200,
      restored,
      "Registo Produto_Loja restaurado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao restaurar registo Produto_Loja:", error);
    return sendError(
      res,
      500,
      "Falha interna ao restaurar registo Produto_Loja.",
    );
  }
};

/**
 * Remove permanentemente um registo da base de dados. Operação irreversível.
 *
 * @route  DELETE /store-products/:id/hard
 * @param  {import('express').Request}  req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const hardDeleteStoreProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await storeProductModel.findByIdIncludingDeleted(id);

    if (!existing) {
      return sendError(res, 404, "Registo Produto_Loja nao encontrado.");
    }

    await storeProductModel.hardDelete(id);
    return sendSuccess(
      res,
      200,
      existing,
      "Registo Produto_Loja removido permanentemente com sucesso.",
    );
  } catch (error) {
    console.error(
      "Erro ao remover permanentemente registo Produto_Loja:",
      error,
    );
    return sendError(
      res,
      500,
      "Falha interna ao remover permanentemente registo Produto_Loja.",
    );
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
  hardDeleteStoreProduct,
};
