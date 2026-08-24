/**
 * @module oauthService
 * @description Autenticação social (Google e Apple) via OAuth 2.0.
 *
 * Fluxo de redireccionamento:
 *   1. GET /auth/oauth/:provider        → 302 para o ecrã de consentimento
 *   2. O provider devolve o código no callback
 *   3. Trocamos o código por tokens e obtemos o perfil
 *   4. upsertOAuthUser liga/cria o Utilizador e emitimos o JWT do site
 *
 * Credenciais via .env — sem elas o provider fica desactivado e o botão
 * não aparece no frontend (GET /auth/oauth/providers).
 */

const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

/* ─── Configuração dos providers ───────────────────────────── */

const GOOGLE_AUTH_URL    = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL   = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const APPLE_AUTH_URL  = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_ISSUER    = "https://appleid.apple.com";
const APPLE_JWKS_URL  = "https://appleid.apple.com/auth/keys";

const isEnabled = {
  google: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  apple: () =>
    Boolean(
      process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY,
    ),
};

/** URL base da API, usado nos redirect_uri registados nas consolas */
const apiBaseUrl = () =>
  process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

/** URL do frontend para onde regressamos com o JWT */
const frontendBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:8931";

const callbackUrl = (provider) => `${apiBaseUrl()}/api/v1/auth/oauth/${provider}/callback`;

/** Estado anti-CSRF: valor aleatório de uso único, válido 10 minutos */
const createState = () => crypto.randomBytes(16).toString("hex");

/* ─── URLs de consentimento ────────────────────────────────── */

const buildGoogleAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl("google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
};

const buildAppleAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID, // Services ID
    redirect_uri: callbackUrl("apple"),
    response_type: "code",
    scope: "name email",
    state,
    response_mode: "form_post", // Apple exige POST no callback
  });
  return `${APPLE_AUTH_URL}?${params}`;
};

/* ─── Apple: client_secret é um JWT ES256 assinado com a .p8 ── */

let cachedAppleSecret = null;

const getAppleClientSecret = () => {
  // O segredo vale até 6 meses; regeneramos em memória a cada ~25 dias.
  if (cachedAppleSecret && cachedAppleSecret.expires > Date.now()) {
    return cachedAppleSecret.value;
  }
  const now = Math.floor(Date.now() / 1000);
  const value = jwt.sign(
    {
      iss: process.env.APPLE_TEAM_ID,
      iat: now,
      exp: now + 60 * 60 * 24 * 30,
      aud: APPLE_ISSUER,
      sub: process.env.APPLE_CLIENT_ID,
    },
    process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    { algorithm: "ES256", keyid: process.env.APPLE_KEY_ID },
  );
  cachedAppleSecret = { value, expires: Date.now() + 25 * 24 * 60 * 60 * 1000 };
  return value;
};

/* ─── Verificação do id_token da Apple contra o JWKS público ── */

let appleJwksCache = null;

const verifyAppleIdToken = async (idToken) => {
  const header = jwt.decode(idToken, { complete: true })?.header;
  if (!header?.kid) throw new Error("id_token da Apple inválido.");

  if (!appleJwksCache) {
    const res = await axios.get(APPLE_JWKS_URL, { timeout: 10000 });
    appleJwksCache = res.data.keys;
  }

  const jwk = appleJwksCache.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("Chave pública da Apple não encontrada.");

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  return jwt.verify(idToken, publicKey, {
    issuer: APPLE_ISSUER,
    audience: process.env.APPLE_CLIENT_ID,
  });
};

/* ─── Troca de códigos e obtenção de perfis ─────────────────── */

const exchangeGoogleCode = async (code) => {
  const { data } = await axios.post(
    GOOGLE_TOKEN_URL,
    new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl("google"),
      grant_type: "authorization_code",
    }),
    { timeout: 15000 },
  );

  const info = await axios.get(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${data.access_token}` },
    timeout: 10000,
  });

  return info.data; // { sub, email, email_verified, given_name, family_name, ... }
};

const exchangeAppleCode = async (code) => {
  const { data } = await axios.post(
    APPLE_TOKEN_URL,
    new URLSearchParams({
      code,
      client_id: process.env.APPLE_CLIENT_ID,
      client_secret: getAppleClientSecret(),
      redirect_uri: callbackUrl("apple"),
      grant_type: "authorization_code",
    }),
    { timeout: 15000 },
  );

  return data; // contém id_token
};

/* ─── Utilizador: ligar ou criar conta local ───────────────── */

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Procura o utilizador pelo email; liga o provider se ainda não estiver
 * ligado, ou cria uma conta nova (o email já vem verificado do provider).
 * Campos obrigatórios sem equivalente no perfil social ficam como
 * marcadores — o utilizador completa-os depois no Perfil.
 * @returns {Promise<{user: {id, email, role}, created: boolean}>}
 */
const upsertOAuthUser = async ({ provider, providerUserId, email, pNome, uNome }) => {
  if (!email) throw new Error("O fornecedor de autenticação não devolveu um email válido.");

  email = String(email).toLowerCase().trim();

  const [rows] = await db.execute(
    "SELECT id, email, role, deleted_at FROM Utilizador WHERE email = ? LIMIT 1",
    [email],
  );

  let user;
  let created = false;

  if (rows.length > 0) {
    user = rows[0];
    if (user.deleted_at) throw new Error("Esta conta foi desactivada. Contacta o suporte.");
  } else {
    const localPart = capitalize(email.split("@")[0].replace(/[._-]+/g, " ").trim().split(" ")[0]);
    const hash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

    const [result] = await db.execute(
      `INSERT INTO Utilizador
         (p_nome, u_nome, rua, municipio, email, data_nascimento,
          palavra_passe, genero, role, email_verificado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'outro', 'user', 1)`,
      [
        pNome || localPart || "Utilizador",
        uNome || "Social",
        "A definir",
        "Luanda",
        email,
        "1970-01-01", // sem data no perfil social; editável no Perfil
        hash,         // aleatória: impossível autenticar por password
      ],
    );
    user = { id: result.insertId, email, role: "user" };
    created = true;
  }

  // Liga a identidade social ao utilizador (idempotente).
  await db.execute(
    `INSERT INTO Utilizador_OAuth (id_utilizador, provider, provider_user_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE id_utilizador = VALUES(id_utilizador)`,
    [user.id, provider, String(providerUserId)],
  );

  return { user, created };
};

module.exports = {
  isEnabled,
  apiBaseUrl,
  frontendBaseUrl,
  callbackUrl,
  createState,
  buildGoogleAuthUrl,
  buildAppleAuthUrl,
  getAppleClientSecret,
  verifyAppleIdToken,
  exchangeGoogleCode,
  exchangeAppleCode,
  upsertOAuthUser,
};
