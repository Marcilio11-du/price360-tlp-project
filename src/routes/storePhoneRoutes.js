/**
 * @module storePhoneRoutes
 * @description Rotas REST para gestão de números de telefone de lojas (`Telefone_Loja`).
 * Inclui filtragem por loja e operações de listagem, leitura, criação,
 * atualização, soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/store-phones`
 */

const express = require("express");
const storePhoneController = require("../controllers/storePhoneController");
const {
  validateStorePhoneIdParam,
  validateStoreIdParam,
  validateCreateStorePhone,
  validateUpdateStorePhone,
} = require("../middlewares/validateStorePhone");

const router = express.Router();

router.get("/", storePhoneController.getStorePhones);
router.get("/all", storePhoneController.getAllStorePhones);
router.get("/deleted", storePhoneController.getDeletedStorePhones);
router.get(
  "/store/:storeId",
  validateStoreIdParam,
  storePhoneController.getStorePhonesByStore,
);
router.get(
  "/:id",
  validateStorePhoneIdParam,
  storePhoneController.getStorePhoneById,
);
router.post(
  "/",
  validateCreateStorePhone,
  storePhoneController.createStorePhone,
);
router.put(
  "/:id",
  validateStorePhoneIdParam,
  validateUpdateStorePhone,
  storePhoneController.updateStorePhone,
);
router.delete(
  "/:id",
  validateStorePhoneIdParam,
  storePhoneController.softDeleteStorePhone,
);
router.patch(
  "/:id/restore",
  validateStorePhoneIdParam,
  storePhoneController.restoreStorePhone,
);
router.delete(
  "/:id/hard",
  validateStorePhoneIdParam,
  storePhoneController.hardDeleteStorePhone,
);

module.exports = router;
