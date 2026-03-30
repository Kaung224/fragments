// src/model/data/aws/index.js

// Temporary: still use MemoryDB for metadata until DynamoDB is added
const MemoryDB = require('./memory-db');
const logger = require('../../../../logger');

const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Metadata DB (simulates DynamoDB)
const metadata = new MemoryDB();

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

// Delete fragment metadata + S3 object
async function deleteFragment(ownerId, id) {
  // delete metadata from MemoryDB
  await metadata.del(ownerId, id);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (err) {
    logger.error({ err, ...params }, 'Error deleting fragment data from S3');
    throw new Error('unable to delete fragment data');
  }
}

// List fragments for a user
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);

  if (expand || !fragments) {
    return fragments;
  }

  return fragments.map((fragment) => JSON.parse(fragment).id);
}

module.exports = {
  metadata,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
  listFragments,
};
