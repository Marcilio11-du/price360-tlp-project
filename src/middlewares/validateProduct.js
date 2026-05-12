const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    data: null,
    message: 'Falha de validacao dos dados enviados.',
    details: errors
  });
};

const isValidDate = (value) => !Number.isNaN(Date.parse(value));

const validateProductIdParam = (req, res, next) => {
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

const validateCreateProduct = (req, res, next) => {
  const requiredFields = ['nome', 'marca', 'id_categoria'];
  const errors = [];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      errors.push(`O campo ${field} e obrigatorio.`);
    }
  }

  if (req.body.id_categoria) {
    const categoryId = Number(req.body.id_categoria);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      errors.push('O campo id_categoria deve ser um inteiro positivo.');
    }
  }

  if (req.body.data_validade && !isValidDate(req.body.data_validade)) {
    errors.push('O campo data_validade deve estar em formato de data valido.');
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

const validateUpdateProduct = (req, res, next) => {
  const allowedFields = ['nome', 'marca', 'data_validade', 'descricao', 'id_categoria'];
  const keys = Object.keys(req.body);
  const errors = [];

  if (keys.length === 0) {
    errors.push('Envie pelo menos um campo para atualizacao.');
  }

  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      errors.push(`O campo ${key} nao e permitido na atualizacao.`);
    }
  }

  if (req.body.id_categoria !== undefined) {
    const categoryId = Number(req.body.id_categoria);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      errors.push('O campo id_categoria deve ser um inteiro positivo.');
    }
  }

  if (req.body.data_validade && !isValidDate(req.body.data_validade)) {
    errors.push('O campo data_validade deve estar em formato de data valido.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.nome) req.body.nome = String(req.body.nome).trim();
  if (req.body.marca) req.body.marca = String(req.body.marca).trim();
  if (req.body.descricao) req.body.descricao = String(req.body.descricao).trim();
  if (req.body.id_categoria !== undefined) req.body.id_categoria = Number(req.body.id_categoria);

  return next();
};

module.exports = {
  validateProductIdParam,
  validateCreateProduct,
  validateUpdateProduct
};
