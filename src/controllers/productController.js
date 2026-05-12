/**
 * @module productController
 * @description Handlers HTTP para o CRUD de produtos.
 * Inclui suporte a pesquisa dinâmica por múltiplos critérios (RF01)
 * através de duas rotas distintas: `GET /products` e `GET /products/search`.
 */

const productModel = require("../models/productModel");

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
 * Extrai e normaliza os parâmetros de pesquisa a partir da query string.
 * Mapeia os nomes externos dos parâmetros (ex: `palavra_chave`, `categoria`)
 * para os nomes internos usados por `parseSearchFilters` no modelo.
 *
 * Para o parâmetro `categoria`: se o valor for numérico, é interpretado como
 * `categoriaId` (filtro exacto); caso contrário, é interpretado como
 * `categoriaNome` (filtro parcial por nome).
 *
 * @param {Object} query - `req.query` do pedido Express.
 * @returns {Object} Objecto de filtros normalizado.
 */
const getSearchFilters = (query) => {
  const filters = {
    nome: query.nome ? String(query.nome).trim() : null,
    palavraChave: query.palavra_chave
      ? String(query.palavra_chave).trim()
      : null,
    q: query.q ? String(query.q).trim() : null,
    categoriaId: null,
    categoriaNome: null,
  };

  if (query.categoria) {
    const parsedCategory = Number(query.categoria);
    if (Number.isInteger(parsedCategory) && parsedCategory > 0) {
      filters.categoriaId = parsedCategory;
    } else {
      filters.categoriaNome = String(query.categoria).trim();
    }
  }

  return filters;
};

// --- Handlers de leitura ---

/**
 * Lista todos os produtos activos, com suporte a filtros de pesquisa (RF01).
 * É a rota principal de consulta de produtos para o cliente da aplicação.
 *
 * Nota: `getProducts` e `searchProducts` utilizam a mesma lógica interna
 * (`getSearchFilters` + `findAllActives`), mas existem como rotas separadas
 * para permitir semânticas de URL distintas (`/products` vs `/products/search`).
 *
 * @route  GET /products
 * @param  {import('express').Request}  req - Suporta query params: `nome`, `palavra_chave`, `q`, `categoria`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getProducts = async (req, res) => {
  try {
    const filters = getSearchFilters(req.query);
    const products = await productModel.findAllActives(filters);

    return sendSuccess(
      res,
      200,
      products,
      "Produtos ativos listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return sendError(res, 500, "Falha interna ao listar produtos.");
  }
};

/**
 * Endpoint de pesquisa explícita de produtos activos (RF01).
 * Semanticamente equivalente a `getProducts`, mas exposto numa rota dedicada
 * `/products/search` para deixar claro que o propósito é a pesquisa por critérios.
 *
 * @route  GET /products/search
 * @param  {import('express').Request}  req - Suporta os mesmos query params que `getProducts`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const searchProducts = async (req, res) => {
  try {
    const filters = getSearchFilters(req.query);
    const products = await productModel.findAllActives(filters);

    return sendSuccess(
      res,
      200,
      products,
      "Pesquisa de produtos executada com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao pesquisar produtos:", error);
    return sendError(res, 500, "Falha interna ao pesquisar produtos.");
  }
};

/**
 * Lista todos os produtos (activos e removidos), com suporte a filtros.
 * Destinado a uso administrativo.
 *
 * @route  GET /products/all
 * @param  {import('express').Request}  req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getAllProducts = async (req, res) => {
  try {
    const filters = getSearchFilters(req.query);
    const products = await productModel.findAll(filters);

    return sendSuccess(
      res,
      200,
      products,
      "Todos os produtos listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar todos os produtos:", error);
    return sendError(res, 500, "Falha interna ao listar todos os produtos.");
  }
};

/**
 * Lista apenas os produtos marcados como removidos (soft deleted).
 *
 * @route  GET /products/deleted
 * @param  {import('express').Request}  _req
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getDeletedProducts = async (_req, res) => {
  try {
    const products = await productModel.findAllDeleted();

    return sendSuccess(
      res,
      200,
      products,
      "Produtos removidos listados com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar produtos removidos:", error);
    return sendError(res, 500, "Falha interna ao listar produtos removidos.");
  }
};

/**
 * Devolve um produto activo pelo seu ID.
 *
 * @route  GET /products/:id
 * @param  {import('express').Request}  req - `req.params.id` inteiro positivo.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await productModel.findById(productId);

    if (!product) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    return sendSuccess(res, 200, product, "Produto encontrado com sucesso.");
  } catch (error) {
    console.error("Erro ao obter produto por id:", error);
    return sendError(res, 500, "Falha interna ao obter produto.");
  }
};

// --- Handlers de escrita ---

/**
 * Cria um novo produto.
 * Verifica se a categoria indicada existe e está activa antes de persistir.
 *
 * @route  POST /products
 * @param  {import('express').Request}  req - Body validado por `validateCreateProduct`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const createProduct = async (req, res) => {
  try {
    const payload = req.body;

    const categoryExists = await productModel.categoryExists(
      payload.id_categoria,
    );
    if (!categoryExists) {
      return sendError(
        res,
        404,
        "Categoria informada nao existe ou esta inativa.",
      );
    }

    const newProductId = await productModel.create(payload);
    const product = await productModel.findByIdIncludingDeleted(newProductId);

    return sendSuccess(res, 201, product, "Produto criado com sucesso.");
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return sendError(res, 500, "Falha interna ao criar produto.");
  }
};

/**
 * Actualiza os dados de um produto activo.
 * Se `id_categoria` for enviado, verifica se a nova categoria existe e está activa.
 *
 * @route  PATCH /products/:id
 * @param  {import('express').Request}  req - Body validado por `validateUpdateProduct`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const payload = { ...req.body };

    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    if (payload.id_categoria) {
      const categoryExists = await productModel.categoryExists(
        payload.id_categoria,
      );
      if (!categoryExists) {
        return sendError(
          res,
          404,
          "Categoria informada nao existe ou esta inativa.",
        );
      }
    }

    const updatedRows = await productModel.update(productId, payload);
    if (updatedRows === 0) {
      return sendError(
        res,
        400,
        "Nenhum campo valido foi enviado para atualizacao.",
      );
    }

    const updatedProduct =
      await productModel.findByIdIncludingDeleted(productId);
    return sendSuccess(
      res,
      200,
      updatedProduct,
      "Produto atualizado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return sendError(res, 500, "Falha interna ao atualizar produto.");
  }
};

/**
 * Remove logicamente um produto (soft delete), preservando o registo na BD.
 *
 * @route  DELETE /products/:id
 * @param  {import('express').Request}  req - `req.params.id`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const softDeleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existingProduct = await productModel.findById(productId);

    if (!existingProduct) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    await productModel.softDelete(productId);
    const deletedProduct =
      await productModel.findByIdIncludingDeleted(productId);

    return sendSuccess(
      res,
      200,
      deletedProduct,
      "Produto removido com sucesso (soft delete).",
    );
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    return sendError(res, 500, "Falha interna ao remover produto.");
  }
};

/**
 * Restaura um produto previamente removido com soft delete.
 * Retorna 409 se o produto já estiver activo.
 *
 * @route  PATCH /products/:id/restore
 * @param  {import('express').Request}  req - `req.params.id`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const restoreProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existingProduct =
      await productModel.findByIdIncludingDeleted(productId);

    if (!existingProduct) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    if (!existingProduct.deleted_at) {
      return sendError(res, 409, "Produto ja se encontra ativo.");
    }

    await productModel.restore(productId);
    const restoredProduct =
      await productModel.findByIdIncludingDeleted(productId);

    return sendSuccess(
      res,
      200,
      restoredProduct,
      "Produto restaurado com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao restaurar produto:", error);
    return sendError(res, 500, "Falha interna ao restaurar produto.");
  }
};

/**
 * Remove permanentemente um produto da base de dados. Operação irreversível.
 * O registo antes da remoção é incluído na resposta para referência.
 *
 * @route  DELETE /products/:id/hard
 * @param  {import('express').Request}  req - `req.params.id`.
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 */
const hardDeleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existingProduct =
      await productModel.findByIdIncludingDeleted(productId);

    if (!existingProduct) {
      return sendError(res, 404, "Produto nao encontrado.");
    }

    await productModel.hardDelete(productId);
    return sendSuccess(
      res,
      200,
      existingProduct,
      "Produto removido permanentemente com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao remover permanentemente produto:", error);
    return sendError(
      res,
      500,
      "Falha interna ao remover permanentemente produto.",
    );
  }
};

module.exports = {
  getProducts,
  searchProducts,
  getAllProducts,
  getDeletedProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  hardDeleteProduct,
};
