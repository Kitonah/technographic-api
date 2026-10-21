import { runHtmlProbe } from './probes/stream';
import 'reflect-metadata';
import { runTlsProbe } from './probes/tls';
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

  // Run Probe 1 (DNS), Probe 2 (TLS), and Probe 3 (Streaming HTML) in parallel
  const [dnsData, tlsData, htmlData] = await Promise.all([
    runDnsProbe(domain),
    runTlsProbe(domain),
    runHtmlProbe(domain)
  ]);

  // Construct complete live probe payload
  const probePayload: RawProbePayload = {
    domain,
    timestamp: new Date().toISOString(),
    dns: dnsData,
    tls: tlsData,
    html: htmlData
  };

  // Run through mock detection engine
  const result = await mockDetectTechnologies(probePayload);

  // Total execution duration across all three parallel network probes
  result.metadata.probeDurationMs = Date.now() - startTime;

  // Return technographic output with debug inspection data
  return c.json({
    ...result,
    _debugRawDns: dnsData,
    _debugRawTls: tlsData,
    _debugRawHtml: {
      statusCode: htmlData.statusCode,
      headers: htmlData.headers,
      snippetLengthBytes: htmlData.snippet.length,
      snippetPreview: htmlData.snippet.slice(0, 300)
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