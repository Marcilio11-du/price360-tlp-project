const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    data: null,
    message: 'Falha de validacao dos dados enviados.',
    details: errors
  });
};

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

const validateStoreLinkIdParam = (req, res, next) => {
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

const validateCreateStoreLink = (req, res, next) => {
  const errors = [];

  if (req.body.link === undefined || req.body.link === null || req.body.link === '') {
    if (req.body.link === '') {
      errors.push('O campo link nao pode ser uma string vazia.');
    } else {
      errors.push('O campo link e obrigatorio.');
    }
  } else if (typeof req.body.link === 'string' && req.body.link.trim() === '') {
    errors.push('O campo link nao pode ser uma string vazia.');
  } else if (!urlRegex.test(String(req.body.link).trim())) {
    errors.push('O campo link deve conter um URL valido (ex: https://loja.pt).');
  }

  if (req.body.id_loja === undefined || req.body.id_loja === null || req.body.id_loja === '') {
    errors.push('O campo id_loja e obrigatorio.');
  } else if (!isPositiveInteger(req.body.id_loja)) {
    errors.push('O campo id_loja deve ser um inteiro positivo.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.link = String(req.body.link).trim();
  req.body.id_loja = Number(req.body.id_loja);

  return next();
};

const validateUpdateStoreLink = (req, res, next) => {
  const allowedFields = ['link', 'id_loja'];
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

  if (req.body.link !== undefined) {
    if (req.body.link === null || req.body.link === '') {
      errors.push('O campo link nao pode ser uma string vazia.');
    } else if (typeof req.body.link === 'string' && req.body.link.trim() === '') {
      errors.push('O campo link nao pode ser uma string vazia.');
    } else if (!urlRegex.test(String(req.body.link).trim())) {
      errors.push('O campo link deve conter um URL valido (ex: https://loja.pt).');
    }
  }

  if (req.body.id_loja !== undefined && !isPositiveInteger(req.body.id_loja)) {
    errors.push('O campo id_loja deve ser um inteiro positivo.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.link !== undefined) req.body.link = String(req.body.link).trim();
  if (req.body.id_loja !== undefined) req.body.id_loja = Number(req.body.id_loja);

  return next();
};

module.exports = {
  validateStoreLinkIdParam,
  validateStoreIdParam,
  validateCreateStoreLink,
  validateUpdateStoreLink
};
