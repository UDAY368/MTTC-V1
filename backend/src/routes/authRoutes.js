import express from 'express';
import { login, getCurrentAdmin } from '../controllers/authController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticateAdmin, getCurrentAdmin);

export default router;
