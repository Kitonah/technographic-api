import 'reflect-metadata';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { rateLimiter } from './middleware/rateLimit';
import { executeParallelProbes } from './probes/orchestrator';
import { mockDetectTechnologies } from './rules/mockDetector';
import { ProblemDetails } from './types/contracts';

const CACHE_TTL_SECONDS = 3600; // 1 hour edge cache

// 1. Initialize OpenAPI-enabled Hono router with RFC 7807 error formatting
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      const errorDetail = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'param'}: ${issue.message}`)
        .join(', ');

      const problem: ProblemDetails = {
        type: 'https://api.technographics.io/errors/invalid-request',
        title: 'Validation Error',
        status: 400,
        detail: errorDetail,
        instance: c.req.path,
        code: 'VALIDATION_FAILED',
        timestamp: new Date().toISOString()
      };

      return c.json(problem, 400);
    }
  }
});

// 2. Attach Global Middleware (Rate Limiting)
app.use('/v1/enrich/*', rateLimiter);

// 3. Define Query Parameter Validation Schema
const DomainQuerySchema = z.object({
  domain: z
    .string()
    .min(3, { message: 'Domain must be at least 3 characters long' })
    .max(253, { message: 'Domain cannot exceed 253 characters' })
    .regex(
      /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      { message: "Must be a valid domain format (e.g., 'example.com', not 'http://example.com' or 'example')" }
    )
    .openapi({
      example: 'stripe.com',
      description: 'The target website domain to inspect'
    })
});

// 4. Define Route Specification (OpenAPI Contract)
const enrichRoute = createRoute({
  method: 'get',
  path: '/v1/enrich/technographics',
  request: {
    query: DomainQuerySchema
  },
  responses: {
    200: {
      description: 'Technographic stack detected successfully'
    },
    400: {
      description: 'Invalid domain query parameter provided (RFC 7807)'
    },
    429: {
      description: 'Rate limit quota exceeded (RFC 7807)'
    },
    500: {
      description: 'Internal server error occurred while probing domain'
    }
  }
});

// 5. Implement Route Logic with L1 Edge Caching
app.openapi(enrichRoute, async (c) => {
  const { domain } = c.req.valid('query');
  const cacheUrl = new URL(c.req.url);
  cacheUrl.searchParams.set('domain', domain.toLowerCase());
  const cacheKey = new Request(cacheUrl.toString(), c.req.raw);

  const cache = caches.default;

  // 1. Check for cached response
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const cachedData = (await cachedResponse.json()) as Record<string, any>;
    return c.json(
      {
        ...cachedData,
        cached: true
      },
      200,
      {
        'X-Cache-Status': 'HIT',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`
      }
    );
  }

  // 2. Cache MISS: Run probes
  const startTime = Date.now();
  const probePayload = await executeParallelProbes(domain);
  const result = await mockDetectTechnologies(probePayload);
  result.metadata.probeDurationMs = Date.now() - startTime;
  result.cached = false;

  const responseBody = {
    ...result,
    _debugRawDns: probePayload.dns,
    _debugRawTls: probePayload.tls,
    _debugRawHtml: {
      statusCode: probePayload.html.statusCode,
      headers: probePayload.html.headers,
      snippetLengthBytes: probePayload.html.snippet.length,
      snippetPreview: probePayload.html.snippet.slice(0, 300)
    }
  };

  // 3. Store response in Cloudflare edge cache
  const responseToCache = new Response(JSON.stringify(responseBody), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`
    }
  });

  c.executionCtx.waitUntil(cache.put(cacheKey, responseToCache));

  return c.json(responseBody, 200, {
    'X-Cache-Status': 'MISS',
    'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString()
  });
});

export default app;