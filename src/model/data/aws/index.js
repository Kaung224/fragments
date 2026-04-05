// src/model/data/aws/index.js

const s3Client = require('./s3Client');
const ddbDocClient = require('./ddbDocClient');
const logger = require('../../../logger');

const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Convert stream → Buffer
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Write fragment data to S3
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
  } catch (err) {
    logger.error({ err, ...params }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

// Read fragment data from S3
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  try {
    const result = await s3Client.send(new GetObjectCommand(params));
    return streamToBuffer(result.Body);
  } catch (err) {
    logger.error({ err, ...params }, 'Error reading fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// List fragments for a user
async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  if (!expand) {
    params.ProjectionExpression = 'id';
  }

  const command = new QueryCommand(params);

  try {
    const data = await ddbDocClient.send(command);
    return !expand ? data?.Items.map((item) => item.id) : data?.Items;
  } catch (err) {
    logger.error({ err, params }, 'error getting fragments from DynamoDB');
    throw err;
  }
}

// Write fragment metadata to DynamoDB
async function writeFragment(fragment) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  const command = new PutCommand(params);

  try {
    return await ddbDocClient.send(command);
  } catch (err) {
    logger.warn({ err, params, fragment }, 'error writing fragment to DynamoDB');
    throw err;
  }
}

// Read fragment metadata from DynamoDB
async function readFragment(ownerId, id) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  const command = new GetCommand(params);

  try {
    const data = await ddbDocClient.send(command);
    return data?.Item;
  } catch (err) {
    logger.warn({ err, params }, 'error reading fragment from DynamoDB');
    throw err;
  }
}

// Delete fragment (DynamoDB + S3)
async function deleteFragment(ownerId, id) {
  const ddbParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  try {
    // Delete metadata from DynamoDB
    await ddbDocClient.send(new DeleteCommand(ddbParams));

    // Delete data from S3
    await s3Client.send(new DeleteObjectCommand(s3Params));
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error deleting fragment');
    throw new Error('unable to delete fragment');
  }
}

module.exports = {
  writeFragmentData,
  readFragmentData,
  deleteFragment,
  listFragments,
  readFragment,
  writeFragment,
};
