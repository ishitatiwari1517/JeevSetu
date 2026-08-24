/* eslint-env node, jest */

const { handle, parseClaude, stripJsonFences } =
  require('../../amplify/backend/function/scanWorker/src/logic');

const ENV = {
  SCANS_TABLE: 'petvue-scans-ddb',
  SCAN_BUCKET: 'petvue-scans',
};

const claudeReply = (json) => ({
  content: [{ text: JSON.stringify(json) }],
});

const SAMPLE_RESPONSE = {
  subject_detected: true,
  image_quality: 'good',
  findings: [
    {
      condition: 'Mange',
      confidence: 80,
      severity: 'SEE_VET',
      visible_indicators: ['fur loss'],
      plain_language: 'Sarcoptic mange with alopecia',
    },
  ],
  overall_status: 'NEEDS_ATTENTION',
  recommendation: 'See a vet within the week.',
};

const buildDeps = (overrides = {}) => {
  const updateItem = jest.fn(async () => undefined);
  const getItem = jest.fn(async () => ({
    scanId: 'scan-1',
    userId: 'user-1',
    status: 'queued',
    imageKeys: ['scans/user-1/scan-1/0.jpg', 'scans/user-1/scan-1/1.jpg'],
    mediaType: 'image/jpeg',
  }));
  return {
    env: ENV,
    getItem,
    updateItem,
    getObjectBytes: jest.fn(async () => Buffer.from('fakebytes')),
    anthropic: {
      messages: {
        create: jest.fn(async () => claudeReply(SAMPLE_RESPONSE)),
      },
    },
    ...overrides,
  };
};

const sqsEvent = (records = [{ body: JSON.stringify({ scanId: 'scan-1' }) }]) => ({ Records: records });

describe('parseClaude', () => {
  test('parses a clean JSON response', () => {
    const parsed = parseClaude(JSON.stringify(SAMPLE_RESPONSE));
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0].condition).toBe('Mange');
    expect(parsed.findings[0].plainLanguage).toBe('Sarcoptic mange with alopecia');
  });

  test('strips ```json fences when present', () => {
    const fenced = '```json\n' + JSON.stringify(SAMPLE_RESPONSE) + '\n```';
    expect(parseClaude(fenced)?.subjectDetected).toBe(true);
    expect(stripJsonFences(fenced)).toBe(JSON.stringify(SAMPLE_RESPONSE));
  });

  test('returns null on bad JSON', () => {
    expect(parseClaude('not json at all')).toBeNull();
  });
});

describe('handle (worker SQS flow)', () => {
  test('happy path: marks processing, calls Claude per image, writes complete', async () => {
    const deps = buildDeps();
    await handle(sqsEvent(), deps);

    // 1 GetCommand, 1 update to 'processing', 1 update to 'complete'
    expect(deps.getItem).toHaveBeenCalledTimes(1);
    expect(deps.updateItem).toHaveBeenCalledTimes(2);
    expect(deps.updateItem.mock.calls[0][0].set.status).toBe('processing');
    expect(deps.updateItem.mock.calls[1][0].set.status).toBe('complete');
    expect(deps.updateItem.mock.calls[1][0].set.result).toBeDefined();
    expect(deps.updateItem.mock.calls[1][0].set.result.findings).toHaveLength(1);

    // Both images processed.
    expect(deps.getObjectBytes).toHaveBeenCalledTimes(2);
    expect(deps.anthropic.messages.create).toHaveBeenCalledTimes(2);
  });

  test('marks scan failed when scan record is missing', async () => {
    const deps = buildDeps({ getItem: jest.fn(async () => null) });
    await handle(sqsEvent(), deps);
    // The processing-status update never fires because the early throw happens
    // before status is mutated. We do call updateItem in markFailed.
    const failedCall = deps.updateItem.mock.calls.find(
      (c) => c[0].set.status === 'failed',
    );
    expect(failedCall).toBeDefined();
    expect(failedCall[0].set.error).toMatch(/not found/i);
  });

  test('proceeds with partial results when some Claude calls fail', async () => {
    let callIndex = 0;
    const deps = buildDeps({
      anthropic: {
        messages: {
          create: jest.fn(async () => {
            callIndex += 1;
            if (callIndex === 2) throw new Error('Claude went down');
            return claudeReply(SAMPLE_RESPONSE);
          }),
        },
      },
    });
    await handle(sqsEvent(), deps);
    const completeCall = deps.updateItem.mock.calls.find(
      (c) => c[0].set.status === 'complete',
    );
    expect(completeCall).toBeDefined();
  });

  test('marks failed when ALL Claude calls fail', async () => {
    const deps = buildDeps({
      anthropic: {
        messages: {
          create: jest.fn(async () => { throw new Error('rate limited'); }),
        },
      },
    });
    await handle(sqsEvent(), deps);
    const failedCall = deps.updateItem.mock.calls.find(
      (c) => c[0].set.status === 'failed',
    );
    expect(failedCall).toBeDefined();
  });

  test('skips records with bad JSON body', async () => {
    const deps = buildDeps();
    await handle(sqsEvent([{ body: 'not-json' }]), deps);
    expect(deps.getItem).not.toHaveBeenCalled();
  });

  test('skips records without a scanId', async () => {
    const deps = buildDeps();
    await handle(sqsEvent([{ body: JSON.stringify({}) }]), deps);
    expect(deps.getItem).not.toHaveBeenCalled();
  });
});
