import { DetectedVia, TechCategory } from '../types/contracts';

/**
 * Defines where and how to parse software version numbers.
 * Uses regular expression capture groups (e.g. /v(\d+\.\d+)/).
 */
export interface VersionExtractor {
  surface: 'headers' | 'htmlSnippet';
  regex: RegExp;
  groupIndex?: number; // Defaults to capture group 1
}

/**
 * Multi-surface matching patterns for a single technology.
 * An engine match occurs if ANY surface pattern matches.
 */
export interface RuleMatchCriteria {
  dnsTxt?: RegExp[];
  dnsMx?: RegExp[];
  dnsCname?: RegExp[];
  tlsIssuer?: RegExp;
  tlsSan?: RegExp[];
  headers?: Record<string, RegExp>; // Case-insensitive header name -> Regex pattern
  htmlSnippet?: RegExp[];
}

/**
 * The blueprint for a single technographic signature.
 */
export interface DetectionRule {
  id: string;
  name: string;
  category: TechCategory;
  baseConfidence: number; // 0 to 100
  matches: RuleMatchCriteria;
  versionExtractor?: VersionExtractor;
}