import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, handleChat);

export default router;
