export function errorHandlerMiddleware(err, req, res, next) {
  console.error(`[Error] ${req.correlationId} — ${err.message}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: err.message,
      correlationId: req.correlationId,
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message,
      correlationId: req.correlationId,
    });
  }

  if (err.name === 'ConflictError') {
    return res.status(409).json({
      error: 'Conflict',
      message: err.message,
      correlationId: req.correlationId,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
      correlationId: req.correlationId,
    });
  }

  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'Something went wrong',
    correlationId: req.correlationId,
    ...(isDev && { stack: err.stack }),
  });
}