import dotenv from 'dotenv';
dotenv.config();

// Env must be loaded before any module that uses DATABASE_URL (e.g. Prisma)
import './config/env.js';
import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import prisma from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import dayRoutes from './routes/dayRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import dayQuizRoutes from './routes/dayQuizRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: allow FRONTEND_URL (comma-separated) and always allow localhost for local dev
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = frontendOrigin.split(',').map((o) => o.trim()).filter(Boolean);
const localhostOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, origin);
    if (localhostOrigins.includes(origin)) return cb(null, origin);
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/days', dayRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/day-quizzes', dayQuizRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server and verify DB connection
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');
  } catch (dbErr) {
    console.error('❌ Database connection failed:', dbErr.message || dbErr);
    console.error('   Ensure DATABASE_URL is set and run: npx prisma migrate deploy');
  }
});
