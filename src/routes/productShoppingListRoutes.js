/**
 * @module productShoppingListRoutes
 * @description Rotas REST para gestão da associação N:N entre produtos
 * e listas de compras (`Lista_compras_Produto`).
 * Inclui filtragem por lista e por produto, e operações de listagem,
 * leitura, criação, atualização, soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/product-shopping-lists`
 */

const express = require("express");
const productShoppingListController = require("../controllers/productShoppingListController");
const {
  validateProductShoppingListIdParam,
  validateListIdParam,
  validateProductIdParam,
  validateCreateProductShoppingList,
  validateUpdateProductShoppingList,
} = require("../middlewares/validateProductShoppingList");

const router = express.Router();

router.get("/", productShoppingListController.getProductShoppingLists);
router.get("/all", productShoppingListController.getAllProductShoppingLists);
router.get(
  "/deleted",
  productShoppingListController.getDeletedProductShoppingLists,
);
router.get(
  "/list/:listId",
  validateListIdParam,
  productShoppingListController.getProductShoppingListsByList,
);
router.get(
  "/product/:productId",
  validateProductIdParam,
  productShoppingListController.getProductShoppingListsByProduct,
);
router.get(
  "/:id",
  validateProductShoppingListIdParam,
  productShoppingListController.getProductShoppingListById,
);
router.post(
  "/",
  validateCreateProductShoppingList,
  productShoppingListController.createProductShoppingList,
);
router.put(
  "/:id",
  validateProductShoppingListIdParam,
  validateUpdateProductShoppingList,
  productShoppingListController.updateProductShoppingList,
);
router.delete(
  "/:id",
  validateProductShoppingListIdParam,
  productShoppingListController.softDeleteProductShoppingList,
);
router.patch(
  "/:id/restore",
  validateProductShoppingListIdParam,
  productShoppingListController.restoreProductShoppingList,
);
router.delete(
  "/:id/hard",
  validateProductShoppingListIdParam,
  productShoppingListController.hardDeleteProductShoppingList,
);

module.exports = router;
