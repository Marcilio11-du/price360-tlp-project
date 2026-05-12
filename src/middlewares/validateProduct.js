/**
 * @module validateProduct
 * @description Middlewares de validação e normalização para os endpoints de produtos.
 * Garante que os dados recebidos respeitam o schema da tabela `Produto`
 * antes de chegarem ao controller.
 */

/**
 * Envia uma resposta 400 com a lista de erros de validação.
 *
 * @param {import('express').Response} res    - Objecto de resposta Express.
 * @param {string[]}                   errors - Lista de mensagens de erro.
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
 * Verifica se um valor pode ser interpretado como data válida pelo motor JS.
 *
 * @param {string} value - Valor a validar.
 * @returns {boolean} `true` se a data for válida.
 */
const isValidDate = (value) => !Number.isNaN(Date.parse(value));

// --- Middlewares de parâmetros de rota ---

/**
 * Valida o parâmetro de rota `:id`, garantindo que é um inteiro positivo.
 * Em caso de sucesso, substitui `req.params.id` pelo valor numérico convertido.
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const validateProductIdParam = (req, res, next) => {
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

// --- Middlewares de body ---

/**
 * Valida o corpo do pedido para criação de produto.
 * Campos obrigatórios: `nome`, `marca`, `id_categoria`.
 * Valida também que `id_categoria` é inteiro positivo e que `data_validade`,
 * se presente, tem formato de data válido.
 * Em caso de sucesso, normaliza os campos de texto (trim) e converte `id_categoria`
 * para número antes de chamar `next()`.
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const validateCreateProduct = (req, res, next) => {
  const requiredFields = ["nome", "marca", "id_categoria"];
  const errors = [];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      errors.push(`O campo ${field} e obrigatorio.`);
    }
  }

  if (req.body.id_categoria) {
    const categoryId = Number(req.body.id_categoria);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      errors.push("O campo id_categoria deve ser um inteiro positivo.");
    }
  }

  if (req.body.data_validade && !isValidDate(req.body.data_validade)) {
    errors.push("O campo data_validade deve estar em formato de data valido.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.nome = String(req.body.nome).trim();
  req.body.marca = String(req.body.marca).trim();
  req.body.id_categoria = Number(req.body.id_categoria);

  if (req.body.descricao) {
    req.body.descricao = String(req.body.descricao).trim();
  }

  return next();
};

/**
 * Valida o corpo do pedido para actualização parcial de produto.
 * Garante que pelo menos um campo é enviado e que apenas campos de
 * `allowedFields` estão presentes. Aplica as mesmas validações de
 * `id_categoria` e `data_validade` que a criação.
 * Em caso de sucesso, normaliza os campos presentes antes de chamar `next()`.
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const validateUpdateProduct = (req, res, next) => {
  const allowedFields = [
    "nome",
    "marca",
    "data_validade",
    "descricao",
    "id_categoria",
  ];
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

  if (req.body.id_categoria !== undefined) {
    const categoryId = Number(req.body.id_categoria);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      errors.push("O campo id_categoria deve ser um inteiro positivo.");
    }
  }

  if (req.body.data_validade && !isValidDate(req.body.data_validade)) {
    errors.push("O campo data_validade deve estar em formato de data valido.");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.nome) req.body.nome = String(req.body.nome).trim();
  if (req.body.marca) req.body.marca = String(req.body.marca).trim();
  if (req.body.descricao)
    req.body.descricao = String(req.body.descricao).trim();
  if (req.body.id_categoria !== undefined)
    req.body.id_categoria = Number(req.body.id_categoria);

  return next();
};

module.exports = {
  validateProductIdParam,
  validateCreateProduct,
  validateUpdateProduct,
};
