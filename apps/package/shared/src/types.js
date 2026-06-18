/**
 * @typedef {Object} RateLimitRequest
 * @property {string} ip
 * @property {string} [userId]
 * @property {string} apiKey
 * @property {string} [planId]
 */

/**
 * @typedef {Object} RateLimitResult
 * @property {boolean} allowed
 * @property {number} [remaining]
 * @property {number} [resetAt]
 * @property {string} [deniedBy]
 */

/**
 * @typedef {Object} ClientConfig
 * @property {string} apiKey
 * @property {string} clientName
 * @property {string} planId
 * @property {string} algorithm
 */

export {};