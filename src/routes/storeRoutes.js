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
const { isAdmin, authenticate } = require("../middlewares/authenticate");
const {
  validateStoreIdParam,
  validateCreateStore,
  validateUpdateStore,
} = require("../middlewares/validateStore");

router.get("/", storeController.getStores);
router.get("/all",     isAdmin, storeController.getAllStores);
router.get("/deleted", isAdmin, storeController.getDeletedStores);
router.get("/:id/profile", validateStoreIdParam, storeController.getStoreProfile);
router.get("/:id/products", validateStoreIdParam, storeController.getStoreProducts);
router.get("/:id/reviews", validateStoreIdParam, storeController.getStoreReviews);
router.post("/:id/reviews", authenticate, validateStoreIdParam, storeController.createStoreReview);
router.delete("/:id/reviews/:reviewId", authenticate, validateStoreIdParam, storeController.deleteStoreReview);
router.get("/:id", validateStoreIdParam, storeController.getStoreById);
router.post("/",   isAdmin, validateCreateStore, storeController.createStore);
router.put(
  "/:id",
  isAdmin,
  validateStoreIdParam,
  validateUpdateStore,
  storeController.updateStore,
);
router.delete("/:id",        isAdmin, validateStoreIdParam, storeController.softDeleteStore);
router.patch("/:id/restore", isAdmin, validateStoreIdParam, storeController.restoreStore);
router.delete("/:id/hard",   isAdmin, validateStoreIdParam, storeController.hardDeleteStore);

module.exports = router;
