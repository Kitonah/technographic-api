import { HtmlProbeData } from '../types/contracts';

const MAX_BYTES = 50 * 1024; // 50 KB hard inspection budget
const USER_AGENT = 'Mozilla/5.0 (compatible; TechnographicBot/1.0; +https://technographics.io/bot)';

/**
 * Probe 3: Streaming HTTP Reader & Header Extractor
 * Reads response headers and up to 50 KB of the HTML document before terminating the stream.
 */
export async function runHtmlProbe(domain: string): Promise<HtmlProbeData> {
  const fallback: HtmlProbeData = {
    statusCode: 0,
    headers: {},
    snippet: ''
  };

  const targetUrl = `https://${domain}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(3500) // 3.5-second total timeout
    });

    // 1. Extract and sanitize HTTP response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const statusCode = response.status;

    // If there is no response body, return headers immediately
    if (!response.body) {
      return { statusCode, headers, snippet: '' };
    }

    // 2. Stream chunk-by-chunk and abort at 50 KB
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedBytes = 0;
    let snippet = '';

    try {
      while (accumulatedBytes < MAX_BYTES) {
        const { value, done } = await reader.read();
        if (done || !value) break;

        const remainingQuota = MAX_BYTES - accumulatedBytes;
        if (value.length <= remainingQuota) {
          accumulatedBytes += value.length;
          snippet += decoder.decode(value, { stream: true });
        } else {
          // Slice only what we need to hit exactly 50 KB, then cancel
          const partialChunk = value.subarray(0, remainingQuota);
          accumulatedBytes += partialChunk.length;
          snippet += decoder.decode(partialChunk, { stream: false });
          break;
        }
      }
    } finally {
      // Abort the underlying TCP connection to release edge network egress
      await reader.cancel();
    }

    return {
      statusCode,
      headers,
      snippet
    };
  } catch {
    // If HTTPS fails entirely (e.g., self-signed or invalid cert), attempt plaintext HTTP fallback
    if (targetUrl.startsWith('https://')) {
      try {
        const httpFallbackResponse = await fetch(`http://${domain}`, {
          method: 'GET',
          headers: { 'User-Agent': USER_AGENT },
          redirect: 'follow',
          signal: AbortSignal.timeout(2000)
        });

        const headers: Record<string, string> = {};
        httpFallbackResponse.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });

        return {
          statusCode: httpFallbackResponse.status,
          headers,
          snippet: ''
        };
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}