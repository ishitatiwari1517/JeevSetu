export const MIN_IMAGES = 1;
export const MAX_IMAGES = 6;

export type Quality = 'good' | 'acceptable' | 'poor';

export interface CapturedAsset {
  id: string;
  uri: string;
  base64?: string;
  mediaType: string;
  fileName?: string;
  fileSize?: number;
  quality: Quality;
  qualityReason: string;
}

export interface ConfidenceResult {
  percent: number;
  label: 'Low' | 'Moderate' | 'High';
  needsMore: number;
}

const QUALITY_REASON: Record<Quality, string> = {
  good: 'Clear Focus',
  acceptable: 'Acceptable',
  poor: 'Low Lighting',
};

const QUALITY_DISPLAY: Record<Quality, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  good: { label: 'HIGH QUALITY', tone: 'green' },
  acceptable: { label: 'ADJUSTING', tone: 'amber' },
  poor: { label: 'LOW QUALITY', tone: 'red' },
};

export const qualityDisplay = (q: Quality) => QUALITY_DISPLAY[q];
export const qualityReason = (q: Quality) => QUALITY_REASON[q];

/**
 * Heuristic quality assignment from picker asset metadata.
 * Today: file size as a coarse proxy for clarity. Real on-device blur /
 * subject detection (YOLO) is Phase 5 #19.
 */
export const assignQuality = (asset: { fileSize?: number }): Quality => {
  const size = asset.fileSize ?? 0;
  // No file-size info → assume acceptable rather than penalising
  if (size === 0) return 'acceptable';
  // Phone cameras at quality 0.85 typically produce 100-400 KB JPEGs.
  // Previous thresholds (1.5 MB / 500 KB) were far too high and marked
  // virtually every capture as "poor → Low Quality / Low Lighting".
  if (size >= 200_000) return 'good';      // ≥ 200 KB → good
  if (size >= 50_000)  return 'acceptable'; // ≥ 50 KB  → acceptable
  return 'poor';                            // < 50 KB  → genuinely tiny / thumbnail
};

const QUALITY_WEIGHT: Record<Quality, number> = { good: 1, acceptable: 0.7, poor: 0.4 };

/**
 * Composite confidence shown to the user. Two factors:
 *  - count: more images → more confidence (saturating at MAX_IMAGES)
 *  - quality: average quality weight modulates the count contribution
 *
 * Returned label thresholds match the PRD §6.6:
 *   < 50  → Low
 *   50-79 → Moderate
 *   ≥ 80  → High
 *
 * `needsMore` is the suggested additional photo count to reach High
 * confidence, capped at the remaining slots.
 */
export const computeConfidence = (
  assets: ReadonlyArray<{ quality: Quality }>,
): ConfidenceResult => {
  if (assets.length === 0) {
    return { percent: 0, label: 'Low', needsMore: MIN_IMAGES };
  }
  // Floor of 35 so a single low-quality photo doesn't read as "0% sure" — the user
  // already invested effort. Each image adds 12 points modulated by its quality
  // weight; capped at 95 so we never imply certainty.
  const avgWeight =
    assets.reduce((sum, a) => sum + QUALITY_WEIGHT[a.quality], 0) / assets.length;
  const raw = 35 + Math.min(assets.length, MAX_IMAGES) * 12 * avgWeight;
  const percent = Math.min(95, Math.round(raw));
  const label: ConfidenceResult['label'] =
    percent >= 80 ? 'High' : percent >= 50 ? 'Moderate' : 'Low';
  const remaining = MAX_IMAGES - assets.length;
  const needsMore = label === 'High' ? 0 : Math.min(2, remaining);
  return { percent, label, needsMore };
};

const KB = 1024;
const MB = KB * 1024;

export const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= KB) return `${Math.round(bytes / KB)} KB`;
  return `${bytes} B`;
};
