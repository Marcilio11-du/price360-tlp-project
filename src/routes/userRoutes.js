/**
 * @module userRoutes
 * @description Rotas REST para gestão de utilizadores (`Utilizador`).
 * Expõe operações de listagem, leitura, criação, atualização,
 * soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/users`
 */

const express = require("express");
const userController = require("../controllers/userController");
const {
  validateUserIdParam,
  validateCreateUser,
  validateUpdateUser,
} = require("../middlewares/validateUser");

const router = express.Router();

router.get("/", userController.getUsers);
router.get("/all", userController.getAllUsers);
router.get("/deleted", userController.getDeletedUsers);
router.get("/:id", validateUserIdParam, userController.getUserById);
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

module.exports = router;
