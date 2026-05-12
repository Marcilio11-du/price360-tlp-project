const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    data: null,
    message: 'Falha de validacao dos dados enviados.',
    details: errors
  });
};

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isNonNegativeInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;

const validateStoreProductIdParam = (req, res, next) => {
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

const validateCreateStoreProduct = (req, res, next) => {
  const requiredFields = ['id_produto', 'id_loja', 'quantidade', 'preco'];
  const errors = [];

  for (const field of requiredFields) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
      errors.push(`O campo ${field} e obrigatorio.`);
    }
  }

  if (req.body.id_produto !== undefined && !isPositiveInteger(req.body.id_produto)) {
    errors.push('O campo id_produto deve ser um inteiro positivo.');
  }

  if (req.body.id_loja !== undefined && !isPositiveInteger(req.body.id_loja)) {
    errors.push('O campo id_loja deve ser um inteiro positivo.');
  }

  if (req.body.quantidade !== undefined && !isNonNegativeInteger(req.body.quantidade)) {
    errors.push('O campo quantidade deve ser um inteiro maior ou igual a zero.');
  }

  const preco = Number(req.body.preco);
  if (req.body.preco !== undefined && (Number.isNaN(preco) || preco < 0)) {
    errors.push('O campo preco deve ser um numero maior ou igual a zero.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.id_produto = Number(req.body.id_produto);
  req.body.id_loja = Number(req.body.id_loja);
  req.body.quantidade = Number(req.body.quantidade);
  req.body.preco = Number(req.body.preco);

  return next();
};

const validateUpdateStoreProduct = (req, res, next) => {
  const allowedFields = ['id_produto', 'id_loja', 'quantidade', 'preco'];
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

  if (req.body.id_produto !== undefined && !isPositiveInteger(req.body.id_produto)) {
    errors.push('O campo id_produto deve ser um inteiro positivo.');
  }

  if (req.body.id_loja !== undefined && !isPositiveInteger(req.body.id_loja)) {
    errors.push('O campo id_loja deve ser um inteiro positivo.');
  }

  if (req.body.quantidade !== undefined && !isNonNegativeInteger(req.body.quantidade)) {
    errors.push('O campo quantidade deve ser um inteiro maior ou igual a zero.');
  }

  if (req.body.preco !== undefined) {
    const preco = Number(req.body.preco);
    if (Number.isNaN(preco) || preco < 0) {
      errors.push('O campo preco deve ser um numero maior ou igual a zero.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (req.body.id_produto !== undefined) req.body.id_produto = Number(req.body.id_produto);
  if (req.body.id_loja !== undefined) req.body.id_loja = Number(req.body.id_loja);
  if (req.body.quantidade !== undefined) req.body.quantidade = Number(req.body.quantidade);
  if (req.body.preco !== undefined) req.body.preco = Number(req.body.preco);

  return next();
};

module.exports = {
  validateStoreProductIdParam,
  validateCreateStoreProduct,
  validateUpdateStoreProduct
};
