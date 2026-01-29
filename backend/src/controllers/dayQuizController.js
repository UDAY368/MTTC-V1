import prisma from '../config/database.js';

/**
 * Get All DayQuizzes for a Day
 * GET /api/day-quizzes?dayId=xxx
 */
export const getDayQuizzesByDay = async (req, res, next) => {
  try {
    const { dayId } = req.query;

    if (!dayId) {
      return res.status(400).json({
        success: false,
        message: 'dayId query parameter is required',
      });
    }

    const dayQuizzes = await prisma.dayQuiz.findMany({
      where: { dayId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            uniqueUrl: true,
            durationMinutes: true,
            isActive: true,
            description: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json({
      success: true,
      data: dayQuizzes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single DayQuiz
 * GET /api/day-quizzes/:id
 */
export const getDayQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dayQuiz = await prisma.dayQuiz.findUnique({
      where: { id },
      include: {
        day: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
        quiz: {
          include: {
            _count: {
              select: {
                questions: true,
                attempts: true,
              },
            },
          },
        },
      },
    });

    if (!dayQuiz) {
      return res.status(404).json({
        success: false,
        message: 'DayQuiz not found',
      });
    }

    res.json({
      success: true,
      data: dayQuiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Attach Quiz to Day
 * POST /api/day-quizzes
 */
export const attachQuizToDay = async (req, res, next) => {
  try {
    const { dayId, quizId } = req.body;

    if (!dayId || !quizId) {
      return res.status(400).json({
        success: false,
        message: 'dayId and quizId are required',
      });
    }

    // Verify day exists
    const day = await prisma.day.findUnique({
      where: { id: dayId },
    });

    if (!day) {
      return res.status(404).json({
        success: false,
        message: 'Day not found',
      });
    }

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Check if quiz is already attached to this day
    const existing = await prisma.dayQuiz.findUnique({
      where: {
        dayId_quizId: {
          dayId,
          quizId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Quiz is already attached to this day',
      });
    }

    // Get the highest order value for this day
    const lastDayQuiz = await prisma.dayQuiz.findFirst({
      where: { dayId },
      orderBy: { order: 'desc' },
    });

    const order = lastDayQuiz ? lastDayQuiz.order + 1 : 1;

    const dayQuiz = await prisma.dayQuiz.create({
      data: {
        dayId,
        quizId,
        order,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            uniqueUrl: true,
            durationMinutes: true,
            isActive: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Quiz attached to day successfully',
      data: dayQuiz,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Quiz is already attached to this day',
      });
    }
    next(error);
  }
};

/**
 * Update DayQuiz
 * PUT /api/day-quizzes/:id
 */
export const updateDayQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVisible } = req.body;

    const updateData = {};

    if (isVisible !== undefined) {
      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isVisible must be a boolean',
        });
      }
      updateData.isVisible = isVisible;
    }

    const dayQuiz = await prisma.dayQuiz.update({
      where: { id },
      data: updateData,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            uniqueUrl: true,
            durationMinutes: true,
            isActive: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'DayQuiz updated successfully',
      data: dayQuiz,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'DayQuiz not found',
      });
    }
    next(error);
  }
};

/**
 * Detach Quiz from Day
 * DELETE /api/day-quizzes/:id
 */
export const detachQuizFromDay = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.dayQuiz.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Quiz detached from day successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'DayQuiz not found',
      });
    }
    next(error);
  }
};

/**
 * Reorder DayQuizzes
 * PUT /api/day-quizzes/reorder
 * Body: { dayQuizIds: ['id1', 'id2', 'id3'] } - ordered array of dayQuiz IDs
 */
export const reorderDayQuizzes = async (req, res, next) => {
  try {
    const { dayQuizIds } = req.body;

    if (!Array.isArray(dayQuizIds) || dayQuizIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'dayQuizIds must be a non-empty array',
      });
    }

    // Update order for each dayQuiz
    const updatePromises = dayQuizIds.map((dayQuizId, index) =>
      prisma.dayQuiz.update({
        where: { id: dayQuizId },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'DayQuizzes reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
