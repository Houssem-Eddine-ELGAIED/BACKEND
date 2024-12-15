import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import crypto from 'crypto';  // Utilisé pour la validation des signatures avec certains services comme Razorpay

// Configuration du paiement (si nécessaire, ici vous pouvez laisser une configuration générique)
const config = (req, res) => {
  res.send({ message: "Payment configuration is successful" });
};

// Créer une commande après paiement
const order = async (req, res, next) => {
  try {
    const { cartItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

    // Vérification de la présence des articles dans le panier
    if (!cartItems || cartItems.length === 0) {
      res.statusCode = 400;
      throw new Error('No order items.');
    }

    // Créer la commande dans la base de données
    const order = new Order({
      user: req.user._id,
      orderItems: cartItems.map(item => ({
        ...item,
        product: item._id
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: false,  // Par défaut, la commande n'est pas payée
      isDelivered: false, // Par défaut, la commande n'est pas livrée
      paidAt: null,
      deliveredAt: null
    });

    // Sauvegarder la commande sans marquer le paiement
    const createdOrder = await order.save();

    // Mise à jour du stock des produits après création de la commande
    for (let item of cartItems) {
      const product = await Product.findById(item._id);
      if (product) {
        product.stock -= item.qty;  // Décrémente le stock selon la quantité achetée
        await product.save();
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);  // Passer l'erreur à un middleware de gestion des erreurs
  }
};

// Validation du paiement
const validate = async (req, res) => {
  const { paymentId, status, paymentMethod, transactionId } = req.body;  // Nouvelle structure sans Razorpay spécifique

  try {
    // Validation de la réponse de paiement
    if (status !== 'success') {
      res.statusCode = 400;
      throw new Error('Payment not successful');
    }

    // Mise à jour de la commande avec le statut de paiement
    const order = await Order.findById(req.params.id);  // Récupère la commande à partir de l'ID passé en paramètre

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    // Mettre à jour les informations de paiement
    order.isPaid = true;
    order.paidAt = new Date();  // Date de paiement
    order.paymentResult = {
      paymentId,
      status: 'paid',
      transactionId,
      paymentMethod
    };

    // Sauvegarde la commande mise à jour
    const updatedOrder = await order.save();

    res.status(200).json({
      message: 'Payment validated successfully',
      updatedOrder
    });
  } catch (error) {
    res.statusCode = 500;
    res.json({ message: error.message });
  }
};

// Mettre à jour la commande comme livrée
const updateOrderToDelivered = async (req, res) => {
  try {
    const { deliveredAt } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    // Marquer la commande comme livrée
    order.isDelivered = true;
    order.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date();  // Date de livraison

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.statusCode = 500;
    res.json({ message: error.message });
  }
};

// Configuration pour récupérer toutes les commandes
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'id name');

    if (!orders || orders.length === 0) {
      res.statusCode = 404;
      throw new Error('Orders not found!');
    }

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// Configuration pour récupérer une commande par ID
const getOrderById = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export { config, order, validate, updateOrderToDelivered, getOrders, getOrderById };
