const productModel = require('../models/productModel');

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

const getSearchFilters = (query) => {
  const filters = {
    nome: query.nome ? String(query.nome).trim() : null,
    palavraChave: query.palavra_chave ? String(query.palavra_chave).trim() : null,
    q: query.q ? String(query.q).trim() : null,
    categoriaId: null,
    categoriaNome: null
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

const getProducts = async (req, res) => {
  try {
    const filters = getSearchFilters(req.query);
    const products = await productModel.findAllActives(filters);

    return sendSuccess(
      res,
      200,
      products,
      'Produtos ativos listados com sucesso.'
    );
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return sendError(res, 500, 'Falha interna ao listar produtos.');
  }
};

const searchProducts = async (req, res) => {
  try {
    const filters = getSearchFilters(req.query);
    const products = await productModel.findAllActives(filters);

    return sendSuccess(
      res,
      200,
      products,
      'Pesquisa de produtos executada com sucesso.'
    );
  } catch (error) {
    console.error('Erro ao pesquisar produtos:', error);
    return sendError(res, 500, 'Falha interna ao pesquisar produtos.');
  }
};

const getAllProducts = async (req, res) => {
  try {
    const filters = getSearchFilters(req.query);
    const products = await productModel.findAll(filters);

    return sendSuccess(
      res,
      200,
      products,
      'Todos os produtos listados com sucesso.'
    );
  } catch (error) {
    console.error('Erro ao listar todos os produtos:', error);
    return sendError(res, 500, 'Falha interna ao listar todos os produtos.');
  }
};

const getDeletedProducts = async (_req, res) => {
  try {
    const products = await productModel.findAllDeleted();

    return sendSuccess(
      res,
      200,
      products,
      'Produtos removidos listados com sucesso.'
    );
  } catch (error) {
    console.error('Erro ao listar produtos removidos:', error);
    return sendError(res, 500, 'Falha interna ao listar produtos removidos.');
  }
};

const getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await productModel.findById(productId);

    if (!product) {
      return sendError(res, 404, 'Produto nao encontrado.');
    }

    return sendSuccess(res, 200, product, 'Produto encontrado com sucesso.');
  } catch (error) {
    console.error('Erro ao obter produto por id:', error);
    return sendError(res, 500, 'Falha interna ao obter produto.');
  }
};

const createProduct = async (req, res) => {
  try {
    const payload = req.body;

    const categoryExists = await productModel.categoryExists(payload.id_categoria);
    if (!categoryExists) {
      return sendError(res, 404, 'Categoria informada nao existe ou esta inativa.');
    }

    const newProductId = await productModel.create(payload);
    const product = await productModel.findByIdIncludingDeleted(newProductId);

    return sendSuccess(res, 201, product, 'Produto criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return sendError(res, 500, 'Falha interna ao criar produto.');
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const payload = { ...req.body };

    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return sendError(res, 404, 'Produto nao encontrado.');
    }

    if (payload.id_categoria) {
      const categoryExists = await productModel.categoryExists(payload.id_categoria);
      if (!categoryExists) {
        return sendError(res, 404, 'Categoria informada nao existe ou esta inativa.');
      }
    }

    const updatedRows = await productModel.update(productId, payload);
    if (updatedRows === 0) {
      return sendError(res, 400, 'Nenhum campo valido foi enviado para atualizacao.');
    }

    const updatedProduct = await productModel.findByIdIncludingDeleted(productId);
    return sendSuccess(res, 200, updatedProduct, 'Produto atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return sendError(res, 500, 'Falha interna ao atualizar produto.');
  }
};

const softDeleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existingProduct = await productModel.findById(productId);

    if (!existingProduct) {
      return sendError(res, 404, 'Produto nao encontrado.');
    }

    await productModel.softDelete(productId);
    const deletedProduct = await productModel.findByIdIncludingDeleted(productId);

    return sendSuccess(
      res,
      200,
      deletedProduct,
      'Produto removido com sucesso (soft delete).'
    );
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    return sendError(res, 500, 'Falha interna ao remover produto.');
  }
};

const restoreProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existingProduct = await productModel.findByIdIncludingDeleted(productId);

    if (!existingProduct) {
      return sendError(res, 404, 'Produto nao encontrado.');
    }

    if (!existingProduct.deleted_at) {
      return sendError(res, 409, 'Produto ja se encontra ativo.');
    }

    await productModel.restore(productId);
    const restoredProduct = await productModel.findByIdIncludingDeleted(productId);

    return sendSuccess(res, 200, restoredProduct, 'Produto restaurado com sucesso.');
  } catch (error) {
    console.error('Erro ao restaurar produto:', error);
    return sendError(res, 500, 'Falha interna ao restaurar produto.');
  }
};

const hardDeleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existingProduct = await productModel.findByIdIncludingDeleted(productId);

    if (!existingProduct) {
      return sendError(res, 404, 'Produto nao encontrado.');
    }

    await productModel.hardDelete(productId);
    return sendSuccess(
      res,
      200,
      existingProduct,
      'Produto removido permanentemente com sucesso.'
    );
  } catch (error) {
    console.error('Erro ao remover permanentemente produto:', error);
    return sendError(res, 500, 'Falha interna ao remover permanentemente produto.');
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
  hardDeleteProduct
};
