import express from 'express';
import {
  trackPageVisit,
  getAnalyticsStats,
  getVisitsChartData,
  getQuizAttemptsChartData,
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route for tracking page visits
router.post('/track', trackPageVisit);

// Protected routes (admin only)
router.get('/stats', authenticateToken, getAnalyticsStats);
router.get('/chart/visits', authenticateToken, getVisitsChartData);
router.get('/chart/quiz-attempts', authenticateToken, getQuizAttemptsChartData);

export default router;
