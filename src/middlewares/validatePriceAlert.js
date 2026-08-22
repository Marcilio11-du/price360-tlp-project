const validateCreatePriceAlert = (req, res, next) => {
  const idProduto = Number(req.body.id_produto);
  const precoAlvo = Number(req.body.preco_alvo);
  if (!Number.isInteger(idProduto) || idProduto <= 0 || !Number.isFinite(precoAlvo) || precoAlvo <= 0) {
    return res.status(400).json({ status: "error", data: null, message: "id_produto e preco_alvo positivo são obrigatórios." });
  }
  req.body.id_produto = idProduto; req.body.preco_alvo = precoAlvo; return next();
};
module.exports = { validateCreatePriceAlert };
