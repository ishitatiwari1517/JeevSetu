/* eslint-env node */
'use strict';

const corsHeaders = () => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
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
  const qs = event?.queryStringParameters?.scanId;
  return qs ? String(qs) : null;
};

const buildPayload = (scan) => {
  const base = {
    scanId: scan.scanId,
    status: scan.status,
    imageCount: scan.imageCount,
    createdAt: scan.createdAt,
    updatedAt: scan.updatedAt,
    finishedAt: scan.finishedAt,
  };
  if (scan.status === 'complete' && scan.result) base.result = scan.result;
  if (scan.status === 'failed' && scan.error) base.error = scan.error;
  return base;
};

const handle = async (event, deps) => {
  if (event?.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  const userId = userIdFromEvent(event);
  if (!userId) return error(401, 'Authentication required', 'NO_AUTH');

  const scanId = scanIdFromEvent(event);
  if (!scanId) return error(400, 'scanId required', 'NO_SCAN_ID');

  const { env, getItem } = deps;
  const tableName = env.SCANS_TABLE;
  if (!tableName) return error(500, 'Backend not fully configured', 'NO_CONFIG');

  const scan = await getItem({ tableName, key: { scanId } });
  if (!scan) return error(404, 'Scan not found', 'NOT_FOUND');
  if (scan.userId !== userId) return error(403, 'Not your scan', 'FORBIDDEN');

  return respond(200, buildPayload(scan));
};

module.exports = {
  handle,
  buildPayload,
  userIdFromEvent,
  scanIdFromEvent,
  corsHeaders,
};
