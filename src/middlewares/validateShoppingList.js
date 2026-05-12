/**
 * @module validateShoppingList
 * @description Middlewares de validação de entrada para os endpoints da
 * tabela `Lista_compras`. Valida parâmetros de rota e campos do body
 * antes de os handlers do controller serem invocados.
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
 * Aceita números ou strings numéricas para compatibilidade com dados de formulário.
 * @param {*} value - Valor a verificar.
 * @returns {boolean}
 */
const isPositiveInteger = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

// --- Validadores de parâmetros de rota ---

/**
 * Valida e normaliza o parâmetro de rota `:id`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateShoppingListIdParam = (req, res, next) => {
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
 * Valida e normaliza o parâmetro de rota `:clientId`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateClientIdParam = (req, res, next) => {
  const clientId = Number(req.params.clientId);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Parametro clientId invalido. Utilize um inteiro positivo.",
    });
  }

  req.params.clientId = clientId;
  return next();
};

// --- Validadores de body ---

/**
 * Valida o body para criação de uma lista de compras.
 * Os campos `nome` e `id_cliente` são obrigatórios.
 * O campo `descricao` é opcional e normalizado para null se vazio.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateCreateShoppingList = (req, res, next) => {
  const errors = [];

  if (!req.body.nome) {
    errors.push("O campo nome e obrigatorio.");
  }

  if (
    req.body.id_cliente === undefined ||
    req.body.id_cliente === null ||
    req.body.id_cliente === ""
  ) {
    errors.push("O campo id_cliente e obrigatorio.");
  }

  if (
    req.body.nome !== undefined &&
    String(req.body.nome).trim().length === 0
  ) {
    errors.push("O campo nome nao pode ser uma string vazia.");
  }

  if (
    req.body.id_cliente !== undefined &&
    req.body.id_cliente !== null &&
    req.body.id_cliente !== ""
  ) {
    if (!isPositiveInteger(req.body.id_cliente)) {
      errors.push("O campo id_cliente deve ser um inteiro positivo.");
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.nome = String(req.body.nome).trim();
  req.body.id_cliente = Number(req.body.id_cliente);
  if (req.body.descricao !== undefined) {
    req.body.descricao = String(req.body.descricao).trim() || null;
  }

  return next();
};

/**
 * Valida o body para atualização parcial de uma lista de compras.
 * Rejeita campos não permitidos e exige pelo menos um campo válido.
 * O campo `descricao` é normalizado para null se vier como string vazia.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateUpdateShoppingList = (req, res, next) => {
  const allowedFields = ["nome", "descricao", "id_cliente"];
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
    req.body.nome !== undefined &&
    String(req.body.nome).trim().length === 0
  ) {
    errors.push("O campo nome nao pode ser uma string vazia.");
  }

  if (
    req.body.id_cliente !== undefined &&
    !isPositiveInteger(req.body.id_cliente)
  ) {
    errors.push("O campo id_cliente deve ser um inteiro positivo.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.nome !== undefined) req.body.nome = String(req.body.nome).trim();
  if (req.body.id_cliente !== undefined)
    req.body.id_cliente = Number(req.body.id_cliente);
  if (req.body.descricao !== undefined) {
    req.body.descricao = String(req.body.descricao).trim() || null;
  }

  return next();
};

module.exports = {
  validateShoppingListIdParam,
  validateClientIdParam,
  validateCreateShoppingList,
  validateUpdateShoppingList,
};
