/* eslint-env node */
'use strict';

const corsHeaders = () => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
});

const respond = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders(),
  body: JSON.stringify(body),
});

const error = (statusCode, message, code) => respond(statusCode, { error: message, code });

const userIdFromEvent = (event) => {
  const claims =
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims;
  return claims?.sub || null;
};

const scanIdFromEvent = (event) => {
  const fromPath = event?.pathParameters?.scanId || event?.pathParameters?.id;
  if (fromPath) return String(fromPath);
  try {
    const body = JSON.parse(event?.body || '{}');
    return body.scanId ? String(body.scanId) : null;
  } catch {
    return null;
  }
};

const handle = async (event, deps) => {
  if (event?.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  const userId = userIdFromEvent(event);
  if (!userId) return error(401, 'Authentication required', 'NO_AUTH');

  const scanId = scanIdFromEvent(event);
  if (!scanId) return error(400, 'scanId required', 'NO_SCAN_ID');

  const { env, getItem, updateItem, headObject, sendMessage } = deps;
  const tableName = env.SCANS_TABLE;
  const bucket = env.SCAN_BUCKET;
  const queueUrl = env.SCAN_QUEUE_URL;
  if (!tableName || !bucket || !queueUrl) {
    return error(500, 'Backend not fully configured', 'NO_CONFIG');
  }

  const scan = await getItem({ tableName, key: { scanId } });
  if (!scan) return error(404, 'Scan not found', 'NOT_FOUND');
  if (scan.userId !== userId) return error(403, 'Not your scan', 'FORBIDDEN');

  if (scan.status === 'processing' || scan.status === 'queued') {
    return respond(202, { scanId, status: scan.status });
  }
  if (scan.status === 'complete') {
    return respond(200, { scanId, status: 'complete' });
  }

  // Verify every image landed in S3 before we enqueue work.
  const missing = [];
  await Promise.all((scan.imageKeys || []).map(async (key) => {
    const exists = await headObject({ bucket, key }).catch(() => false);
    if (!exists) missing.push(key);
  }));
  if (missing.length > 0) {
    return error(409, `Upload incomplete (${missing.length} image(s) missing). Retry uploads then call this endpoint again.`, 'UPLOAD_INCOMPLETE');
  }

  const now = new Date().toISOString();
  await updateItem({
    tableName,
    key: { scanId },
    set: { status: 'queued', updatedAt: now },
  });

  await sendMessage({ queueUrl, body: { scanId, userId } });

  return respond(202, { scanId, status: 'queued' });
};

module.exports = {
  handle,
  userIdFromEvent,
  scanIdFromEvent,
  corsHeaders,
};
