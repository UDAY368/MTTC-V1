import prisma from '../config/database.js';

/**
 * Helper function to get localized text
 * Falls back to English if Telugu text is not available
 */
const getLocalizedText = (item, language) => {
  if (language === 'te' && item.textTe) {
    return item.textTe;
  }
  return item.text;
};

/**
 * Get Quiz by Unique URL (Public Access)
 * GET /api/public/quiz/:uniqueUrl
 * Returns quiz with both English and Telugu text for questions/options
 */
export const getQuizByUrl = async (req, res, next) => {
  try {
    const { uniqueUrl } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { uniqueUrl },
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
              select: {
                id: true,
                text: true,
                textTe: true,
                order: true,
                // Don't expose isCorrect to prevent cheating
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
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

    if (!quiz.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not active',
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
 * Start Quiz Attempt
 * POST /api/public/quiz/:uniqueUrl/start
 * Body: { language: 'en' | 'te' } - defaults to 'en' if not provided
 */
export const startQuizAttempt = async (req, res, next) => {
  try {
    const { uniqueUrl } = req.params;
    const { language = 'en' } = req.body;

    // Validate language
    const validLanguages = ['en', 'te'];
    const selectedLanguage = validLanguages.includes(language) ? language : 'en';

    // Find quiz
    const quiz = await prisma.quiz.findUnique({
      where: { uniqueUrl },
      include: {
        questions: {
          select: {
            id: true,
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

    if (!quiz.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not active',
      });
    }

    // Create quiz attempt with selected language
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        uniqueUrl,
        language: selectedLanguage,
        totalQuestions: quiz.questions.length,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Quiz attempt started',
      data: {
        attemptId: attempt.id,
        startedAt: attempt.startedAt,
        durationMinutes: quiz.durationMinutes,
        totalQuestions: attempt.totalQuestions,
        language: attempt.language,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Answer
 * POST /api/public/attempts/:attemptId/answers
 */
export const submitAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, optionIds } = req.body; // optionIds can be array for multiple choice

    // Validation
    if (!questionId || !optionIds) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and option IDs are required',
      });
    }

    const optionIdsArray = Array.isArray(optionIds) ? optionIds : [optionIds];

    if (optionIdsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one option must be selected',
      });
    }

    // Verify attempt exists and is not submitted
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { id: questionId },
              include: {
                options: {
                  where: {
                    id: { in: optionIdsArray },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found',
      });
    }

    if (attempt.isSubmitted) {
      return res.status(403).json({
        success: false,
        message: 'This quiz attempt has already been submitted',
      });
    }

    // Verify question belongs to this quiz
    const question = attempt.quiz.questions[0];
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in this quiz',
      });
    }

    // Verify all options belong to this question
    const validOptionIds = question.options.map((opt) => opt.id);
    const invalidOptions = optionIdsArray.filter((id) => !validOptionIds.includes(id));

    if (invalidOptions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some options do not belong to this question',
      });
    }

    // Delete existing answers for this question in this attempt
    await prisma.userAnswer.deleteMany({
      where: {
        attemptId,
        questionId,
      },
    });

    // Create new answers
    const userAnswers = await prisma.userAnswer.createMany({
      data: optionIdsArray.map((optionId) => ({
        attemptId,
        questionId,
        optionId,
      })),
    });

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        questionId,
        optionIds: optionIdsArray,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Quiz (Calculate Score)
 * POST /api/public/attempts/:attemptId/submit
 */
export const submitQuiz = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    // Get attempt with all related data
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        userAnswers: true,
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found',
      });
    }

    if (attempt.isSubmitted) {
      return res.status(403).json({
        success: false,
        message: 'This quiz attempt has already been submitted',
      });
    }

    // Calculate score (server-side)
    const { calculateQuizScore } = await import('../utils/scoreCalculator.js');
    const { score, totalQuestions, details } = calculateQuizScore(
      attempt.quiz,
      attempt.userAnswers
    );

    // Update attempt with score and submission time
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        isSubmitted: true,
        submittedAt: new Date(),
        score,
      },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
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
          },
        },
        userAnswers: {
          include: {
            option: true,
            question: true,
          },
        },
      },
    });

    // Get language preference from attempt
    const language = updatedAttempt.language || 'en';

    // Prepare response with correct answers (localized)
    const questionsWithAnswers = updatedAttempt.quiz.questions.map((question) => {
      const correctOptions = question.options.filter((opt) => opt.isCorrect);
      const userSelectedAnswers = updatedAttempt.userAnswers.filter(
        (answer) => answer.questionId === question.id
      );

      return {
        id: question.id,
        text: getLocalizedText(question, language),
        textEn: question.text,
        textTe: question.textTe,
        type: question.type,
        order: question.order,
        correctOptions: correctOptions.map((opt) => ({
          id: opt.id,
          text: getLocalizedText(opt, language),
          textEn: opt.text,
          textTe: opt.textTe,
        })),
        userSelectedOptions: userSelectedAnswers.map((answer) => ({
          id: answer.option.id,
          text: getLocalizedText(answer.option, language),
          textEn: answer.option.text,
          textTe: answer.option.textTe,
        })),
        isCorrect: details.find((d) => d.questionId === question.id)?.isCorrect || false,
      };
    });

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attemptId: updatedAttempt.id,
        score,
        totalQuestions,
        submittedAt: updatedAttempt.submittedAt,
        language,
        questions: questionsWithAnswers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Quiz Attempt Results
 * GET /api/public/attempts/:attemptId
 */
export const getAttemptResults = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
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
          },
        },
        userAnswers: {
          include: {
            option: true,
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found',
      });
    }

    if (!attempt.isSubmitted) {
      return res.status(403).json({
        success: false,
        message: 'This quiz attempt has not been submitted yet',
      });
    }

    // Get language preference from attempt
    const language = attempt.language || 'en';

    // Prepare response with correct answers (localized)
    const questionsWithAnswers = attempt.quiz.questions.map((question) => {
      const correctOptions = question.options.filter((opt) => opt.isCorrect);
      const userSelectedAnswers = attempt.userAnswers.filter(
        (answer) => answer.questionId === question.id
      );

      // Calculate if answer is correct
      const correctOptionIds = new Set(correctOptions.map((opt) => opt.id));
      const userSelectedOptionIds = new Set(
        userSelectedAnswers.map((answer) => answer.optionId)
      );

      let isCorrect = false;
      if (question.type === 'SINGLE_CHOICE') {
        isCorrect =
          userSelectedOptionIds.size === 1 &&
          correctOptionIds.size === 1 &&
          correctOptionIds.has(Array.from(userSelectedOptionIds)[0]);
      } else if (question.type === 'MULTIPLE_CHOICE') {
        const allSelectedAreCorrect = Array.from(userSelectedOptionIds).every((id) =>
          correctOptionIds.has(id)
        );
        const allCorrectAreSelected = Array.from(correctOptionIds).every((id) =>
          userSelectedOptionIds.has(id)
        );
        isCorrect = allSelectedAreCorrect && allCorrectAreSelected && userSelectedOptionIds.size === correctOptionIds.size;
      }

      return {
        id: question.id,
        text: getLocalizedText(question, language),
        textEn: question.text,
        textTe: question.textTe,
        type: question.type,
        order: question.order,
        correctOptions: correctOptions.map((opt) => ({
          id: opt.id,
          text: getLocalizedText(opt, language),
          textEn: opt.text,
          textTe: opt.textTe,
        })),
        userSelectedOptions: userSelectedAnswers.map((answer) => ({
          id: answer.option.id,
          text: getLocalizedText(answer.option, language),
          textEn: answer.option.text,
          textTe: answer.option.textTe,
        })),
        isCorrect,
      };
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        submittedAt: attempt.submittedAt,
        startedAt: attempt.startedAt,
        language,
        quiz: {
          id: attempt.quiz.id,
          title: attempt.quiz.title,
          course: attempt.quiz.course,
        },
        questions: questionsWithAnswers,
      },
    });
  } catch (error) {
    next(error);
  }
};
