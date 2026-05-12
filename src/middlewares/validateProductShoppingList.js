const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    data: null,
    message: 'Falha de validacao dos dados enviados.',
    details: errors
  });
};

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const validateProductShoppingListIdParam = (req, res, next) => {
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

const validateListIdParam = (req, res, next) => {
  const listId = Number(req.params.listId);

  if (!Number.isInteger(listId) || listId <= 0) {
    return res.status(400).json({
      status: 'error',
      data: null,
      message: 'Parametro listId invalido. Utilize um inteiro positivo.'
    });
  }

  req.params.listId = listId;
  return next();
};

const validateProductIdParam = (req, res, next) => {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      status: 'error',
      data: null,
      message: 'Parametro productId invalido. Utilize um inteiro positivo.'
    });
  }

  req.params.productId = productId;
  return next();
};

const validateCreateProductShoppingList = (req, res, next) => {
  const requiredFields = ['id_lista', 'id_produto'];
  const errors = [];

  for (const field of requiredFields) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
      errors.push(`O campo ${field} e obrigatorio.`);
    }
  }

  if (req.body.id_lista !== undefined && !isPositiveInteger(req.body.id_lista)) {
    errors.push('O campo id_lista deve ser um inteiro positivo.');
  }

  if (req.body.id_produto !== undefined && !isPositiveInteger(req.body.id_produto)) {
    errors.push('O campo id_produto deve ser um inteiro positivo.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.id_lista = Number(req.body.id_lista);
  req.body.id_produto = Number(req.body.id_produto);

  return next();
};

const validateUpdateProductShoppingList = (req, res, next) => {
  const allowedFields = ['id_lista', 'id_produto'];
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

  if (req.body.id_lista !== undefined && !isPositiveInteger(req.body.id_lista)) {
    errors.push('O campo id_lista deve ser um inteiro positivo.');
  }

  if (req.body.id_produto !== undefined && !isPositiveInteger(req.body.id_produto)) {
    errors.push('O campo id_produto deve ser um inteiro positivo.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.id_lista !== undefined) req.body.id_lista = Number(req.body.id_lista);
  if (req.body.id_produto !== undefined) req.body.id_produto = Number(req.body.id_produto);

  return next();
};

module.exports = {
  validateProductShoppingListIdParam,
  validateListIdParam,
  validateProductIdParam,
  validateCreateProductShoppingList,
  validateUpdateProductShoppingList
};
