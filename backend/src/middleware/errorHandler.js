/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  // Log full error for debugging (always log; Railway/logging will capture)
  console.error('[Error]', err.message || err);
  if (err.stack) console.error(err.stack);
  if (err.meta) console.error('[Prisma meta]', err.meta);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference. A related record may not exist.',
    });
  }

  if (err.code === 'P2011') {
    return res.status(400).json({
      success: false,
      message: 'A required field is missing or invalid.',
    });
  }

  // Prisma: connection/schema issues (e.g. migrations not run, DB unreachable)
  if (err.code === 'P1001' || err.code === 'P1002' || err.code === 'P1017') {
    console.error('[Prisma] Database connection error. Ensure DATABASE_URL is set and database is reachable.');
    return res.status(503).json({
      success: false,
      message: isDev ? (err.message || 'Database connection error') : 'Service temporarily unavailable. Please try again later.',
    });
  }

  // Prisma/DB: invalid enum (e.g. QUIZ not in ResourceType — migrations not run on production)
  const rawMsg = err.message || err.cause?.message || '';
  const msg = rawMsg.toLowerCase();
  if (msg.includes('invalid input value for enum') || msg.includes('enum') && (msg.includes('invalid') || msg.includes('unknown'))) {
    console.error('[Prisma] Schema/enum mismatch. Run migrations: npx prisma migrate deploy', rawMsg);
    return res.status(400).json({
      success: false,
      message: 'Resource type not available in database. Run migrations on the server: npx prisma migrate deploy',
    });
  }

  // Other Prisma errors: if this was a QUIZ resource create, return 400 with migrations message (not 500)
  if (err.code && String(err.code).startsWith('P')) {
    const isQuizResourceCreate = req.method === 'POST' && req.originalUrl?.includes('/api/resources') && req.body?.type === 'QUIZ';
    if (isQuizResourceCreate) {
      console.error('[Prisma] QUIZ resource create failed:', err.code, err.message, err.meta || '');
      return res.status(400).json({
        success: false,
        message: 'Could not create Quiz resource. Run database migrations on the server: npx prisma migrate deploy',
      });
    }
    console.error('[Prisma]', err.code, err.message, err.meta || '');
    return res.status(500).json({
      success: false,
      message: isDev ? (err.message || 'Database error') : 'Something went wrong. Please try again.',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
    });
  }

  // Catch-all: if we're about to return 500 for a QUIZ resource create, return 400 with migrations message instead
  const isQuizCreate = req.method === 'POST' &&
    (req.originalUrl === '/api/resources' || req.originalUrl?.includes('/api/resources')) &&
    (req.body?.type === 'QUIZ' || String(req.body?.type || '').toUpperCase() === 'QUIZ');
  if (status >= 500 && isQuizCreate) {
    console.error('[Error] QUIZ resource create failed (converting 500→400):', err.message || err, err.code || '');
    return res.status(400).json({
      success: false,
      message: 'Could not create Quiz resource. Run database migrations on the server: npx prisma migrate deploy',
    });
  }

  // Default error — don't leak internal details in production
  const message = status >= 500 && !isDev
    ? 'Internal server error'
    : (err.message || 'Internal server error');
  res.status(status).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
