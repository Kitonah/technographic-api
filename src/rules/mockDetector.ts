import { RawProbePayload, TechnographicResult } from '../types/contracts';

/**
 * Mock Detector Engine
 * Returns realistic dummy data so Person A can test routing, caching, and validation
 */
export async function mockDetectTechnologies(payload: RawProbePayload): Promise<TechnographicResult> {
  const domainLower = payload.domain.toLowerCase();

  const isShopify = domainLower.includes('shopify') || domainLower.includes('store') || domainLower.includes('shoes');
  const isStripe = domainLower.includes('stripe') || domainLower.includes('pay') || domainLower.includes('checkout');

  return {
    domain: payload.domain,
    scannedAt: new Date().toISOString(),
    cached: false,
    technologies: [
      {
        name: isShopify ? 'Shopify' : 'Cloudflare Pages',
        category: isShopify ? 'ecommerce' : 'hosting',
        confidence: 95,
        version: null,
        detectedVia: ['dns', 'headers']
      },
      {
        name: isStripe ? 'Stripe Elements' : 'Stripe',
        category: 'payment',
        confidence: 100,
        version: 'v3',
        detectedVia: ['html']
      },
      {
        name: 'Google Workspace',
        category: 'marketing',
        confidence: 90,
        version: null,
        detectedVia: ['dns']
      }
    ],
    metadata: {
      totalDetected: 3,
      probeDurationMs: 14
    }
  };
}