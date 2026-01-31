import express from 'express';
import {
  getAllFlashCardDecks,
  getFlashCardDeckById,
  createFlashCardDeck,
  updateFlashCardDeck,
  deleteFlashCardDeck,
} from '../controllers/flashCardDeckController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateAdmin);

router.get('/', getAllFlashCardDecks);
router.get('/:id', getFlashCardDeckById);
router.post('/', createFlashCardDeck);
router.put('/:id', updateFlashCardDeck);
router.delete('/:id', deleteFlashCardDeck);

export default router;
