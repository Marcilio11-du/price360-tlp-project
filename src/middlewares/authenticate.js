const { verifyToken } = require('../config/jwt');

/**
 * Middleware de autenticação JWT.
 * Lê o token Bearer do header Authorization, verifica-o e, se válido,
 * injeta req.user = { id, email, role } para uso nas rotas protegidas.
 * Retorna 401 se o token estiver ausente, inválido ou expirado.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      data: null,
      message: 'Acesso negado. Token de autenticacao ausente.'
    });
  }

  const token = authHeader.slice(7); // remove o prefixo "Bearer "

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    return next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      status: 'error',
      data: null,
      message: isExpired
        ? 'Token expirado. Faca login novamente.'
        : 'Token invalido.'
    });
  }
};

/**
 * Middleware de autorização por role.
 * Deve ser utilizado APÓS o middleware `authenticate`.
 * Retorna 403 se o utilizador autenticado não possuir um dos roles permitidos.
 *
 * @param {...string} roles - Roles com acesso permitido (ex: 'admin', 'user').
 * @returns {import('express').RequestHandler}
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      data: null,
      message: 'Acesso proibido. Permissoes insuficientes.'
    });
  }
  return next();
};

module.exports = { authenticate, authorize };
