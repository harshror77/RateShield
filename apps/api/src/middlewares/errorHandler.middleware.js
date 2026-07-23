const ERROR_MAP = {
  ValidationError:   { status: 400, error: 'Bad Request' },
  NotFoundError:     { status: 404, error: 'Not Found' },
  ConflictError:     { status: 409, error: 'Conflict' },
  UnauthorizedError: { status: 401, error: 'Unauthorized' },
};

export function errorHandlerMiddleware(err, req, res, next) {
  console.error(`[Error] ${req.correlationId} — ${err.message}`);

  const mapped = ERROR_MAP[err.name];
  const status = mapped?.status ?? 500;
  const label = mapped?.error ?? 'Internal Server Error';
  const isDev = process.env.NODE_ENV !== 'production';

  return res.status(status).json({
    error: label,
    message: (status === 500 && !isDev) ? 'Something went wrong' : err.message,
    correlationId: req.correlationId,
    ...(isDev && status === 500 && { stack: err.stack }),
  });
}