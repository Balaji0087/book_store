import express from 'express';
import { adminAuthMiddleware } from '../middlewares/authMiddleware.js';
import {
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getOrderStatusReport,
  getForecast
} from '../controllers/reportController.js';

const reportRouter = express.Router();

// All report routes require admin authentication
reportRouter.get('/sales', adminAuthMiddleware, getSalesReport);
reportRouter.get('/inventory', adminAuthMiddleware, getInventoryReport);
reportRouter.get('/customers', adminAuthMiddleware, getCustomerReport);
reportRouter.get('/order-status', adminAuthMiddleware, getOrderStatusReport);
reportRouter.get('/forecast', adminAuthMiddleware, getForecast);

export default reportRouter;