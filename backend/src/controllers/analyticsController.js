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
 * Helper: build date range from filter (same logic as stats)
 */
function getDateRangeFromFilter(filter) {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  switch (filter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getTime());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime());
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime());
      break;
    default:
      startDate = null; // all time
      endDate = null;
  }
  return { startDate, endDate };
}

/**
 * Get chart data for visits
 * GET /api/analytics/chart/visits?view=day|month&year=2024&month=1
 * When filter is provided, chart uses same date range as stats (sum matches stats)
 */
export const getVisitsChartData = async (req, res) => {
  try {
    const { view, year, month, filter } = req.query;
    const viewVal = Array.isArray(view) ? view[0] : view;
    const yearVal = Array.isArray(year) ? year[0] : year;
    const monthVal = Array.isArray(month) ? month[0] : month;
    const v = String(viewVal || 'day').toLowerCase().trim();
    const now = new Date();
    const y = yearVal != null && String(yearVal).trim() ? String(yearVal).trim() : (v === 'day' || v === 'month' ? String(now.getFullYear()) : null);
    const m = monthVal != null && String(monthVal).trim() ? String(monthVal).trim() : (v === 'day' && y ? String(now.getMonth() + 1) : null);

    // 1) Day-wise: X = days 1..31 of selected month, Y = visit count — always when view=day (never use filter branch)
    if (v === 'day' && y && m) {
      const monthNum = Math.min(12, Math.max(1, parseInt(m, 10) || 1));
      const startDate = new Date(parseInt(y, 10), monthNum - 1, 1);
      const endDate = new Date(parseInt(y, 10), monthNum, 0);
      const daysInMonth = endDate.getDate();

      const visits = await prisma.pageVisit.findMany({
        where: {
          visitedAt: {
            gte: startDate,
            lte: new Date(parseInt(y, 10), monthNum, 0, 23, 59, 59),
          },
        },
        select: { visitedAt: true },
      });

      const visitsByDay = {};
      for (let day = 1; day <= daysInMonth; day++) {
        visitsByDay[day] = 0;
      }
      visits.forEach((visit) => {
        const day = visit.visitedAt.getDate();
        visitsByDay[day]++;
      });

      const data = Object.entries(visitsByDay)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([day, count]) => ({ label: `Day ${day}`, value: count }));
      return res.json({ success: true, data });
    }

    // 2) Month-wise: X = Jan–Dec for selected year, Y = visit count
    if (v === 'month' && y) {
      const startDate = new Date(parseInt(y, 10), 0, 1);
      const endDate = new Date(parseInt(y, 10), 11, 31, 23, 59, 59);
      const visits = await prisma.pageVisit.findMany({
        where: { visitedAt: { gte: startDate, lte: endDate } },
        select: { visitedAt: true },
      });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const visitsByMonth = {};
      for (let mo = 0; mo < 12; mo++) visitsByMonth[mo] = 0;
      visits.forEach((visit) => {
        const mo = visit.visitedAt.getMonth();
        visitsByMonth[mo]++;
      });
      const data = Object.entries(visitsByMonth)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([mo, count]) => ({
          label: monthNames[parseInt(mo, 10)],
          value: count,
        }));
      return res.json({ success: true, data });
    }

    // 3) Fallback: use filter (All Time / Today / etc.) so chart sum can match stats
    if (filter && ['all', 'today', 'yesterday', 'week', 'month'].includes(String(filter))) {
      const { startDate, endDate } = getDateRangeFromFilter(filter);
      const whereClause = startDate
        ? { visitedAt: { gte: startDate, ...(endDate ? { lt: endDate } : {}) } }
        : {};

      const visits = await prisma.pageVisit.findMany({
        where: whereClause,
        select: { visitedAt: true },
      });

      let data = [];
      if (filter === 'all') {
        const byYear = {};
        visits.forEach((v) => {
          const yr = v.visitedAt.getFullYear();
          byYear[yr] = (byYear[yr] || 0) + 1;
        });
        data = Object.entries(byYear).sort((a, b) => Number(a[0]) - Number(b[0])).map(([yr, count]) => ({ label: String(yr), value: count }));
      } else if (filter === 'today' || filter === 'yesterday') {
        const total = visits.length;
        data = total > 0 ? [{ label: filter === 'today' ? 'Today' : 'Yesterday', value: total }] : [{ label: filter === 'today' ? 'Today' : 'Yesterday', value: 0 }];
      } else if (filter === 'week') {
        const now = new Date();
        const byDay = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          byDay[key] = 0;
        }
        visits.forEach((v) => {
          const key = v.visitedAt.toISOString().slice(0, 10);
          if (byDay[key] !== undefined) byDay[key]++;
        });
        data = Object.entries(byDay).map(([k, count]) => ({
          label: new Date(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          value: count,
        }));
      } else if (filter === 'month') {
        const now = new Date();
        const byDay = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          byDay[key] = 0;
        }
        visits.forEach((v) => {
          const key = v.visitedAt.toISOString().slice(0, 10);
          if (byDay[key] !== undefined) byDay[key]++;
        });
        data = Object.entries(byDay).map(([k, count]) => ({
          label: new Date(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: count,
        }));
      }
      return res.json({ success: true, data });
    }

    return res.status(400).json({
      success: false,
      message: 'Provide view=day with year and month, or view=month with year, or filter (all/today/yesterday/week/month).',
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
 * When filter is provided, chart uses same date range as stats (sum matches stats)
 */
export const getQuizAttemptsChartData = async (req, res) => {
  try {
    const { view, year, month, filter } = req.query;
    const viewVal = Array.isArray(view) ? view[0] : view;
    const yearVal = Array.isArray(year) ? year[0] : year;
    const monthVal = Array.isArray(month) ? month[0] : month;
    const v = String(viewVal || 'day').toLowerCase().trim();
    const nowQuiz = new Date();
    const y = yearVal != null && String(yearVal).trim() ? String(yearVal).trim() : (v === 'day' || v === 'month' ? String(nowQuiz.getFullYear()) : null);
    const m = monthVal != null && String(monthVal).trim() ? String(monthVal).trim() : (v === 'day' && y ? String(nowQuiz.getMonth() + 1) : null);

    // 1) Day-wise: X = days 1..31 of selected month, Y = quiz attempt count — always when view=day
    if (v === 'day' && y && m) {
      const monthNum = Math.min(12, Math.max(1, parseInt(m, 10) || 1));
      const startDate = new Date(parseInt(y, 10), monthNum - 1, 1);
      const endDate = new Date(parseInt(y, 10), monthNum, 0);
      const daysInMonth = endDate.getDate();

      const attempts = await prisma.quizAttempt.findMany({
        where: {
          startedAt: {
            gte: startDate,
            lte: new Date(parseInt(y, 10), monthNum, 0, 23, 59, 59),
          },
        },
        select: { startedAt: true },
      });

      const attemptsByDay = {};
      for (let day = 1; day <= daysInMonth; day++) {
        attemptsByDay[day] = 0;
      }
      attempts.forEach((attempt) => {
        const day = attempt.startedAt.getDate();
        attemptsByDay[day]++;
      });

      const data = Object.entries(attemptsByDay)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([day, count]) => ({ label: `Day ${day}`, value: count }));
      return res.json({ success: true, data });
    }

    // 2) Month-wise: X = Jan–Dec for selected year, Y = quiz attempt count
    if (v === 'month' && y) {
      const startDate = new Date(parseInt(y, 10), 0, 1);
      const endDate = new Date(parseInt(y, 10), 11, 31, 23, 59, 59);
      const attempts = await prisma.quizAttempt.findMany({
        where: { startedAt: { gte: startDate, lte: endDate } },
        select: { startedAt: true },
      });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const attemptsByMonth = {};
      for (let mo = 0; mo < 12; mo++) attemptsByMonth[mo] = 0;
      attempts.forEach((attempt) => {
        const mo = attempt.startedAt.getMonth();
        attemptsByMonth[mo]++;
      });
      const data = Object.entries(attemptsByMonth)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([mo, count]) => ({
          label: monthNames[parseInt(mo, 10)],
          value: count,
        }));
      return res.json({ success: true, data });
    }

    // 3) Fallback: use filter so chart sum can match stats
    if (filter && ['all', 'today', 'yesterday', 'week', 'month'].includes(String(filter))) {
      const { startDate, endDate } = getDateRangeFromFilter(filter);
      const whereClause = startDate
        ? { startedAt: { gte: startDate, ...(endDate ? { lt: endDate } : {}) } }
        : {};

      const attempts = await prisma.quizAttempt.findMany({
        where: whereClause,
        select: { startedAt: true },
      });

      let data = [];
      if (filter === 'all') {
        const byYear = {};
        attempts.forEach((a) => {
          const yr = a.startedAt.getFullYear();
          byYear[yr] = (byYear[yr] || 0) + 1;
        });
        data = Object.entries(byYear).sort((a, b) => Number(a[0]) - Number(b[0])).map(([yr, count]) => ({ label: String(yr), value: count }));
      } else if (filter === 'today' || filter === 'yesterday') {
        const total = attempts.length;
        data = total > 0 ? [{ label: filter === 'today' ? 'Today' : 'Yesterday', value: total }] : [{ label: filter === 'today' ? 'Today' : 'Yesterday', value: 0 }];
      } else if (filter === 'week') {
        const now = new Date();
        const byDay = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          byDay[key] = 0;
        }
        attempts.forEach((a) => {
          const key = a.startedAt.toISOString().slice(0, 10);
          if (byDay[key] !== undefined) byDay[key]++;
        });
        data = Object.entries(byDay).map(([k, count]) => ({
          label: new Date(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          value: count,
        }));
      } else if (filter === 'month') {
        const now = new Date();
        const byDay = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          byDay[key] = 0;
        }
        attempts.forEach((a) => {
          const key = a.startedAt.toISOString().slice(0, 10);
          if (byDay[key] !== undefined) byDay[key]++;
        });
        data = Object.entries(byDay).map(([k, count]) => ({
          label: new Date(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: count,
        }));
      }
      return res.json({ success: true, data });
    }

    return res.status(400).json({
      success: false,
      message: 'Provide view=day with year and month, or view=month with year, or filter (all/today/yesterday/week/month).',
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
