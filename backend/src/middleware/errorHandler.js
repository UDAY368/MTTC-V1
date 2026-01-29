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

  // Prisma: schema/table/connection issues (e.g. migrations not run, DB unreachable)
  if (err.code && String(err.code).startsWith('P')) {
    console.error('[Prisma] Database error. Ensure DATABASE_URL is set and migrations are deployed (e.g. prisma migrate deploy).');
    return res.status(503).json({
      success: false,
      message: isDev ? (err.message || 'Database error') : 'Service temporarily unavailable. Please try again later.',
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
