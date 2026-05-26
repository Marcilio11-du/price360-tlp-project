/**
 * @module validateUser
 * @description Middlewares de validação e normalização para os endpoints de utilizadores.
 * Cada middleware verifica a conformidade dos dados de entrada e normaliza valores
 * (trim, lowercase, expansão de abreviaturas) antes de passarem ao controller.
 */

/** Valores aceites para o campo `genero` (antes e após normalização). */
const allowedGenderValues = ["masculino", "feminino", "outro", "m", "f"];
/** Valores aceites para o campo `role`. */
const allowedRoleValues = ["user", "admin"];

/** Expressão regular para validação básica de formato de email. */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * Normaliza o valor do género: converte para minúsculas, remove espaços
 * e expande abreviaturas ('m' → 'masculino', 'f' → 'feminino').
 * Desta forma, a BD recebe sempre o valor por extenso.
 *
 * @param {string} value - Valor bruto do campo `genero`.
 * @returns {string} Valor normalizado.
 */
const normalizeGender = (value) => {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "m") return "masculino";
  if (normalized === "f") return "feminino";
  return normalized;
};

/**
 * Normaliza o valor do papel (role): converte para minúsculas e remove espaços.
 *
 * @param {string} value - Valor bruto do campo `role`.
 * @returns {string} Valor normalizado.
 */
const normalizeRole = (value) => String(value).trim().toLowerCase();

// --- Middlewares de parâmetros de rota ---

/**
 * Valida o parâmetro de rota `:id`, garantindo que é um inteiro positivo.
 * Em caso de sucesso, substitui `req.params.id` pelo valor numérico já convertido.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const validateUserIdParam = (req, res, next) => {
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
 * Valida o corpo do pedido para criação de utilizador.
 * Verifica campos obrigatórios, formato de email, comprimento da palavra-passe,
 * formato de data, e valores permitidos para `genero` e `role`.
 * Em caso de sucesso, normaliza os campos do body antes de chamar `next()`.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const validateCreateUser = (req, res, next) => {
  const requiredFields = [
    "p_nome",
    "u_nome",
    "rua",
    "municipio",
    "email",
    "data_nascimento",
    "palavra_passe",
    "genero",
  ];

  const errors = [];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      errors.push(`O campo ${field} e obrigatorio.`);
    }
  }

  if (
    req.body.email &&
    !emailRegex.test(String(req.body.email).trim().toLowerCase())
  ) {
    errors.push("O campo email deve conter um formato valido.");
  }

  if (req.body.palavra_passe && String(req.body.palavra_passe).length < 8) {
    errors.push("A palavra_passe deve conter no minimo 8 caracteres.");
  }

  if (
    req.body.data_nascimento &&
    Number.isNaN(Date.parse(req.body.data_nascimento))
  ) {
    errors.push(
      "O campo data_nascimento deve estar no formato de data valido.",
    );
  }

  if (req.body.genero) {
    const normalizedGender = normalizeGender(req.body.genero);
    if (!allowedGenderValues.includes(normalizedGender)) {
      errors.push("O campo genero deve ser: masculino, feminino ou outro.");
    }
  }

  if (req.body.role) {
    const normalizedRole = normalizeRole(req.body.role);
    if (!allowedRoleValues.includes(normalizedRole)) {
      errors.push("O campo role deve ser user ou admin.");
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.p_nome = String(req.body.p_nome).trim();
  req.body.u_nome = String(req.body.u_nome).trim();
  req.body.rua = String(req.body.rua).trim();
  req.body.municipio = String(req.body.municipio).trim();
  req.body.email = String(req.body.email).trim().toLowerCase();
  req.body.genero = normalizeGender(req.body.genero);
  req.body.role = req.body.role ? normalizeRole(req.body.role) : "user";

  return next();
};

/**
 * Valida o corpo do pedido para actualização parcial de utilizador.
 * Garante que pelo menos um campo é enviado, que apenas campos permitidos
 * estão presentes, e aplica as mesmas validações de formato do `validateCreateUser`.
 * Em caso de sucesso, normaliza os campos presentes antes de chamar `next()`.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const validateUpdateUser = (req, res, next) => {
  const allowedFields = [
    "p_nome",
    "u_nome",
    "rua",
    "municipio",
    "email",
    "data_nascimento",
    "palavra_passe",
    "genero",
    "role",
    "municipio_preferencial",
    "avatar_path",
  ];

  const bodyKeys = Object.keys(req.body);
  const errors = [];

  if (bodyKeys.length === 0) {
    errors.push("Envie pelo menos um campo para atualizacao.");
  }

  for (const key of bodyKeys) {
    if (!allowedFields.includes(key)) {
      errors.push(`O campo ${key} nao e permitido na atualizacao.`);
    }
  }

  if (
    req.body.email &&
    !emailRegex.test(String(req.body.email).trim().toLowerCase())
  ) {
    errors.push("O campo email deve conter um formato valido.");
  }

  if (req.body.palavra_passe && String(req.body.palavra_passe).length < 8) {
    errors.push("A palavra_passe deve conter no minimo 8 caracteres.");
  }

  if (
    req.body.data_nascimento &&
    Number.isNaN(Date.parse(req.body.data_nascimento))
  ) {
    errors.push(
      "O campo data_nascimento deve estar no formato de data valido.",
    );
  }

  if (req.body.genero) {
    const normalizedGender = normalizeGender(req.body.genero);
    if (!allowedGenderValues.includes(normalizedGender)) {
      errors.push("O campo genero deve ser: masculino, feminino ou outro.");
    }
  }

  if (req.body.role) {
    const normalizedRole = normalizeRole(req.body.role);
    if (!allowedRoleValues.includes(normalizedRole)) {
      errors.push("O campo role deve ser user ou admin.");
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Normalização aplicada apenas aos campos presentes — campos ausentes
  // não são tocados para não introduzir valores indesejados no payload.
  if (req.body.p_nome) req.body.p_nome = String(req.body.p_nome).trim();
  if (req.body.u_nome) req.body.u_nome = String(req.body.u_nome).trim();
  if (req.body.rua) req.body.rua = String(req.body.rua).trim();
  if (req.body.municipio)
    req.body.municipio = String(req.body.municipio).trim();
  if (req.body.email)
    req.body.email = String(req.body.email).trim().toLowerCase();
  if (req.body.genero) req.body.genero = normalizeGender(req.body.genero);
  if (req.body.role) req.body.role = normalizeRole(req.body.role);

  return next();
};

module.exports = {
  validateUserIdParam,
  validateCreateUser,
  validateUpdateUser,
};
