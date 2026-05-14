// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

export default async function authMiddleware(req, res, next) {
    // 1. Grab the Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
            .status(401)
            .json({ success: false, message: 'Not authorized, token missing' });
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify & attach user object
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id).select('-password');
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error('JWT verification failed:', err);
        return res
            .status(401)
            .json({ success: false, message: 'Token invalid or expired' });
    }
}

export async function adminAuthMiddleware(req, res, next) {
    // First check if user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
            .status(401)
            .json({ success: false, message: 'Not authorized, token missing' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id).select('-password');
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: 'User not found' });
        }
        
        // Check if user has admin role
        if (user.role !== 'admin') {
            return res
                .status(403)
                .json({ success: false, message: 'Access denied. Admin role required.' });
        }
        
        req.user = user;
        next();
    } catch (err) {
        console.error('JWT verification failed:', err);
        return res
            .status(401)
            .json({ success: false, message: 'Token invalid or expired' });
    }
}