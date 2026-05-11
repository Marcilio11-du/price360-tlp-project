const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryControllers');

router.get('/', categoryController.getAllCategories);
router.get('/all', categoryController.getAllCategoriesIncludingDeleted);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.softDeleteCategory);
router.patch('/:id/restore', categoryController.restoreCategory);
router.delete('/:id/hard', categoryController.hardDeleteCategory);

module.exports = router;