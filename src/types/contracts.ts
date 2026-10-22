/**
 * Core taxonomy categories for detected technologies.
 */
export type TechCategory =
  | 'hosting'
  | 'cdn'
  | 'cms'
  | 'payment'
  | 'analytics'
  | 'marketing'
  | 'productivity'
  | 'security'
  | 'framework'
  | string;

/**
 * Inspection surfaces where fingerprints were captured.
 */
export type DetectedVia =
  | 'dns'
  | 'tls'
  | 'http_header'
  | 'cookie'
  | 'html_script'
  | string;

/**
 * Clean data contract for an enriched technology detection.
 */
export interface EnrichedTechnology {
  name: string;
  category: string;
  confidence: number;
  version: string | null;
  detectedVia: string[];
  cpe23: string | null;
  deploymentRole: 'direct_deployment' | 'platform_bundled_substrate';
}

/**
 * Segregated commercial technographic response payload.
 */
export interface EnrichedResult {
  domain: string;
  scannedAt: string;
  cached: boolean;
  technologies: EnrichedTechnology[];
  underlyingInfrastructure: EnrichedTechnology[];
  metadata: {
    totalDirect: number;
    totalSubstrate: number;
    totalDetected: number;
    probeDurationMs: number;
  };
}

/**
 * RFC 7807 Problem Details error specification.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  timestamp: string;
}

/**
 * Probe telemetry payloads collected from the edge.
 */
export interface DnsProbeData {
  resolvedIps: string[];
  cnames: string[];
  mxRecords: string[];
  txtRecords: string[];
}

export interface TlsProbeData {
  protocol: string;
  issuer: string;
  sanList: string[];
  validTo?: string;
}

export interface HtmlProbeData {
  statusCode: number;
  headers: Record<string, string>;
  snippet: string;
}

export interface RawProbePayload {
  domain: string;
  timestamp: string;
  dns: DnsProbeData;
  tls: TlsProbeData;
  html: HtmlProbeData;
}