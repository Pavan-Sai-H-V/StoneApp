const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');

// Create new order
router.post('/', async (req, res) => {
    try {
        const { orderItems, totalPrice, user } = req.body;

        const order = new Order({
            orderItems,
            totalPrice,
            user
        });

        const createdOrder = await order.save();

        // Get admin's WhatsApp number
        const admin = await User.findOne({ isAdmin: true });
        if (admin) {
            // Create WhatsApp message
            const message = `New Order Received!\n\nOrder Items:\n${orderItems.map(item => 
                `${item.name} x ${item.quantity} - $${item.price * item.quantity}`
            ).join('\n')}\n\nTotal Price: $${totalPrice}`;
            
            // WhatsApp link
            const whatsappLink = `https://wa.me/${admin.whatsappNumber}?text=${encodeURIComponent(message)}`;
            
            createdOrder.whatsappSent = true;
            await createdOrder.save();

            res.status(201).json({
                order: createdOrder,
                whatsappLink
            });
        } else {
            res.status(201).json(createdOrder);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user orders
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders (Admin only)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 