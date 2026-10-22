import { DetectionRule } from './types';

export const SIGNATURE_REGISTRY: DetectionRule[] = [
  // 1. Cloudflare Infrastructure
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'cdn',
    baseConfidence: 95,
    matches: {
      headers: {
        'server': /^cloudflare$/i,
        'cf-ray': /.+/
      },
      tlsIssuer: /Cloudflare/i
    }
  },
  // 2. Stripe Payments
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payment',
    baseConfidence: 90,
    matches: {
      dnsTxt: [/stripe-verification=/i],
      headers: {
        'content-security-policy': /js\.stripe\.com/i
      },
      htmlSnippet: [/https:\/\/js\.stripe\.com\/(v\d+)/i]
    },
    versionExtractor: {
      surface: 'htmlSnippet',
      regex: /https:\/\/js\.stripe\.com\/(v\d+)/i,
      groupIndex: 1
    }
  },
  // 3. Google Workspace (Email & Productivity)
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'productivity',
    baseConfidence: 95,
    matches: {
      dnsMx: [/aspmx\.l\.google\.com/i, /googlemail\.com/i],
      dnsTxt: [/google-site-verification=/i]
    }
  },
  // 4. Microsoft 365 / Exchange Online
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'productivity',
    baseConfidence: 95,
    matches: {
      dnsMx: [/\.mail\.protection\.outlook\.com/i],
      dnsTxt: [/MS=ms\d+/i]
    }
  },
  // 5. Amazon Web Services (CloudFront / Infrastructure)
  {
    id: 'aws-infrastructure',
    name: 'Amazon Web Services',
    category: 'hosting',
    baseConfidence: 85,
    matches: {
      headers: {
        'x-amz-cf-id': /.+/,
        'x-amz-cf-pop': /.+/
      },
      tlsIssuer: /Amazon/i
    }
  },
  // 6. Next.js Framework
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'framework',
    baseConfidence: 95,
    matches: {
      headers: {
        'x-powered-by': /Next\.js/i
      },
      htmlSnippet: [/__NEXT_DATA__/i, /\/_next\/static\//i]
    }
  },
  // 7. Vercel Hosting
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'hosting',
    baseConfidence: 95,
    matches: {
      headers: {
        'x-vercel-id': /.+/,
        'server': /^vercel$/i
      },
      dnsTxt: [/vercel-domain-verification/i]
    }
  },
  // 8. Shopify E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'cms',
    baseConfidence: 95,
    matches: {
      headers: {
        'x-shopid': /.+/
      },
      dnsTxt: [/shopify-verification-code=/i],
      htmlSnippet: [/cdn\.shopify\.com/i, /window\.Shopify/i]
    }
  }
];