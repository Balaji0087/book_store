import express from 'express';
import { adminAuthMiddleware, default as authMiddleware } from '../middlewares/authMiddleware.js';
import {
    registerUser,
    loginUser,
    getAllUsers,
    updateUser,
    deleteUser,
    createUser,
    createAdmin,
    viewBook
} from '../controllers/userController.js';

const userRouter = express.Router();

// Public
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/view-book/:id', authMiddleware, viewBook);

// Public routes (temporary for admin creation)
userRouter.post('/create-admin', createAdmin); // Allow creating admin without auth initially
userRouter.post('/create', adminAuthMiddleware, createUser);
userRouter.get('/all', adminAuthMiddleware, getAllUsers);
userRouter.put('/:id', adminAuthMiddleware, updateUser);
userRouter.delete('/:id', adminAuthMiddleware, deleteUser);

export default userRouter;