/**
 * @module notificationRoutes
 * @description Rotas autenticadas da central de notificações.
 * Prefixo registado em app.js: `/api/v1/notifications`
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authenticate");
const controller = require("../controllers/notificationController");

router.use(authenticate);

router.get("/", controller.listNotifications);
router.patch("/:alertId/marcar-visto", controller.marcarVisto);

module.exports = router;
