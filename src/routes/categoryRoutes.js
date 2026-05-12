/**
 * @module categoryRoutes
 * @description Rotas REST para gestão de categorias de produtos (`Categoria`).
 * Expõe operações de listagem, leitura, criação, atualização,
 * soft delete, restauro e remoção permanente.
 * Prefixo registado em app.js: `/api/v1/categories`
 */

const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryControllers");
const {
  validateCategoryIdParam,
  validateCreateCategory,
  validateUpdateCategory,
} = require("../middlewares/validateCategory");

// Listagens
router.get("/", categoryController.getCategories);
router.get("/all", categoryController.getAllCategories);
router.get("/deleted", categoryController.getDeletedCategories);

// Leitura por id
router.get("/:id", validateCategoryIdParam, categoryController.getCategoryById);

// Criação
router.post("/", validateCreateCategory, categoryController.createCategory);

// Atualização
router.put(
  "/:id",
  validateCategoryIdParam,
  validateUpdateCategory,
  categoryController.updateCategory,
);

// Remoção lógica e restauro
router.delete(
  "/:id",
  validateCategoryIdParam,
  categoryController.softDeleteCategory,
);
router.patch(
  "/:id/restore",
  validateCategoryIdParam,
  categoryController.restoreCategory,
);

// Remoção permanente
router.delete(
  "/:id/hard",
  validateCategoryIdParam,
  categoryController.hardDeleteCategory,
);

module.exports = router;
