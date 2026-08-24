/* eslint-env node, jest */

const { handle, MIN_IMAGES, MAX_IMAGES } = require('../../amplify/backend/function/scanInitiate/src/logic');

const ENV = {
  SCAN_BUCKET: 'petvue-scans',
  SCANS_TABLE: 'petvue-scans-ddb',
};

const buildDeps = (overrides = {}) => ({
  env: ENV,
  randomUUID: () => 'fixed-uuid-1',
  presign: jest.fn(async ({ key }) => `https://example.com/${key}?sig=abc`),
  putItem: jest.fn(async () => undefined),
  ...overrides,
});

const event = (overrides = {}) => {
  const { body, ...rest } = overrides;
  return {
    httpMethod: 'POST',
    body: JSON.stringify(body || { imageCount: 3, mediaType: 'image/jpeg' }),
    requestContext: { authorizer: { claims: { sub: 'user-1' } } },
    ...rest,
  };
};

test('happy path returns scanId, presigned URLs, and writes pending DDB row', async () => {
  const deps = buildDeps();
  const res = await handle(event(), deps);
  const body = JSON.parse(res.body);

  expect(res.statusCode).toBe(200);
  expect(body.scanId).toBe('fixed-uuid-1');
  expect(body.presigned).toHaveLength(3);
  expect(body.presigned[0].key).toBe('scans/user-1/fixed-uuid-1/0.jpg');
  expect(body.presigned[0].uploadUrl).toMatch(/^https:\/\//);
  expect(body.expiresIn).toBeGreaterThan(0);

  expect(deps.presign).toHaveBeenCalledTimes(3);
  expect(deps.putItem).toHaveBeenCalledTimes(1);
  const written = deps.putItem.mock.calls[0][0].item;
  expect(written.userId).toBe('user-1');
  expect(written.status).toBe('pending_upload');
  expect(written.imageKeys).toEqual([
    'scans/user-1/fixed-uuid-1/0.jpg',
    'scans/user-1/fixed-uuid-1/1.jpg',
    'scans/user-1/fixed-uuid-1/2.jpg',
  ]);
  expect(written.petId).toBeUndefined();
});

test('uses png extension when mediaType is image/png', async () => {
  const res = await handle(
    event({ body: { imageCount: 2, mediaType: 'image/png' } }),
    buildDeps(),
  );
  const body = JSON.parse(res.body);
  expect(body.presigned.every((p) => p.key.endsWith('.png'))).toBe(true);
});

test('rejects unauthenticated requests', async () => {
  const res = await handle({ httpMethod: 'POST', body: '{}' }, buildDeps());
  expect(res.statusCode).toBe(401);
  expect(JSON.parse(res.body).code).toBe('NO_AUTH');
});

test('rejects malformed JSON body', async () => {
  const res = await handle(
    {
      httpMethod: 'POST',
      body: 'not-json',
      requestContext: { authorizer: { claims: { sub: 'user-1' } } },
    },
    buildDeps(),
  );
  expect(res.statusCode).toBe(400);
  expect(JSON.parse(res.body).code).toBe('BAD_BODY');
});

test('rejects imageCount outside the supported range', async () => {
  for (const n of [0, 7, 100, 'three', null]) {
    const res = await handle(
      event({ body: { imageCount: n, mediaType: 'image/jpeg' } }),
      buildDeps(),
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).code).toBe('BAD_IMAGE_COUNT');
  }
  // Valid bounds are accepted.
  for (const n of [MIN_IMAGES, MAX_IMAGES]) {
    const res = await handle(
      event({ body: { imageCount: n, mediaType: 'image/jpeg' } }),
      buildDeps(),
    );
    expect(res.statusCode).toBe(200);
  }
});

test('rejects unsupported mediaType', async () => {
  const res = await handle(
    event({ body: { imageCount: 2, mediaType: 'image/gif' } }),
    buildDeps(),
  );
  expect(res.statusCode).toBe(400);
  expect(JSON.parse(res.body).code).toBe('BAD_MEDIA_TYPE');
});

test('persists petId when supplied', async () => {
  const deps = buildDeps();
  await handle(
    event({ body: { imageCount: 2, mediaType: 'image/jpeg', petId: 'pet-9' } }),
    deps,
  );
  expect(deps.putItem.mock.calls[0][0].item.petId).toBe('pet-9');
});

test('OPTIONS preflight short-circuits', async () => {
  const res = await handle({ httpMethod: 'OPTIONS' }, buildDeps());
  expect(res.statusCode).toBe(200);
  expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
});

test('errors when env not fully configured', async () => {
  const res = await handle(
    event(),
    buildDeps({ env: { SCAN_BUCKET: 'b' } }),
  );
  expect(res.statusCode).toBe(500);
  expect(JSON.parse(res.body).code).toBe('NO_CONFIG');
});
