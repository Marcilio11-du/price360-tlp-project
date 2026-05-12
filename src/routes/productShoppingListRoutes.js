const express = require('express');
const productShoppingListController = require('../controllers/productShoppingListController');
const {
  validateProductShoppingListIdParam,
  validateListIdParam,
  validateProductIdParam,
  validateCreateProductShoppingList,
  validateUpdateProductShoppingList
} = require('../middlewares/validateProductShoppingList');

const router = express.Router();

router.get('/', productShoppingListController.getProductShoppingLists);
router.get('/all', productShoppingListController.getAllProductShoppingLists);
router.get('/deleted', productShoppingListController.getDeletedProductShoppingLists);
router.get('/list/:listId', validateListIdParam, productShoppingListController.getProductShoppingListsByList);
router.get('/product/:productId', validateProductIdParam, productShoppingListController.getProductShoppingListsByProduct);
router.get('/:id', validateProductShoppingListIdParam, productShoppingListController.getProductShoppingListById);
router.post('/', validateCreateProductShoppingList, productShoppingListController.createProductShoppingList);
router.put('/:id', validateProductShoppingListIdParam, validateUpdateProductShoppingList, productShoppingListController.updateProductShoppingList);
router.delete('/:id', validateProductShoppingListIdParam, productShoppingListController.softDeleteProductShoppingList);
router.patch('/:id/restore', validateProductShoppingListIdParam, productShoppingListController.restoreProductShoppingList);
router.delete('/:id/hard', validateProductShoppingListIdParam, productShoppingListController.hardDeleteProductShoppingList);

module.exports = router;
