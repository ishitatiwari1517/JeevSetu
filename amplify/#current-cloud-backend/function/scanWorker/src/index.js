/* eslint-env node */
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { handle } = require('./logic');

const REGION = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const ssm = new SSMClient({ region: REGION });

let cachedAnthropic = null;
let cachedApiKey = null;

const resolveApiKey = async () => {
  if (cachedApiKey) return cachedApiKey;
  const ref = process.env.ANTHROPIC_API_KEY;
  if (!ref) throw new Error('ANTHROPIC_API_KEY not set');
  if (ref.startsWith('/amplify/')) {
    const { Parameter } = await ssm.send(
      new GetParameterCommand({ Name: ref, WithDecryption: true }),
    );
    cachedApiKey = Parameter?.Value || null;
  } else {
    cachedApiKey = ref;
  }
  if (!cachedApiKey) throw new Error('ANTHROPIC_API_KEY resolved to empty value');
  return cachedApiKey;
};

const resolveAnthropic = async () => {
  if (cachedAnthropic) return cachedAnthropic;
  const apiKey = await resolveApiKey();
  cachedAnthropic = new Anthropic({ apiKey });
  return cachedAnthropic;
};

const getItem = async ({ tableName, key }) => {
  const res = await ddb.send(new GetCommand({ TableName: tableName, Key: key }));
  return res.Item || null;
};

const updateItem = async ({ tableName, key, set }) => {
  const names = {};
  const values = {};
  const setExprs = [];
  Object.entries(set).forEach(([k, v], i) => {
    const nameKey = `#n${i}`;
    const valKey = `:v${i}`;
    names[nameKey] = k;
    values[valKey] = v;
    setExprs.push(`${nameKey} = ${valKey}`);
  });
  await ddb.send(new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${setExprs.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
};

const getObjectBytes = async ({ bucket, key }) => {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  // Body is a stream — collect to a Buffer.
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
};

exports.handler = async (event) => {
  const anthropic = await resolveAnthropic();
  return handle(event, {
    env: process.env,
    anthropic,
    getItem,
    updateItem,
    getObjectBytes,
  });
};
