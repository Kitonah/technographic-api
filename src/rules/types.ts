export type InspectionSurface =
  | 'dns'
  | 'tls'
  | 'http_header'
  | 'cookie'
  | 'html_script';

export type DeploymentRole =
  | 'direct_deployment'
  | 'platform_bundled_substrate'
  | 'suppressed_collision';

export interface DnsProbePayload {
  a: string[];
  cname: string[];
  mx: Array<{ priority: number; exchange: string }>;
  txt: string[];
}

export interface TlsProbePayload {
  protocol: 'TLSv1.2' | 'TLSv1.3' | string;
  issuerCn: string;
  issuerOrg: string;
  subjectCn: string;
  sans: string[];
  validFrom?: string;
  validTo?: string;
}

export interface HttpStreamingProbePayload {
  status: number;
  headers: Record<string, string>;
  setCookies: string[];
  bodySnippet50Kb: string;
  bytesRead: number;
  streamAbortedAtCeiling: boolean;
}

export interface ProbeSnapshotFixture {
  fixtureId: string;
  description: string;
  targetDomain: string;
  capturedAt: string;
  dns: DnsProbePayload;
  tls: TlsProbePayload;
  http: HttpStreamingProbePayload;
}

export interface SurfaceMatcher {
  surface: InspectionSurface;
  subTarget?: string; // 'a' | 'cname' | 'mx' | 'txt' for dns; header name for http_header
  regex: string;
  baseConfidence: number;
  versionGroup?: number;
  decodeBase64JsonKey?: string;
}

export interface DisambiguationPolicy {
  type: 'EXCLUDES_LOWER_TIER' | 'ATTENUATES_SUBSTRATE' | 'IMPLIES_RUNTIME' | 'MUTUAL_DISAMBIGUATION';
  targetTechId: string;
  attenuationMultiplier?: number;
  overrideDnsPattern?: string;
}

export interface TechnologySignature {
  id: string;
  name: string;
  category: string;
  cpeVendor: string;
  cpeProduct: string;
  matchers: SurfaceMatcher[];
  disambiguation?: DisambiguationPolicy[];
}

export interface DetectedTechnology {
  id: string;
  name: string;
  category: string;
  confidence: number;
  deploymentRole: DeploymentRole;
  matchedSurfaces: InspectionSurface[];
  normalizedVersion: string | null;
  cpe23: string | null;
  evidenceTrail: string[];
}