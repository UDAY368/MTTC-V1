import prisma from '../config/database.js';

/**
 * Track a page visit
 * POST /api/analytics/track
 * Works for any device (mobile, laptop, etc.) - no auth required.
 */
export const trackPageVisit = async (req, res) => {
  try {
    const body = req.body || {};
    const pageUrl = typeof body.pageUrl === 'string' && body.pageUrl.trim()
      ? body.pageUrl.trim()
      : '/';
    const pageType = typeof body.pageType === 'string' ? body.pageType : null;
    const referrer = typeof body.referrer === 'string' ? body.referrer : null;
    const userAgent = typeof body.userAgent === 'string' ? body.userAgent : null;
    const sessionId = typeof body.sessionId === 'string' && body.sessionId.trim()
      ? body.sessionId.trim()
      : null;

    const visit = await prisma.pageVisit.create({
      data: {
        pageUrl,
        pageType,
        referrer,
        userAgent,
        sessionId,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
      },
    });

    res.status(201).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    console.error('Error tracking page visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track page visit',
      error: error.message,
    });
  }
};

/**
 * Get analytics statistics
 * GET /api/analytics/stats?filter=all|today|yesterday|week|month
 */
export const getAnalyticsStats = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;

    // Calculate date range based on filter
    const now = new Date();
    let startDate = null;

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null; // All time
    }

    // Build where clause
    const whereClause = startDate
      ? {
          visitedAt: {
            gte: startDate,
            ...(filter === 'yesterday' ? { lt: endDate } : {}),
          },
        }
      : {};

    // Get total visits
    const totalVisits = await prisma.pageVisit.count({
      where: whereClause,
    });

    // Live users = unique sessions in last 30 minutes (any device); include visits without sessionId
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const recentVisits = await prisma.pageVisit.findMany({
      where: { visitedAt: { gte: thirtyMinutesAgo } },
      select: { sessionId: true },
    });
    const uniqueSessionIds = new Set(
      recentVisits
        .map((v) => v.sessionId)
        .filter((id) => id != null && String(id).trim() !== '')
    );
    const visitsWithoutSession = recentVisits.filter((v) => v.sessionId == null || String(v.sessionId).trim() === '');
    const liveUsersCount = uniqueSessionIds.size + visitsWithoutSession.length;

    // Get total quiz attempts
    const quizAttemptsWhere = startDate
      ? {
          startedAt: {
            gte: startDate,
            ...(filter === 'yesterday' ? { lt: endDate } : {}),
          },
        }
      : {};

    const totalQuizAttempts = await prisma.quizAttempt.count({
      where: quizAttemptsWhere,
    });

    res.json({
      success: true,
      data: {
        totalVisits,
        liveUsers: liveUsersCount,
        totalQuizAttempts,
        filter,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics stats',
      error: error.message,
    });
  }
};

/**
 * Get chart data for visits
 * GET /api/analytics/chart/visits?view=day|month&year=2024&month=1
 */
export const getVisitsChartData = async (req, res) => {
  try {
    const { view = 'day', year, month } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required',
      });
    }

    let data = [];

    if (view === 'day') {
      // Day-wise view requires month
      if (!month) {
        return res.status(400).json({
          success: false,
          message: 'Month is required for day-wise view',
        });
      }

      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      const daysInMonth = endDate.getDate();

      // Get all visits for the month
      const visits = await prisma.pageVisit.findMany({
        where: {
          visitedAt: {
            gte: startDate,
            lte: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59),
          },
        },
        select: {
          visitedAt: true,
        },
      });

      // Group by day
      const visitsByDay = {};
      for (let day = 1; day <= daysInMonth; day++) {
        visitsByDay[day] = 0;
      }

      visits.forEach((visit) => {
        const day = visit.visitedAt.getDate();
        visitsByDay[day]++;
      });

      data = Object.entries(visitsByDay).map(([day, count]) => ({
        label: `Day ${day}`,
        value: count,
      }));
    } else if (view === 'month') {
      // Month-wise view for the entire year
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);

      // Get all visits for the year
      const visits = await prisma.pageVisit.findMany({
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          visitedAt: true,
        },
      });

      // Group by month
      const visitsByMonth = {};
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      for (let month = 0; month < 12; month++) {
        visitsByMonth[month] = 0;
      }

      visits.forEach((visit) => {
        const month = visit.visitedAt.getMonth();
        visitsByMonth[month]++;
      });

      data = Object.entries(visitsByMonth).map(([month, count]) => ({
        label: monthNames[parseInt(month)],
        value: count,
      }));
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching visits chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visits chart data',
      error: error.message,
    });
  }
};

/**
 * Get chart data for quiz attempts
 * GET /api/analytics/chart/quiz-attempts?view=day|month&year=2024&month=1
 */
export const getQuizAttemptsChartData = async (req, res) => {
  try {
    const { view = 'day', year, month } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required',
      });
    }

    let data = [];

    if (view === 'day') {
      // Day-wise view requires month
      if (!month) {
        return res.status(400).json({
          success: false,
          message: 'Month is required for day-wise view',
        });
      }

      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      const daysInMonth = endDate.getDate();

      // Get all quiz attempts for the month
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          startedAt: {
            gte: startDate,
            lte: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59),
          },
        },
        select: {
          startedAt: true,
        },
      });

      // Group by day
      const attemptsByDay = {};
      for (let day = 1; day <= daysInMonth; day++) {
        attemptsByDay[day] = 0;
      }

      attempts.forEach((attempt) => {
        const day = attempt.startedAt.getDate();
        attemptsByDay[day]++;
      });

      data = Object.entries(attemptsByDay).map(([day, count]) => ({
        label: `Day ${day}`,
        value: count,
      }));
    } else if (view === 'month') {
      // Month-wise view for the entire year
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);

      // Get all quiz attempts for the year
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          startedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          startedAt: true,
        },
      });

      // Group by month
      const attemptsByMonth = {};
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      for (let month = 0; month < 12; month++) {
        attemptsByMonth[month] = 0;
      }

      attempts.forEach((attempt) => {
        const month = attempt.startedAt.getMonth();
        attemptsByMonth[month]++;
      });

      data = Object.entries(attemptsByMonth).map(([month, count]) => ({
        label: monthNames[parseInt(month)],
        value: count,
      }));
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching quiz attempts chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempts chart data',
      error: error.message,
    });
  }
};
