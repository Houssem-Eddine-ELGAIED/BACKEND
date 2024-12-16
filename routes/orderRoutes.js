import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  addOrderItems,
  deleteOrder,
  getOrders,
  getMyOrders,
  updateOrderToPaid,
  updateOrderToDeliver,
  getOrderById,
} from '../controllers/orderController.js';
import validateRequest from '../middleware/validator.js';
import { param, check } from 'express-validator';

const router = express.Router();

const validator = {
  getOrderById: [
    param('id').notEmpty().isMongoId().withMessage('Invalid ID format'),
  ],
  addOrderItems: [
    check('cartItems').notEmpty(),
    check('shippingAddress').notEmpty(),
    check('paymentMethod').notEmpty(),
    check('itemsPrice').isNumeric(),
  ],
};

router
  .route('/')
  .post( validator.addOrderItems, validateRequest, addOrderItems)
  .get( admin, getOrders);

router.get('/my-orders',  getMyOrders);
router
  .route('/:id')
  .get( validator.getOrderById, validateRequest, getOrderById)
  .delete( admin, validator.getOrderById, validateRequest, deleteOrder);

router.put('/:id/pay',  updateOrderToPaid);
router.put('/:id/deliver', admin, updateOrderToDeliver);

export default router;
