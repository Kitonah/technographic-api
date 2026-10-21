import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { runDnsProbe } from './probes/doh';
import { mockDetectTechnologies } from './rules/mockDetector';
import { ProblemDetails, RawProbePayload } from './types/contracts';

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

  // Run real Probe 1: DNS-over-HTTPS
  const dnsData = await runDnsProbe(domain);

  // Construct probe payload with real DNS data (TLS and HTML remain synthetic until Tasks 4 & 5)
  const probePayload: RawProbePayload = {
    domain,
    timestamp: new Date().toISOString(),
    dns: dnsData,
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
  const result = await mockDetectTechnologies(probePayload);

  // Record total probe duration
  result.metadata.probeDurationMs = Date.now() - startTime;

  // Return enriched result plus raw DNS for debugging verification
  return c.json({
    ...result,
    _debugRawDns: dnsData
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