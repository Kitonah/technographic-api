import {
  DetectedTechnology,
  InspectionSurface,
  ProbeSnapshotFixture,
  TechnologySignature
} from './types';

const SURFACE_WEIGHTS: Record<InspectionSurface, number> = {
  dns: 1.15,
  tls: 1.10,
  http_header: 1.00,
  cookie: 0.90,
  html_script: 0.85
};

const INTRA_SURFACE_GAMMA = 0.50;
const DIVERSITY_ALPHA = 0.35;

/**
 * Normalizes extracted version strings into uniform SemVer or CalVer strings,
 * rejecting Unix timestamps and epoch cache busters (> 2100).
 */
export function normalizeVersion(rawVersion: string | undefined): string | null {
  if (!rawVersion) return null;
  let cleaned = rawVersion.trim();

  // 1. Strip package scopes and leading version prefixes (acme-web@v14.2.5-beta.2 -> 14.2.5-beta.2)
  cleaned = cleaned.replace(
    /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?(?:[a-z0-9-._~]+@)?(?:v|ver|version|release)[-._:/\s]*/i,
    ''
  );
  // Strip build metadata (+build.123)
  cleaned = cleaned.split('+')[0];

  // 2. Check CalVer format (e.g., 2026.08.1.0 or 2026-08-25)
  const calVerMatch = cleaned.match(
    /^((?:19|20)\d{2})[-._/](0?[1-9]|1[0-2])(?:[-._/](\d{1,2}))?(?:\.(\d+))?$/
  );
  if (calVerMatch) {
    const year = calVerMatch[1];
    const month = calVerMatch[2].padStart(2, '0');
    const dayOrPatch = (calVerMatch[3] || '0').padStart(1, '0');
    const subPatch = calVerMatch[4] ? `.${calVerMatch[4]}` : '';
    return `${year}.${month}.${dayOrPatch}${subPatch}`;
  }

  // 3. Standard SemVer coercion
  const semVerMatch = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([a-zA-Z0-9.-]+))?$/);
  if (!semVerMatch) return null;

  const major = parseInt(semVerMatch[1], 10);
  // Reject Unix epoch cache busters (> 2100)
  if (major > 2100) return null;

  const minor = semVerMatch[2] ?? '0';
  const patch = semVerMatch[3] ?? '0';
  const prerelease = semVerMatch[4] ? `-${semVerMatch[4].toLowerCase()}` : '';

  return `${major}.${minor}.${patch}${prerelease}`;
}

/**
 * Pure evaluation function implementing:
 * 1. Multi-Surface Regex Matching with Defensive Fallbacks
 * 2. Three-Stage Damped Noisy-OR Scorer with Logarithmic Diversity Scaling
 * 3. Base64 JSON Metadata Decoding
 * 4. SemVer/CalVer Version Normalization & NIST CPE 2.3 Binding
 * 5. DAG Disambiguation (Parent Substrate Attenuation & Tier Collision Suppression)
 */
export function evaluateRules(
  payload: ProbeSnapshotFixture,
  signatures: TechnologySignature[]
): DetectedTechnology[] {
  const rawDetections = new Map<string, DetectedTechnology>();

  for (const sig of signatures) {
    const surfaceMatches = new Map<InspectionSurface, number[]>();
    const evidenceTrail: string[] = [];
    let bestVersion: string | null = null;

    for (const matcher of sig.matchers) {
      const regex = new RegExp(matcher.regex, 'i');
      let candidateTargets: string[] = [];

      if (matcher.surface === 'dns') {
        const sub = matcher.subTarget || 'txt';
        if (sub === 'a') candidateTargets = payload.dns?.a || [];
        else if (sub === 'cname') candidateTargets = payload.dns?.cname || [];
        else if (sub === 'mx') candidateTargets = (payload.dns?.mx || []).map((m) => m.exchange);
        else candidateTargets = payload.dns?.txt || [];
      } else if (matcher.surface === 'tls') {
        candidateTargets = [
          payload.tls?.issuerCn,
          payload.tls?.issuerOrg,
          payload.tls?.subjectCn,
          ...(payload.tls?.sans || [])
        ].filter(Boolean) as string[];
      } else if (matcher.surface === 'http_header') {
        if (matcher.subTarget) {
          const val = payload.http?.headers?.[matcher.subTarget.toLowerCase()];
          if (val) candidateTargets = [val];
        } else {
          candidateTargets = Object.entries(payload.http?.headers || {}).map(([k, v]) => `${k}: ${v}`);
        }
      } else if (matcher.surface === 'cookie') {
        candidateTargets = payload.http?.setCookies || [];
      } else if (matcher.surface === 'html_script') {
        candidateTargets = payload.http?.bodySnippet50Kb ? [payload.http.bodySnippet50Kb] : [];
      }

      for (const targetStr of candidateTargets) {
        const match = regex.exec(targetStr);
        if (match) {
          const list = surfaceMatches.get(matcher.surface) || [];
          list.push(matcher.baseConfidence);
          surfaceMatches.set(matcher.surface, list);
          evidenceTrail.push(
            `${matcher.surface}${matcher.subTarget ? `(${matcher.subTarget})` : ''}: ${matcher.regex}`
          );

          if (matcher.versionGroup && match[matcher.versionGroup]) {
            let extracted = match[matcher.versionGroup];
            if (matcher.decodeBase64JsonKey) {
              try {
                let decoded = '';
                if (typeof Buffer !== 'undefined') {
                  decoded = Buffer.from(extracted, 'base64').toString('utf-8');
                } else if (typeof atob === 'function') {
                  decoded = atob(extracted);
                }
                const decodedJson = JSON.parse(decoded);
                extracted = decodedJson[matcher.decodeBase64JsonKey] || '';
              } catch {
                extracted = '';
              }
            }
            const norm = normalizeVersion(extracted);
            if (
              norm &&
              (!bestVersion || norm.length > bestVersion.length || bestVersion.endsWith('.0.0'))
            ) {
              bestVersion = norm;
            }
          }
          break;
        }
      }
    }

    if (surfaceMatches.size === 0) continue;

    // Stage 1: Intra-Surface Damping
    const surfaceScores = new Map<InspectionSurface, number>();
    for (const [surf, confs] of surfaceMatches.entries()) {
      const sorted = [...confs].sort((a, b) => b - a);
      let unconf = 1.0 - sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        unconf *= 1.0 - INTRA_SURFACE_GAMMA * sorted[i];
      }
      surfaceScores.set(surf, 1.0 - unconf);
    }

    // Stage 2: Inter-Surface Weighted Noisy-OR
    let totalUnconf = 1.0;
    for (const [surf, score] of surfaceScores.entries()) {
      const w = SURFACE_WEIGHTS[surf] ?? 1.0;
      const weightedProb = Math.min(1.0, score * w);
      totalUnconf *= 1.0 - weightedProb;
    }
    const baseCombined = 1.0 - totalUnconf;

    // Stage 3: Cross-Surface Logarithmic Diversity Multiplier
    const nSurfaces = surfaceScores.size;
    const multiplier = nSurfaces > 1 ? 1.0 + DIVERSITY_ALPHA * Math.log(nSurfaces) : 1.0;
    const finalConfidence = Number(Math.min(1.0, baseCombined * multiplier).toFixed(4));

    const cpe23 = bestVersion
      ? `cpe:2.3:a:${sig.cpeVendor}:${sig.cpeProduct}:${bestVersion}:*:*:*:*:*:*:*`
      : null;

    rawDetections.set(sig.id, {
      id: sig.id,
      name: sig.name,
      category: sig.category,
      confidence: finalConfidence,
      deploymentRole: 'direct_deployment',
      matchedSurfaces: Array.from(surfaceScores.keys()),
      normalizedVersion: bestVersion,
      cpe23,
      evidenceTrail
    });
  }

  // Stage 4: DAG Disambiguation & Substrate Attenuation
  for (const sig of signatures) {
    const sourceDetection = rawDetections.get(sig.id);
    if (!sourceDetection || sourceDetection.confidence < 0.70 || !sig.disambiguation) continue;

    for (const policy of sig.disambiguation) {
      const targetDetection = rawDetections.get(policy.targetTechId);
      if (!targetDetection) continue;

      if (policy.type === 'EXCLUDES_LOWER_TIER') {
        targetDetection.deploymentRole = 'suppressed_collision';
      } else if (policy.type === 'ATTENUATES_SUBSTRATE') {
        const hasOverrideDns =
          policy.overrideDnsPattern &&
          (payload.dns?.cname || []).some((c) => new RegExp(policy.overrideDnsPattern!, 'i').test(c));
        if (!hasOverrideDns) {
          targetDetection.deploymentRole = 'platform_bundled_substrate';
          targetDetection.confidence = Number(
            (targetDetection.confidence * (policy.attenuationMultiplier ?? 0.35)).toFixed(4)
          );
        }
      }
    }
  }

  return Array.from(rawDetections.values());
}