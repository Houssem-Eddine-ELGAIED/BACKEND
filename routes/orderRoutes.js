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
    param('id')
      .notEmpty()
      .isMongoId()
      .withMessage('Invalid ID format')
      .trim()
      .escape(),
  ],
  addOrderItems: [
    check('cartItems').notEmpty().withMessage('Cart items are required.'),
    check('shippingAddress').notEmpty().withMessage('Shipping address is required.'),
    check('paymentMethod').notEmpty().withMessage('Payment method is required.'),
    check('itemsPrice').isNumeric().withMessage('Items price must be a number.'),
  ],
};

router
  .route('/')
  .post(
    protect, // Vérification de l'authentification
    validator.addOrderItems, // Validation des champs dans la requête
    validateRequest, // Validation des erreurs
    addOrderItems // Contrôleur de la route
  )
  .get(protect, admin, getOrders); // Route protégée et accessible uniquement aux admins

router.get('/my-orders', protect, getMyOrders); // Route protégée pour obtenir les commandes de l'utilisateur

router
  .route('/:id')
  .get(
    protect, // Vérification de l'authentification
    validator.getOrderById, // Validation de l'ID dans l'URL
    validateRequest, // Validation des erreurs
    getOrderById // Contrôleur pour obtenir une commande par ID
  )
  .delete(
    protect, // Vérification de l'authentification
    admin, // Vérification des privilèges administrateur
    validator.getOrderById, // Validation de l'ID dans l'URL
    validateRequest, // Validation des erreurs
    deleteOrder // Contrôleur pour supprimer une commande
  );

router.put('/:id/pay', protect, updateOrderToPaid); // Route protégée pour mettre à jour une commande en payée
router.put('/:id/deliver', protect, admin, updateOrderToDeliver); // Route protégée et accessible uniquement aux admins pour marquer une commande comme livrée

export default router;
