import { describe, expect, it } from 'vitest';
import { PRODUCTION_SIGNATURES } from './definitions';
import { evaluateRules } from './engine';
import {
  ENTERPRISE_SAAS_VERCEL_FIXTURE,
  HIGH_VOLUME_ECOMMERCE_SHOPIFY_PLUS_FIXTURE,
  LEGACY_ENTERPRISE_AWS_M365_FIXTURE
} from './fixtures';

describe('Edge Technographic Intelligence Engine - Offline Benchmark Suite', () => {
  it('Fixture 1 (Enterprise SaaS): detects Vercel, Next.js, HubSpot, Segment, Sentry, and attenuates AWS S3 bleed', () => {
    const results = evaluateRules(ENTERPRISE_SAAS_VERCEL_FIXTURE, PRODUCTION_SIGNATURES);
    const byId = Object.fromEntries(results.map((r) => [r.id, r]));

    // 1. Multi-surface corroboration assertions
    expect(byId['vercel'].confidence).toBe(1.0);
    expect(byId['vercel'].matchedSurfaces).toEqual(expect.arrayContaining(['dns', 'http_header']));
    expect(byId['hubspot'].confidence).toBe(1.0);
    expect(byId['hubspot'].matchedSurfaces).toEqual(
      expect.arrayContaining(['dns', 'cookie', 'html_script'])
    );
    expect(byId['google-workspace'].confidence).toBeGreaterThanOrEqual(0.95);

    // 2. Disambiguation: Single S3 image in HTML body must be attenuated as substrate by Vercel
    expect(byId['aws'].deploymentRole).toBe('platform_bundled_substrate');
    expect(byId['aws'].confidence).toBeLessThan(0.30);

    // 3. Version extraction & Base64 meta decoding assertions
    expect(byId['nextjs'].normalizedVersion).toBe('14.2.5');
    expect(byId['segment'].normalizedVersion).toBe('4.15.3');
    expect(byId['sentry'].normalizedVersion).toBe('14.2.5-beta.2');
    expect(byId['sentry'].cpe23).toBe('cpe:2.3:a:sentry:sentry:14.2.5-beta.2:*:*:*:*:*:*:*');
  });

  it('Fixture 2 (High-Volume E-Commerce): detects Shopify Plus, suppresses base Shopify, and attenuates bundled Cloudflare CDN', () => {
    const results = evaluateRules(HIGH_VOLUME_ECOMMERCE_SHOPIFY_PLUS_FIXTURE, PRODUCTION_SIGNATURES);
    const byId = Object.fromEntries(results.map((r) => [r.id, r]));

    // 1. Shopify Plus detected with 1.0 confidence; standard Shopify tier marked suppressed_collision
    expect(byId['shopify-plus'].confidence).toBe(1.0);
    expect(byId['shopify-plus'].deploymentRole).toBe('direct_deployment');
    expect(byId['shopify-plus'].normalizedVersion).toBe('15.2.0');
    expect(byId['shopify'].deploymentRole).toBe('suppressed_collision');

    // 2. Bundled Cloudflare CDN attenuated to platform_bundled_substrate while Bot Management cookie is captured
    expect(byId['cloudflare'].deploymentRole).toBe('platform_bundled_substrate');
    expect(byId['cloudflare'].confidence).toBeLessThan(0.40);
    expect(byId['cloudflare-bot-management'].confidence).toBeGreaterThanOrEqual(0.85);

    // 3. Klaviyo and OneTrust CalVer normalization
    expect(byId['klaviyo'].confidence).toBe(1.0);
    expect(byId['onetrust'].confidence).toBe(1.0);
    expect(byId['onetrust'].normalizedVersion).toBe('2026.08.1.0');
  });

  it('Fixture 3 (Legacy Enterprise): detects direct AWS CloudFront deployment, Microsoft 365, and Datadog RUM across 4 surfaces', () => {
    const results = evaluateRules(LEGACY_ENTERPRISE_AWS_M365_FIXTURE, PRODUCTION_SIGNATURES);
    const byId = Object.fromEntries(results.map((r) => [r.id, r]));

    // 1. Direct AWS CloudFront verified across DNS, TLS, HTTP Header, and Cookie
    expect(byId['aws'].confidence).toBe(1.0);
    expect(byId['aws'].deploymentRole).toBe('direct_deployment');
    expect(byId['aws'].matchedSurfaces).toEqual(
      expect.arrayContaining(['dns', 'tls', 'http_header', 'cookie'])
    );

    // 2. Microsoft 365 DNS verification
    expect(byId['microsoft-365'].confidence).toBeGreaterThanOrEqual(0.95);

    // 3. Datadog RUM multi-surface corroboration and specific version resolution
    expect(byId['datadog'].confidence).toBe(1.0);
    expect(byId['datadog'].matchedSurfaces).toEqual(
      expect.arrayContaining(['http_header', 'cookie', 'html_script'])
    );
    expect(byId['datadog'].normalizedVersion).toBe('5.28.1');
  });
});