import express from 'express';
import {
  getResourcesByDay,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  toggleResourceVisibility,
  reorderResources,
} from '../controllers/resourceController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// All resource routes require admin authentication
router.use(authenticateAdmin);

router.get('/', getResourcesByDay);
router.get('/:id', getResourceById);
router.post('/', createResource);
router.put('/reorder', reorderResources); // Must be before /:id route
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);
router.put('/:id/visibility', toggleResourceVisibility);

export default router;
