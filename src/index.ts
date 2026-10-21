import 'reflect-metadata';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { executeParallelProbes } from './probes/orchestrator';
import { mockDetectTechnologies } from './rules/mockDetector';
import { ProblemDetails } from './types/contracts';

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

// 2. Define Query Parameter Validation Schema
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

// 3. Define Route Specification (OpenAPI Contract)
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
    500: {
      description: 'Internal server error occurred while probing domain'
    }
  }
});

// 4. Implement Route Logic
app.openapi(enrichRoute, async (c) => {
  const { domain } = c.req.valid('query');
  const startTime = Date.now();

  // Execute isolated parallel probes with hard timeout boundaries
  const probePayload = await executeParallelProbes(domain);

  // Run through detection engine
  const result = await mockDetectTechnologies(probePayload);

  // Record total elapsed probe time
  result.metadata.probeDurationMs = Date.now() - startTime;

  return c.json({
    ...result,
    _debugRawDns: probePayload.dns,
    _debugRawTls: probePayload.tls,
    _debugRawHtml: {
      statusCode: probePayload.html.statusCode,
      headers: probePayload.html.headers,
      snippetLengthBytes: probePayload.html.snippet.length,
      snippetPreview: probePayload.html.snippet.slice(0, 300)
    }
  }, 200);
});

// Health check endpoint for uptime bots
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString()
  });
});

export default app;