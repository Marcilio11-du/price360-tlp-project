/**
 * @module storeRoutes
 * @description Rotas REST para gestão de lojas (`Loja`).
 * Expõe operações de listagem, leitura, criação, atualização,
 * soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/stores`
 */

const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeControllers");
const {
  validateStoreIdParam,
  validateCreateStore,
  validateUpdateStore,
} = require("../middlewares/validateStore");

router.get("/", storeController.getStores);
router.get("/all", storeController.getAllStores);
router.get("/deleted", storeController.getDeletedStores);
router.get("/:id", validateStoreIdParam, storeController.getStoreById);
router.post("/", validateCreateStore, storeController.createStore);
router.put(
  "/:id",
  validateStoreIdParam,
  validateUpdateStore,
  storeController.updateStore,
);
router.delete("/:id", validateStoreIdParam, storeController.softDeleteStore);
router.patch(
  "/:id/restore",
  validateStoreIdParam,
  storeController.restoreStore,
);
router.delete(
  "/:id/hard",
  validateStoreIdParam,
  storeController.hardDeleteStore,
);

module.exports = router;
