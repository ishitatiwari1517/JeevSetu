import {
  assignQuality,
  computeConfidence,
  formatBytes,
  MAX_IMAGES,
  MIN_IMAGES,
} from '../src/screens/multiImageCapture';

describe('assignQuality', () => {
  test('large files are good', () => {
    expect(assignQuality({ fileSize: 2_400_000 })).toBe('good');
  });

  test('mid-size files are acceptable', () => {
    expect(assignQuality({ fileSize: 100_000 })).toBe('acceptable');
  });

  test('tiny files are poor', () => {
    expect(assignQuality({ fileSize: 10_000 })).toBe('poor');
  });

  test('missing file size defaults to acceptable', () => {
    expect(assignQuality({})).toBe('acceptable');
  });
});

describe('computeConfidence', () => {
  test('zero assets → Low / 0% / needsMore = MIN_IMAGES', () => {
    const result = computeConfidence([]);
    expect(result).toEqual({ percent: 0, label: 'Low', needsMore: MIN_IMAGES });
  });

  test('two good photos hit Moderate', () => {
    const result = computeConfidence([
      { quality: 'good' },
      { quality: 'good' },
    ]);
    expect(result.label).toBe('Moderate');
    expect(result.percent).toBeGreaterThanOrEqual(40);
    expect(result.percent).toBeLessThan(80);
  });

  test('six good photos hit High', () => {
    const six = Array.from({ length: MAX_IMAGES }, () => ({ quality: 'good' as const }));
    const result = computeConfidence(six);
    expect(result.label).toBe('High');
    expect(result.percent).toBeGreaterThanOrEqual(80);
    expect(result.needsMore).toBe(0);
  });

  test('poor photos drag confidence down', () => {
    const allGood = computeConfidence([
      { quality: 'good' }, { quality: 'good' }, { quality: 'good' },
    ]);
    const allPoor = computeConfidence([
      { quality: 'poor' }, { quality: 'poor' }, { quality: 'poor' },
    ]);
    expect(allPoor.percent).toBeLessThan(allGood.percent);
  });

  test('needsMore caps at remaining slot count', () => {
    // 5 acceptable photos → label still not High → needsMore = remaining (1), not 2.
    const result = computeConfidence(
      Array.from({ length: 5 }, () => ({ quality: 'acceptable' as const })),
    );
    if (result.label !== 'High') {
      expect(result.needsMore).toBeLessThanOrEqual(MAX_IMAGES - 5);
    }
  });
});

describe('formatBytes', () => {
  test('returns empty string for missing or zero size', () => {
    expect(formatBytes(undefined)).toBe('');
    expect(formatBytes(0)).toBe('');
  });

  test('formats MB', () => {
    expect(formatBytes(2_400_000)).toBe('2.3 MB');
  });

  test('formats KB', () => {
    expect(formatBytes(45 * 1024)).toBe('45 KB');
  });

  test('formats bytes for tiny inputs', () => {
    expect(formatBytes(512)).toBe('512 B');
  });
});
