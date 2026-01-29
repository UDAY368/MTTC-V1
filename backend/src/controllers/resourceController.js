import prisma from '../config/database.js';

/**
 * Get All Resources for a Day
 * GET /api/resources?dayId=xxx
 */
export const getResourcesByDay = async (req, res, next) => {
  try {
    const { dayId } = req.query;

    if (!dayId) {
      return res.status(400).json({
        success: false,
        message: 'dayId query parameter is required',
      });
    }

    const resources = await prisma.resource.findMany({
      where: { dayId },
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
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Resource
 * GET /api/resources/:id
 */
export const getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        day: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
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
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Resource
 * POST /api/resources
 */
export const createResource = async (req, res, next) => {
  try {
    const {
      dayId,
      type,
      title,
      videoUrl, // VIDEO
      question, // SHORT_QUESTIONS (legacy - single Q&A)
      answer, // SHORT_QUESTIONS (legacy - single Q&A)
      shortQuestions, // SHORT_QUESTIONS (array of {question, answer})
      assignmentQuestion, // ASSIGNMENT (legacy - single question)
      assignmentQuestions, // ASSIGNMENT (array of {question})
      noteParagraphs, // NOTES (array of {heading, content})
      flashCards, // FLASH_CARDS (array of {question, answer})
      glossaryWords, // GLOSSARY (array of {word, meaning})
      recommendations, // RECOMMENDATION (array of {title, content})
    } = req.body;

    // Validation
    if (!dayId || !type) {
      return res.status(400).json({
        success: false,
        message: 'dayId and type are required',
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

    // Validate type-specific fields
    if (type === 'VIDEO' && !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'videoUrl is required for VIDEO type',
      });
    }

    if (type === 'SHORT_QUESTIONS') {
      // Support both legacy single Q&A and new array format
      if (shortQuestions && Array.isArray(shortQuestions)) {
        if (shortQuestions.length === 0 || shortQuestions.some(q => !q.question?.trim() || !q.answer?.trim())) {
          return res.status(400).json({
            success: false,
            message: 'At least one question with both question and answer is required for SHORT_QUESTIONS type',
          });
        }
      } else if (!question || !answer) {
        return res.status(400).json({
          success: false,
          message: 'question and answer are required for SHORT_QUESTIONS type',
        });
      }
    }

    if (type === 'ASSIGNMENT') {
      // Support both legacy single question and new array format
      if (assignmentQuestions && Array.isArray(assignmentQuestions)) {
        if (assignmentQuestions.length === 0 || assignmentQuestions.some(aq => !aq.question?.trim())) {
          return res.status(400).json({
            success: false,
            message: 'At least one assignment question is required for ASSIGNMENT type',
          });
        }
      } else if (!assignmentQuestion) {
        return res.status(400).json({
          success: false,
          message: 'assignmentQuestion is required for ASSIGNMENT type',
        });
      }
    }

    if (type === 'GLOSSARY') {
      if (!Array.isArray(glossaryWords) || glossaryWords.length === 0 || glossaryWords.some(gw => !gw.word?.trim() || !gw.meaning?.trim())) {
        return res.status(400).json({
          success: false,
          message: 'At least one glossary word with word and meaning is required for GLOSSARY type',
        });
      }
    }

    if (type === 'RECOMMENDATION') {
      if (!Array.isArray(recommendations) || recommendations.length === 0 || recommendations.some(r => !r.title?.trim() || !r.content?.trim())) {
        return res.status(400).json({
          success: false,
          message: 'At least one recommendation with title and content is required for RECOMMENDATION type',
        });
      }
    }

    if ((type === 'NOTES' || type === 'BRIEF_NOTES') && (!Array.isArray(noteParagraphs) || noteParagraphs.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'noteParagraphs array is required for NOTES and BRIEF_NOTES types',
      });
    }

    if (type === 'FLASH_CARDS' && (!Array.isArray(flashCards) || flashCards.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'flashCards array is required for FLASH_CARDS type',
      });
    }

    // Get the highest order value for this day
    const lastResource = await prisma.resource.findFirst({
      where: { dayId },
      orderBy: { order: 'desc' },
    });

    const order = lastResource ? lastResource.order + 1 : 1;

    // Use Prisma enum value when available (ensures BRIEF_NOTES and other enums are accepted)
    const resourceType = prisma.ResourceType?.[type] ?? type;

    // Create resource with type-specific data
    const resourceData = {
      dayId,
      type: resourceType,
      title: title?.trim() || null,
      order,
      videoUrl: type === 'VIDEO' ? videoUrl.trim() : null,
      // For SHORT_QUESTIONS: use first question/answer for backward compatibility, or legacy fields
      question: type === 'SHORT_QUESTIONS' 
        ? (shortQuestions && Array.isArray(shortQuestions) && shortQuestions.length > 0 
            ? shortQuestions[0].question.trim() 
            : question?.trim() || null)
        : null,
      answer: type === 'SHORT_QUESTIONS' 
        ? (shortQuestions && Array.isArray(shortQuestions) && shortQuestions.length > 0 
            ? shortQuestions[0].answer.trim() 
            : answer?.trim() || null)
        : null,
      // For ASSIGNMENT: use first question for backward compatibility, or legacy field
      assignmentQuestion: type === 'ASSIGNMENT' 
        ? (assignmentQuestions && Array.isArray(assignmentQuestions) && assignmentQuestions.length > 0 
            ? assignmentQuestions[0].question.trim() 
            : assignmentQuestion?.trim() || null)
        : null,
    };

    // Create resource with nested data
    const resource = await prisma.resource.create({
      data: {
        ...resourceData,
        ...((type === 'NOTES' || type === 'BRIEF_NOTES') && {
          noteParagraphs: {
            create: noteParagraphs.map((para, index) => ({
              heading: para.heading?.trim() || null,
              content: para.content.trim(),
              order: index + 1,
            })),
          },
        }),
        ...(type === 'FLASH_CARDS' && {
          flashCards: {
            create: flashCards.map((card, index) => ({
              question: card.question.trim(),
              answer: card.answer.trim(),
              order: index + 1,
            })),
          },
        }),
        ...(type === 'SHORT_QUESTIONS' && shortQuestions && Array.isArray(shortQuestions) && {
          shortQuestions: {
            create: shortQuestions.map((qa, index) => ({
              question: qa.question.trim(),
              answer: qa.answer.trim(),
              order: index + 1,
            })),
          },
        }),
        ...(type === 'ASSIGNMENT' && assignmentQuestions && Array.isArray(assignmentQuestions) && {
          assignmentQuestions: {
            create: assignmentQuestions.map((aq, index) => ({
              question: aq.question.trim(),
              order: index + 1,
            })),
          },
        }),
        ...(type === 'GLOSSARY' && glossaryWords && Array.isArray(glossaryWords) && {
          glossaryWords: {
            create: glossaryWords.map((gw, index) => ({
              word: gw.word.trim(),
              meaning: gw.meaning.trim(),
              order: index + 1,
            })),
          },
        }),
        ...(type === 'RECOMMENDATION' && recommendations && Array.isArray(recommendations) && {
          recommendations: {
            create: recommendations.map((r, index) => ({
              title: r.title.trim(),
              content: r.content.trim(),
              order: index + 1,
            })),
          },
        }),
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
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Resource
 * PUT /api/resources/:id
 */
export const updateResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      videoUrl,
      question,
      answer,
      shortQuestions,
      assignmentQuestion,
      assignmentQuestions,
      noteParagraphs,
      flashCards,
      glossaryWords,
      recommendations,
      isVisible,
    } = req.body;

    // Get existing resource to know its type
    const existingResource = await prisma.resource.findUnique({
      where: { id },
      include: {
        noteParagraphs: true,
        flashCards: true,
        shortQuestions: true,
        assignmentQuestions: true,
        glossaryWords: true,
        recommendations: true,
      },
    });

    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const type = existingResource.type;

    // Build update data
    const updateData = {};

    if (title !== undefined) {
      updateData.title = title?.trim() || null;
    }

    if (isVisible !== undefined) {
      updateData.isVisible = isVisible;
    }

    // Type-specific updates
    if (type === 'VIDEO' && videoUrl !== undefined) {
      if (!videoUrl || videoUrl.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'videoUrl is required for VIDEO type',
        });
      }
      updateData.videoUrl = videoUrl.trim();
    }

    if (type === 'SHORT_QUESTIONS') {
      // Support both legacy single Q&A and new array format
      if (shortQuestions !== undefined && Array.isArray(shortQuestions)) {
        if (shortQuestions.length === 0 || shortQuestions.some(q => !q.question?.trim() || !q.answer?.trim())) {
          return res.status(400).json({
            success: false,
            message: 'At least one question with both question and answer is required',
          });
        }
        // Delete existing short questions and create new ones
        await prisma.shortQuestion.deleteMany({
          where: { resourceId: id },
        });
      } else if (question !== undefined || answer !== undefined) {
        // Legacy single Q&A format
        if (question !== undefined) {
          if (!question || question.trim() === '') {
            return res.status(400).json({
              success: false,
              message: 'question is required',
            });
          }
          updateData.question = question.trim();
        }
        if (answer !== undefined) {
          if (!answer || answer.trim() === '') {
            return res.status(400).json({
              success: false,
              message: 'answer is required',
            });
          }
          updateData.answer = answer.trim();
        }
      }
    }

    if (type === 'ASSIGNMENT') {
      // Support both legacy single question and new array format
      if (assignmentQuestions !== undefined && Array.isArray(assignmentQuestions)) {
        if (assignmentQuestions.length === 0 || assignmentQuestions.some(aq => !aq.question?.trim())) {
          return res.status(400).json({
            success: false,
            message: 'At least one assignment question is required',
          });
        }
        // Delete existing assignment questions and create new ones
        await prisma.assignmentQuestion.deleteMany({
          where: { resourceId: id },
        });
        updateData.assignmentQuestions = {
          create: assignmentQuestions.map((aq, index) => ({
            question: aq.question.trim(),
            order: index + 1,
          })),
        };
      } else if (assignmentQuestion !== undefined) {
        // Legacy single question format
        if (!assignmentQuestion || assignmentQuestion.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'assignmentQuestion is required for ASSIGNMENT type',
          });
        }
        updateData.assignmentQuestion = assignmentQuestion.trim();
      }
    }

    if (type === 'GLOSSARY' && glossaryWords !== undefined) {
      if (!Array.isArray(glossaryWords) || glossaryWords.length === 0 || glossaryWords.some(gw => !gw.word?.trim() || !gw.meaning?.trim())) {
        return res.status(400).json({
          success: false,
          message: 'At least one glossary word with word and meaning is required',
        });
      }
      // Delete existing glossary words and create new ones
      await prisma.glossaryWord.deleteMany({
        where: { resourceId: id },
      });
      updateData.glossaryWords = {
        create: glossaryWords.map((gw, index) => ({
          word: gw.word.trim(),
          meaning: gw.meaning.trim(),
          order: index + 1,
        })),
      };
    }

    if (type === 'RECOMMENDATION' && recommendations !== undefined) {
      if (!Array.isArray(recommendations) || recommendations.length === 0 || recommendations.some(r => !r.title?.trim() || !r.content?.trim())) {
        return res.status(400).json({
          success: false,
          message: 'At least one recommendation with title and content is required',
        });
      }
      await prisma.recommendation.deleteMany({
        where: { resourceId: id },
      });
      updateData.recommendations = {
        create: recommendations.map((r, index) => ({
          title: r.title.trim(),
          content: r.content.trim(),
          order: index + 1,
        })),
      };
    }

    // Handle NOTES and BRIEF_NOTES paragraphs update
    if ((type === 'NOTES' || type === 'BRIEF_NOTES') && noteParagraphs !== undefined) {
      if (!Array.isArray(noteParagraphs) || noteParagraphs.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'noteParagraphs must be a non-empty array',
        });
      }

      // Delete existing paragraphs and create new ones
      await prisma.noteParagraph.deleteMany({
        where: { resourceId: id },
      });

      updateData.noteParagraphs = {
        create: noteParagraphs.map((para, index) => ({
          heading: para.heading?.trim() || null,
          content: para.content.trim(),
          order: index + 1,
        })),
      };
    }

    // Handle FLASH_CARDS update
    if (type === 'FLASH_CARDS' && flashCards !== undefined) {
      if (!Array.isArray(flashCards) || flashCards.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'flashCards must be a non-empty array',
        });
      }

      // Delete existing cards and create new ones
      await prisma.flashCard.deleteMany({
        where: { resourceId: id },
      });

      updateData.flashCards = {
        create: flashCards.map((card, index) => ({
          question: card.question.trim(),
          answer: card.answer.trim(),
          order: index + 1,
        })),
      };
    }

    // Handle SHORT_QUESTIONS update (array format)
    if (type === 'SHORT_QUESTIONS' && shortQuestions !== undefined && Array.isArray(shortQuestions)) {
      // Delete existing short questions and create new ones
      await prisma.shortQuestion.deleteMany({
        where: { resourceId: id },
      });

      updateData.shortQuestions = {
        create: shortQuestions.map((qa, index) => ({
          question: qa.question.trim(),
          answer: qa.answer.trim(),
          order: index + 1,
        })),
      };
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
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
    });

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: resource,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }
    next(error);
  }
};

/**
 * Delete Resource
 * DELETE /api/resources/:id
 */
export const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.resource.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }
    next(error);
  }
};

/**
 * Toggle Resource Visibility
 * PUT /api/resources/:id/visibility
 */
export const toggleResourceVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVisible } = req.body;

    if (typeof isVisible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVisible must be a boolean',
      });
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: { isVisible },
    });

    res.json({
      success: true,
      message: `Resource ${isVisible ? 'shown' : 'hidden'} successfully`,
      data: resource,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }
    next(error);
  }
};

/**
 * Reorder Resources
 * PUT /api/resources/reorder
 * Body: { resourceIds: ['id1', 'id2', 'id3'] } - ordered array of resource IDs
 */
export const reorderResources = async (req, res, next) => {
  try {
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'resourceIds must be a non-empty array',
      });
    }

    // Update order for each resource
    const updatePromises = resourceIds.map((resourceId, index) =>
      prisma.resource.update({
        where: { id: resourceId },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Resources reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
