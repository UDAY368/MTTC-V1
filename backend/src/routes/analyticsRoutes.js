import express from 'express';
import {
  trackPageVisit,
  getAnalyticsStats,
  getVisitsChartData,
  getQuizAttemptsChartData,
} from '../controllers/analyticsController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route for tracking page visits
router.post('/track', trackPageVisit);

// Protected routes (admin only)
router.get('/stats', authenticateAdmin, getAnalyticsStats);
router.get('/chart/visits', authenticateAdmin, getVisitsChartData);
router.get('/chart/quiz-attempts', authenticateAdmin, getQuizAttemptsChartData);

export default router;
