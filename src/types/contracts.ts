export interface DnsProbeData {
  mxRecords: string[];
  txtRecords: string[];
  cnames: string[];
  resolvedIps: string[];
}

export interface TlsProbeData {
  issuer: string;
  sanList: string[]; // Subject Alternative Names
  validTo?: string;
  protocol?: string;
}

export interface HtmlProbeData {
  snippet: string;   // First 50 KB text chunk
  headers: Record<string, string>;
  statusCode: number;
}

export interface RawProbePayload {
  domain: string;
  timestamp: string;
  dns: DnsProbeData;
  tls: TlsProbeData;
  html: HtmlProbeData;
}

export type TechCategory = 
  | 'hosting'
  | 'analytics'
  | 'payment'
  | 'ecommerce'
  | 'cms'
  | 'security'
  | 'crm'
  | 'marketing';

export interface DetectedTechnology {
  name: string;
  category: TechCategory;
  confidence: number;
  version?: string | null;
  detectedVia: ('dns' | 'tls' | 'headers' | 'html')[];
}

export interface TechnographicResult {
  domain: string;
  scannedAt: string;
  cached: boolean;
  technologies: DetectedTechnology[];
  metadata: {
    totalDetected: number;
    probeDurationMs: number;
  };
}

// RFC 7807 Error Envelope Standard
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  timestamp: string;
}