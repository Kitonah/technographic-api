import { EnrichedResult, RawProbePayload } from '../types/contracts';
import { SIGNATURE_REGISTRY } from './definitions';
import { evaluateRules } from './engine';

/**
 * Executes the signature engine against live probe telemetry and formats the EnrichedResult.
 */
export async function detectTechnologies(payload: RawProbePayload): Promise<EnrichedResult> {
  const technologies = evaluateRules(payload, SIGNATURE_REGISTRY);

  return {
    domain: payload.domain,
    scannedAt: payload.timestamp,
    cached: false,
    technologies,
    metadata: {
      totalDetected: technologies.length,
      probeDurationMs: 0 // Populated by the orchestrator in index.ts
    }
  };
}