import express from 'express';
import {
  getDayFlashCardDecksByDay,
  getDayFlashCardDeckById,
  attachDeckToDay,
  updateDayFlashCardDeck,
  detachDeckFromDay,
  reorderDayFlashCardDecks,
} from '../controllers/dayFlashCardDeckController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateAdmin);

router.get('/', getDayFlashCardDecksByDay);
router.get('/:id', getDayFlashCardDeckById);
router.post('/', attachDeckToDay);
router.put('/:id', updateDayFlashCardDeck);
router.delete('/:id', detachDeckFromDay);
router.put('/reorder', reorderDayFlashCardDecks);

export default router;
