const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    data: null,
    message: 'Falha de validacao dos dados enviados.',
    details: errors
  });
};

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const phoneRegex = /^\+?[0-9\s\-().]{6,20}$/;

const validateStorePhoneIdParam = (req, res, next) => {
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

const validateStoreIdParam = (req, res, next) => {
  const storeId = Number(req.params.storeId);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return res.status(400).json({
      status: 'error',
      data: null,
      message: 'Parametro storeId invalido. Utilize um inteiro positivo.'
    });
  }

  req.params.storeId = storeId;
  return next();
};

const validateCreateStorePhone = (req, res, next) => {
  const errors = [];

  if (req.body.n_telefone === undefined || req.body.n_telefone === null || req.body.n_telefone === '') {
    if (req.body.n_telefone === '') {
      errors.push('O campo n_telefone nao pode ser uma string vazia.');
    } else {
      errors.push('O campo n_telefone e obrigatorio.');
    }
  } else if (typeof req.body.n_telefone === 'string' && req.body.n_telefone.trim() === '') {
    errors.push('O campo n_telefone nao pode ser uma string vazia.');
  } else if (!phoneRegex.test(String(req.body.n_telefone).trim())) {
    errors.push('O campo n_telefone deve conter um formato valido (ex: +351912345678).');
  }

  if (req.body.id_loja === undefined || req.body.id_loja === null || req.body.id_loja === '') {
    errors.push('O campo id_loja e obrigatorio.');
  } else if (!isPositiveInteger(req.body.id_loja)) {
    errors.push('O campo id_loja deve ser um inteiro positivo.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.n_telefone = String(req.body.n_telefone).trim();
  req.body.id_loja = Number(req.body.id_loja);

  return next();
};

const validateUpdateStorePhone = (req, res, next) => {
  const allowedFields = ['n_telefone', 'id_loja'];
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

  if (req.body.n_telefone !== undefined) {
    if (req.body.n_telefone === null || req.body.n_telefone === '') {
      errors.push('O campo n_telefone nao pode ser uma string vazia.');
    } else if (typeof req.body.n_telefone === 'string' && req.body.n_telefone.trim() === '') {
      errors.push('O campo n_telefone nao pode ser uma string vazia.');
    } else if (!phoneRegex.test(String(req.body.n_telefone).trim())) {
      errors.push('O campo n_telefone deve conter um formato valido (ex: +351912345678).');
    }
  }

  if (req.body.id_loja !== undefined && !isPositiveInteger(req.body.id_loja)) {
    errors.push('O campo id_loja deve ser um inteiro positivo.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.n_telefone !== undefined) req.body.n_telefone = String(req.body.n_telefone).trim();
  if (req.body.id_loja !== undefined) req.body.id_loja = Number(req.body.id_loja);

  return next();
};

module.exports = {
  validateStorePhoneIdParam,
  validateStoreIdParam,
  validateCreateStorePhone,
  validateUpdateStorePhone
};
