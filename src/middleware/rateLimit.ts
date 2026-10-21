import { createMiddleware } from 'hono/factory';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import { ProblemDetails } from '../types/contracts';

// Local development in-memory fallback store
const localHits = new Map<string, number[]>();

function checkLocalRateLimit(ip: string, limit = 10, windowMs = 10000) {
  const now = Date.now();
  const timestamps = (localHits.get(ip) || []).filter((time) => now - time < windowMs);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return { success: false, limit, remaining: 0, resetSeconds };
  }

  timestamps.push(now);
  localHits.set(ip, timestamps);
  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000)
  };
}

export const rateLimiter = createMiddleware(async (c, next) => {
  // Extract client IP from Cloudflare header or fall back to localhost
  const clientIp = c.req.header('cf-connecting-ip') || '127.0.0.1';

  // Read Upstash environment variables if present in wrangler bindings
  const redisUrl = c.env?.UPSTASH_REDIS_REST_URL;
  const redisToken = c.env?.UPSTASH_REDIS_REST_TOKEN;

  let success = true;
  let limit = 10;
  let remaining = 10;
  let resetSeconds = 10;

  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: 'ratelimit:technographics'
    });

    const result = await ratelimit.limit(clientIp);
    success = result.success;
    limit = result.limit;
    remaining = result.remaining;
    resetSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  } else {
    // Run local in-memory sliding window emulator
    const local = checkLocalRateLimit(clientIp, 10, 10000);
    success = local.success;
    limit = local.limit;
    remaining = local.remaining;
    resetSeconds = local.resetSeconds;
  }

  // Set standard RateLimit headers on all responses
  c.header('RateLimit-Limit', limit.toString());
  c.header('RateLimit-Remaining', remaining.toString());
  c.header('RateLimit-Reset', resetSeconds.toString());

  if (!success) {
    c.header('Retry-After', resetSeconds.toString());

    const problem: ProblemDetails = {
      type: 'https://api.technographics.io/errors/rate-limit-exceeded',
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit quota exceeded (${limit} requests per 10 seconds). Please retry in ${resetSeconds} seconds.`,
      instance: c.req.path,
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    };

    return c.json(problem, 429);
  }

  await next();
});