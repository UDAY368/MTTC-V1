import prisma from '../config/database.js';

/**
 * Get All DayFlashCardDecks for a Day
 * GET /api/day-flash-decks?dayId=xxx
 */
export const getDayFlashCardDecksByDay = async (req, res, next) => {
  try {
    const { dayId } = req.query;
    if (!dayId) {
      return res.status(400).json({
        success: false,
        message: 'dayId query parameter is required',
      });
    }
    const dayFlashCardDecks = await prisma.dayFlashCardDeck.findMany({
      where: { dayId },
      include: {
        deck: {
          select: {
            id: true,
            title: true,
            uniqueUrl: true,
            description: true,
            _count: { select: { cards: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: dayFlashCardDecks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single DayFlashCardDeck
 * GET /api/day-flash-decks/:id
 */
export const getDayFlashCardDeckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dfd = await prisma.dayFlashCardDeck.findUnique({
      where: { id },
      include: {
        day: { select: { id: true, title: true, courseId: true } },
        deck: { include: { cards: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!dfd) {
      return res.status(404).json({ success: false, message: 'DayFlashCardDeck not found' });
    }
    res.json({ success: true, data: dfd });
  } catch (error) {
    next(error);
  }
};

/**
 * Attach Flash Card Deck to Day
 * POST /api/day-flash-decks
 * Body: { dayId, deckId }
 */
export const attachDeckToDay = async (req, res, next) => {
  try {
    const { dayId, deckId } = req.body;
    if (!dayId || !deckId) {
      return res.status(400).json({
        success: false,
        message: 'dayId and deckId are required',
      });
    }
    const day = await prisma.day.findUnique({ where: { id: dayId } });
    if (!day) {
      return res.status(404).json({ success: false, message: 'Day not found' });
    }
    const deck = await prisma.flashCardDeck.findUnique({ where: { id: deckId } });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Flash card deck not found' });
    }
    const existing = await prisma.dayFlashCardDeck.findUnique({
      where: { dayId_deckId: { dayId, deckId } },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Deck is already attached to this day',
      });
    }
    const last = await prisma.dayFlashCardDeck.findFirst({
      where: { dayId },
      orderBy: { order: 'desc' },
    });
    const order = last ? last.order + 1 : 1;
    const dayFlashCardDeck = await prisma.dayFlashCardDeck.create({
      data: { dayId, deckId, order },
      include: {
        deck: {
          select: {
            id: true,
            title: true,
            uniqueUrl: true,
            description: true,
            _count: { select: { cards: true } },
          },
        },
      },
    });
    res.status(201).json({
      success: true,
      message: 'Flash card deck attached to day successfully',
      data: dayFlashCardDeck,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Deck is already attached to this day',
      });
    }
    next(error);
  }
};

/**
 * Update DayFlashCardDeck (visibility, order)
 * PUT /api/day-flash-decks/:id
 */
export const updateDayFlashCardDeck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVisible } = req.body;
    const updateData = {};
    if (typeof isVisible === 'boolean') updateData.isVisible = isVisible;
    const dayFlashCardDeck = await prisma.dayFlashCardDeck.update({
      where: { id },
      data: updateData,
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
    });
    res.json({
      success: true,
      message: 'DayFlashCardDeck updated successfully',
      data: dayFlashCardDeck,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'DayFlashCardDeck not found' });
    }
    next(error);
  }
};

/**
 * Detach Deck from Day
 * DELETE /api/day-flash-decks/:id
 */
export const detachDeckFromDay = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.dayFlashCardDeck.delete({ where: { id } });
    res.json({ success: true, message: 'Flash card deck detached from day successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'DayFlashCardDeck not found' });
    }
    next(error);
  }
};

/**
 * Reorder DayFlashCardDecks
 * PUT /api/day-flash-decks/reorder
 * Body: { dayFlashCardDeckIds: ['id1', 'id2', ...] }
 */
export const reorderDayFlashCardDecks = async (req, res, next) => {
  try {
    const { dayFlashCardDeckIds } = req.body;
    if (!Array.isArray(dayFlashCardDeckIds) || dayFlashCardDeckIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'dayFlashCardDeckIds must be a non-empty array',
      });
    }
    await Promise.all(
      dayFlashCardDeckIds.map((dfdId, index) =>
        prisma.dayFlashCardDeck.update({
          where: { id: dfdId },
          data: { order: index + 1 },
        })
      )
    );
    res.json({ success: true, message: 'Day flash card decks reordered successfully' });
  } catch (error) {
    next(error);
  }
};
