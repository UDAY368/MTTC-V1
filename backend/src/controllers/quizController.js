import prisma from '../config/database.js';
import { generateUniqueQuizUrl } from '../utils/generateUniqueUrl.js';

/**
 * Get All Quizzes (for a course if courseId provided)
 * GET /api/quizzes?courseId=xxx
 */
export const getAllQuizzes = async (req, res, next) => {
  try {
    const { courseId } = req.query;

    const where = courseId ? { courseId } : {};

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Quiz (Admin)
 * GET /api/quizzes/:id
 */
export const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        questions: {
          include: {
            options: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Quiz
 * POST /api/quizzes
 */
export const createQuiz = async (req, res, next) => {
  try {
    const { courseId, title, description, totalQuestions, durationMinutes } = req.body;

    // Validation
    if (!courseId || !title || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, and duration are required',
      });
    }

    if (durationMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be greater than 0',
      });
    }

    const totalQuestionsVal = totalQuestions != null ? Math.max(0, parseInt(totalQuestions, 10) || 0) : 0;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Generate unique URL
    const uniqueUrl = await generateUniqueQuizUrl(prisma, 'quiz');

    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title: title.trim(),
        description: description?.trim() || null,
        totalQuestions: totalQuestionsVal,
        durationMinutes: parseInt(durationMinutes),
        uniqueUrl,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Quiz
 * PUT /api/quizzes/:id
 */
export const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, totalQuestions, durationMinutes, isActive } = req.body;

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (totalQuestions !== undefined) {
      updateData.totalQuestions = Math.max(0, parseInt(totalQuestions, 10) || 0);
    }

    if (durationMinutes !== undefined) {
      if (durationMinutes <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be greater than 0',
        });
      }
      updateData.durationMinutes = parseInt(durationMinutes);
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Quiz
 * DELETE /api/quizzes/:id
 */
export const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.quiz.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
