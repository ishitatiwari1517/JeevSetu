// Result shape per PRD §6.5. The Lambda eventually returns this shape directly;
// today the legacy single-finding response is adapted into it via aiScan.normalize.

export type Severity = 'HEALTHY' | 'MONITOR' | 'SEE_VET' | 'EMERGENCY';
export type OverallStatus = 'HEALTHY' | 'NEEDS_ATTENTION' | 'URGENT';
export type ImageQuality = 'good' | 'acceptable' | 'poor';
export type ConfidenceLabel = 'High' | 'Moderate' | 'Low' | 'Insufficient';

export interface ScanFinding {
  condition: string;
  confidence: number;
  severity: Severity;
  visibleIndicators: string[];
  plainLanguage: string;
}

export interface ScanResult {
  subjectDetected: boolean;
  imageQuality: ImageQuality;
  findings: ScanFinding[];
  overallStatus: OverallStatus;
  recommendation: string;
  disclaimer: string;
  description?: string;
  observedConcerns?: string[];
  referencePoints?: string[];
  riskLevel?: 'Low' | 'Moderate' | 'High';
  riskJustification?: string;
  precautionarySteps?: string[];
  whenToSeekVet?: string[];
}

export const DEFAULT_DISCLAIMER =
  'This assessment is based solely on the provided image and may not be accurate. Please consult a qualified veterinarian for a professional diagnosis.';

// Severity → visual tone for the condition card severity pill.
export const SEVERITY_TONE: Record<Severity, { label: string; bg: string; fg: string }> = {
  HEALTHY:   { label: 'HEALTHY',   bg: '#E1F4ED', fg: '#1F8A5F' },
  MONITOR:   { label: 'MONITOR',   bg: '#FFF3D6', fg: '#A77410' },
  SEE_VET:   { label: 'SEE VET',   bg: '#FFE0CC', fg: '#B8521A' },
  EMERGENCY: { label: 'EMERGENCY', bg: '#FCE7E7', fg: '#B53636' },
};

// Overall status → banner visual.
export const STATUS_BANNER: Record<OverallStatus, { label: string; tone: string; bg: string }> = {
  HEALTHY:         { label: 'HEALTHY',         tone: '#1F8A5F', bg: '#E1F4ED' },
  NEEDS_ATTENTION: { label: 'NEEDS ATTENTION', tone: '#1F6A99', bg: '#E1F0FA' },
  URGENT:          { label: 'URGENT',          tone: '#B53636', bg: '#FCE7E7' },
};

/**
 * User-visible confidence label per PRD §6.6 thresholds:
 *   85–100 → High
 *   60–84  → Moderate
 *   40–59  → Low
 *   <40    → Insufficient (UI suppresses the card; shows "we need clearer photos")
 */
export const confidenceLabel = (percent: number): ConfidenceLabel => {
  if (percent >= 85) return 'High';
  if (percent >= 60) return 'Moderate';
  if (percent >= 40) return 'Low';
  return 'Insufficient';
};

/**
 * PRD §6.5 plain-language substitution map. Used as a fallback normalizer when
 * Claude's `plain_language` field is missing or matches a known clinical term.
 * Lookup is case-insensitive and substring-based.
 */
const PLAIN_LANGUAGE_MAP: Array<{ pattern: RegExp; display: string }> = [
  { pattern: /sarcoptic mange.*alopecia/i, display: 'Mange — hair loss and skin irritation' },
  { pattern: /bilateral ocular discharge/i, display: 'Discharge from both eyes' },
  { pattern: /generalized pruritus/i, display: 'Widespread itching and scratching' },
  { pattern: /pyrexia indicators/i, display: 'Signs suggesting fever' },
];

export const toPlainLanguage = (input: string): string => {
  if (!input) return '';
  const hit = PLAIN_LANGUAGE_MAP.find(entry => entry.pattern.test(input));
  return hit ? hit.display : input;
};

/**
 * Filter the findings array per PRD §6.6: hide cards whose confidence is below
 * the Insufficient threshold (40). If everything is below threshold, the screen
 * shows "we need clearer photos" instead of an empty list.
 */
export const visibleFindings = (findings: ScanFinding[]): ScanFinding[] =>
  findings.filter(f => f.confidence >= 40);
