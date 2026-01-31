import prisma from '../config/database.js';
import { generateUniqueFlashDeckUrl } from '../utils/generateUniqueUrl.js';

/**
 * Get All Flash Card Decks (for a course if courseId provided)
 * GET /api/flash-decks?courseId=xxx
 */
export const getAllFlashCardDecks = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const where = courseId ? { courseId } : {};
    const decks = await prisma.flashCardDeck.findMany({
      where,
      include: {
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: decks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Flash Card Deck (with cards)
 * GET /api/flash-decks/:id
 */
export const getFlashCardDeckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deck = await prisma.flashCardDeck.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true } },
        cards: { orderBy: { order: 'asc' } },
      },
    });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Flash card deck not found' });
    }
    res.json({ success: true, data: deck });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Flash Card Deck
 * POST /api/flash-decks
 * Body: { courseId, title, description?, cards: [{ question, answer }] }
 */
export const createFlashCardDeck = async (req, res, next) => {
  try {
    const { courseId, title, description, cards } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and title are required',
      });
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const uniqueUrl = await generateUniqueFlashDeckUrl(prisma, 'flash');
    const cardRows = Array.isArray(cards) && cards.length > 0
      ? cards
          .filter((c) => c && (c.question?.trim() || c.answer?.trim()))
          .map((c, i) => ({
            question: (c.question || '').trim() || 'Question',
            answer: (c.answer || '').trim() || 'Answer',
            order: i + 1,
          }))
      : [];
    const deck = await prisma.flashCardDeck.create({
      data: {
        courseId,
        title: title.trim(),
        description: description?.trim() || null,
        uniqueUrl,
        cards: cardRows.length
          ? { create: cardRows }
          : undefined,
      },
      include: {
        cards: { orderBy: { order: 'asc' } },
      },
    });
    res.status(201).json({
      success: true,
      message: 'Flash card deck created successfully',
      data: deck,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Flash Card Deck (title, description, and replace cards)
 * PUT /api/flash-decks/:id
 * Body: { title?, description?, cards?: [{ question, answer }] }
 */
export const updateFlashCardDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, cards } = req.body;
    const existing = await prisma.flashCardDeck.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Flash card deck not found' });
    }
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (Array.isArray(cards)) {
      await prisma.flashCardDeckCard.deleteMany({ where: { deckId: id } });
      const cardRows = cards
        .filter((c) => c && (c.question?.trim() || c.answer?.trim()))
        .map((c, i) => ({
          deckId: id,
          question: (c.question || '').trim() || 'Question',
          answer: (c.answer || '').trim() || 'Answer',
          order: i + 1,
        }));
      if (cardRows.length) {
        await prisma.flashCardDeckCard.createMany({ data: cardRows });
      }
    }
    const deck = await prisma.flashCardDeck.update({
      where: { id },
      data: updateData,
      include: { cards: { orderBy: { order: 'asc' } } },
    });
    res.json({ success: true, message: 'Flash card deck updated successfully', data: deck });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Flash Card Deck
 * DELETE /api/flash-decks/:id
 */
export const deleteFlashCardDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.flashCardDeck.delete({ where: { id } });
    res.json({ success: true, message: 'Flash card deck deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Flash card deck not found' });
    }
    next(error);
  }
};

/**
 * Get Flash Card Deck by uniqueUrl (public, for full-screen viewer)
 * GET /api/public/flash/:uniqueUrl
 */
export const getFlashDeckByUrl = async (req, res, next) => {
  try {
    const { uniqueUrl } = req.params;
    const deck = await prisma.flashCardDeck.findUnique({
      where: { uniqueUrl },
      include: {
        cards: { orderBy: { order: 'asc' } },
      },
    });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Flash card deck not found' });
    }
    res.json({ success: true, data: deck });
  } catch (error) {
    next(error);
  }
};
