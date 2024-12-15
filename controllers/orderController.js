import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

// @desc     Créer une nouvelle commande
// @method   POST
// @endpoint /api/v1/orders
// @access   Private
const addOrderItems = async (req, res, next) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const {
      cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    const taxPrice = 0;

    if (!cartItems || cartItems.length === 0) {
      res.status(400);
      throw new Error('No order items.');
    }

    const calculatedTotalPrice = totalPrice || itemsPrice + shippingPrice + taxPrice;

    const order = new Order({
      user: req.user._id,
      orderItems: cartItems.map((item) => ({
        product: item._id,
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice: calculatedTotalPrice,
    });

    const createdOrder = await order.save({ session });

   // Réduire le stock des produits commandés
   for (const item of cartItems) {
    const product = await Product.findById(item._id).session(session); // Charger le produit avec la session
    if (!product) {
      throw new Error(`Product with id ${item._id} not found`);
    }

    // Vérifier la quantité en stock
    if (product.countInStock < item.qty) {
      throw new Error(`Not enough stock for ${product.name}. Available stock: ${product.countInStock}`);
    }

    // Réduire le stock
    product.countInStock -= item.qty;
    await product.save({ session }); // Sauvegarder le produit avec la session
  }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(createdOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc     Supprimer une commande
// @method   DELETE
// @endpoint /api/v1/orders/:id
// @access   Private/Admin
const deleteOrder = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found!');
    }

    await order.deleteOne();

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc     Obtenir toutes les commandes
// @method   GET
// @endpoint /api/v1/orders
// @access   Private/Admin
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'id name');
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc     Obtenir les commandes de l'utilisateur connecté
// @method   GET
// @endpoint /api/v1/orders/my-orders
// @access   Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc     Mettre à jour la commande pour la marquer comme payée
// @method   PUT
// @endpoint /api/v1/orders/:id/pay
// @access   Private
const updateOrderToPaid = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const { paidAt, paymentId, email } = req.body;  // Informations de paiement

    // Rechercher la commande
    const order = await Order.findById(orderId);

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    // Mettre à jour les informations de paiement
    order.isPaid = true;
    order.paidAt = paidAt ? new Date(paidAt) : new Date();  // Utiliser la date fournie ou la date actuelle
    order.paymentResult = {
      paymentId,
      status: 'paid',
      email_address: email
    };

    // Sauvegarder la commande mise à jour
    const updatedOrder = await order.save();

    // Ajouter une logique pour marquer la commande comme livrée le jour suivant
    const deliveryDate = new Date(updatedOrder.paidAt);
    deliveryDate.setDate(deliveryDate.getDate() + 1);  // Définir la date de livraison au jour suivant

    // Mettre à jour la commande pour la marquer comme livrée
    updatedOrder.isDelivered = true;
    updatedOrder.deliveredAt = deliveryDate;

    // Sauvegarder la commande après modification
    const finalUpdatedOrder = await updatedOrder.save();

    res.status(200).json(finalUpdatedOrder);  // Retourner la commande mise à jour
  } catch (error) {
    next(error);  // Passer l'erreur au middleware de gestion des erreurs
  }
};

// @desc     Mettre à jour la commande pour la marquer comme livrée
// @method   PUT
// @endpoint /api/v1/orders/:id/deliver
// @access   Private/Admin
const updateOrderToDeliver = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const { deliveredAt } = req.body;  // Date de livraison

    // Rechercher la commande
    const order = await Order.findById(orderId);

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    // Mettre à jour le statut de livraison
    order.isDelivered = true;
    order.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date(); // Utiliser la date fournie ou la date actuelle

    // Sauvegarder la commande après modification
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);  // Retourner la commande mise à jour
  } catch (error) {
    next(error);  // Passer l'erreur au middleware de gestion des erreurs
  }
};
// @desc     Obtenir une commande par ID
// @method   GET
// @endpoint /api/v1/orders/:id
// @access   Private
const getOrderById = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found!');
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export {
  addOrderItems,
  deleteOrder,
  getOrders,
  getMyOrders,
  updateOrderToPaid,
  updateOrderToDeliver,
  getOrderById,
};
