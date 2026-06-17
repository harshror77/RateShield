export function apiKeyAuthMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-api-key header',
      correlationId: req.correlationId,
    });
  }

  req.apiKey = apiKey;
  next();
}