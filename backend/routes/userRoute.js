import express from 'express';
import {
    registerUser,
    loginUser,
    getAllUsers,
    updateUser,
    deleteUser,
    createUser
   } from '../controllers/userController.js';

const userRouter = express.Router();

// Public
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);

// Admin routes (you might want to add authentication middleware here)
userRouter.post('/create', createUser);
userRouter.get('/all', getAllUsers);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;