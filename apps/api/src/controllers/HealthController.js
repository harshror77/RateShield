import {getRedisClient } from '../singletons/index.js';

export class HealthController {
  async check(req, res) {
    let redisStatus = 'ok';

    try {
      const redis = getRedisClient();
      await redis.ping();
    } catch (err) {
      redisStatus = 'error';
    }

    const isHealthy = redisStatus === 'ok';

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus,
      },
    });
  }
}