// routes/bookRoute.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBook, getBooks, updateBook, deleteBook, getRecommendations } from '../controllers/bookController.js';
import { adminAuthMiddleware, default as authMiddleware } from '../middlewares/authMiddleware.js';

const bookRouter = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/'),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

bookRouter.post('/', adminAuthMiddleware, upload.single('image'), createBook);
bookRouter.get('/recommendations', authMiddleware, getRecommendations);
bookRouter.get('/', getBooks);
bookRouter.put('/:id', adminAuthMiddleware, upload.single('image'), updateBook); // Reuse createBook for updates
bookRouter.delete('/:id', adminAuthMiddleware, deleteBook);

export default bookRouter;
