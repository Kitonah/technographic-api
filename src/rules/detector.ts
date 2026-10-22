import { EnrichedResult, EnrichedTechnology, RawProbePayload } from '../types/contracts';
import { PRODUCTION_SIGNATURES } from './definitions';
import { evaluateRules } from './engine';
import { ProbeSnapshotFixture } from './types';

export async function detectTechnologies(
  payload: RawProbePayload,
  fallbackDomain?: string
): Promise<EnrichedResult> {
  const domain = payload?.domain || fallbackDomain || 'unknown';
  const timestamp = payload?.timestamp || new Date().toISOString();

  // Safely extract headers and cookies
  const headers = payload?.html?.headers || {};
  const rawSetCookie = headers['set-cookie'] || '';
  const setCookies = rawSetCookie ? [rawSetCookie] : [];

  // Safely parse TLS issuer details
  const issuerRaw = payload?.tls?.issuer || '';
  const issuerOrg = issuerRaw.match(/O=([^,]+)/)?.[1] || issuerRaw;
  const issuerCn = issuerRaw.match(/CN=([^,]+)/)?.[1] || issuerRaw;

  // Safely convert MX strings into structured records
  const mx = (payload?.dns?.mxRecords || []).map((rec) => {
    const parts = (rec || '').trim().split(/\s+/);
    return {
      priority: parseInt(parts[0], 10) || 10,
      exchange: parts[1] || parts[0] || ''
    };
  });

  const snippet = payload?.html?.snippet || '';

  const adaptedFixture: ProbeSnapshotFixture = {
    fixtureId: `live-${domain}`,
    description: `Live scan for ${domain}`,
    targetDomain: domain,
    capturedAt: timestamp,
    dns: {
      a: payload?.dns?.resolvedIps || [],
      cname: payload?.dns?.cnames || [],
      mx,
      txt: payload?.dns?.txtRecords || []
    },
    tls: {
      protocol: payload?.tls?.protocol || 'TLSv1.3',
      issuerCn,
      issuerOrg,
      subjectCn: domain,
      sans: payload?.tls?.sanList || [],
      validTo: payload?.tls?.validTo
    },
    http: {
      status: payload?.html?.statusCode || 200,
      headers,
      setCookies,
      bodySnippet50Kb: snippet,
      bytesRead: snippet.length,
      streamAbortedAtCeiling: snippet.length >= 50000
    }
  };

  const detected = evaluateRules(adaptedFixture, PRODUCTION_SIGNATURES);

  const directTechnologies: EnrichedTechnology[] = [];
  const underlyingInfrastructure: EnrichedTechnology[] = [];

  for (const d of detected) {
    // Suppressed collisions (e.g. standard Shopify when Shopify Plus is verified) are completely pruned
    if (d.deploymentRole === 'suppressed_collision') {
      continue;
    }

    const item: EnrichedTechnology = {
      name: d.name,
      category: d.category,
      confidence: Math.round(d.confidence * 100),
      version: d.normalizedVersion,
      detectedVia: d.matchedSurfaces,
      cpe23: d.cpe23,
      deploymentRole: d.deploymentRole
    };

    if (d.deploymentRole === 'direct_deployment') {
      directTechnologies.push(item);
    } else if (d.deploymentRole === 'platform_bundled_substrate') {
      underlyingInfrastructure.push(item);
    }
  }

  return {
    domain,
    scannedAt: timestamp,
    cached: false,
    technologies: directTechnologies,
    underlyingInfrastructure,
    metadata: {
      totalDirect: directTechnologies.length,
      totalSubstrate: underlyingInfrastructure.length,
      totalDetected: directTechnologies.length + underlyingInfrastructure.length,
      probeDurationMs: 0
    }
  };
}