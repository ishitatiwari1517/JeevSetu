/* eslint-env node */
'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { handle } = require('./logic');

const REGION = process.env.AWS_REGION || 'us-east-1';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const getItem = async ({ tableName, key }) => {
  const res = await ddb.send(new GetCommand({ TableName: tableName, Key: key }));
  return res.Item || null;
};

exports.handler = async (event) => {
  console.log('[scanResult] event', { method: event?.httpMethod, path: event?.path });
  return handle(event, {
    env: process.env,
    getItem,
  });
};
