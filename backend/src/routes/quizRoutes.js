import express from 'express';
import {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quizController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// All quiz routes require admin authentication
router.use(authenticateAdmin);

router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);

export default router;
