/**
 * @module oauthController
 * @description Handlers do fluxo OAuth (Google e Apple).
 * Inicia o consentimento, valida o state anti-CSRF, obtém o perfil,
 * liga/cria o Utilizador e devolve o JWT do site ao frontend.
 */

const { signToken } = require("../config/jwt");
const {
  isEnabled,
  createState,
  buildGoogleAuthUrl,
  buildAppleAuthUrl,
  exchangeGoogleCode,
  exchangeAppleCode,
  verifyAppleIdToken,
  upsertOAuthUser,
  frontendBaseUrl,
} = require("../services/oauthService");

const sendSuccess = (res, statusCode, data, message) =>
  res.status(statusCode).json({ status: "success", data, message });

/* ─── Helpers de cookie/state (sem depender de cookie-parser) ── */

const STATE_COOKIE = "xepreco_oauth_state";

const readCookie = (req, name) => {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
};

const setStateCookie = (res, value) => {
  res.cookie(STATE_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });
};

const clearStateCookie = (res) => {
  res.setHeader("Set-Cookie", `${STATE_COOKIE}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
};

/**
 * Valida o state anti-CSRF. Em caso de falha redireciona para o frontend
 * com mensagem de erro e devolve false.
 */
const assertState = (req, res) => {
  const esperado = readCookie(req, STATE_COOKIE);
  const recebido = req.query.state || req.body?.state;
  clearStateCookie(res);
  if (!esperado || !recebido || esperado !== String(recebido)) {
    redirectFrontend(res, { erro: "Sessao_de_autenticacao_invalida_tenta_novamente" });
    return false;
  }
  return true;
};

/** Redirecciona o browser de volta ao frontend com token ou erro no hash */
const redirectFrontend = (res, { token, novo, erro } = {}) => {
  const base = frontendBaseUrl();
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (novo) params.set("novo", "1");
  if (erro) params.set("erro", erro);
  const destino = `${base}/#/autenticacao-social${params.toString() ? `?${params}` : ""}`;

  // A Apple usa form_post: respondemos com HTML que faz o redirect.
  if (res.req && res.req.method === "POST") {
    res.type("html").send(
      `<!doctype html><meta charset="utf-8"><title>A entrar…</title>` +
      `<p style="font-family:sans-serif">A entrar no Xé Preço…</p>` +
      `<script>location.replace(${JSON.stringify(destino)});</script>` +
      `<a href="${destino}">Continuar</a>`,
    );
    return;
  }
  res.redirect(302, destino);
};

/* ─── Providers activos (o frontend mostra/esconde botões) ──── */

const listProviders = (_req, res) =>
  sendSuccess(res, 200, { google: isEnabled.google(), apple: isEnabled.apple() });

/* ─── Início do fluxo ──────────────────────────────────────── */

const startGoogle = (_req, res) => {
  if (!isEnabled.google()) return redirectFrontend(res, { erro: "Google nao configurado" });
  const state = createState();
  setStateCookie(res, state);
  return res.redirect(302, buildGoogleAuthUrl(state));
};

const startApple = (_req, res) => {
  if (!isEnabled.apple()) return redirectFrontend(res, { erro: "Apple nao configurado" });
  const state = createState();
  setStateCookie(res, state);
  return res.redirect(302, buildAppleAuthUrl(state));
};

/* ─── Callbacks ────────────────────────────────────────────── */

const finishLogin = async (res, provider, profile) => {
  const { user, created } = await upsertOAuthUser({
    provider,
    providerUserId: profile.sub,
    email: profile.email,
    pNome: profile.given_name || profile.p_nome,
    uNome: profile.family_name || profile.u_nome,
  });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  redirectFrontend(res, { token, novo: created });
};

const callbackGoogle = async (req, res) => {
  try {
    if (req.query.error) {
      clearStateCookie(res);
      return redirectFrontend(res, { erro: "Autorizacao_cancelada" });
    }
    if (!assertState(req, res)) return;

    const profile = await exchangeGoogleCode(req.query.code);
    await finishLogin(res, "google", profile);
  } catch (err) {
    console.error("[OAUTH][GOOGLE]", err.message);
    redirectFrontend(res, { erro: "Falha_na_autenticacao_com_Google" });
  }
};

/**
 * Apple: response_mode=form_post → POST urlencoded com code/id_token/user.
 * O nome só é enviado na PRIMEIRA autorização (campo `user` do formulário).
 */
const callbackApple = async (req, res) => {
  try {
    if (!assertState(req, res)) return;

    let claims;
    if (req.body?.code) {
      const tokens = await exchangeAppleCode(req.body.code);
      claims = await verifyAppleIdToken(tokens.id_token);
    } else if (req.body?.id_token) {
      claims = await verifyAppleIdToken(req.body.id_token);
    } else {
      return redirectFrontend(res, { erro: "Resposta_da_Apple_sem_dados" });
    }

    let nome = {};
    try { nome = JSON.parse(req.body.user || "{}"); } catch { /* sem nome */ }

    await finishLogin(res, "apple", {
      sub: claims.sub,
      email: claims.email,
      given_name: nome.name?.firstName,
      family_name: nome.name?.lastName,
    });
  } catch (err) {
    console.error("[OAUTH][APPLE]", err.message);
    redirectFrontend(res, { erro: "Falha_na_autenticacao_com_Apple" });
  }
};

/** GET no callback da Apple só acontece em erros/cancelamentos */
const callbackAppleGet = (req, res) => {
  clearStateCookie(res);
  redirectFrontend(res, { erro: req.query.error ? "Autorizacao_cancelada" : "Resposta_inesperada_da_Apple" });
};

module.exports = {
  listProviders,
  startGoogle,
  callbackGoogle,
  startApple,
  callbackApple,
  callbackAppleGet,
};
