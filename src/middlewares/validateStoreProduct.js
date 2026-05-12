/**
 * @module validateStoreProduct
 * @description Middlewares de validação de entrada para os endpoints da
 * tabela `Produto_Loja`. Valida parâmetros de rota e campos do body,
 * incluindo campos numéricos com regras distintas (quantidade >= 0, preço >= 0).
 */

/**
 * Envia uma resposta de erro de validação com status 400.
 * @param {import('express').Response} res
 * @param {string[]} errors
 * @returns {import('express').Response}
 */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: "error",
    data: null,
    message: "Falha de validacao dos dados enviados.",
    details: errors,
  });
};

/**
 * Verifica se um valor é um inteiro estritamente positivo (> 0).
 * Usado para validar IDs de produto e de loja.
 * @param {*} value
 * @returns {boolean}
 */
const isPositiveInteger = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

/**
 * Verifica se um valor é um inteiro não negativo (>= 0).
 * Distinto de `isPositiveInteger`: aceita zero, permitindo quantidade 0
 * (produto esgotado mas ainda registado no sistema).
 * @param {*} value
 * @returns {boolean}
 */
const isNonNegativeInteger = (value) =>
  Number.isInteger(Number(value)) && Number(value) >= 0;

// --- Validadores de parâmetros de rota ---

/**
 * Valida e normaliza o parâmetro de rota `:id`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateStoreProductIdParam = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Parametro id invalido. Utilize um inteiro positivo.",
    });
  }

  req.params.id = id;
  return next();
};

// --- Validadores de body ---

/**
 * Valida o body para criação de uma relação produto-loja.
 * Campos obrigatórios: `id_produto`, `id_loja`, `quantidade`, `preco`.
 * - `id_produto` e `id_loja` devem ser inteiros positivos.
 * - `quantidade` deve ser um inteiro não negativo (aceita 0).
 * - `preco` deve ser um número não negativo (aceita decimais).
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateCreateStoreProduct = (req, res, next) => {
  const requiredFields = ["id_produto", "id_loja", "quantidade", "preco"];
  const errors = [];

  for (const field of requiredFields) {
    if (
      req.body[field] === undefined ||
      req.body[field] === null ||
      req.body[field] === ""
    ) {
      errors.push(`O campo ${field} e obrigatorio.`);
    }
  }

  if (
    req.body.id_produto !== undefined &&
    !isPositiveInteger(req.body.id_produto)
  ) {
    errors.push("O campo id_produto deve ser um inteiro positivo.");
  }

  if (req.body.id_loja !== undefined && !isPositiveInteger(req.body.id_loja)) {
    errors.push("O campo id_loja deve ser um inteiro positivo.");
  }

  if (
    req.body.quantidade !== undefined &&
    !isNonNegativeInteger(req.body.quantidade)
  ) {
    errors.push(
      "O campo quantidade deve ser um inteiro maior ou igual a zero.",
    );
  }

  const preco = Number(req.body.preco);
  if (req.body.preco !== undefined && (Number.isNaN(preco) || preco < 0)) {
    errors.push("O campo preco deve ser um numero maior ou igual a zero.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.id_produto = Number(req.body.id_produto);
  req.body.id_loja = Number(req.body.id_loja);
  req.body.quantidade = Number(req.body.quantidade);
  req.body.preco = Number(req.body.preco);

  return next();
};

/**
 * Valida o body para atualização parcial de uma relação produto-loja.
 * Rejeita campos não permitidos e exige pelo menos um campo válido.
 * Aplica as mesmas regras de tipo que `validateCreateStoreProduct`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateUpdateStoreProduct = (req, res, next) => {
  const allowedFields = ["id_produto", "id_loja", "quantidade", "preco"];
  const keys = Object.keys(req.body);
  const errors = [];

  if (keys.length === 0) {
    errors.push("Envie pelo menos um campo para atualizacao.");
  }

  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      errors.push(`O campo ${key} nao e permitido na atualizacao.`);
    }
  }

  if (
    req.body.id_produto !== undefined &&
    !isPositiveInteger(req.body.id_produto)
  ) {
    errors.push("O campo id_produto deve ser um inteiro positivo.");
  }

  if (req.body.id_loja !== undefined && !isPositiveInteger(req.body.id_loja)) {
    errors.push("O campo id_loja deve ser um inteiro positivo.");
  }

  if (
    req.body.quantidade !== undefined &&
    !isNonNegativeInteger(req.body.quantidade)
  ) {
    errors.push(
      "O campo quantidade deve ser um inteiro maior ou igual a zero.",
    );
  }

  if (req.body.preco !== undefined) {
    const preco = Number(req.body.preco);
    if (Number.isNaN(preco) || preco < 0) {
      errors.push("O campo preco deve ser um numero maior ou igual a zero.");
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.id_produto !== undefined)
    req.body.id_produto = Number(req.body.id_produto);
  if (req.body.id_loja !== undefined)
    req.body.id_loja = Number(req.body.id_loja);
  if (req.body.quantidade !== undefined)
    req.body.quantidade = Number(req.body.quantidade);
  if (req.body.preco !== undefined) req.body.preco = Number(req.body.preco);

  return next();
};

module.exports = {
  validateStoreProductIdParam,
  validateCreateStoreProduct,
  validateUpdateStoreProduct,
};
