import prisma from '../config/database.js';

/**
 * Get All Days for a Course
 * GET /api/days?courseId=xxx
 */
export const getDaysByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'courseId query parameter is required',
      });
    }

    const days = await prisma.day.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            resources: true,
            dayQuizzes: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json({
      success: true,
      data: days,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Day with all resources
 * GET /api/days/:id
 */
export const getDayById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const day = await prisma.day.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        resources: {
          orderBy: {
            order: 'asc',
          },
          include: {
            noteParagraphs: {
              orderBy: {
                order: 'asc',
              },
            },
            flashCards: {
              orderBy: {
                order: 'asc',
              },
            },
            shortQuestions: {
              orderBy: {
                order: 'asc',
              },
            },
            assignmentQuestions: {
              orderBy: {
                order: 'asc',
              },
            },
            glossaryWords: {
              orderBy: {
                order: 'asc',
              },
            },
            recommendations: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        dayQuizzes: {
          orderBy: {
            order: 'asc',
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
        },
        dayFlashCardDecks: {
          orderBy: {
            order: 'asc',
          },
          include: {
            deck: {
              select: {
                id: true,
                title: true,
                uniqueUrl: true,
                _count: { select: { cards: true } },
              },
            },
          },
        },
      },
    });

    if (!day) {
      return res.status(404).json({
        success: false,
        message: 'Day not found',
      });
    }

    res.json({
      success: true,
      data: day,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Day
 * POST /api/days
 */
export const createDay = async (req, res, next) => {
  try {
    const { courseId, title, description } = req.body;

    if (!courseId || !title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'courseId and title are required',
      });
    }

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

    // Get the highest order value for this course
    const lastDay = await prisma.day.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const order = lastDay ? lastDay.order + 1 : 1;

    const day = await prisma.day.create({
      data: {
        courseId,
        title: title.trim(),
        description: description?.trim() || null,
        order,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Day created successfully',
      data: day,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Day
 * PUT /api/days/:id
 */
export const updateDay = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'title is required',
      });
    }

    const day = await prisma.day.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    res.json({
      success: true,
      message: 'Day updated successfully',
      data: day,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Day not found',
      });
    }
    next(error);
  }
};

/**
 * Delete Day
 * DELETE /api/days/:id
 */
export const deleteDay = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.day.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Day deleted successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Day not found',
      });
    }
    next(error);
  }
};

/**
 * Reorder Days
 * PUT /api/days/reorder
 * Body: { dayIds: ['id1', 'id2', 'id3'] } - ordered array of day IDs
 */
export const reorderDays = async (req, res, next) => {
  try {
    const { dayIds } = req.body;

    if (!Array.isArray(dayIds) || dayIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'dayIds must be a non-empty array',
      });
    }

    // Update order for each day
    const updatePromises = dayIds.map((dayId, index) =>
      prisma.day.update({
        where: { id: dayId },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Days reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder items (resources + dayQuizzes) within a day
 * PUT /api/days/:id/reorder-items
 * Body: { items: [ { type: 'resource', id }, { type: 'dayQuiz', id }, ... ] }
 */
export const reorderDayItems = async (req, res, next) => {
  try {
    const { id: dayId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items must be a non-empty array of { type, id }',
      });
    }

    const order = {};
    items.forEach((item, index) => {
      if (!order[item.type]) order[item.type] = [];
      order[item.type].push({ id: item.id, order: index + 1 });
    });

    const resourceUpdates = (order.resource || []).map(({ id, order: o }) =>
      prisma.resource.updateMany({
        where: { id, dayId },
        data: { order: o },
      })
    );
    const dayQuizUpdates = (order.dayQuiz || []).map(({ id, order: o }) =>
      prisma.dayQuiz.updateMany({
        where: { id, dayId },
        data: { order: o },
      })
    );

    await Promise.all([...resourceUpdates, ...dayQuizUpdates]);

    res.json({
      success: true,
      message: 'Items reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
