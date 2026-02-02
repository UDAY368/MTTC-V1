import express from 'express';
import {
  getQuizByUrl,
  startQuizAttempt,
  submitAnswer,
  submitQuiz,
  getAttemptResults,
} from '../controllers/publicQuizController.js';
import { getFlashDeckByUrl } from '../controllers/flashCardDeckController.js';
import { getPublicCourses, getPublicCourseById, getPublicCourseLearn, getPublicDefaultCourseId } from '../controllers/courseController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/default-course-id', getPublicDefaultCourseId);
router.get('/courses', getPublicCourses);
router.get('/courses/:id/learn', getPublicCourseLearn);
router.get('/courses/:id', getPublicCourseById);
router.get('/quiz/:uniqueUrl', getQuizByUrl);
router.get('/flash/:uniqueUrl', getFlashDeckByUrl);
router.post('/quiz/:uniqueUrl/start', startQuizAttempt);
router.post('/attempts/:attemptId/answers', submitAnswer);
router.post('/attempts/:attemptId/submit', submitQuiz);
router.get('/attempts/:attemptId', getAttemptResults);

export default router;
