/**
 * @module favoriteRoutes
 * @description Rotas autenticadas de favoritos.
 * Prefixo registado em app.js: `/api/v1/favorites`
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authenticate");
const controller = require("../controllers/favoriteController");

router.use(authenticate);

router.get("/", controller.listFavorites);
router.get("/ids", controller.listFavoriteIds);
router.post("/", controller.addFavorite);
router.delete("/:idProduto", controller.removeFavorite);

module.exports = router;
