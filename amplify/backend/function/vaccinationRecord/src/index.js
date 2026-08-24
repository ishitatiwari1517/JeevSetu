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

const TABLE_NAME = process.env.VACCINATIONS_TABLE_NAME;
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

const ALLOWED_STATUSES = new Set(['scheduled', 'completed', 'overdue']);

const validateCreate = (body) => {
  if (!body || typeof body !== 'object') return 'Invalid JSON body';
  if (!body.vaccineName || typeof body.vaccineName !== 'string') return 'vaccineName is required';
  if (!body.dueDate || typeof body.dueDate !== 'string') return 'dueDate is required';
  if (body.status && !ALLOWED_STATUSES.has(body.status)) return 'invalid status';
  return null;
};

async function listForPet(userId, petId) {
  const out = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: BY_PET_INDEX,
      KeyConditionExpression: 'petId = :p',
      FilterExpression: 'userId = :u',
      ExpressionAttributeValues: { ':p': petId, ':u': userId },
    }),
  );
  return out.Items || [];
}

async function getOne(vaccinationId) {
  const out = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { vaccinationId } }),
  );
  return out.Item || null;
}

async function createOne(userId, petId, body) {
  const now = new Date().toISOString();
  const item = {
    vaccinationId: crypto.randomUUID(),
    petId,
    userId,
    vaccineName: body.vaccineName,
    dueDate: body.dueDate,
    administeredDate: body.administeredDate || null,
    veterinarian: body.veterinarian || null,
    notes: body.notes || null,
    status: body.status || (body.administeredDate ? 'completed' : 'scheduled'),
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

async function updateOne(vaccinationId, patch) {
  const fields = ['vaccineName', 'administeredDate', 'dueDate', 'veterinarian', 'notes', 'status'];
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
  sets.push('updatedAt = :updatedAt');
  const out = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { vaccinationId },
      UpdateExpression: 'SET ' + sets.join(', '),
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );
  return out.Attributes;
}

async function deleteOne(vaccinationId) {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { vaccinationId } }),
  );
}

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  if (event.httpMethod === 'OPTIONS') return respond(200, null);

  if (!TABLE_NAME) return respond(500, { error: 'Vaccinations table not configured' });

  const userId = getUserId(event);
  if (!userId) return respond(401, { error: 'Unauthorized' });

  const petId = event.pathParameters && event.pathParameters.petId;
  const vaccinationId = event.pathParameters && event.pathParameters.vaccinationId;
  if (!petId) return respond(400, { error: 'petId is required' });

  try {
    if (event.httpMethod === 'GET' && !vaccinationId) {
      const items = await listForPet(userId, petId);
      return respond(200, { items });
    }

    if (event.httpMethod === 'GET' && vaccinationId) {
      const item = await getOne(vaccinationId);
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
      const err = validateCreate(body);
      if (err) return respond(400, { error: err });
      const created = await createOne(userId, petId, body);
      return respond(201, created);
    }

    if (event.httpMethod === 'PATCH' && vaccinationId) {
      const existing = await getOne(vaccinationId);
      if (!existing || existing.userId !== userId || existing.petId !== petId) {
        return respond(404, { error: 'Not found' });
      }
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return respond(400, { error: 'Invalid JSON' });
      }
      if (body.status && !ALLOWED_STATUSES.has(body.status)) {
        return respond(400, { error: 'invalid status' });
      }
      const updated = await updateOne(vaccinationId, body);
      return respond(200, updated);
    }

    if (event.httpMethod === 'DELETE' && vaccinationId) {
      const existing = await getOne(vaccinationId);
      if (!existing || existing.userId !== userId || existing.petId !== petId) {
        return respond(404, { error: 'Not found' });
      }
      await deleteOne(vaccinationId);
      return respond(204, null);
    }

    return respond(405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('vaccinationRecord error:', e);
    return respond(500, { error: 'Internal server error' });
  }
};
