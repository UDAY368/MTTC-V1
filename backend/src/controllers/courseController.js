import prisma from '../config/database.js';

/**
 * Get Courses (public) — for landing page, no auth required.
 * GET /api/public/courses
 * Uses a fallback minimal query if the full query fails (e.g. missing related tables on first deploy).
 */
export const getPublicCourses = async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        instructorName: true,
        highlights: { orderBy: { order: 'asc' }, select: { text: true } },
        syllabus: { orderBy: { order: 'asc' }, select: { title: true, description: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: courses });
  } catch (fullError) {
    console.error('[getPublicCourses] Full query failed:', fullError.message || fullError);
    try {
      const coursesMinimal = await prisma.course.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          instructorName: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      const data = coursesMinimal.map((c) => ({
        ...c,
        highlights: [],
        syllabus: [],
      }));
      return res.json({ success: true, data });
    } catch (minimalError) {
      console.error('[getPublicCourses] Minimal query also failed:', minimalError.message || minimalError);
      next(minimalError);
    }
  }
};

/**
 * Get default (first) course ID only — minimal query for landing CTA, no auth.
 * GET /api/public/default-course-id
 * Use when NEXT_PUBLIC_DEFAULT_COURSE_ID is not set so the "About Course" link can work with one fast request.
 */
export const getPublicDefaultCourseId = async (req, res, next) => {
  try {
    const first = await prisma.course.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: first ? { id: first.id } : null });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Course by ID (public) — for About Course page, no auth required.
 * GET /api/public/courses/:id
 */
export const getPublicCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        instructorName: true,
        aboutInstructor: true,
        highlights: { orderBy: { order: 'asc' }, select: { text: true } },
        syllabus: { orderBy: { order: 'asc' }, select: { title: true, description: true } },
      },
    });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Course Learn view (public) — course + days + visible resources & dayQuizzes for consumption.
 * GET /api/public/courses/:id/learn
 */
export const getPublicCourseLearn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        days: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            resources: {
              where: { isVisible: true },
              orderBy: { order: 'asc' },
              include: {
                noteParagraphs: { orderBy: { order: 'asc' } },
                flashCards: { orderBy: { order: 'asc' } },
                shortQuestions: { orderBy: { order: 'asc' } },
                assignmentQuestions: { orderBy: { order: 'asc' } },
                glossaryWords: { orderBy: { order: 'asc' } },
                recommendations: { orderBy: { order: 'asc' } },
              },
            },
            dayQuizzes: {
              where: { isVisible: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                quiz: {
                  select: {
                    id: true,
                    title: true,
                    uniqueUrl: true,
                    durationMinutes: true,
                    totalQuestions: true,
                  },
                },
              },
            },
            dayFlashCardDecks: {
              where: { isVisible: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                deck: {
                  select: {
                    id: true,
                    title: true,
                    uniqueUrl: true,
                    description: true,
                    cards: { orderBy: { order: 'asc' } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    // Shape quiz and flash decks for frontend
    const data = {
      ...course,
      days: course.days.map((day) => ({
        ...day,
        dayQuizzes: day.dayQuizzes.map((dq) => ({
          id: dq.id,
          order: dq.order,
          quiz: {
            id: dq.quiz.id,
            title: dq.quiz.title,
            uniqueUrl: dq.quiz.uniqueUrl,
            durationMinutes: dq.quiz.durationMinutes ?? 0,
            questionCount: dq.quiz.totalQuestions ?? 0,
          },
        })),
        dayFlashCardDecks: day.dayFlashCardDecks.map((dfd) => ({
          id: dfd.id,
          order: dfd.order,
          deck: {
            id: dfd.deck.id,
            title: dfd.deck.title,
            uniqueUrl: dfd.deck.uniqueUrl,
            description: dfd.deck.description ?? null,
            cards: dfd.deck.cards,
          },
        })),
      })),
    };
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Courses
 * GET /api/courses
 */
export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        quizzes: {
          select: {
            id: true,
            title: true,
            uniqueUrl: true,
            isActive: true,
            createdAt: true,
          },
        },
        days: {
          select: {
            id: true,
            title: true,
            order: true,
            createdAt: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        highlights: { orderBy: { order: 'asc' } },
        syllabus: { orderBy: { order: 'asc' } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Course
 * GET /api/courses/:id
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        quizzes: {
          include: {
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
        },
        days: {
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
        },
        highlights: { orderBy: { order: 'asc' } },
        syllabus: { orderBy: { order: 'asc' } },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Course
 * POST /api/courses
 * Body: name, description?, duration?, instructorName?, aboutInstructor?, highlights?: string[], syllabus?: { title, description? }[]
 */
export const createCourse = async (req, res, next) => {
  try {
    const { name, description, duration, instructorName, aboutInstructor, highlights, syllabus } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Course name is required',
      });
    }

    const highlightsList = Array.isArray(highlights)
      ? highlights.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim())
      : [];
    const syllabusList = Array.isArray(syllabus)
      ? syllabus
          .filter((m) => m && (m.title != null && String(m.title).trim() !== ''))
          .map((m, i) => ({
            title: String(m.title).trim(),
            description: m.description != null ? String(m.description).trim() : null,
            order: i + 1,
          }))
      : [];

    const createData = {
      name: name.trim(),
      description: description?.trim() || null,
      duration: duration?.trim() || null,
      instructorName: instructorName?.trim() || null,
      aboutInstructor: aboutInstructor?.trim() || null,
    };
    if (highlightsList.length > 0) {
      createData.highlights = { create: highlightsList.map((text, i) => ({ text, order: i + 1 })) };
    }
    if (syllabusList.length > 0) {
      createData.syllabus = {
        create: syllabusList.map((m, i) => ({
          title: String(m.title).trim(),
          description: m.description != null ? String(m.description).trim() : null,
          order: (m.order != null ? Number(m.order) : i + 1) || i + 1,
        })),
      };
    }

    const course = await prisma.course.create({
      data: createData,
      include: {
        highlights: { orderBy: { order: 'asc' } },
        syllabus: { orderBy: { order: 'asc' } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    console.error('[createCourse]', error.code || error.name, error.message, error.meta || '');
    next(error);
  }
};

/**
 * Update Course
 * PUT /api/courses/:id
 * Body: name, description?, duration?, instructorName?, aboutInstructor?, highlights?: string[], syllabus?: { title, description? }[]
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, duration, instructorName, aboutInstructor, highlights, syllabus } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Course name is required',
      });
    }

    const highlightsList = Array.isArray(highlights)
      ? highlights.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim())
      : undefined;
    const syllabusList = Array.isArray(syllabus)
      ? syllabus
          .filter((m) => m && (m.title != null && String(m.title).trim() !== ''))
          .map((m, i) => ({
            title: String(m.title).trim(),
            description: m.description != null ? String(m.description).trim() : null,
            order: i + 1,
          }))
      : undefined;

    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      duration: duration?.trim() || null,
      instructorName: instructorName?.trim() || null,
      aboutInstructor: aboutInstructor?.trim() || null,
    };

    if (highlightsList !== undefined) {
      await prisma.courseHighlight.deleteMany({ where: { courseId: id } });
      if (highlightsList.length > 0) {
        updateData.highlights = {
          create: highlightsList.map((text, i) => ({ text, order: i + 1 })),
        };
      }
    }
    if (syllabusList !== undefined) {
      await prisma.courseModule.deleteMany({ where: { courseId: id } });
      if (syllabusList.length > 0) {
        updateData.syllabus = {
          create: syllabusList.map(({ title, description: desc, order }) => ({ title, description: desc || null, order })),
        };
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        highlights: { orderBy: { order: 'asc' } },
        syllabus: { orderBy: { order: 'asc' } },
      },
    });

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Course
 * DELETE /api/courses/:id
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.course.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
