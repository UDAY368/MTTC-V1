import express from 'express';
import {
  getDaysByCourse,
  getDayById,
  createDay,
  updateDay,
  deleteDay,
  reorderDays,
  reorderDayItems,
} from '../controllers/dayController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// All day routes require admin authentication
router.use(authenticateAdmin);

router.get('/', getDaysByCourse);
router.get('/:id', getDayById);
router.post('/', createDay);
router.put('/:id/reorder-items', reorderDayItems);
router.put('/:id', updateDay);
router.delete('/:id', deleteDay);
router.put('/reorder', reorderDays);

export default router;
