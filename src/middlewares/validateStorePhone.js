/**
 * @module validateStorePhone
 * @description Middlewares de validação de entrada para os endpoints da
 * tabela `Telefone_Loja`. Valida parâmetros de rota e campos do body,
 * incluindo o formato do número de telefone.
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
 * @param {*} value
 * @returns {boolean}
 */
const isPositiveInteger = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

/**
 * Expressão regular para validação de números de telefone.
 * Aceita:
 *  - Prefixo internacional opcional com `+` (ex.: +351)
 *  - Dígitos, espaços, traços, parênteses e pontos
 *  - Entre 6 a 20 caracteres no total
 * Exemplos válidos: +351912345678, 912 345 678, (21) 123-4567
 */
const phoneRegex = /^\+?[0-9\s\-().]{6,20}$/;

// --- Validadores de parâmetros de rota ---

/**
 * Valida e normaliza o parâmetro de rota `:id`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateStorePhoneIdParam = (req, res, next) => {
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
 * Valida e normaliza o parâmetro de rota `:storeId`.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateStoreIdParam = (req, res, next) => {
  const storeId = Number(req.params.storeId);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Parametro storeId invalido. Utilize um inteiro positivo.",
    });
  }

  req.params.storeId = storeId;
  return next();
};

// --- Validadores de body ---

/**
 * Valida o body para criação de um telefone de loja.
 * O campo `n_telefone` é obrigatório e deve passar na `phoneRegex`.
 * O campo `id_loja` é obrigatório e deve ser um inteiro positivo.
 * Após validação, normaliza os campos (trim em n_telefone, Number em id_loja).
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateCreateStorePhone = (req, res, next) => {
  const errors = [];

  if (
    req.body.n_telefone === undefined ||
    req.body.n_telefone === null ||
    req.body.n_telefone === ""
  ) {
    if (req.body.n_telefone === "") {
      errors.push("O campo n_telefone nao pode ser uma string vazia.");
    } else {
      errors.push("O campo n_telefone e obrigatorio.");
    }
  } else if (
    typeof req.body.n_telefone === "string" &&
    req.body.n_telefone.trim() === ""
  ) {
    errors.push("O campo n_telefone nao pode ser uma string vazia.");
  } else if (!phoneRegex.test(String(req.body.n_telefone).trim())) {
    errors.push(
      "O campo n_telefone deve conter um formato valido (ex: +351912345678).",
    );
  }

  if (
    req.body.id_loja === undefined ||
    req.body.id_loja === null ||
    req.body.id_loja === ""
  ) {
    errors.push("O campo id_loja e obrigatorio.");
  } else if (!isPositiveInteger(req.body.id_loja)) {
    errors.push("O campo id_loja deve ser um inteiro positivo.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.n_telefone = String(req.body.n_telefone).trim();
  req.body.id_loja = Number(req.body.id_loja);

  return next();
};

/**
 * Valida o body para atualização parcial de um telefone de loja.
 * Rejeita campos não permitidos e exige pelo menos um campo válido.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateUpdateStorePhone = (req, res, next) => {
  const allowedFields = ["n_telefone", "id_loja"];
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

  if (req.body.n_telefone !== undefined) {
    if (req.body.n_telefone === null || req.body.n_telefone === "") {
      errors.push("O campo n_telefone nao pode ser uma string vazia.");
    } else if (
      typeof req.body.n_telefone === "string" &&
      req.body.n_telefone.trim() === ""
    ) {
      errors.push("O campo n_telefone nao pode ser uma string vazia.");
    } else if (!phoneRegex.test(String(req.body.n_telefone).trim())) {
      errors.push(
        "O campo n_telefone deve conter um formato valido (ex: +351912345678).",
      );
    }
  }

  if (req.body.id_loja !== undefined && !isPositiveInteger(req.body.id_loja)) {
    errors.push("O campo id_loja deve ser um inteiro positivo.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.n_telefone !== undefined)
    req.body.n_telefone = String(req.body.n_telefone).trim();
  if (req.body.id_loja !== undefined)
    req.body.id_loja = Number(req.body.id_loja);

  return next();
};

module.exports = {
  validateStorePhoneIdParam,
  validateStoreIdParam,
  validateCreateStorePhone,
  validateUpdateStorePhone,
};
