const express = require("express");
const { authenticate } = require("../middlewares/authenticate");
const controller = require("../controllers/priceAlertController");
const { validateCreatePriceAlert } = require("../middlewares/validatePriceAlert");
const router = express.Router();
router.use(authenticate); router.get("/", controller.listMyAlerts); router.post("/", validateCreatePriceAlert, controller.createAlert); router.delete("/:id", controller.deleteAlert);
module.exports = router;
