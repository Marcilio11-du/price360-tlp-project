// ---------------------------------------------------------------------------
// Helpers locais
// ---------------------------------------------------------------------------

/**
 * Envia uma resposta de erro de validação padronizada (HTTP 400).
 * @param {import('express').Response} res - Objeto de resposta Express.
 * @param {string[]} errors - Lista de mensagens de erro de validação.
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
 * Verifica se um valor é um inteiro positivo.
 * Aceita números e strings numéricas.
 * @param {*} value - Valor a verificar.
 * @returns {boolean} True se o valor for um inteiro positivo.
 */
const isPositiveInteger = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

// ---------------------------------------------------------------------------
// Validadores exportados
// ---------------------------------------------------------------------------

/**
 * Valida o parâmetro de rota `:id`, garantindo que é um inteiro positivo.
 * Converte req.params.id para número após validação.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateCategoryIdParam = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: 'error',
      data: null,
      message: 'Parametro id invalido. Utilize um inteiro positivo.'
    });
  }

  req.params.id = id;
  return next();
};

/**
 * Valida o body para criação de uma categoria.
 * - `nome`: obrigatório, string não vazia; é normalizado com trim().
 * - `descricao`: opcional; se presente, é normalizado com trim() ou convertido
 *   para null caso resulte em string vazia.
 * Campos extra não são permitidos.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateCreateCategory = (req, res, next) => {
  const errors = [];

  // --- validação de "nome" ---
  if (req.body.nome === undefined || req.body.nome === null) {
    errors.push('O campo nome e obrigatorio.');
  } else if (typeof req.body.nome !== 'string' || req.body.nome.trim() === '') {
    errors.push('O campo nome nao pode ser uma string vazia.');
  }

  // --- validação de "descricao" (opcional) ---
  if (req.body.descricao !== undefined && req.body.descricao !== null) {
    if (typeof req.body.descricao !== 'string') {
      errors.push('O campo descricao deve ser uma string.');
    }
    // String vazia é aceite (será convertida para null na normalização)
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Normalização
  req.body.nome = req.body.nome.trim();

  if (req.body.descricao !== undefined && req.body.descricao !== null) {
    const trimmed = req.body.descricao.trim();
    // String vazia após trim → null (sem descrição)
    req.body.descricao = trimmed === '' ? null : trimmed;
  }

  return next();
};

/**
 * Valida o body para atualização de uma categoria.
 * - Deve conter pelo menos um dos campos permitidos: `nome`, `descricao`.
 * - Não são permitidos campos fora desta lista.
 * - Se `nome` estiver presente, não pode ser uma string vazia.
 * - Normaliza os campos presentes com trim().
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateUpdateCategory = (req, res, next) => {
  const allowedFields = ['nome', 'descricao'];
  const keys = Object.keys(req.body);
  const errors = [];

  // Pelo menos um campo tem de ser enviado
  if (keys.length === 0) {
    errors.push('Envie pelo menos um campo para atualizacao.');
  }

  // Nenhum campo extra é permitido
  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      errors.push(`O campo ${key} nao e permitido na atualizacao.`);
    }
  }

  // Validação de "nome" (se presente)
  if (req.body.nome !== undefined) {
    if (req.body.nome === null || typeof req.body.nome !== 'string' || req.body.nome.trim() === '') {
      errors.push('O campo nome nao pode ser uma string vazia.');
    }
  }

  // Validação de "descricao" (se presente) — pode ser null ou string
  if (req.body.descricao !== undefined && req.body.descricao !== null) {
    if (typeof req.body.descricao !== 'string') {
      errors.push('O campo descricao deve ser uma string.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Normalização dos campos presentes
  if (req.body.nome !== undefined) {
    req.body.nome = req.body.nome.trim();
  }

  if (req.body.descricao !== undefined && req.body.descricao !== null) {
    const trimmed = req.body.descricao.trim();
    // String vazia após trim → null
    req.body.descricao = trimmed === '' ? null : trimmed;
  }

  return next();
};

module.exports = {
  validateCategoryIdParam,
  validateCreateCategory,
  validateUpdateCategory
};
