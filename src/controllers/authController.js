const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken } = require('../config/jwt');

// Nome da tabela de utilizadores — configurável por variável de ambiente.
const USER_TABLE = process.env.DB_USER_TABLE || 'Utilizador';

// ---------------------------------------------------------------------------
// Helpers de resposta (seguem o padrão do projeto)
// ---------------------------------------------------------------------------

/**
 * Envia uma resposta de sucesso formatada.
 * @param {import('express').Response} res
 * @param {number} statusCode - Código HTTP de sucesso.
 * @param {*} data - Dados a incluir na resposta.
 * @param {string} message - Mensagem descritiva.
 */
const sendSuccess = (res, statusCode, data, message) =>
  res.status(statusCode).json({ status: 'success', data, message });

/**
 * Envia uma resposta de erro formatada.
 * @param {import('express').Response} res
 * @param {number} statusCode - Código HTTP de erro.
 * @param {string} message - Mensagem de erro.
 * @param {*} [details=null] - Detalhes adicionais (ex: erros de validação).
 */
const sendError = (res, statusCode, message, details = null) =>
  res.status(statusCode).json({ status: 'error', data: null, message, details });

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Autentica um utilizador e retorna um token JWT.
 *
 * @route  POST /api/v1/auth/login
 * @param  {import('express').Request}  req - Body esperado: { email, palavra_passe }
 * @param  {import('express').Response} res
 * @returns {Promise<void>}
 *
 * Fluxo:
 *  1. Valida presença de `email` e `palavra_passe` no body (400 se faltarem).
 *  2. Procura o utilizador pelo email na base de dados.
 *  3. Retorna 401 genérico se o utilizador não existir (não revela se o email existe).
 *  4. Retorna 401 se a conta estiver desativada (deleted_at IS NOT NULL).
 *  5. Compara a palavra-passe com o hash armazenado via bcrypt.
 *  6. Retorna 401 genérico se a palavra-passe estiver errada.
 *  7. Assina e retorna o token JWT com { id, email, role }.
 */
const login = async (req, res) => {
  try {
    const { email, palavra_passe } = req.body;

    // --- 1. Validação dos campos obrigatórios ---
    const validationErrors = [];

    if (!email) {
      validationErrors.push('O campo email e obrigatorio.');
    }
    if (!palavra_passe) {
      validationErrors.push('A palavra_passe e obrigatoria.');
    }

    if (validationErrors.length > 0) {
      return sendError(
        res,
        400,
        'Falha de validacao dos dados enviados.',
        validationErrors
      );
    }

    // --- 2. Busca o utilizador na base de dados ---
    const [rows] = await db.execute(
      `SELECT id, email, palavra_passe, role, deleted_at FROM ${USER_TABLE} WHERE email = ? LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );

    const user = rows[0];

    // --- 3. Utilizador não encontrado — resposta intencionalmente vaga ---
    if (!user) {
      return sendError(res, 401, 'Credenciais invalidas.');
    }

    // --- 4. Conta desativada ---
    if (user.deleted_at !== null) {
      return sendError(res, 401, 'Conta desativada. Contacte o suporte.');
    }

    // --- 5. Verificação da palavra-passe ---
    const passwordMatch = await bcrypt.compare(palavra_passe, user.palavra_passe);

    if (!passwordMatch) {
      return sendError(res, 401, 'Credenciais invalidas.');
    }

    // --- 6. Geração do token JWT ---
    const token = signToken({ id: user.id, email: user.email, role: user.role });

    // --- 7. Buscar dados completos do utilizador (para popular Navbar e Perfil) ---
    const userModel = require('../models/userModel');
    const fullUser = await userModel.getUserById(user.id);

    // --- 8. Resposta de sucesso (palavra_passe nunca é exposta) ---
    return sendSuccess(res, 200, {
      token,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        role: fullUser.role,
        p_nome: fullUser.p_nome,
        u_nome: fullUser.u_nome,
        avatar_path: fullUser.avatar_path,
        municipio: fullUser.municipio,
        municipio_preferencial: fullUser.municipio_preferencial,
      }
    }, 'Login efetuado com sucesso.');
  } catch (error) {
    console.error('Erro ao efetuar login:', error);
    return sendError(res, 500, 'Falha interna ao efetuar login.');
  }
};

/**
 * Regista um novo utilizador e retorna um token JWT imediatamente.
 * O utilizador fica autenticado logo após o cadastro — não precisa de fazer login separado.
 *
 * @route  POST /api/v1/auth/register
 * @param  {import('express').Request}  req - Body esperado conforme validateCreateUser
 * @param  {import('express').Response} res
 */
const register = async (req, res) => {
  try {
    const userModel = require('../models/userModel');
    const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

    const payload = req.body;

    // Verificar unicidade do email
    const existing = await userModel.getUserByEmail(payload.email);
    if (existing) {
      return sendError(res, 409, 'Já existe uma conta com este email.');
    }

    // Hash da palavra-passe
    const hashedPassword = await bcrypt.hash(payload.palavra_passe, SALT_ROUNDS);

    // Criar utilizador
    const userId = await userModel.createUser({
      ...payload,
      palavra_passe: hashedPassword,
      role: 'user',
    });

    const createdUser = await userModel.getUserByIdIncludingDeleted(userId);

    // Gerar token JWT — o utilizador fica autenticado imediatamente
    const token = signToken({ id: createdUser.id, email: createdUser.email, role: createdUser.role });

    return sendSuccess(res, 201, {
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        p_nome: createdUser.p_nome,
        u_nome: createdUser.u_nome,
        municipio_preferencial: createdUser.municipio_preferencial,
      }
    }, 'Conta criada com sucesso. Bem-vindo ao Price360!');
  } catch (error) {
    console.error('Erro ao registar utilizador:', error);
    return sendError(res, 500, 'Falha interna ao criar conta.');
  }
};

module.exports = { login, register };