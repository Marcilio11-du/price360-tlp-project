/**
 * @module storeProductRoutes
 * @description Rotas REST para gestão da relação produto-loja (`Produto_Loja`).
 * Associa produtos a lojas com quantidade e preço específicos.
 * Expõe operações de listagem, leitura, criação, atualização,
 * soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/store-products`
 */

const express = require("express");
const storeProductController = require("../controllers/storeProductController");
const {
  validateStoreProductIdParam,
  validateCreateStoreProduct,
  validateUpdateStoreProduct,
} = require("../middlewares/validateStoreProduct");

const router = express.Router();

router.get("/", storeProductController.getStoreProducts);
router.get("/all", storeProductController.getAllStoreProducts);
router.get("/deleted", storeProductController.getDeletedStoreProducts);
router.get(
  "/:id",
  validateStoreProductIdParam,
  storeProductController.getStoreProductById,
);
router.post(
  "/",
  validateCreateStoreProduct,
  storeProductController.createStoreProduct,
);
router.put(
  "/:id",
  validateStoreProductIdParam,
  validateUpdateStoreProduct,
  storeProductController.updateStoreProduct,
);
router.delete(
  "/:id",
  validateStoreProductIdParam,
  storeProductController.softDeleteStoreProduct,
);
router.patch(
  "/:id/restore",
  validateStoreProductIdParam,
  storeProductController.restoreStoreProduct,
);
router.delete(
  "/:id/hard",
  validateStoreProductIdParam,
  storeProductController.hardDeleteStoreProduct,
);

module.exports = router;
