// routes/orderRoutes.js
import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import {
  createOrder,
  confirmPayment,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getUserOrders
} from '../controllers/orderController.js';

const orderRouter = express.Router();

// Protected routes (require authentication)
orderRouter.post('/', authMiddleware, createOrder);
orderRouter.get('/confirm', authMiddleware, confirmPayment);

// Public routes
orderRouter.get('/', getOrders);
orderRouter.get("/user", authMiddleware, getUserOrders)
orderRouter.get('/:id', getOrderById);
orderRouter.put('/:id', updateOrder);
orderRouter.delete('/:id', deleteOrder);

export default orderRouter;