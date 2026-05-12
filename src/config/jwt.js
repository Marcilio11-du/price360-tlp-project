const jwt = require('jsonwebtoken');

// Lê o segredo e o tempo de expiração das variáveis de ambiente.
// JWT_SECRET é obrigatório em produção; JWT_EXPIRES_IN usa '24h' por omissão.
const FALLBACK_SECRET = 'dev_secret_change_in_production';

const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!process.env.JWT_SECRET) {
  console.warn(
    '[AVISO DE SEGURANCA] JWT_SECRET nao definido nas variaveis de ambiente. ' +
    'A usar segredo de fallback — NUNCA utilize isto em producao!'
  );
}

/**
 * Gera um token JWT assinado com o payload fornecido.
 * @param {object} payload - Dados a incluir no token (id, email, role).
 * @returns {string} Token JWT assinado.
 */
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Verifica e descodifica um token JWT.
 * @param {string} token - Token JWT a verificar.
 * @returns {object} Payload descodificado se o token for válido.
 * @throws {JsonWebTokenError} Se o token for inválido.
 * @throws {TokenExpiredError} Se o token estiver expirado.
 */
const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { signToken, verifyToken };
