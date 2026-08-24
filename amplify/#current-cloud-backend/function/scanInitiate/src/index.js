/* eslint-env node */
'use strict';

const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { handle } = require('./logic');

const REGION = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const presign = async ({ bucket, key, contentType, expiresIn }) =>
  getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn },
  );

const putItem = async ({ tableName, item }) =>
  ddb.send(new PutCommand({ TableName: tableName, Item: item }));

exports.handler = async (event) => {
  console.log('[scanInitiate] event', { method: event?.httpMethod, path: event?.path });
  return handle(event, {
    env: process.env,
    randomUUID: () => crypto.randomUUID(),
    presign,
    putItem,
  });
};
