/**
 * @module authRoutes
 * @description Rotas de autenticação da API.
 * Expõe o endpoint de login que valida as credenciais do utilizador
 * e devolve um token JWT para uso nas restantes rotas protegidas.
 * Prefixo registado em app.js: `/api/v1/auth`
 */

const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// POST /api/v1/auth/login — autentica um utilizador e retorna um JWT
router.post("/login", authController.login);

// GET /api/v1/auth/verify-email — valida um token de confirmação de email
router.get("/verify-email", authController.verifyEmail);

// POST /api/v1/auth/register — cria conta e autentica imediatamente (onboarding)
const { validateCreateUser } = require('../middlewares/validateUser');
router.post("/register", validateCreateUser, authController.register);

module.exports = router;