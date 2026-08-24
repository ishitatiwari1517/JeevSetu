/* eslint-env node, jest */

const { handle } = require('../../amplify/backend/function/scanResult/src/logic');

const ENV = { SCANS_TABLE: 'petvue-scans-ddb' };

const buildDeps = (overrides = {}) => ({
  env: ENV,
  getItem: jest.fn(async () => ({
    scanId: 'scan-1',
    userId: 'user-1',
    status: 'complete',
    imageCount: 3,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:08Z',
    finishedAt: '2026-05-01T00:00:08Z',
    result: { overallStatus: 'NEEDS_ATTENTION', findings: [] },
  })),
  ...overrides,
});

const event = (overrides = {}) => ({
  httpMethod: 'GET',
  pathParameters: { scanId: 'scan-1' },
  requestContext: { authorizer: { claims: { sub: 'user-1' } } },
  ...overrides,
});

test('returns 200 with full payload when complete', async () => {
  const res = await handle(event(), buildDeps());
  const body = JSON.parse(res.body);
  expect(res.statusCode).toBe(200);
  expect(body.scanId).toBe('scan-1');
  expect(body.status).toBe('complete');
  expect(body.result).toBeDefined();
});

test('omits result while still processing', async () => {
  const deps = buildDeps({
    getItem: jest.fn(async () => ({
      scanId: 'scan-1', userId: 'user-1', status: 'processing',
      imageCount: 3, createdAt: 't', updatedAt: 't',
    })),
  });
  const res = await handle(event(), deps);
  const body = JSON.parse(res.body);
  expect(res.statusCode).toBe(200);
  expect(body.status).toBe('processing');
  expect(body.result).toBeUndefined();
});

test('returns error string when failed', async () => {
  const deps = buildDeps({
    getItem: jest.fn(async () => ({
      scanId: 'scan-1', userId: 'user-1', status: 'failed',
      imageCount: 3, createdAt: 't', updatedAt: 't',
      error: 'Lambda timed out',
    })),
  });
  const res = await handle(event(), deps);
  const body = JSON.parse(res.body);
  expect(res.statusCode).toBe(200);
  expect(body.status).toBe('failed');
  expect(body.error).toBe('Lambda timed out');
});

test('refuses to return another user\'s scan', async () => {
  const deps = buildDeps({
    getItem: jest.fn(async () => ({
      scanId: 'scan-1', userId: 'other-user', status: 'complete',
      imageCount: 3, createdAt: 't', updatedAt: 't',
    })),
  });
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(403);
});

test('returns 404 for missing scan', async () => {
  const deps = buildDeps({ getItem: jest.fn(async () => null) });
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(404);
});

test('rejects unauthenticated requests', async () => {
  const res = await handle({ httpMethod: 'GET', pathParameters: { scanId: 's' } }, buildDeps());
  expect(res.statusCode).toBe(401);
});

test('returns 400 when scanId is missing from path and query', async () => {
  const res = await handle(
    {
      httpMethod: 'GET',
      pathParameters: null,
      requestContext: { authorizer: { claims: { sub: 'user-1' } } },
    },
    buildDeps(),
  );
  expect(res.statusCode).toBe(400);
});
