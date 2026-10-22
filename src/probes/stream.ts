import { HtmlProbeData } from '../types/contracts';

const CEILING_BYTES = 51200; // 50 KB edge extraction ceiling
const PROBE_TIMEOUT_MS = 6000; // 6-second defensive timeout

/**
 * Executes a controlled 50KB streaming HTTP probe against the target domain.
 * Negotiates diagnostic headers with Akamai and Fastly, while presenting
 * modern desktop client fingerprints to prevent anti-bot challenges.
 */
export async function runHtmlProbe(domain: string): Promise<HtmlProbeData> {
  const targetUrl = `https://${domain}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // 1. Realistic Browser Persona
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',

        // 2. Client Hints (Anti-Bot Camouflage)
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',

        // 3. Enterprise CDN Negotiation Handshakes
        // Akamai Diagnostic Header Request
        'Pragma':
          'akamai-x-cache-on, akamai-x-cache-remote-on, akamai-x-check-cacheable, akamai-x-get-cache-key, akamai-x-get-true-cache-key',
        // Fastly Debug Request
        'Fastly-Debug': '1'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    // Extract headers safely into lowercase dictionary
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Stream up to 50KB of response body without buffering the entire document
    let snippet = '';
    let bytesRead = 0;

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: false });

      try {
        while (bytesRead < CEILING_BYTES) {
          const { done, value } = await reader.read();
          if (done || !value) break;

          const remaining = CEILING_BYTES - bytesRead;
          const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;

          snippet += decoder.decode(chunk, { stream: true });
          bytesRead += chunk.byteLength;

          if (bytesRead >= CEILING_BYTES) {
            // Cancel the stream to release the TCP socket immediately
            await reader.cancel();
            break;
          }
        }
      } catch {
        // If stream reader was forcibly aborted after ceiling, cleanly proceed
      }
    }

    return {
      statusCode: response.status,
      headers,
      snippet
    };
  } catch {
    // Graceful fallback if domain is unreachable or times out
    return {
      statusCode: 0,
      headers: {},
      snippet: ''
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Export alias to prevent naming mismatches
export const probeStream = runHtmlProbe;