import express from 'express';
import {
  getQuestionsByQuiz,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '../controllers/questionController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// All question routes require admin authentication
router.use(authenticateAdmin);

router.get('/', getQuestionsByQuiz);
router.get('/:id', getQuestionById);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.put('/reorder', reorderQuestions);

export default router;
