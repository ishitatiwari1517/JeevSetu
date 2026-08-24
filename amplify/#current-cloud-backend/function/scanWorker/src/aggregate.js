/* eslint-env node */
'use strict';

// PRD §6.7 ensemble aggregation across per-image findings.
//
// Pure: input is N parsed Claude responses (one per image), output is a single
// merged ScanResult that the frontend consumes. No AWS, no I/O.

const SEVERITY_ORDER = { HEALTHY: 0, MONITOR: 1, SEE_VET: 2, EMERGENCY: 3 };

const PLAIN_LANGUAGE_MAP = [
  { pattern: /sarcoptic mange.*alopecia/i, display: 'Mange — hair loss and skin irritation' },
  { pattern: /bilateral ocular discharge/i, display: 'Discharge from both eyes' },
  { pattern: /generalized pruritus/i, display: 'Widespread itching and scratching' },
  { pattern: /pyrexia indicators/i, display: 'Signs suggesting fever' },
  { pattern: /feline conjunctivitis/i, display: 'Eye inflammation (cat)' },
  { pattern: /ear mites/i, display: 'Possible ear mites' },
  { pattern: /upper respiratory infection/i, display: 'Possible upper respiratory infection' },
  { pattern: /mastitis/i, display: 'Possible udder inflammation (mastitis)' },
  { pattern: /foot-and-mouth/i, display: 'Possible foot-and-mouth indicators' },
  { pattern: /lumpy skin disease/i, display: 'Possible lumpy skin disease signs' },
  { pattern: /pink eye|infectious bovine keratoconjunctivitis/i, display: 'Possible pink eye (cattle)' },
  { pattern: /lameness/i, display: 'Signs of lameness' },
];

const DEFAULT_DISCLAIMER =
  'This assessment is based solely on the provided image and may not be accurate. Please consult a qualified veterinarian for a professional diagnosis.';

const VALID_SEVERITIES = new Set(Object.keys(SEVERITY_ORDER));
const VALID_OVERALL = new Set(['HEALTHY', 'NEEDS_ATTENTION', 'URGENT']);
const VALID_QUALITY = new Set(['good', 'acceptable', 'poor']);

const toPlainLanguage = (input) => {
  if (!input) return '';
  const hit = PLAIN_LANGUAGE_MAP.find((entry) => entry.pattern.test(input));
  return hit ? hit.display : input;
};

const mostSevere = (severities) => {
  let best = 'HEALTHY';
  for (const s of severities) {
    if (!VALID_SEVERITIES.has(s)) continue;
    if (SEVERITY_ORDER[s] > SEVERITY_ORDER[best]) best = s;
  }
  return best;
};

const overallFromFindings = (findings) => {
  if (findings.some((f) => f.severity === 'EMERGENCY')) return 'URGENT';
  if (findings.some((f) => f.severity === 'SEE_VET' || f.severity === 'MONITOR')) {
    return 'NEEDS_ATTENTION';
  }
  return 'HEALTHY';
};

const worstQuality = (qualities) => {
  if (qualities.includes('poor')) return 'poor';
  if (qualities.includes('acceptable')) return 'acceptable';
  return 'good';
};

const pickRecommendation = (perImage, overall) => {
  const all = perImage.map((r) => r?.recommendation).filter(Boolean);
  if (overall === 'URGENT') return 'Seek veterinary care immediately.';
  if (all.length > 0) return all[0];
  return overall === 'HEALTHY'
    ? 'No concerning findings. Keep up the routine care and consider a periodic vet checkup.'
    : 'Schedule a veterinary visit to confirm and discuss next steps.';
};

const aggregate = (perImageResults) => {
  const usable = (perImageResults || []).filter((r) => r && r.subjectDetected !== false);
  if (usable.length === 0) {
    return {
      subjectDetected: false,
      imageQuality: 'poor',
      findings: [],
      overallStatus: 'NEEDS_ATTENTION',
      recommendation: 'We could not identify a dog, cat, or cow in any of the photos. Please retake the scan.',
      description: '',
      observedConcerns: [],
      referencePoints: [],
      riskLevel: 'Low',
      riskJustification: '',
      precautionarySteps: [],
      whenToSeekVet: [],
      disclaimer: DEFAULT_DISCLAIMER,
    };
  }

  const totalImages = usable.length;
  const grouped = new Map();

  usable.forEach((r) => {
    (Array.isArray(r.findings) ? r.findings : []).forEach((f) => {
      const condition = String(f.condition || '').trim();
      if (!condition) return;
      const conf = Number(f.confidence);
      if (!Number.isFinite(conf)) return;
      const severity = VALID_SEVERITIES.has(f.severity) ? f.severity : 'MONITOR';

      const key = condition.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, {
          condition,
          severities: [],
          confidences: [],
          plainLanguages: [],
          indicators: new Set(),
        });
      }
      const acc = grouped.get(key);
      acc.severities.push(severity);
      acc.confidences.push(Math.max(0, Math.min(100, Math.round(conf))));
      const pl = String(f.plainLanguage || f.plain_language || '').trim();
      if (pl) acc.plainLanguages.push(pl);
      const inds = Array.isArray(f.visibleIndicators)
        ? f.visibleIndicators
        : Array.isArray(f.visible_indicators) ? f.visible_indicators : [];
      inds.forEach((i) => {
        if (typeof i === 'string' && i.trim()) acc.indicators.add(i.trim());
      });
    });
  });

  const findings = [];
  for (const data of grouped.values()) {
    const appearedIn = data.confidences.length;
    const avgConfidence = Math.round(
      data.confidences.reduce((sum, c) => sum + c, 0) / appearedIn,
    );
    const maxConfidence = Math.max(...data.confidences);

    // PRD §6.7: include if appears in ≥2 images OR confidence ≥75 in single image.
    if (appearedIn < 2 && maxConfidence < 75) continue;

    // Conflicting readings (some images flag, others don't) cap at 60 and prefix Possible.
    let confidence = avgConfidence;
    let displayCondition = data.condition;
    if (appearedIn < totalImages) {
      confidence = Math.min(confidence, 60);
      if (!/^possible /i.test(displayCondition)) {
        displayCondition = `Possible ${displayCondition.charAt(0).toLowerCase()}${displayCondition.slice(1)}`;
      }
    }

    const severity = mostSevere(data.severities);
    const rawLanguage = data.plainLanguages[0] || '';
    findings.push({
      condition: displayCondition,
      confidence,
      severity,
      visibleIndicators: Array.from(data.indicators),
      plainLanguage: toPlainLanguage(rawLanguage),
    });
  }

  findings.sort((a, b) => {
    const sevDelta = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    return sevDelta !== 0 ? sevDelta : b.confidence - a.confidence;
  });

  const overallStatus = overallFromFindings(findings);
  const imageQuality = worstQuality(
    usable.map((r) => (VALID_QUALITY.has(r.imageQuality) ? r.imageQuality : 'acceptable')),
  );

  // Merge new health analysis fields across all per-image results.
  const RISK_ORDER = { Low: 0, Moderate: 1, High: 2 };
  const descriptions = usable.map((r) => r.description).filter(Boolean);
  const allConcerns = new Set();
  const allRefPoints = new Set();
  const allPrecautions = new Set();
  const allSeekVet = new Set();
  let worstRisk = 'Low';
  let bestJustification = '';

  usable.forEach((r) => {
    (Array.isArray(r.observedConcerns) ? r.observedConcerns : []).forEach((s) => { if (typeof s === 'string' && s.trim()) allConcerns.add(s.trim()); });
    (Array.isArray(r.referencePoints) ? r.referencePoints : []).forEach((s) => { if (typeof s === 'string' && s.trim()) allRefPoints.add(s.trim()); });
    (Array.isArray(r.precautionarySteps) ? r.precautionarySteps : []).forEach((s) => { if (typeof s === 'string' && s.trim()) allPrecautions.add(s.trim()); });
    (Array.isArray(r.whenToSeekVet) ? r.whenToSeekVet : []).forEach((s) => { if (typeof s === 'string' && s.trim()) allSeekVet.add(s.trim()); });
    const rl = r.riskLevel;
    if (rl && (RISK_ORDER[rl] || 0) > (RISK_ORDER[worstRisk] || 0)) {
      worstRisk = rl;
      bestJustification = r.riskJustification || bestJustification;
    }
  });

  return {
    subjectDetected: true,
    imageQuality,
    findings,
    overallStatus: VALID_OVERALL.has(overallStatus) ? overallStatus : 'NEEDS_ATTENTION',
    recommendation: pickRecommendation(usable, overallStatus),
    description: descriptions[0] || '',
    observedConcerns: Array.from(allConcerns),
    referencePoints: Array.from(allRefPoints),
    riskLevel: worstRisk,
    riskJustification: bestJustification,
    precautionarySteps: Array.from(allPrecautions),
    whenToSeekVet: Array.from(allSeekVet),
    disclaimer: DEFAULT_DISCLAIMER,
  };
};

module.exports = {
  aggregate,
  toPlainLanguage,
  mostSevere,
  overallFromFindings,
  DEFAULT_DISCLAIMER,
};
