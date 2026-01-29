import express from 'express';
import {
  getQuizByUrl,
  startQuizAttempt,
  submitAnswer,
  submitQuiz,
  getAttemptResults,
} from '../controllers/publicQuizController.js';
import { getPublicCourses, getPublicCourseById, getPublicCourseLearn } from '../controllers/courseController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/courses', getPublicCourses);
router.get('/courses/:id/learn', getPublicCourseLearn);
router.get('/courses/:id', getPublicCourseById);
router.get('/quiz/:uniqueUrl', getQuizByUrl);
router.post('/quiz/:uniqueUrl/start', startQuizAttempt);
router.post('/attempts/:attemptId/answers', submitAnswer);
router.post('/attempts/:attemptId/submit', submitQuiz);
router.get('/attempts/:attemptId', getAttemptResults);

export default router;
