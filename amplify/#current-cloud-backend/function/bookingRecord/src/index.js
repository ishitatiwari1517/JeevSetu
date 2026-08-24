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

const TABLE_NAME = process.env.BOOKINGS_TABLE_NAME;
const BY_USER_INDEX = 'byUser';
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

const STATUSES = new Set(['pending', 'confirmed', 'completed', 'cancelled']);
const SERVICE_TYPES = new Set([
  'vet-visit',
  'grooming',
  'training',
  'boarding',
  'walking',
  'other',
]);

const ALLOWED_TRANSITIONS = {
  pending: new Set(['confirmed', 'cancelled']),
  confirmed: new Set(['completed', 'cancelled']),
  completed: new Set([]),
  cancelled: new Set([]),
};

function validateCreate(body) {
  if (!body || typeof body !== 'object') return 'Invalid JSON body';
  if (!body.petId || typeof body.petId !== 'string') return 'petId is required';
  if (!body.serviceType || !SERVICE_TYPES.has(body.serviceType)) {
    return 'invalid serviceType';
  }
  if (!body.scheduledAt || typeof body.scheduledAt !== 'string') {
    return 'scheduledAt is required';
  }
  if (
    body.durationMinutes != null &&
    (typeof body.durationMinutes !== 'number' || body.durationMinutes <= 0)
  ) {
    return 'durationMinutes must be a positive number';
  }
  return null;
}

async function listForUser(userId, filter) {
  const usePetIndex = !!filter.petId;
  const indexName = usePetIndex ? BY_PET_INDEX : BY_USER_INDEX;
  const partitionKey = usePetIndex ? 'petId' : 'userId';
  const partitionValue = usePetIndex ? filter.petId : userId;

  let KeyConditionExpression = `${partitionKey} = :pk`;
  const ExpressionAttributeValues = { ':pk': partitionValue };
  if (filter.from && filter.to) {
    KeyConditionExpression += ' AND scheduledAt BETWEEN :from AND :to';
    ExpressionAttributeValues[':from'] = filter.from;
    ExpressionAttributeValues[':to'] = filter.to;
  }

  const filterParts = [];
  if (usePetIndex) {
    filterParts.push('userId = :u');
    ExpressionAttributeValues[':u'] = userId;
  }
  let ExpressionAttributeNames;
  if (filter.status) {
    if (!STATUSES.has(filter.status)) return [];
    filterParts.push('#s = :status');
    ExpressionAttributeValues[':status'] = filter.status;
    ExpressionAttributeNames = { '#s': 'status' };
  }

  const params = {
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression,
    ExpressionAttributeValues,
    ScanIndexForward: true,
  };
  if (filterParts.length) {
    params.FilterExpression = filterParts.join(' AND ');
  }
  if (ExpressionAttributeNames) {
    params.ExpressionAttributeNames = ExpressionAttributeNames;
  }

  const out = await docClient.send(new QueryCommand(params));
  return out.Items || [];
}

async function getOne(bookingId) {
  const out = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { bookingId } }),
  );
  return out.Item || null;
}

async function createOne(userId, body) {
  const now = new Date().toISOString();
  const item = {
    bookingId: crypto.randomUUID(),
    userId,
    petId: body.petId,
    serviceType: body.serviceType,
    scheduledAt: body.scheduledAt,
    providerId: body.providerId || null,
    providerName: body.providerName || null,
    durationMinutes: body.durationMinutes || null,
    location: body.location || null,
    notes: body.notes || null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

async function updateOne(existing, patch) {
  const fields = [
    'serviceType',
    'providerId',
    'providerName',
    'scheduledAt',
    'durationMinutes',
    'location',
    'notes',
    'cancellationReason',
  ];
  const sets = [];
  const names = {};
  const values = { ':updatedAt': new Date().toISOString() };

  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(patch, f)) {
      sets.push(`#${f} = :${f}`);
      names[`#${f}`] = f;
      values[`:${f}`] = patch[f];
    }
  }

  if (patch.status && patch.status !== existing.status) {
    sets.push('#status = :status');
    names['#status'] = 'status';
    values[':status'] = patch.status;
    const now = new Date().toISOString();
    if (patch.status === 'confirmed') {
      sets.push('confirmedAt = :confirmedAt');
      values[':confirmedAt'] = now;
    } else if (patch.status === 'completed') {
      sets.push('completedAt = :completedAt');
      values[':completedAt'] = now;
    } else if (patch.status === 'cancelled') {
      sets.push('cancelledAt = :cancelledAt');
      values[':cancelledAt'] = now;
    }
  }

  sets.push('updatedAt = :updatedAt');
  const out = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { bookingId: existing.bookingId },
      UpdateExpression: 'SET ' + sets.join(', '),
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );
  return out.Attributes;
}

async function deleteOne(bookingId) {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { bookingId } }),
  );
}

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  if (event.httpMethod === 'OPTIONS') return respond(200, null);

  if (!TABLE_NAME) return respond(500, { error: 'Bookings table not configured' });

  const userId = getUserId(event);
  if (!userId) return respond(401, { error: 'Unauthorized' });

  const bookingId = event.pathParameters && event.pathParameters.bookingId;

  try {
    if (event.httpMethod === 'GET' && !bookingId) {
      const qs = event.queryStringParameters || {};
      const items = await listForUser(userId, {
        petId: qs.petId,
        status: qs.status,
        from: qs.from,
        to: qs.to,
      });
      return respond(200, { items });
    }

    if (event.httpMethod === 'GET' && bookingId) {
      const item = await getOne(bookingId);
      if (!item || item.userId !== userId) return respond(404, { error: 'Not found' });
      return respond(200, item);
    }

    if (event.httpMethod === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return respond(400, { error: 'Invalid JSON' });
      }
      const err = validateCreate(body);
      if (err) return respond(400, { error: err });
      const created = await createOne(userId, body);
      return respond(201, created);
    }

    if (event.httpMethod === 'PATCH' && bookingId) {
      const existing = await getOne(bookingId);
      if (!existing || existing.userId !== userId) {
        return respond(404, { error: 'Not found' });
      }
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return respond(400, { error: 'Invalid JSON' });
      }
      if (body.serviceType && !SERVICE_TYPES.has(body.serviceType)) {
        return respond(400, { error: 'invalid serviceType' });
      }
      if (body.status) {
        if (!STATUSES.has(body.status)) {
          return respond(400, { error: 'invalid status' });
        }
        const allowed = ALLOWED_TRANSITIONS[existing.status] || new Set();
        if (body.status !== existing.status && !allowed.has(body.status)) {
          return respond(409, {
            error: `cannot transition from ${existing.status} to ${body.status}`,
          });
        }
      }
      const updated = await updateOne(existing, body);
      return respond(200, updated);
    }

    if (event.httpMethod === 'DELETE' && bookingId) {
      const existing = await getOne(bookingId);
      if (!existing || existing.userId !== userId) {
        return respond(404, { error: 'Not found' });
      }
      await deleteOne(bookingId);
      return respond(204, null);
    }

    return respond(405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('bookingRecord error:', e);
    return respond(500, { error: 'Internal server error' });
  }
};
