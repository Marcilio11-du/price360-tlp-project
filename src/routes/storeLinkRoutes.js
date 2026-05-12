const express = require('express');
const storeLinkController = require('../controllers/storeLinkController');
const {
  validateStoreLinkIdParam,
  validateStoreIdParam,
  validateCreateStoreLink,
  validateUpdateStoreLink
} = require('../middlewares/validateStoreLink');

const router = express.Router();

router.get('/', storeLinkController.getStoreLinks);
router.get('/all', storeLinkController.getAllStoreLinks);
router.get('/deleted', storeLinkController.getDeletedStoreLinks);
router.get('/store/:storeId', validateStoreIdParam, storeLinkController.getStoreLinksByStore);
router.get('/:id', validateStoreLinkIdParam, storeLinkController.getStoreLinkById);
router.post('/', validateCreateStoreLink, storeLinkController.createStoreLink);
router.put('/:id', validateStoreLinkIdParam, validateUpdateStoreLink, storeLinkController.updateStoreLink);
router.delete('/:id', validateStoreLinkIdParam, storeLinkController.softDeleteStoreLink);
router.patch('/:id/restore', validateStoreLinkIdParam, storeLinkController.restoreStoreLink);
router.delete('/:id/hard', validateStoreLinkIdParam, storeLinkController.hardDeleteStoreLink);

module.exports = router;
