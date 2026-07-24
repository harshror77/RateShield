import { PLANS, ALGORITHMS } from '@harshror77/rate-limiter';

export { PLANS, ALGORITHMS };

const windowMs = parseInt(process.env.DEFAULT_WINDOW_MS || '60000');

export const planLimits = {
  [PLANS.FREE]:       { maxRequests: parseInt(process.env.DEFAULT_FREE_LIMIT || '100'), windowMs },
  [PLANS.PRO]:        { maxRequests: parseInt(process.env.DEFAULT_PRO_LIMIT || '1000'), windowMs },
  [PLANS.ENTERPRISE]: { maxRequests: parseInt(process.env.DEFAULT_ENTERPRISE_LIMIT || '10000'), windowMs },
}; 