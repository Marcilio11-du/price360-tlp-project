/**
 * @module favoriteController
 * @description Endpoints autenticados para gestão de favoritos.
 */

const favoriteModel = require("../models/favoriteModel");
const productModel = require("../models/productModel");

/** Resposta de sucesso normalizada. */
const sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({ status: "success", data, message });
};

/** Resposta de erro normalizada. */
const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({ status: "error", data: null, message, details });
};

/**
 * GET /favorites
 * Lista os favoritos do utilizador autenticado.
 */
const listFavorites = async (req, res) => {
  try {
    const idUtilizador = req.user.id;
    const favoritos = await favoriteModel.findByUser(idUtilizador);
    return sendSuccess(res, 200, favoritos, "Favoritos listados com sucesso.");
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    return sendError(res, 500, "Falha interna ao listar favoritos.");
  }
};

/**
 * GET /favorites/ids
 * Apenas os ids de produtos favoritados (para marcar corações nos cards).
 */
const listFavoriteIds = async (req, res) => {
  try {
    const ids = await favoriteModel.findFavoriteProductIds(req.user.id);
    return sendSuccess(res, 200, ids, "Ids de favoritos obtidos.");
  } catch (error) {
    console.error("Erro ao obter ids de favoritos:", error);
    return sendError(res, 500, "Falha interna ao obter favoritos.");
  }
};

/**
 * POST /favorites   body: { id_produto }
 * Adiciona um produto aos favoritos.
 */
const addFavorite = async (req, res) => {
  try {
    const idProduto = Number(req.body?.id_produto);
    if (!Number.isInteger(idProduto) || idProduto <= 0) {
      return sendError(res, 400, "id_produto é obrigatório.");
    }

    const produto = await productModel.findById(idProduto);
    if (!produto) {
      return sendError(res, 404, "Produto não encontrado.");
    }

    // Preço mínimo actual no momento do favourito (pode ser null se
    // o produto ainda não tiver ofertas activas).
    let precoNoMomento = null;
    const [rows] = await (
      require("../config/db")
    ).execute(
      "SELECT MIN(preco) AS preco_min FROM Produto_Loja WHERE id_produto = ? AND deleted_at IS NULL",
      [idProduto],
    );
    precoNoMomento = rows[0]?.preco_min != null ? Number(rows[0].preco_min) : null;

    const resultado = await favoriteModel.addFavorite({
      id_utilizador: req.user.id,
      id_produto: idProduto,
      preco_no_momento: precoNoMomento,
    });

    return sendSuccess(
      res,
      resultado === "created" ? 201 : 200,
      { id_produto: idProduto, favorito: true },
      resultado === "created"
        ? "Produto adicionado aos favoritos."
        : "Produto já estava nos favoritos.",
    );
  } catch (error) {
    console.error("Erro ao adicionar favorito:", error);
    return sendError(res, 500, "Falha interna ao adicionar favorito.");
  }
};

/**
 * DELETE /favorites/:idProduto
 * Remove um produto dos favoritos do utilizador.
 */
const removeFavorite = async (req, res) => {
  try {
    const idProduto = Number(req.params.idProduto);
    if (!Number.isInteger(idProduto) || idProduto <= 0) {
      return sendError(res, 400, "id_produto inválido.");
    }

    const removido = await favoriteModel.removeFavorite(req.user.id, idProduto);
    if (!removido) {
      return sendError(res, 404, "Favorito não encontrado.");
    }

    return sendSuccess(res, 200, { id_produto: idProduto, favorito: false }, "Favorito removido.");
  } catch (error) {
    console.error("Erro ao remover favorito:", error);
    return sendError(res, 500, "Falha interna ao remover favorito.");
  }
};

module.exports = { listFavorites, listFavoriteIds, addFavorite, removeFavorite };
