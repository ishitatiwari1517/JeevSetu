/* eslint-env node, jest */

const { handle } = require('../../amplify/backend/function/scanEnqueue/src/logic');

const ENV = {
  SCANS_TABLE: 'petvue-scans-ddb',
  SCAN_BUCKET: 'petvue-scans',
  SCAN_QUEUE_URL: 'https://sqs.aws/scan-queue',
};

const buildDeps = (overrides = {}) => ({
  env: ENV,
  getItem: jest.fn(async () => ({
    scanId: 'scan-1',
    userId: 'user-1',
    status: 'pending_upload',
    imageKeys: ['scans/user-1/scan-1/0.jpg', 'scans/user-1/scan-1/1.jpg'],
  })),
  updateItem: jest.fn(async () => undefined),
  headObject: jest.fn(async () => true),
  sendMessage: jest.fn(async () => undefined),
  ...overrides,
});

const event = (overrides = {}) => ({
  httpMethod: 'POST',
  pathParameters: { scanId: 'scan-1' },
  body: '{}',
  requestContext: { authorizer: { claims: { sub: 'user-1' } } },
  ...overrides,
});

test('happy path: marks queued and sends SQS message', async () => {
  const deps = buildDeps();
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(202);
  expect(JSON.parse(res.body)).toEqual({ scanId: 'scan-1', status: 'queued' });
  expect(deps.headObject).toHaveBeenCalledTimes(2);
  expect(deps.updateItem).toHaveBeenCalledTimes(1);
  expect(deps.updateItem.mock.calls[0][0].set.status).toBe('queued');
  expect(deps.sendMessage).toHaveBeenCalledWith({
    queueUrl: ENV.SCAN_QUEUE_URL,
    body: { scanId: 'scan-1', userId: 'user-1' },
  });
});

test('refuses access to another user\'s scan', async () => {
  const deps = buildDeps({
    getItem: jest.fn(async () => ({
      scanId: 'scan-1',
      userId: 'other-user',
      status: 'pending_upload',
      imageKeys: [],
    })),
  });
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(403);
  expect(JSON.parse(res.body).code).toBe('FORBIDDEN');
  expect(deps.sendMessage).not.toHaveBeenCalled();
});

test('returns 404 when scan does not exist', async () => {
  const deps = buildDeps({ getItem: jest.fn(async () => null) });
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(404);
  expect(JSON.parse(res.body).code).toBe('NOT_FOUND');
});

test('returns 409 when uploads are incomplete', async () => {
  const deps = buildDeps({
    headObject: jest.fn(async ({ key }) => key.endsWith('0.jpg')), // first uploaded, second missing
  });
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(409);
  expect(JSON.parse(res.body).code).toBe('UPLOAD_INCOMPLETE');
  expect(deps.sendMessage).not.toHaveBeenCalled();
});

test('idempotent: returns existing status when already queued', async () => {
  const deps = buildDeps({
    getItem: jest.fn(async () => ({
      scanId: 'scan-1', userId: 'user-1', status: 'queued', imageKeys: ['k'],
    })),
  });
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(202);
  expect(JSON.parse(res.body).status).toBe('queued');
  expect(deps.updateItem).not.toHaveBeenCalled();
  expect(deps.sendMessage).not.toHaveBeenCalled();
});

test('returns complete status without re-enqueueing finished scans', async () => {
  const deps = buildDeps({
    getItem: jest.fn(async () => ({
      scanId: 'scan-1', userId: 'user-1', status: 'complete', imageKeys: ['k'],
    })),
  });
  const res = await handle(event(), deps);
  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body).status).toBe('complete');
  expect(deps.sendMessage).not.toHaveBeenCalled();
});

test('rejects unauthenticated requests', async () => {
  const res = await handle({ httpMethod: 'POST', pathParameters: { scanId: 's' }, body: '{}' }, buildDeps());
  expect(res.statusCode).toBe(401);
});

test('reads scanId from body when path parameter is absent', async () => {
  const deps = buildDeps();
  const res = await handle(
    {
      httpMethod: 'POST',
      pathParameters: null,
      body: JSON.stringify({ scanId: 'scan-1' }),
      requestContext: { authorizer: { claims: { sub: 'user-1' } } },
    },
    deps,
  );
  expect(res.statusCode).toBe(202);
});
