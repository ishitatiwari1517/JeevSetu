/* eslint-env node */
'use strict';

const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { handle } = require('./logic');

const REGION = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const sqs = new SQSClient({ region: REGION });

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

const headObject = async ({ bucket, key }) => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') return false;
    throw err;
  }
};

const sendMessage = async ({ queueUrl, body }) =>
  sqs.send(new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(body),
  }));

exports.handler = async (event) => {
  console.log('[scanEnqueue] event', { method: event?.httpMethod, path: event?.path });
  return handle(event, {
    env: process.env,
    getItem,
    updateItem,
    headObject,
    sendMessage,
  });
};
