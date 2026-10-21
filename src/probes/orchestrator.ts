import { DnsProbeData, HtmlProbeData, RawProbePayload, TlsProbeData } from '../types/contracts';
import { runDnsProbe } from './doh';
import { runTlsProbe } from './tls';
import { runHtmlProbe } from './stream';

const DEFAULT_DNS: DnsProbeData = {
  mxRecords: [],
  txtRecords: [],
  cnames: [],
  resolvedIps: []
};

const DEFAULT_TLS: TlsProbeData = {
  issuer: 'Unknown',
  sanList: [],
  protocol: 'None'
};

const DEFAULT_HTML: HtmlProbeData = {
  statusCode: 0,
  headers: {},
  snippet: ''
};

/**
 * Executes a probe promise against an enforced timeout boundary
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
}

/**
 * Orchestrates DNS, TLS, and HTTP streaming probes concurrently.
 * Employs Promise.allSettled to guarantee partial results if any probe hangs or fails.
 */
export async function executeParallelProbes(domain: string): Promise<RawProbePayload> {
  const [dnsResult, tlsResult, htmlResult] = await Promise.allSettled([
    withTimeout(runDnsProbe(domain), 2500, DEFAULT_DNS),
    withTimeout(runTlsProbe(domain), 3000, DEFAULT_TLS),
    withTimeout(runHtmlProbe(domain), 4000, DEFAULT_HTML)
  ]);

  const dns = dnsResult.status === 'fulfilled' ? dnsResult.value : DEFAULT_DNS;
  const tls = tlsResult.status === 'fulfilled' ? tlsResult.value : DEFAULT_TLS;
  const html = htmlResult.status === 'fulfilled' ? htmlResult.value : DEFAULT_HTML;

  return {
    domain,
    timestamp: new Date().toISOString(),
    dns,
    tls,
    html
  };
}