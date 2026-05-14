// routes/orderRoutes.js
import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { adminAuthMiddleware } from '../middlewares/authMiddleware.js';
import {
  createOrder,
  confirmPayment,
  getOrders,
  getOrderById,
  sendOrderEmail,
  updateOrder,
  deleteOrder,
  getUserOrders
} from '../controllers/orderController.js';

const orderRouter = express.Router();

// Protected routes (require authentication)
orderRouter.post('/', authMiddleware, createOrder);
orderRouter.get('/confirm', authMiddleware, confirmPayment);

// Admin routes (require admin authentication)
orderRouter.get('/', getOrders);
orderRouter.put('/:id', adminAuthMiddleware, updateOrder);
orderRouter.delete('/:id', adminAuthMiddleware, deleteOrder);

// User routes (require user authentication)
orderRouter.get("/user", authMiddleware, getUserOrders)
orderRouter.get('/:id', getOrderById);
orderRouter.post('/:id/send-email', authMiddleware, sendOrderEmail);
export default orderRouter;