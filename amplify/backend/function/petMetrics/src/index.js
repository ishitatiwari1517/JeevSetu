const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const WEIGHTS_TABLE = process.env.WEIGHT_LOGS_TABLE_NAME;
const ACTIVITIES_TABLE = process.env.ACTIVITY_LOGS_TABLE_NAME;
const BY_PET_INDEX = 'byPet';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: CORS,
  body: body == null ? '' : JSON.stringify(body),
});

const getUserId = (event) => {
  const claims =
    event.requestContext &&
    event.requestContext.authorizer &&
    event.requestContext.authorizer.claims;
  return claims ? claims.sub : null;
};

const ACTIVITY_TYPES = new Set(['walk', 'play', 'run', 'training', 'other']);
const WEIGHT_SOURCES = new Set(['manual', 'vet-visit', 'home-scale']);

const RESOURCE = {
  weights: {
    table: () => WEIGHTS_TABLE,
    idKey: 'weightLogId',
    pathIdParam: 'weightLogId',
    validate: (body) => {
      if (typeof body.weightKg !== 'number' || !isFinite(body.weightKg) || body.weightKg <= 0) {
        return 'weightKg must be a positive number';
      }
      if (!body.loggedAt || typeof body.loggedAt !== 'string') return 'loggedAt is required';
      if (body.source && !WEIGHT_SOURCES.has(body.source)) return 'invalid source';
      return null;
    },
    buildItem: (id, userId, petId, body) => ({
      weightLogId: id,
      petId,
      userId,
      weightKg: body.weightKg,
      loggedAt: body.loggedAt,
      source: body.source || 'manual',
      notes: body.notes || null,
    }),
    updatableFields: ['weightKg', 'loggedAt', 'source', 'notes'],
  },
  activities: {
    table: () => ACTIVITIES_TABLE,
    idKey: 'activityLogId',
    pathIdParam: 'activityLogId',
    validate: (body) => {
      if (!body.activityType || !ACTIVITY_TYPES.has(body.activityType)) {
        return 'invalid activityType';
      }
      if (
        typeof body.durationMinutes !== 'number' ||
        !isFinite(body.durationMinutes) ||
        body.durationMinutes <= 0
      ) {
        return 'durationMinutes must be a positive number';
      }
      if (!body.loggedAt || typeof body.loggedAt !== 'string') return 'loggedAt is required';
      if (
        body.distanceKm != null &&
        (typeof body.distanceKm !== 'number' || body.distanceKm < 0)
      ) {
        return 'distanceKm must be a non-negative number';
      }
      return null;
    },
    buildItem: (id, userId, petId, body) => ({
      activityLogId: id,
      petId,
      userId,
      activityType: body.activityType,
      durationMinutes: body.durationMinutes,
      distanceKm: body.distanceKm == null ? null : body.distanceKm,
      loggedAt: body.loggedAt,
      notes: body.notes || null,
    }),
    updatableFields: ['activityType', 'durationMinutes', 'distanceKm', 'loggedAt', 'notes'],
  },
};

function resolveResource(event) {
  const path = (event.resource || event.path || '').toLowerCase();
  if (path.includes('/weights')) return RESOURCE.weights;
  if (path.includes('/activities')) return RESOURCE.activities;
  return null;
}

async function listForPet(resource, userId, petId, from, to) {
  const KeyConditionExpression =
    from && to
      ? 'petId = :p AND loggedAt BETWEEN :from AND :to'
      : 'petId = :p';
  const ExpressionAttributeValues = { ':p': petId, ':u': userId };
  if (from && to) {
    ExpressionAttributeValues[':from'] = from;
    ExpressionAttributeValues[':to'] = to;
  }
  const out = await docClient.send(
    new QueryCommand({
      TableName: resource.table(),
      IndexName: BY_PET_INDEX,
      KeyConditionExpression,
      FilterExpression: 'userId = :u',
      ExpressionAttributeValues,
      ScanIndexForward: false,
    }),
  );
  return out.Items || [];
}

async function getOne(resource, id) {
  const out = await docClient.send(
    new GetCommand({ TableName: resource.table(), Key: { [resource.idKey]: id } }),
  );
  return out.Item || null;
}

async function createOne(resource, userId, petId, body) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const item = {
    ...resource.buildItem(id, userId, petId, body),
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: resource.table(), Item: item }));
  return item;
}

async function updateOne(resource, id, patch) {
  const sets = [];
  const names = {};
  const values = { ':updatedAt': new Date().toISOString() };
  for (const f of resource.updatableFields) {
    if (Object.prototype.hasOwnProperty.call(patch, f)) {
      sets.push(`#${f} = :${f}`);
      names[`#${f}`] = f;
      values[`:${f}`] = patch[f];
    }
  }
  sets.push('updatedAt = :updatedAt');
  const out = await docClient.send(
    new UpdateCommand({
      TableName: resource.table(),
      Key: { [resource.idKey]: id },
      UpdateExpression: 'SET ' + sets.join(', '),
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );
  return out.Attributes;
}

async function deleteOne(resource, id) {
  await docClient.send(
    new DeleteCommand({ TableName: resource.table(), Key: { [resource.idKey]: id } }),
  );
}

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  if (event.httpMethod === 'OPTIONS') return respond(200, null);

  if (!WEIGHTS_TABLE || !ACTIVITIES_TABLE) {
    return respond(500, { error: 'pet metrics tables not configured' });
  }

  const userId = getUserId(event);
  if (!userId) return respond(401, { error: 'Unauthorized' });

  const resource = resolveResource(event);
  if (!resource) return respond(404, { error: 'Unknown resource' });

  const petId = event.pathParameters && event.pathParameters.petId;
  const itemId = event.pathParameters && event.pathParameters[resource.pathIdParam];
  if (!petId) return respond(400, { error: 'petId is required' });

  try {
    if (event.httpMethod === 'GET' && !itemId) {
      const qs = event.queryStringParameters || {};
      const items = await listForPet(resource, userId, petId, qs.from, qs.to);
      return respond(200, { items });
    }

    if (event.httpMethod === 'GET' && itemId) {
      const item = await getOne(resource, itemId);
      if (!item || item.userId !== userId || item.petId !== petId) {
        return respond(404, { error: 'Not found' });
      }
      return respond(200, item);
    }

    if (event.httpMethod === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return respond(400, { error: 'Invalid JSON' });
      }
      const err = resource.validate(body);
      if (err) return respond(400, { error: err });
      const created = await createOne(resource, userId, petId, body);
      return respond(201, created);
    }

    if (event.httpMethod === 'PATCH' && itemId) {
      const existing = await getOne(resource, itemId);
      if (!existing || existing.userId !== userId || existing.petId !== petId) {
        return respond(404, { error: 'Not found' });
      }
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return respond(400, { error: 'Invalid JSON' });
      }
      if (resource === RESOURCE.activities && body.activityType && !ACTIVITY_TYPES.has(body.activityType)) {
        return respond(400, { error: 'invalid activityType' });
      }
      if (resource === RESOURCE.weights && body.source && !WEIGHT_SOURCES.has(body.source)) {
        return respond(400, { error: 'invalid source' });
      }
      const updated = await updateOne(resource, itemId, body);
      return respond(200, updated);
    }

    if (event.httpMethod === 'DELETE' && itemId) {
      const existing = await getOne(resource, itemId);
      if (!existing || existing.userId !== userId || existing.petId !== petId) {
        return respond(404, { error: 'Not found' });
      }
      await deleteOne(resource, itemId);
      return respond(204, null);
    }

    return respond(405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('petMetrics error:', e);
    return respond(500, { error: 'Internal server error' });
  }
};
