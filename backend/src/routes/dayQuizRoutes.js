import express from 'express';
import {
  getDayQuizzesByDay,
  getDayQuizById,
  attachQuizToDay,
  updateDayQuiz,
  detachQuizFromDay,
  reorderDayQuizzes,
} from '../controllers/dayQuizController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// All day-quiz routes require admin authentication
router.use(authenticateAdmin);

router.get('/', getDayQuizzesByDay);
router.get('/:id', getDayQuizById);
router.post('/', attachQuizToDay);
router.put('/:id', updateDayQuiz);
router.delete('/:id', detachQuizFromDay);
router.put('/reorder', reorderDayQuizzes);

export default router;
