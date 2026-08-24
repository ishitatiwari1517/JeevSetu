/* eslint-env node, jest */

const { aggregate, toPlainLanguage, mostSevere, overallFromFindings } =
  require('../../amplify/backend/function/scanWorker/src/aggregate');

const f = (condition, confidence, severity, extras = {}) => ({
  condition,
  confidence,
  severity,
  visibleIndicators: extras.indicators || [],
  plainLanguage: extras.plain || '',
});

const wrap = (findings, overrides = {}) => ({
  subjectDetected: true,
  imageQuality: 'good',
  findings,
  recommendation: overrides.recommendation,
  ...overrides,
});

describe('toPlainLanguage', () => {
  test('substitutes the four PRD examples', () => {
    expect(toPlainLanguage('Sarcoptic mange with alopecia'))
      .toBe('Mange — hair loss and skin irritation');
    expect(toPlainLanguage('Bilateral ocular discharge'))
      .toBe('Discharge from both eyes');
    expect(toPlainLanguage('Generalized pruritus'))
      .toBe('Widespread itching and scratching');
    expect(toPlainLanguage('Pyrexia indicators'))
      .toBe('Signs suggesting fever');
  });

  test('passes through unknown text', () => {
    expect(toPlainLanguage('Hot spot near left ear')).toBe('Hot spot near left ear');
  });
});

describe('mostSevere', () => {
  test('picks the most severe label', () => {
    expect(mostSevere(['HEALTHY', 'MONITOR', 'SEE_VET'])).toBe('SEE_VET');
    expect(mostSevere(['HEALTHY', 'EMERGENCY', 'MONITOR'])).toBe('EMERGENCY');
    expect(mostSevere(['HEALTHY'])).toBe('HEALTHY');
  });
});

describe('overallFromFindings', () => {
  test('EMERGENCY in any finding → URGENT', () => {
    expect(overallFromFindings([f('a', 80, 'EMERGENCY')])).toBe('URGENT');
  });
  test('SEE_VET or MONITOR present → NEEDS_ATTENTION', () => {
    expect(overallFromFindings([f('a', 60, 'SEE_VET')])).toBe('NEEDS_ATTENTION');
    expect(overallFromFindings([f('a', 60, 'MONITOR')])).toBe('NEEDS_ATTENTION');
  });
  test('all healthy or empty → HEALTHY', () => {
    expect(overallFromFindings([])).toBe('HEALTHY');
    expect(overallFromFindings([f('a', 90, 'HEALTHY')])).toBe('HEALTHY');
  });
});

describe('aggregate (PRD §6.7 ensemble)', () => {
  test('drops findings that appear in only one image with low confidence', () => {
    const result = aggregate([
      wrap([f('Mange', 70, 'SEE_VET')]),  // appears once at 70 — below 75 threshold
      wrap([]),
      wrap([]),
    ]);
    expect(result.findings).toHaveLength(0);
    expect(result.overallStatus).toBe('HEALTHY');
  });

  test('keeps a single-image finding if confidence >= 75', () => {
    const result = aggregate([
      wrap([f('Mange', 80, 'SEE_VET')]),
      wrap([]),
      wrap([]),
    ]);
    expect(result.findings).toHaveLength(1);
    // Cross-image: appeared in 1 of 3 — should be marked Possible and capped at 60.
    expect(result.findings[0].condition.toLowerCase()).toContain('possible');
    expect(result.findings[0].confidence).toBeLessThanOrEqual(60);
  });

  test('keeps a finding that appears in >=2 images', () => {
    const result = aggregate([
      wrap([f('Mange', 70, 'SEE_VET')]),
      wrap([f('Mange', 80, 'SEE_VET')]),
      wrap([]),
    ]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].confidence).toBeLessThanOrEqual(60);
  });

  test('full agreement across all images keeps the average and does not prefix Possible', () => {
    const result = aggregate([
      wrap([f('Mange', 70, 'SEE_VET')]),
      wrap([f('Mange', 80, 'SEE_VET')]),
      wrap([f('Mange', 78, 'SEE_VET')]),
    ]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].condition).toBe('Mange');
    expect(result.findings[0].confidence).toBe(76);
  });

  test('most severe across reports wins', () => {
    const result = aggregate([
      wrap([f('Mange', 70, 'MONITOR')]),
      wrap([f('Mange', 80, 'EMERGENCY')]),
      wrap([f('Mange', 72, 'SEE_VET')]),
    ]);
    expect(result.findings[0].severity).toBe('EMERGENCY');
    expect(result.overallStatus).toBe('URGENT');
  });

  test('sorts findings by severity then confidence', () => {
    const result = aggregate([
      wrap([f('Mange', 90, 'SEE_VET'), f('Hot spot', 92, 'EMERGENCY')]),
      wrap([f('Mange', 88, 'SEE_VET'), f('Hot spot', 85, 'EMERGENCY')]),
    ]);
    expect(result.findings[0].condition).toBe('Hot spot');
    expect(result.findings[1].condition).toBe('Mange');
  });

  test('healthy across all images → empty findings, HEALTHY status', () => {
    const result = aggregate([
      wrap([f('Healthy', 95, 'HEALTHY')]),
      wrap([f('Healthy', 90, 'HEALTHY')]),
    ]);
    // Healthy is treated as "no concerning finding" — included only if it crosses threshold,
    // but we still expect overallStatus HEALTHY since no MONITOR/SEE_VET/EMERGENCY exists.
    expect(result.overallStatus).toBe('HEALTHY');
  });

  test('returns subject_detected=false when no usable per-image results', () => {
    const result = aggregate([
      { subjectDetected: false, findings: [] },
      { subjectDetected: false, findings: [] },
    ]);
    expect(result.subjectDetected).toBe(false);
    expect(result.findings).toEqual([]);
    expect(result.overallStatus).toBe('NEEDS_ATTENTION');
  });

  test('imageQuality reflects worst input', () => {
    const result = aggregate([
      wrap([f('Mange', 80, 'SEE_VET')], { imageQuality: 'good' }),
      wrap([f('Mange', 78, 'SEE_VET')], { imageQuality: 'poor' }),
    ]);
    expect(result.imageQuality).toBe('poor');
  });

  test('plain-language substitution applies to aggregated findings', () => {
    const result = aggregate([
      wrap([f('Mange', 80, 'SEE_VET', { plain: 'Sarcoptic mange with alopecia visible' })]),
      wrap([f('Mange', 78, 'SEE_VET', { plain: 'Sarcoptic mange with alopecia visible' })]),
    ]);
    expect(result.findings[0].plainLanguage).toBe('Mange — hair loss and skin irritation');
  });

  test('URGENT severity forces "Seek veterinary care immediately." recommendation', () => {
    const result = aggregate([
      wrap([f('Hot spot', 85, 'EMERGENCY')], { recommendation: 'Different recommendation' }),
      wrap([f('Hot spot', 82, 'EMERGENCY')], { recommendation: 'Different recommendation' }),
    ]);
    expect(result.recommendation).toBe('Seek veterinary care immediately.');
  });
});
