/**
 * @module productRoutes
 * @description Rotas REST para gestão de produtos (`Produto`).
 * Expõe operações de listagem (incluindo pesquisa por texto), leitura,
 * criação, atualização, soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/products`
 */

const express = require("express");
const productController = require("../controllers/productController");
const {
  validateProductIdParam,
  validateCreateProduct,
  validateUpdateProduct,
} = require("../middlewares/validateProduct");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/search", productController.searchProducts);
router.get("/all", productController.getAllProducts);
router.get("/deleted", productController.getDeletedProducts);
router.get("/:id", validateProductIdParam, productController.getProductById);
router.post("/", validateCreateProduct, productController.createProduct);
router.put(
  "/:id",
  validateProductIdParam,
  validateUpdateProduct,
  productController.updateProduct,
);
router.delete(
  "/:id",
  validateProductIdParam,
  productController.softDeleteProduct,
);
router.patch(
  "/:id/restore",
  validateProductIdParam,
  productController.restoreProduct,
);
router.delete(
  "/:id/hard",
  validateProductIdParam,
  productController.hardDeleteProduct,
);

module.exports = router;
