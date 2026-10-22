import { DetectedTechnology, DetectedVia, RawProbePayload } from '../types/contracts';
import { DetectionRule } from './types';

/**
 * Pure evaluation function: compares raw network probe telemetry against a rule registry.
 */
export function evaluateRules(
  payload: RawProbePayload,
  rules: DetectionRule[]
): DetectedTechnology[] {
  const detected: DetectedTechnology[] = [];

  for (const rule of rules) {
    const matchedSurfaces = new Set<DetectedVia>();
    let detectedVersion: string | null = null;

    // --- 1. Evaluate DNS Surfaces ---
    if (rule.matches.dnsTxt && payload.dns.txtRecords.length > 0) {
      const isMatch = rule.matches.dnsTxt.some((pattern) =>
        payload.dns.txtRecords.some((record) => pattern.test(record))
      );
      if (isMatch) matchedSurfaces.add('dns');
    }

    if (rule.matches.dnsMx && payload.dns.mxRecords.length > 0) {
      const isMatch = rule.matches.dnsMx.some((pattern) =>
        payload.dns.mxRecords.some((record) => pattern.test(record))
      );
      if (isMatch) matchedSurfaces.add('dns');
    }

    if (rule.matches.dnsCname && payload.dns.cnames.length > 0) {
      const isMatch = rule.matches.dnsCname.some((pattern) =>
        payload.dns.cnames.some((record) => pattern.test(record))
      );
      if (isMatch) matchedSurfaces.add('dns');
    }

    // --- 2. Evaluate TLS Certificate Surfaces ---
    if (rule.matches.tlsIssuer && payload.tls.issuer) {
      if (rule.matches.tlsIssuer.test(payload.tls.issuer)) {
        matchedSurfaces.add('tls');
      }
    }

    if (rule.matches.tlsSan && payload.tls.sanList.length > 0) {
      const isMatch = rule.matches.tlsSan.some((pattern) =>
        payload.tls.sanList.some((san) => pattern.test(san))
      );
      if (isMatch) matchedSurfaces.add('tls');
    }

    // --- 3. Evaluate HTTP Response Headers Surface ---
    if (rule.matches.headers) {
      for (const [headerKey, pattern] of Object.entries(rule.matches.headers)) {
        const headerValue = payload.html.headers[headerKey.toLowerCase()];
        if (headerValue && pattern.test(headerValue)) {
          matchedSurfaces.add('headers');
          break;
        }
      }
    }

    // --- 4. Evaluate HTML Body Snippet Surface ---
    if (rule.matches.htmlSnippet && payload.html.snippet) {
      const isMatch = rule.matches.htmlSnippet.some((pattern) =>
        pattern.test(payload.html.snippet)
      );
      if (isMatch) matchedSurfaces.add('html');
    }

    // If no surfaces matched, move to the next rule
    if (matchedSurfaces.size === 0) {
      continue;
    }

    // --- 5. Extract Software Version (if configured) ---
    if (rule.versionExtractor) {
      const sourceString =
        rule.versionExtractor.surface === 'htmlSnippet'
          ? payload.html.snippet
          : JSON.stringify(payload.html.headers);

      const match = sourceString.match(rule.versionExtractor.regex);
      if (match) {
        const groupIndex = rule.versionExtractor.groupIndex ?? 1;
        detectedVersion = match[groupIndex] || null;
      }
    }

    // --- 6. Confidence Scoring Math ---
    // Multi-surface confirmation boosts confidence by 5% per additional surface
    const corroborationBonus = (matchedSurfaces.size - 1) * 5;
    const finalConfidence = Math.min(100, rule.baseConfidence + corroborationBonus);

    detected.push({
      name: rule.name,
      category: rule.category,
      confidence: finalConfidence,
      version: detectedVersion,
      detectedVia: Array.from(matchedSurfaces)
    });
  }

  // Sort descending by highest confidence score
  return detected.sort((a, b) => b.confidence - a.confidence);
}