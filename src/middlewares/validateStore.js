/**
 * Envia uma resposta de erro de validação padronizada (HTTP 400).
 *
 * @param {import('express').Response} res    - Objecto de resposta Express.
 * @param {string[]}                   errors - Lista de mensagens de erro.
 */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    data: null,
    message: 'Falha de validacao dos dados enviados.',
    details: errors
  });
};

/**
 * Verifica se um valor é um inteiro positivo (aceita strings numéricas).
 *
 * @param {*} value - Valor a verificar.
 * @returns {boolean}
 */
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

/** Regex de validação de e-mail (formato básico). */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Regex de NIF português — exactamente 9 dígitos numéricos. */
const nifRegex = /^\d{9}$/;

/**
 * Middleware que valida e converte o parâmetro de rota `:id` para inteiro positivo.
 * Rejeita com 400 se o valor não for um inteiro positivo válido.
 */
const validateStoreIdParam = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: 'error',
      data: null,
      message: 'Parametro id invalido. Utilize um inteiro positivo.'
    });
  }

  // Sobrescreve o param com o valor numérico já convertido
  req.params.id = id;
  return next();
};

/**
 * Middleware que valida o corpo de um pedido de criação de loja.
 *
 * Campos obrigatórios: nif, nome, endereco, municipio, email.
 * - nif     : 9 dígitos numéricos (/^\d{9}$/)
 * - email   : formato válido (/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
 * - restantes: strings não vazias após trim()
 *
 * Normaliza todos os campos com .trim() antes de passar ao handler.
 */
const validateCreateStore = (req, res, next) => {
  const errors = [];
  const requiredFields = ['nif', 'nome', 'endereco', 'municipio', 'email'];

  // Verificar presença e não-vacuidade de todos os campos obrigatórios
  for (const field of requiredFields) {
    const val = req.body[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      errors.push(`O campo ${field} e obrigatorio.`);
    }
  }

  // Devolver logo se faltar algum campo — evita validações adicionais com undefined
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Validação do formato do NIF (9 dígitos numéricos)
  if (!nifRegex.test(String(req.body.nif).trim())) {
    errors.push('O campo nif deve conter 9 digitos numericos.');
  }

  // Validação do formato do e-mail
  if (!emailRegex.test(String(req.body.email).trim())) {
    errors.push('O campo email deve conter um formato valido.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Normalizar todos os campos com trim()
  req.body.nif      = String(req.body.nif).trim();
  req.body.nome     = String(req.body.nome).trim();
  req.body.endereco = String(req.body.endereco).trim();
  req.body.municipio = String(req.body.municipio).trim();
  req.body.email    = String(req.body.email).trim();

  return next();
};

/**
 * Middleware que valida o corpo de um pedido de actualização de loja.
 *
 * Campos permitidos: nif, nome, endereco, municipio, email.
 * - Pelo menos um campo deve ser enviado.
 * - Campos não reconhecidos são rejeitados.
 * - Mesmas validações individuais do create, quando o campo está presente.
 * - Normaliza os campos presentes com .trim().
 */
const validateUpdateStore = (req, res, next) => {
  const allowedFields = ['nif', 'nome', 'endereco', 'municipio', 'email'];
  const keys = Object.keys(req.body);
  const errors = [];

  // Pelo menos um campo deve ser enviado
  if (keys.length === 0) {
    errors.push('Envie pelo menos um campo para atualizacao.');
  }

  // Rejeitar campos não permitidos
  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      errors.push(`O campo ${key} nao e permitido na atualizacao.`);
    }
  }

  // Validações individuais — só quando o campo está presente no body
  if (req.body.nif !== undefined) {
    if (String(req.body.nif).trim() === '') {
      errors.push('O campo nif nao pode ser uma string vazia.');
    } else if (!nifRegex.test(String(req.body.nif).trim())) {
      // NIF presente mas com formato inválido
      errors.push('O campo nif deve conter 9 digitos numericos.');
    }
  }

  if (req.body.nome !== undefined && String(req.body.nome).trim() === '') {
    errors.push('O campo nome nao pode ser uma string vazia.');
  }

  if (req.body.endereco !== undefined && String(req.body.endereco).trim() === '') {
    errors.push('O campo endereco nao pode ser uma string vazia.');
  }

  if (req.body.municipio !== undefined && String(req.body.municipio).trim() === '') {
    errors.push('O campo municipio nao pode ser uma string vazia.');
  }

  if (req.body.email !== undefined) {
    if (String(req.body.email).trim() === '') {
      errors.push('O campo email nao pode ser uma string vazia.');
    } else if (!emailRegex.test(String(req.body.email).trim())) {
      // E-mail presente mas com formato inválido
      errors.push('O campo email deve conter um formato valido.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Normalizar apenas os campos presentes
  if (req.body.nif      !== undefined) req.body.nif      = String(req.body.nif).trim();
  if (req.body.nome     !== undefined) req.body.nome     = String(req.body.nome).trim();
  if (req.body.endereco !== undefined) req.body.endereco = String(req.body.endereco).trim();
  if (req.body.municipio !== undefined) req.body.municipio = String(req.body.municipio).trim();
  if (req.body.email    !== undefined) req.body.email    = String(req.body.email).trim();

  return next();
};

module.exports = {
  validateStoreIdParam,
  validateCreateStore,
  validateUpdateStore
};
