/**
 * @module validateProductShoppingList
 * @description Middlewares de validação de entrada para os endpoints da
 * tabela `Lista_compras_Produto`. Valida parâmetros de rota e campos do body
 * antes de os handlers do controller serem invocados.
 */

/**
 * Envia uma resposta de erro de validação com status 400.
 * @param {import('express').Response} res - Objeto de resposta do Express.
 * @param {string[]} errors - Lista de mensagens de erro.
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
 * Aceita números ou strings numéricas para compatibilidade com dados de formulário.
 * @param {*} value - Valor a verificar.
 * @returns {boolean}
 */
const isPositiveInteger = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

// --- Validadores de parâmetros de rota ---

/**
 * Valida e normaliza o parâmetro de rota `:id`.
 * Converte a string para número e rejeita valores não inteiros ou não positivos.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateProductShoppingListIdParam = (req, res, next) => {
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

/**
 * Valida e normaliza o parâmetro de rota `:listId`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateListIdParam = (req, res, next) => {
  const listId = Number(req.params.listId);

  if (!Number.isInteger(listId) || listId <= 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Parametro listId invalido. Utilize um inteiro positivo.",
    });
  }

  req.params.listId = listId;
  return next();
};

/**
 * Valida e normaliza o parâmetro de rota `:productId`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateProductIdParam = (req, res, next) => {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Parametro productId invalido. Utilize um inteiro positivo.",
    });
  }

  req.params.productId = productId;
  return next();
};

// --- Validadores de body ---

/**
 * Valida o body para criação de uma associação lista-produto.
 * Os campos `id_lista` e `id_produto` são obrigatórios e devem ser inteiros positivos.
 * Após validação, normaliza ambos para Number.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateCreateProductShoppingList = (req, res, next) => {
  const requiredFields = ["id_lista", "id_produto"];
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
    req.body.id_lista !== undefined &&
    !isPositiveInteger(req.body.id_lista)
  ) {
    errors.push("O campo id_lista deve ser um inteiro positivo.");
  }

  if (
    req.body.id_produto !== undefined &&
    !isPositiveInteger(req.body.id_produto)
  ) {
    errors.push("O campo id_produto deve ser um inteiro positivo.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.id_lista = Number(req.body.id_lista);
  req.body.id_produto = Number(req.body.id_produto);

  return next();
};

/**
 * Valida o body para atualização parcial de uma associação lista-produto.
 * Rejeita campos não permitidos e exige pelo menos um campo válido.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateUpdateProductShoppingList = (req, res, next) => {
  const allowedFields = ["id_lista", "id_produto"];
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
    req.body.id_lista !== undefined &&
    !isPositiveInteger(req.body.id_lista)
  ) {
    errors.push("O campo id_lista deve ser um inteiro positivo.");
  }

  if (
    req.body.id_produto !== undefined &&
    !isPositiveInteger(req.body.id_produto)
  ) {
    errors.push("O campo id_produto deve ser um inteiro positivo.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.id_lista !== undefined)
    req.body.id_lista = Number(req.body.id_lista);
  if (req.body.id_produto !== undefined)
    req.body.id_produto = Number(req.body.id_produto);

  return next();
};

module.exports = {
  validateProductShoppingListIdParam,
  validateListIdParam,
  validateProductIdParam,
  validateCreateProductShoppingList,
  validateUpdateProductShoppingList,
};
