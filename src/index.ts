import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { mockDetectTechnologies } from './rules/mockDetector';
import { ProblemDetails, RawProbePayload } from './types/contracts';

// 1. Initialize OpenAPI-enabled Hono router
// defaultHook intercepts any input validation errors and formats them into standard RFC 7807 JSON
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

// 2. Define the Query Parameter Validation Schema
// Validates that 'domain' is present, properly structured, and clean
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

// 3. Define the Route Specification (OpenAPI Contract)
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

// 4. Implement the Route Logic
app.openapi(enrichRoute, async (c) => {
  const { domain } = c.req.valid('query');

  // Construct a temporary probe payload using the domain
  // (In Tasks 3 & 4, your real Probes 1, 2, and 3 will fill this in)
  const syntheticPayload: RawProbePayload = {
    domain,
    timestamp: new Date().toISOString(),
    dns: {
      mxRecords: ['aspmx.l.google.com'],
      txtRecords: ['v=spf1 include:_spf.google.com ~all'],
      cnames: [],
      resolvedIps: ['104.18.2.1']
    },
    tls: {
      issuer: 'Cloudflare Inc ECC CA-3',
      sanList: [domain, `*.${domain}`],
      validTo: '2027-01-01T00:00:00.000Z',
      protocol: 'TLSv1.3'
    },
    html: {
      statusCode: 200,
      headers: { server: 'cloudflare' },
      snippet: '<html><body>Mock HTML content</body></html>'
    }
  };

  // Run through mock detection engine
  const result = await mockDetectTechnologies(syntheticPayload);

  return c.json(result, 200);
});

// Health check endpoint for monitoring/uptime bots
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString()
  });
});

export default app;