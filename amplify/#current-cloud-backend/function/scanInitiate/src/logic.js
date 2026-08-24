/* eslint-env node */
'use strict';

const PRESIGN_EXPIRY_SECONDS = 300;
const MIN_IMAGES = 1;
const MAX_IMAGES = 6;
const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png']);

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

const extFor = (mediaType) => (mediaType === 'image/png' ? 'png' : 'jpg');

const handle = async (event, deps) => {
  if (event?.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  const userId = userIdFromEvent(event);
  if (!userId) return error(401, 'Authentication required', 'NO_AUTH');

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_e) {
    return error(400, 'Invalid JSON body', 'BAD_BODY');
  }

  const imageCount = Number(payload.imageCount);
  if (!Number.isInteger(imageCount) || imageCount < MIN_IMAGES || imageCount > MAX_IMAGES) {
    return error(400, `imageCount must be an integer between ${MIN_IMAGES} and ${MAX_IMAGES}`, 'BAD_IMAGE_COUNT');
  }

  const mediaType = String(payload.mediaType || 'image/jpeg');
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return error(400, 'mediaType must be image/jpeg or image/png', 'BAD_MEDIA_TYPE');
  }

  const petId = payload.petId ? String(payload.petId) : undefined;
  const { env, randomUUID, presign, putItem } = deps;
  const bucket = env.SCAN_BUCKET;
  const tableName = env.SCANS_TABLE;
  if (!bucket || !tableName) {
    return error(500, 'Backend not fully configured', 'NO_CONFIG');
  }

  const scanId = randomUUID();
  const ext = extFor(mediaType);
  const presigned = [];
  for (let i = 0; i < imageCount; i++) {
    const key = `scans/${userId}/${scanId}/${i}.${ext}`;
    const url = await presign({
      bucket,
      key,
      contentType: mediaType,
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });
    presigned.push({ key, uploadUrl: url });
  }

  const now = new Date().toISOString();
  const item = {
    scanId,
    userId,
    status: 'pending_upload',
    imageCount,
    imageKeys: presigned.map((p) => p.key),
    mediaType,
    createdAt: now,
    updatedAt: now,
  };
  if (petId) item.petId = petId;

  await putItem({ tableName, item });

  return respond(200, {
    scanId,
    presigned,
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  });
};

module.exports = {
  handle,
  userIdFromEvent,
  corsHeaders,
  PRESIGN_EXPIRY_SECONDS,
  MIN_IMAGES,
  MAX_IMAGES,
};
