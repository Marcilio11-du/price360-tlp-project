/**
 * @module shoppingListRoutes
 * @description Rotas REST para gestão de listas de compras (`Lista_compras`).
 * Inclui filtragem por cliente e operações de listagem, leitura, criação,
 * atualização, soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/shopping-lists`
 */

const express = require("express");
const shoppingListController = require("../controllers/shoppingListController");
const {
  validateShoppingListIdParam,
  validateClientIdParam,
  validateCreateShoppingList,
  validateUpdateShoppingList,
} = require("../middlewares/validateShoppingList");

const router = express.Router();

router.get("/", shoppingListController.getShoppingLists);
router.get("/all", shoppingListController.getAllShoppingLists);
router.get("/deleted", shoppingListController.getDeletedShoppingLists);
router.get(
  "/client/:clientId",
  validateClientIdParam,
  shoppingListController.getShoppingListsByClient,
);
router.get(
  "/:id",
  validateShoppingListIdParam,
  shoppingListController.getShoppingListById,
);
router.post(
  "/",
  validateCreateShoppingList,
  shoppingListController.createShoppingList,
);
router.put(
  "/:id",
  validateShoppingListIdParam,
  validateUpdateShoppingList,
  shoppingListController.updateShoppingList,
);
router.delete(
  "/:id",
  validateShoppingListIdParam,
  shoppingListController.deleteShoppingList,
);
router.patch(
  "/:id/restore",
  validateShoppingListIdParam,
  shoppingListController.restoreShoppingList,
);
router.delete(
  "/:id/hard",
  validateShoppingListIdParam,
  shoppingListController.hardDeleteShoppingList,
);

module.exports = router;
