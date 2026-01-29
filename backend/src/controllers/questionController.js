import prisma from '../config/database.js';

/**
 * Get All Questions for a Quiz
 * GET /api/questions?quizId=xxx
 */
export const getQuestionsByQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.query;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID is required',
      });
    }

    const questions = await prisma.question.findMany({
      where: { quizId },
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
    });

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Question
 * GET /api/questions/:id
 */
export const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Question with Options
 * POST /api/questions
 * Supports bilingual text (English: text, Telugu: textTe)
 */
export const createQuestion = async (req, res, next) => {
  try {
    const { quizId, text, textTe, type, options } = req.body;

    // Validation
    if (!quizId || !text || !type) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID, text, and type are required',
      });
    }

    if (!['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be SINGLE_CHOICE or MULTIPLE_CHOICE',
      });
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 options are required',
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

    // Get current max order for this quiz
    const maxOrder = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (maxOrder?.order || 0) + 1;

    // Validate options
    const hasCorrectAnswer = options.some((opt) => opt.isCorrect);
    if (!hasCorrectAnswer) {
      return res.status(400).json({
        success: false,
        message: 'At least one option must be marked as correct',
      });
    }

    // For single choice, only one option should be correct
    if (type === 'SINGLE_CHOICE') {
      const correctCount = options.filter((opt) => opt.isCorrect).length;
      if (correctCount !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Single choice questions must have exactly one correct answer',
        });
      }
    }

    // Create question with options (supports bilingual text)
    const question = await prisma.question.create({
      data: {
        quizId,
        text: text.trim(),
        textTe: textTe ? textTe.trim() : null,
        type,
        order: nextOrder,
        options: {
          create: options.map((opt, index) => ({
            text: opt.text.trim(),
            textTe: opt.textTe ? opt.textTe.trim() : null,
            isCorrect: Boolean(opt.isCorrect),
            order: index + 1,
          })),
        },
      },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Question
 * PUT /api/questions/:id
 * Supports bilingual text (English: text, Telugu: textTe)
 */
export const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, textTe, type, options } = req.body;

    const updateData = {};

    if (text !== undefined) {
      updateData.text = text.trim();
    }

    if (textTe !== undefined) {
      updateData.textTe = textTe ? textTe.trim() : null;
    }

    if (type !== undefined) {
      if (!['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be SINGLE_CHOICE or MULTIPLE_CHOICE',
        });
      }
      updateData.type = type;
    }

    // If options are provided, validate and update
    if (options && Array.isArray(options)) {
      if (options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 options are required',
        });
      }

      const hasCorrectAnswer = options.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        return res.status(400).json({
          success: false,
          message: 'At least one option must be marked as correct',
        });
      }

      const questionType = type || (await prisma.question.findUnique({ where: { id }, select: { type: true } }))?.type;

      if (questionType === 'SINGLE_CHOICE') {
        const correctCount = options.filter((opt) => opt.isCorrect).length;
        if (correctCount !== 1) {
          return res.status(400).json({
            success: false,
            message: 'Single choice questions must have exactly one correct answer',
          });
        }
      }

      // Delete existing options and create new ones
      await prisma.option.deleteMany({
        where: { questionId: id },
      });

      updateData.options = {
        create: options.map((opt, index) => ({
          text: opt.text.trim(),
          textTe: opt.textTe ? opt.textTe.trim() : null,
          isCorrect: Boolean(opt.isCorrect),
          order: index + 1,
        })),
      };
    }

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Question
 * DELETE /api/questions/:id
 */
export const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.question.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder Questions
 * PUT /api/questions/reorder
 */
export const reorderQuestions = async (req, res, next) => {
  try {
    const { questionOrders } = req.body; // Array of { id, order }

    if (!Array.isArray(questionOrders)) {
      return res.status(400).json({
        success: false,
        message: 'questionOrders must be an array',
      });
    }

    // Update all questions in a transaction
    await prisma.$transaction(
      questionOrders.map(({ id, order }) =>
        prisma.question.update({
          where: { id },
          data: { order },
        })
      )
    );

    res.json({
      success: true,
      message: 'Questions reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
