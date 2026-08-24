/**
 * @module authRoutes
 * @description Rotas de autenticação da API.
 * Expõe o endpoint de login que valida as credenciais do utilizador
 * e devolve um token JWT para uso nas restantes rotas protegidas.
 * Prefixo registado em app.js: `/api/v1/auth`
 */

const express = require("express");
const authController = require("../controllers/authController");
const oauthController = require("../controllers/oauthController");

const router = express.Router();

// POST /api/v1/auth/login — autentica um utilizador e retorna um JWT
router.post("/login", authController.login);

// GET /api/v1/auth/verify-email — valida um token de confirmação de email
router.get("/verify-email", authController.verifyEmail);

// POST /api/v1/auth/register — cria conta e envia email de verificação
const { validateCreateUser } = require('../middlewares/validateUser');
router.post("/register", validateCreateUser, authController.register);

// POST /api/v1/auth/resend-verification — reenvia o link de confirmação
router.post("/resend-verification", authController.resendVerification);

// ─── Autenticação social (OAuth 2.0: Google e Apple) ──────────
router.get("/oauth/providers", oauthController.listProviders);
router.get("/oauth/google",          oauthController.startGoogle);
router.get("/oauth/google/callback", oauthController.callbackGoogle);
router.get("/oauth/apple",           oauthController.startApple);
// A Apple responde com form_post (POST urlencoded)
router.post("/oauth/apple/callback", express.urlencoded({ extended: false }), oauthController.callbackApple);
router.get("/oauth/apple/callback",  oauthController.callbackAppleGet);

module.exports = router;