const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeControllers');

router.get('/', storeController.getAllStores);
router.get('/all', storeController.getAllStoresIncludingDeleted);
router.get('/:id', storeController.getStoreById);
router.post('/', storeController.createStore);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.softDeleteStore);
router.patch('/:id/restore', storeController.restoreStore);
router.delete('/:id/hard', storeController.hardDeleteStore);

module.exports = router;
