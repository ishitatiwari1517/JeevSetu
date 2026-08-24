const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const crypto = require('crypto');

const CACHE_TABLE = process.env.VET_CACHE_TABLE_NAME;
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_RADIUS_METERS = 5000;
const MAX_RADIUS_METERS = 50000;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ssm = new SSMClient();
let cachedApiKey = null;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: CORS,
  body: body == null ? '' : JSON.stringify(body),
});

async function resolveApiKey() {
  if (cachedApiKey) return cachedApiKey;
  const ref = process.env.GOOGLE_PLACES_API_KEY;
  if (!ref) return null;
  if (ref.startsWith('/amplify/')) {
    const { Parameter } = await ssm.send(
      new GetParameterCommand({ Name: ref, WithDecryption: true }),
    );
    cachedApiKey = Parameter?.Value || null;
  } else {
    cachedApiKey = ref;
  }
  return cachedApiKey;
}

const NEARBY_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.regularOpeningHours.openNow',
  'places.primaryType',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'nationalPhoneNumber',
  'regularOpeningHours',
  'websiteUri',
  'googleMapsUri',
  'primaryType',
].join(',');

function normalizePlace(p) {
  return {
    placeId: p.id,
    name: p.displayName?.text || p.name || null,
    address: p.formattedAddress || null,
    location: p.location
      ? { latitude: p.location.latitude, longitude: p.location.longitude }
      : null,
    rating: typeof p.rating === 'number' ? p.rating : null,
    userRatingCount:
      typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
    phone: p.nationalPhoneNumber || null,
    openNow: p.regularOpeningHours?.openNow ?? null,
    primaryType: p.primaryType || null,
  };
}

function normalizeDetails(p) {
  return {
    ...normalizePlace(p),
    weekdayHours: p.regularOpeningHours?.weekdayDescriptions || null,
    websiteUri: p.websiteUri || null,
    googleMapsUri: p.googleMapsUri || null,
  };
}

function cacheKeyFor(kind, params) {
  const ordered = JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce((acc, k) => {
        acc[k] = params[k];
        return acc;
      }, {}),
  );
  return `${kind}:${crypto.createHash('sha256').update(ordered).digest('hex')}`;
}

async function readCache(cacheKey) {
  if (!CACHE_TABLE) return null;
  const out = await ddb.send(
    new GetCommand({ TableName: CACHE_TABLE, Key: { cacheKey } }),
  );
  const item = out.Item;
  if (!item) return null;
  const now = Math.floor(Date.now() / 1000);
  if (item.expiresAt && item.expiresAt < now) return null;
  return item.data;
}

async function writeCache(cacheKey, data) {
  if (!CACHE_TABLE) return;
  const expiresAt = Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS;
  await ddb.send(
    new PutCommand({
      TableName: CACHE_TABLE,
      Item: { cacheKey, data, expiresAt },
    }),
  );
}

async function searchNearby(apiKey, lat, lng, radius, keyword) {
  const body = {
    includedTypes: ['veterinary_care'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
  };
  if (keyword) body.textQuery = keyword;

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': NEARBY_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Places nearby ${res.status}: ${text}`);
  }
  const json = await res.json();
  return (json.places || []).map(normalizePlace);
}

async function placeDetails(apiKey, placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAILS_FIELD_MASK,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Places details ${res.status}: ${text}`);
  }
  const json = await res.json();
  return normalizeDetails(json);
}

function parseFloatOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify({ ...event, body: undefined })}`);

  if (event.httpMethod === 'OPTIONS') return respond(200, null);

  const claims =
    event.requestContext &&
    event.requestContext.authorizer &&
    event.requestContext.authorizer.claims;
  if (!claims || !claims.sub) return respond(401, { error: 'Unauthorized' });

  const apiKey = await resolveApiKey();
  if (!apiKey) {
    console.error('vetFinder: GOOGLE_PLACES_API_KEY not resolved');
    return respond(500, { error: 'Vet finder not configured' });
  }

  const resource = (event.resource || event.path || '').toLowerCase();
  const placeId = event.pathParameters && event.pathParameters.placeId;

  try {
    if (resource.endsWith('/vets/nearby') && event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      const lat = parseFloatOrNull(qs.lat);
      const lng = parseFloatOrNull(qs.lng);
      if (lat == null || lng == null) {
        return respond(400, { error: 'lat and lng query params are required' });
      }
      let radius = parseFloatOrNull(qs.radius) || DEFAULT_RADIUS_METERS;
      if (radius > MAX_RADIUS_METERS) radius = MAX_RADIUS_METERS;
      const keyword = qs.keyword ? String(qs.keyword).trim().slice(0, 100) : '';

      const cacheKey = cacheKeyFor('nearby', {
        lat: lat.toFixed(4),
        lng: lng.toFixed(4),
        radius: Math.round(radius),
        keyword,
      });
      const cached = await readCache(cacheKey);
      if (cached) {
        return respond(200, { items: cached, cached: true });
      }
      const items = await searchNearby(apiKey, lat, lng, radius, keyword);
      await writeCache(cacheKey, items);
      return respond(200, { items, cached: false });
    }

    if (placeId && event.httpMethod === 'GET') {
      const cacheKey = cacheKeyFor('details', { placeId });
      const cached = await readCache(cacheKey);
      if (cached) {
        return respond(200, { ...cached, cached: true });
      }
      const details = await placeDetails(apiKey, placeId);
      await writeCache(cacheKey, details);
      return respond(200, { ...details, cached: false });
    }

    return respond(405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('vetFinder error:', e);
    return respond(502, { error: 'Vet finder upstream error' });
  }
};
