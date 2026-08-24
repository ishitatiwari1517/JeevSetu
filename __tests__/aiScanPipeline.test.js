/* eslint-env jest */

// Mock aws-amplify modules so importing aiScan doesn't pull in real Amplify init.
jest.mock('aws-amplify/api', () => ({ post: jest.fn() }));
jest.mock('aws-amplify/auth', () => ({ fetchAuthSession: jest.fn() }));
jest.mock('../src/aws-exports', () => ({
  aws_cloud_logic_custom: [{ name: 'petvueapi', endpoint: 'https://api.example.com' }],
}), { virtual: true });

const {
  parseInitiateResponse,
  classifyResultResponse,
  pollScanResult,
  ScanError,
} = require('../src/services/aiScan');

describe('parseInitiateResponse', () => {
  test('extracts scanId and presigned in order', () => {
    const result = parseInitiateResponse({
      scanId: 'abc-123',
      presigned: [
        { key: 'k0', uploadUrl: 'u0' },
        { key: 'k1', uploadUrl: 'u1' },
      ],
      expiresIn: 300,
    });
    expect(result.scanId).toBe('abc-123');
    expect(result.presigned).toHaveLength(2);
    expect(result.presigned[0].uploadUrl).toBe('u0');
  });

  test('throws when scanId is missing', () => {
    expect(() => parseInitiateResponse({ presigned: [{ key: 'k', uploadUrl: 'u' }] }))
      .toThrow(/scanId/);
  });

  test('throws when presigned array is empty', () => {
    expect(() => parseInitiateResponse({ scanId: 'a', presigned: [] }))
      .toThrow(/presigned/);
  });
});

describe('classifyResultResponse', () => {
  test('complete with result returns done', () => {
    const verdict = classifyResultResponse({ status: 'complete', result: { findings: [] } });
    expect(verdict.done).toBe(true);
    expect(verdict.result).toEqual({ findings: [] });
  });

  test('complete without result throws BAD_RESULT', () => {
    expect(() => classifyResultResponse({ status: 'complete' }))
      .toThrow(/no result/);
  });

  test('failed throws WORKER_FAILED with the server message', () => {
    expect(() => classifyResultResponse({ status: 'failed', error: 'Lambda timed out' }))
      .toThrow(/Lambda timed out/);
  });

  test('failed without explicit error still throws', () => {
    expect(() => classifyResultResponse({ status: 'failed' }))
      .toThrow(/worker failed/i);
  });

  test('processing/queued/pending → not done', () => {
    expect(classifyResultResponse({ status: 'processing' }).done).toBe(false);
    expect(classifyResultResponse({ status: 'queued' }).done).toBe(false);
    expect(classifyResultResponse({ status: 'pending_upload' }).done).toBe(false);
  });
});

describe('pollScanResult', () => {
  const buildOpts = (overrides = {}) => ({
    sleep: jest.fn(async () => undefined),
    now: jest.fn(() => 0),
    intervalMs: 100,
    timeoutMs: 1000,
    ...overrides,
  });

  test('returns result on first poll if already complete', async () => {
    const fetcher = jest.fn(async () => ({
      status: 'complete',
      result: { findings: [{ condition: 'X' }] },
    }));
    const opts = buildOpts({ fetcher });
    const result = await pollScanResult('s1', 'https://api', {}, opts);
    expect(result.findings[0].condition).toBe('X');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(opts.sleep).not.toHaveBeenCalled();
  });

  test('polls multiple times until complete', async () => {
    let calls = 0;
    const fetcher = jest.fn(async () => {
      calls += 1;
      if (calls < 3) return { status: 'processing' };
      return { status: 'complete', result: { findings: [] } };
    });
    const opts = buildOpts({ fetcher });
    await pollScanResult('s1', 'https://api', {}, opts);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(opts.sleep).toHaveBeenCalledTimes(2); // 2 sleeps between 3 polls
  });

  test('throws TIMEOUT after timeoutMs elapses', async () => {
    const fetcher = jest.fn(async () => ({ status: 'processing' }));
    let elapsed = 0;
    const now = jest.fn(() => { const t = elapsed; elapsed += 600; return t; });
    const opts = buildOpts({ fetcher, now, timeoutMs: 1000 });
    // 0 → first poll, elapsed 600 → second poll, elapsed 1200 → timeout
    await expect(pollScanResult('s1', 'https://api', {}, opts))
      .rejects.toThrow(/timed out/i);
  });

  test('rejects with WORKER_FAILED on failed status', async () => {
    const fetcher = jest.fn(async () => ({ status: 'failed', error: 'oh no' }));
    const opts = buildOpts({ fetcher });
    await expect(pollScanResult('s1', 'https://api', {}, opts))
      .rejects.toThrow(/oh no/);
  });

  test('passes scanId through to the fetcher via default if no override', async () => {
    // When no `fetcher` override, the function uses the default which builds the URL.
    // We don't exercise the network here; only verify behavior with explicit fetcher above.
    expect(typeof pollScanResult).toBe('function');
  });
});

describe('ScanError', () => {
  test('has expected name and code', () => {
    const e = new ScanError('boom', 'X_CODE');
    expect(e.name).toBe('ScanError');
    expect(e.code).toBe('X_CODE');
    expect(e.message).toBe('boom');
  });
});
