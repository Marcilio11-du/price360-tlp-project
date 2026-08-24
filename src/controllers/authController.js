const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken } = require('../config/jwt');
const { sendMail } = require('../services/mailer');

// Nome da tabela de utilizadores — configurável por variável de ambiente.
const USER_TABLE = process.env.DB_USER_TABLE || 'Utilizador';

const sendSuccess = (res, statusCode, data, message) =>
  res.status(statusCode).json({ status: 'success', data, message });

const sendError = (res, statusCode, message, details = null) =>
  res.status(statusCode).json({ status: 'error', data: null, message, details });

const createVerificationToken = () => crypto.randomBytes(32).toString('hex');

// Validade do link de verificação (horas)
const VERIFICATION_TOKEN_TTL_HOURS = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS || 24);

const buildVerificationExpiry = () =>
  new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:8931')
    .replace(/\/$/, '');

const sendVerificationEmail = async (user, token) => {
  // O link abre a página de verificação no FRONTEND, que chama a API
  // e apresenta o resultado ao utilizador.
  const verificationLink = `${getFrontendUrl()}/#/verificar-email?token=${encodeURIComponent(token)}`;
  const firstName = String(user.p_nome || '').trim();

  return sendMail({
    to: user.email,
    subject: 'Confirma o teu email no Xé Preço',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;padding:24px;max-width:520px;margin:0 auto;">
        <h2 style="margin:0 0 12px;color:#0f172a;">Olá${firstName ? `, ${firstName}` : ''}! Falta só um passo</h2>
        <p>Obrigado por criares conta no <strong>Xé Preço</strong>. Para a activar, confirma que este email é teu:</p>
        <p style="margin:24px 0;text-align:center;">
          <a href="${verificationLink}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:700;">
            Confirmar o meu email
          </a>
        </p>
        <p style="font-size:13px;color:#374151;">Este link é válido por <strong>${VERIFICATION_TOKEN_TTL_HOURS} horas</strong>.</p>
        <p style="font-size:12px;color:#6b7280;">Se o botão não funcionar, copia e cola este endereço no navegador:<br>
          <a href="${verificationLink}" style="color:#16a34a;word-break:break-all;">${verificationLink}</a>
        </p>
        <p style="font-size:12px;color:#6b7280;">Não criaste esta conta? Podes ignorar este email.</p>
      </div>
    `,
  });
};

const login = async (req, res) => {
  try {
    const { email, palavra_passe } = req.body;

    const validationErrors = [];

    if (!email) validationErrors.push('O campo email e obrigatorio.');
    if (!palavra_passe) validationErrors.push('A palavra_passe e obrigatoria.');

    if (validationErrors.length > 0) {
      return sendError(res, 400, 'Falha de validacao dos dados enviados.', validationErrors);
    }

    const [rows] = await db.execute(
      `SELECT id, email, palavra_passe, role, email_verificado, deleted_at FROM ${USER_TABLE} WHERE email = ? LIMIT 1`,
      [String(email).trim().toLowerCase()],
    );

    const user = rows[0];

    if (!user) {
      return sendError(res, 401, 'Credenciais invalidas.');
    }

    if (user.deleted_at !== null) {
      return sendError(res, 401, 'Conta desativada. Contacte o suporte.');
    }

    const passwordMatch = await bcrypt.compare(palavra_passe, user.palavra_passe);

    if (!passwordMatch) {
      return sendError(res, 401, 'Credenciais invalidas.');
    }

    if (Number(user.email_verificado) !== 1) {
      return sendError(res, 403, 'Confirme o teu email antes de entrar.');
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const userModel = require('../models/userModel');
    const fullUser = await userModel.getUserById(user.id);

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
        email_verificado: Number(fullUser.email_verificado) === 1,
      },
    }, 'Login efetuado com sucesso.');
  } catch (error) {
    console.error('Erro ao efetuar login:', error);
    return sendError(res, 500, 'Falha interna ao efetuar login.');
  }
};

const register = async (req, res) => {
  try {
    const userModel = require('../models/userModel');
    const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const payload = req.body;

    const existing = await userModel.getUserByEmail(payload.email);
    if (existing) {
      return sendError(res, 409, 'Já existe uma conta com este email.');
    }

    const hashedPassword = await bcrypt.hash(payload.palavra_passe, SALT_ROUNDS);
    const verificationToken = createVerificationToken();

    const userId = await userModel.createUser({
      ...payload,
      // Email normalizado em minúsculas — login e reenvio usam o mesmo formato
      email: String(payload.email || '').trim().toLowerCase(),
      palavra_passe: hashedPassword,
      role: 'user',
      email_verificado: 0,
      email_verificacao_token: verificationToken,
      email_verificado_em: null,
      email_verificacao_expira_em: buildVerificationExpiry(),
    });

    let createdUser = await userModel.getUserByIdIncludingDeleted(userId);
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    if (smtpConfigured) {
      const emailResult = await sendVerificationEmail(createdUser, verificationToken);
      if (!emailResult.sent) {
        console.warn('[auth] Verificação por email não enviada:', emailResult.reason);
      }
    } else {
      await userModel.updateUser(userId, {
        email_verificado: 1,
        email_verificacao_token: null,
        email_verificado_em: new Date(),
      });
      createdUser = await userModel.getUserByIdIncludingDeleted(userId);
    }

    const verificationRequired = smtpConfigured && Number(createdUser.email_verificado) !== 1;
    const token = verificationRequired ? null : signToken({ id: createdUser.id, email: createdUser.email, role: createdUser.role });

    return sendSuccess(res, 201, {
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        p_nome: createdUser.p_nome,
        u_nome: createdUser.u_nome,
        municipio_preferencial: createdUser.municipio_preferencial,
        email_verificado: Number(createdUser.email_verificado) === 1,
      },
      verification_required: verificationRequired,
    }, smtpConfigured
      ? 'Conta criada com sucesso. Verifica o teu email para ativar a conta.'
      : 'Conta criada com sucesso. Bem-vindo ao Xé Preço!');
  } catch (error) {
    console.error('Erro ao registar utilizador:', error);
    return sendError(res, 500, 'Falha interna ao criar conta.');
  }
};

const verifyEmail = async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) {
      return sendError(res, 400, 'Token de verificação não informado.');
    }

    const userModel = require('../models/userModel');
    const user = await userModel.getUserByVerificationToken(token);

    if (!user) {
      return sendError(res, 410, 'Link de verificação inválido ou expirado. Pede um novo email de verificação.');
    }

    await userModel.updateUser(user.id, {
      email_verificado: 1,
      email_verificacao_token: null,
      email_verificado_em: new Date(),
      email_verificacao_expira_em: null,
    });

    return sendSuccess(res, 200, { verified: true }, 'Email verificado com sucesso. Já podes entrar na tua conta.');
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return sendError(res, 500, 'Falha interna ao verificar o email.');
  }
};

/**
 * Reenvia o email de verificação para uma conta ainda não verificada.
 * Responde sempre com sucesso genérico (sem revelar se o email existe),
 * excepto quando a conta já está verificada.
 */
const resendVerification = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) {
      return sendError(res, 400, 'Indica o teu email para reenviar a verificação.');
    }

    const userModel = require('../models/userModel');
    const user = await userModel.getUserByEmail(email);

    if (!user || user.deleted_at) {
      // Não revela existência da conta
      return sendSuccess(res, 200, { reenviado: true }, 'Se este email tiver conta connosco, enviámos um novo link.');
    }

    if (Number(user.email_verificado) === 1) {
      return sendSuccess(res, 200, { reenviado: false }, 'Este email já está verificado. Podes entrar normalmente.');
    }

    const verificationToken = createVerificationToken();
    await userModel.updateUser(user.id, {
      email_verificacao_token: verificationToken,
      email_verificacao_expira_em: buildVerificationExpiry(),
    });

    const emailResult = await sendVerificationEmail(user, verificationToken);
    if (!emailResult.sent) {
      console.warn('[auth] Reenvio de verificação não enviado:', emailResult.reason);
      return sendError(res, 503, 'Não foi possível enviar o email agora. Tenta novamente em instantes.');
    }

    return sendSuccess(res, 200, { reenviado: true }, 'Enviámos um novo link de verificação para o teu email.');
  } catch (error) {
    console.error('Erro ao reenviar verificação:', error);
    return sendError(res, 500, 'Falha interna ao reenviar a verificação.');
  }
};

module.exports = { login, register, verifyEmail, resendVerification };
