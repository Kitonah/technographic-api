import { DnsProbeData } from '../types/contracts';

// Public DNS-over-HTTPS endpoints with automatic fallback
const DOH_RESOLVERS = [
  'https://cloudflare-dns.com/dns-query',
  'https://dns.google/resolve'
];

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

// DNS Query Types (RFC 1035)
const DNS_TYPES = {
  A: 'A',
  MX: 'MX',
  TXT: 'TXT',
  CNAME: 'CNAME'
} as const;

/**
 * Queries a DNS-over-HTTPS resolver for a specific record type
 */
async function queryDoh(domain: string, type: string, resolverIndex = 0): Promise<string[]> {
  if (resolverIndex >= DOH_RESOLVERS.length) {
    return []; // All resolvers exhausted
  }

  const resolver = DOH_RESOLVERS[resolverIndex];
  const url = `${resolver}?name=${encodeURIComponent(domain)}&type=${type}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/dns-json'
      },
      signal: AbortSignal.timeout(2000) // 2-second hard limit per DNS probe
    });

    if (!res.ok) {
      // Fallback to next resolver if HTTP error occurs (e.g., rate limit)
      return queryDoh(domain, type, resolverIndex + 1);
    }

    const json = (await res.json()) as DohResponse;

    if (!json.Answer || json.Answer.length === 0) {
      return [];
    }

    // Extract, clean, and strip quotation marks from DNS records
    return json.Answer.map((ans) => ans.data.replace(/^"|"$/g, '').trim());
  } catch {
    // On network timeout or parse failure, fallback to next resolver
    return queryDoh(domain, type, resolverIndex + 1);
  }
}

/**
 * Probe 1: Comprehensive DNS-over-HTTPS Inspector
 * Fetches MX, TXT, CNAME, and A records in parallel
 */
export async function runDnsProbe(domain: string): Promise<DnsProbeData> {
  // Execute all four DNS lookups concurrently
  const [mxRecords, txtRecords, cnames, resolvedIps] = await Promise.all([
    queryDoh(domain, DNS_TYPES.MX),
    queryDoh(domain, DNS_TYPES.TXT),
    queryDoh(domain, DNS_TYPES.CNAME),
    queryDoh(domain, DNS_TYPES.A)
  ]);

  return {
    mxRecords,
    txtRecords,
    cnames,
    resolvedIps
  };
}