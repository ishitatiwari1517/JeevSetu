import {
  confidenceLabel,
  toPlainLanguage,
  visibleFindings,
  SEVERITY_TONE,
  STATUS_BANNER,
  DEFAULT_DISCLAIMER,
} from '../src/services/scanResult';

describe('confidenceLabel', () => {
  test('PRD §6.6 thresholds', () => {
    expect(confidenceLabel(95)).toBe('High');
    expect(confidenceLabel(85)).toBe('High');
    expect(confidenceLabel(84)).toBe('Moderate');
    expect(confidenceLabel(60)).toBe('Moderate');
    expect(confidenceLabel(59)).toBe('Low');
    expect(confidenceLabel(40)).toBe('Low');
    expect(confidenceLabel(39)).toBe('Insufficient');
    expect(confidenceLabel(0)).toBe('Insufficient');
  });
});

describe('toPlainLanguage', () => {
  test('substitutes the PRD examples', () => {
    expect(toPlainLanguage('Sarcoptic mange with alopecia'))
      .toBe('Mange — hair loss and skin irritation');
    expect(toPlainLanguage('Bilateral ocular discharge'))
      .toBe('Discharge from both eyes');
    expect(toPlainLanguage('Generalized pruritus'))
      .toBe('Widespread itching and scratching');
    expect(toPlainLanguage('Pyrexia indicators'))
      .toBe('Signs suggesting fever');
  });

  test('passes through unknown input', () => {
    expect(toPlainLanguage('Patchy fur loss on neck'))
      .toBe('Patchy fur loss on neck');
  });

  test('case-insensitive matching', () => {
    expect(toPlainLanguage('SARCOPTIC MANGE WITH ALOPECIA'))
      .toBe('Mange — hair loss and skin irritation');
  });

  test('handles empty input', () => {
    expect(toPlainLanguage('')).toBe('');
  });
});

describe('visibleFindings', () => {
  const findings = [
    { condition: 'A', confidence: 90, severity: 'SEE_VET', visibleIndicators: [], plainLanguage: '' },
    { condition: 'B', confidence: 50, severity: 'MONITOR', visibleIndicators: [], plainLanguage: '' },
    { condition: 'C', confidence: 39, severity: 'MONITOR', visibleIndicators: [], plainLanguage: '' },
    { condition: 'D', confidence: 40, severity: 'MONITOR', visibleIndicators: [], plainLanguage: '' },
  ] as const;

  test('drops findings below 40 confidence', () => {
    const visible = visibleFindings(findings as any);
    expect(visible.map(f => f.condition)).toEqual(['A', 'B', 'D']);
  });

  test('returns empty when nothing meets threshold', () => {
    expect(visibleFindings([
      { condition: 'X', confidence: 30, severity: 'MONITOR', visibleIndicators: [], plainLanguage: '' },
    ] as any)).toEqual([]);
  });
});

describe('tone tables', () => {
  test('every severity has a tone', () => {
    expect(Object.keys(SEVERITY_TONE).sort())
      .toEqual(['EMERGENCY', 'HEALTHY', 'MONITOR', 'SEE_VET']);
  });

  test('every overall status has a banner', () => {
    expect(Object.keys(STATUS_BANNER).sort())
      .toEqual(['HEALTHY', 'NEEDS_ATTENTION', 'URGENT']);
  });

  test('default disclaimer mentions licensed veterinarian', () => {
    expect(DEFAULT_DISCLAIMER.toLowerCase()).toMatch(/licensed veterinarian/);
  });
});
