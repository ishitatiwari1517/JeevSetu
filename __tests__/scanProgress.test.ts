import {
  STEPS,
  STEP_DURATION_MS,
  SLOW_THRESHOLD_MS,
  computeStep,
  stepIndex,
  progressFraction,
  isSlowConnection,
} from '../src/screens/scanProgress';

describe('STEPS', () => {
  test('is the four PRD §6.4 stages in order', () => {
    expect(STEPS.map(s => s.key)).toEqual(['upload', 'quality', 'analysis', 'finalize']);
  });
});

describe('computeStep', () => {
  test('starts on upload', () => {
    expect(computeStep(0, false)).toBe('upload');
    expect(computeStep(STEP_DURATION_MS - 1, false)).toBe('upload');
  });

  test('advances to quality after one window', () => {
    expect(computeStep(STEP_DURATION_MS, false)).toBe('quality');
    expect(computeStep(STEP_DURATION_MS * 2 - 1, false)).toBe('quality');
  });

  test('holds on analysis past the third window while scan is in flight', () => {
    expect(computeStep(STEP_DURATION_MS * 2, false)).toBe('analysis');
    expect(computeStep(STEP_DURATION_MS * 10, false)).toBe('analysis');
    expect(computeStep(60_000, false)).toBe('analysis');
  });

  test('jumps to finalize as soon as scan completes', () => {
    expect(computeStep(0, true)).toBe('finalize');
    expect(computeStep(STEP_DURATION_MS * 5, true)).toBe('finalize');
  });
});

describe('stepIndex', () => {
  test('returns 0..3 for the four steps', () => {
    expect(stepIndex('upload')).toBe(0);
    expect(stepIndex('quality')).toBe(1);
    expect(stepIndex('analysis')).toBe(2);
    expect(stepIndex('finalize')).toBe(3);
  });
});

describe('progressFraction', () => {
  test('is 0.25 / 0.5 / 0.75 / 1.0', () => {
    expect(progressFraction('upload')).toBeCloseTo(0.25);
    expect(progressFraction('quality')).toBeCloseTo(0.5);
    expect(progressFraction('analysis')).toBeCloseTo(0.75);
    expect(progressFraction('finalize')).toBeCloseTo(1.0);
  });
});

describe('isSlowConnection', () => {
  test('only fires when stuck on upload past threshold', () => {
    expect(isSlowConnection(0, 'upload')).toBe(false);
    expect(isSlowConnection(SLOW_THRESHOLD_MS - 1, 'upload')).toBe(false);
    expect(isSlowConnection(SLOW_THRESHOLD_MS, 'upload')).toBe(true);
  });

  test('does not fire on later stages even past threshold', () => {
    expect(isSlowConnection(SLOW_THRESHOLD_MS * 2, 'quality')).toBe(false);
    expect(isSlowConnection(SLOW_THRESHOLD_MS * 2, 'analysis')).toBe(false);
    expect(isSlowConnection(SLOW_THRESHOLD_MS * 2, 'finalize')).toBe(false);
  });
});
