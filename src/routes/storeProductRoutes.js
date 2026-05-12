const express = require('express');
const storeProductController = require('../controllers/storeProductController');
const {
  validateStoreProductIdParam,
  validateCreateStoreProduct,
  validateUpdateStoreProduct
} = require('../middlewares/validateStoreProduct');

const router = express.Router();

router.get('/', storeProductController.getStoreProducts);
router.get('/all', storeProductController.getAllStoreProducts);
router.get('/deleted', storeProductController.getDeletedStoreProducts);
router.get('/:id', validateStoreProductIdParam, storeProductController.getStoreProductById);
router.post('/', validateCreateStoreProduct, storeProductController.createStoreProduct);
router.put('/:id', validateStoreProductIdParam, validateUpdateStoreProduct, storeProductController.updateStoreProduct);
router.delete('/:id', validateStoreProductIdParam, storeProductController.softDeleteStoreProduct);
router.patch('/:id/restore', validateStoreProductIdParam, storeProductController.restoreStoreProduct);
router.delete('/:id/hard', validateStoreProductIdParam, storeProductController.hardDeleteStoreProduct);

module.exports = router;
