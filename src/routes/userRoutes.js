/**
 * @module userRoutes
 * @description Rotas REST para gestão de utilizadores (`Utilizador`).
 * Expõe operações de listagem, leitura, criação, atualização,
 * soft delete, restauro, remoção permanente e upload de avatar.
 * Prefixo registado em app.js: `/api/v1/users`
 */

const express = require("express");
const userController = require("../controllers/userController");
const avatarController = require("../controllers/avatarController");
const { authenticate } = require("../middlewares/authenticate");
const {
  validateUserIdParam,
  validateCreateUser,
  validateUpdateUser,
} = require("../middlewares/validateUser");
const uploadAvatar = require("../middlewares/multerConfig");

const router = express.Router();

router.get("/", userController.getUsers);
router.get("/all", userController.getAllUsers);
router.get("/deleted", userController.getDeletedUsers);
router.get("/:id", authenticate, validateUserIdParam, userController.getUserById);
router.post("/", validateCreateUser, userController.createUser);
router.put(
  "/:id",
  validateUserIdParam,
  validateUpdateUser,
  userController.updateUser,
);
router.delete("/:id", validateUserIdParam, userController.deleteUser);
router.patch("/:id/restore", validateUserIdParam, userController.restoreUser);
router.delete("/:id/hard", validateUserIdParam, userController.hardDeleteUser);

// Rota de upload de avatar
// Nota: Esta rota deve estar ANTES da rota GET /:id para evitar conflitos de routing
router.post(
  "/:id/upload-avatar",
  validateUserIdParam,
  uploadAvatar.single("avatar"),
  avatarController.uploadUserAvatar,
);

module.exports = router;
